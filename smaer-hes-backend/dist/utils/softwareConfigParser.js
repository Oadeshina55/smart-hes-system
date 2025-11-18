"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHexcellObisList = parseHexcellObisList;
exports.parseHexingObisList = parseHexingObisList;
exports.parseDLMSConfig = parseDLMSConfig;
exports.loadSoftwareConfigurations = loadSoftwareConfigurations;
exports.getMeterModelConfiguration = getMeterModelConfiguration;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Parse Hexcell OBIS List from text file
 */
function parseHexcellObisList(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const obisCodes = [];
    // Skip header rows (first 4 lines)
    for (let i = 4; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('√') === false)
            continue;
        // Split by tabs
        const columns = line.split('\t');
        if (columns.length < 10)
            continue;
        try {
            const yesNo = columns[0]?.trim();
            const name = columns[1]?.trim();
            const classIdStr = columns[2]?.trim();
            let obisCode = columns[3]?.trim();
            const attributeIdStr = columns[4]?.trim();
            const methodIdStr = columns[5]?.trim();
            const dataType = columns[6]?.trim();
            const dataLengthStr = columns[7]?.trim();
            const scalerStr = columns[8]?.trim();
            const unit = columns[9]?.trim();
            const description = columns[10]?.trim() || name;
            // Skip if not marked with √
            if (yesNo !== '√')
                continue;
            // Clean OBIS code - remove braces and convert to standard format
            obisCode = obisCode.replace(/[{}\s]/g, '');
            if (obisCode.length === 12) {
                // Convert from format 0000600100FF to 0-0:96.1.0.255
                obisCode = convertObisCodeFormat(obisCode);
            }
            const classId = parseInt(classIdStr) || 1;
            // Parse attribute ID (format: "2:R;" or "2:R;3:R;")
            let attributeId = 2;
            let canRead = false;
            let canWrite = false;
            if (attributeIdStr) {
                const attrParts = attributeIdStr.split(';');
                for (const part of attrParts) {
                    if (part.includes(':')) {
                        const [attr, access] = part.split(':');
                        const attrNum = parseInt(attr);
                        if (!isNaN(attrNum) && attributeId === 2) {
                            attributeId = attrNum;
                        }
                        if (access?.includes('R'))
                            canRead = true;
                        if (access?.includes('W'))
                            canWrite = true;
                    }
                }
            }
            const methodId = methodIdStr ? parseInt(methodIdStr) : undefined;
            const dataLength = dataLengthStr ? parseInt(dataLengthStr) : undefined;
            const scaler = scalerStr ? parseInt(scalerStr) : undefined;
            obisCodes.push({
                code: obisCode,
                name: name || description,
                description,
                classId,
                attributeId,
                methodId,
                dataType: dataType || 'unknown',
                dataLength,
                scaler,
                unit: unit || '',
                accessRight: {
                    read: canRead || true, // Default to read if not specified
                    write: canWrite,
                },
                brand: 'hexcell',
            });
        }
        catch (error) {
            console.error(`Error parsing Hexcell OBIS line ${i}:`, error);
            continue;
        }
    }
    return obisCodes;
}
/**
 * Parse Hexing OBIS Function from text file
 */
function parseHexingObisList(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const obisCodes = [];
    // Skip header rows (first ~30 lines)
    for (let i = 30; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line)
            continue;
        // Split by tabs
        const columns = line.split('\t');
        if (columns.length < 10)
            continue;
        try {
            const categorySubcategory = columns[0]?.trim(); // Format: "电网质量//电网质量"
            const classIdStr = columns[1]?.trim();
            const version = columns[2]?.trim();
            const standard = columns[3]?.trim(); // FID2 & IDIS or Hexing
            const attrMethodStr = columns[4]?.trim(); // a1, a2, m1, etc.
            const objectName = columns[5]?.trim();
            const dataType = columns[6]?.trim();
            let obisCode = columns[7]?.trim();
            const displayObis6 = columns[8]?.trim();
            const displayObis4 = columns[9]?.trim();
            const accessRight = columns[10]?.trim(); // Format: \, R, RW, W
            const description = columns[14]?.trim();
            // Skip attribute/method detail rows
            if (attrMethodStr && (attrMethodStr.startsWith('a') || attrMethodStr.startsWith('m'))) {
                continue;
            }
            // Skip empty OBIS codes
            if (!obisCode || obisCode === '\\')
                continue;
            // Parse class ID
            const classId = parseInt(classIdStr) || 1;
            // Determine if this is Hexing-specific
            const isHexingOnly = standard?.includes('Hexing') && !standard?.includes('FID2') && !standard?.includes('IDIS');
            // Parse category and subcategory
            let category = '';
            let subcategory = '';
            if (categorySubcategory && categorySubcategory.includes('//')) {
                const parts = categorySubcategory.split('//');
                category = parts[0] || '';
                subcategory = parts[1] || '';
            }
            // Parse access rights
            const canRead = accessRight === 'R' || accessRight === 'RW';
            const canWrite = accessRight === 'W' || accessRight === 'RW';
            obisCodes.push({
                code: obisCode,
                name: objectName || description || category,
                description: description || objectName || `${category} - ${subcategory}`,
                classId,
                attributeId: 2, // Default, will be updated if more info is available
                dataType: dataType || 'unknown',
                accessRight: {
                    read: canRead,
                    write: canWrite,
                },
                brand: 'hexing',
                category,
                subcategory,
            });
        }
        catch (error) {
            console.error(`Error parsing Hexing OBIS line ${i}:`, error);
            continue;
        }
    }
    return obisCodes;
}
/**
 * Convert OBIS code from hex format to standard dotted format
 * Example: 0000600100FF -> 0-0:96.1.0.255
 */
function convertObisCodeFormat(hexCode) {
    if (hexCode.length !== 12)
        return hexCode;
    try {
        const a = parseInt(hexCode.substr(0, 2), 16);
        const b = parseInt(hexCode.substr(2, 2), 16);
        const c = parseInt(hexCode.substr(4, 2), 16);
        const d = parseInt(hexCode.substr(6, 2), 16);
        const e = parseInt(hexCode.substr(8, 2), 16);
        const f = parseInt(hexCode.substr(10, 2), 16);
        return `${a}-${b}:${c}.${d}.${e}.${f}`;
    }
    catch (error) {
        return hexCode;
    }
}
/**
 * Parse DLMS MD config.xml for Hexcell connection parameters
 * Simple regex-based parsing (xml2js not available in this environment)
 */
function parseDLMSConfig(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const extractValue = (tag) => {
        const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'i');
        const match = content.match(regex);
        return match ? match[1] : undefined;
    };
    return {
        meterAddress: extractValue('Meter_Address'),
        authType: extractValue('Auth_Type'),
        authId: extractValue('Auth_ID'),
        baudRate: parseInt(extractValue('BaudRate') || '4800'),
        dataBits: parseInt(extractValue('DataBits') || '8'),
        stopBits: parseInt(extractValue('StopBits') || '1'),
        parity: parseInt(extractValue('Parity') || '0'),
        aesKey: extractValue('AesKey'),
        serverLowerAddress: extractValue('Server_Lower_MAC_Address'),
        serverUpperAddress: extractValue('Server_Upper_MAC_Address'),
        clientAddress: extractValue('Client_MAC_Address'),
    };
}
/**
 * Load and merge all software configurations
 */
function loadSoftwareConfigurations() {
    const uploadsDir = path.join(__dirname, '../../uploads');
    const hexcellFile = path.join(uploadsDir, 'Hexcell AMI System Unified OBIS List.txt');
    const hexingFile = path.join(uploadsDir, 'Hexing OBIS Function.txt');
    let hexcellCodes = [];
    let hexingCodes = [];
    if (fs.existsSync(hexcellFile)) {
        try {
            hexcellCodes = parseHexcellObisList(hexcellFile);
            console.log(`Loaded ${hexcellCodes.length} Hexcell OBIS codes from software config`);
        }
        catch (error) {
            console.error('Error loading Hexcell software config:', error);
        }
    }
    if (fs.existsSync(hexingFile)) {
        try {
            hexingCodes = parseHexingObisList(hexingFile);
            console.log(`Loaded ${hexingCodes.length} Hexing OBIS codes from software config`);
        }
        catch (error) {
            console.error('Error loading Hexing software config:', error);
        }
    }
    return {
        hexcell: hexcellCodes,
        hexing: hexingCodes,
    };
}
/**
 * Get meter-specific configuration including OBIS codes and connection params
 */
function getMeterModelConfiguration(brand, model) {
    const configs = loadSoftwareConfigurations();
    const obisCodes = brand === 'hexing' ? configs.hexing : configs.hexcell;
    let connectionParams = undefined;
    // Load connection parameters for Hexcell
    if (brand === 'hexcell') {
        const configPath = path.join(__dirname, '../../uploads/DLMS MD/config.xml');
        if (fs.existsSync(configPath)) {
            try {
                connectionParams = parseDLMSConfig(configPath);
            }
            catch (error) {
                console.error('Error loading DLMS config:', error);
            }
        }
    }
    return {
        brand,
        model: model || 'default',
        connectionParams,
        obisCodes,
    };
}
//# sourceMappingURL=softwareConfigParser.js.map