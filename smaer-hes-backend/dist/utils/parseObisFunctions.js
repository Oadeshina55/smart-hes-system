"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadObisFunctions = loadObisFunctions;
exports.getObisFunctionByCode = getObisFunctionByCode;
exports.getObisFunctionsByGroup = getObisFunctionsByGroup;
exports.exportToJson = exportToJson;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const softwareConfigParser_1 = require("./softwareConfigParser");
/**
 * Parse Hexing OBIS Functions from TSV file
 * Format: Tab-separated with Function | Class ID | OBIS Code | ... | Unit | Comments
 */
function parseHexingObis(filePath) {
    const content = fs_1.default.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const functions = [];
    const obisRegex = /(\d+-\d+:\d+\.\d+\.\d+\.\d+)/g;
    const hexRegex = /\{?([0-9A-Fa-f]{12})\}?/g;
    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        if (!raw || !raw.trim())
            continue;
        const parts = raw.split('\t').map(p => p.replace(/^"|"$/g, '').trim()).filter(Boolean);
        const nameCandidate = parts[1] || parts[0] || '';
        const decMatches = Array.from(raw.matchAll(obisRegex)).map(m => m[1]);
        const hexMatches = Array.from(raw.matchAll(hexRegex)).map(m => m[1]);
        const guessUnit = (s) => {
            if (!s)
                return undefined;
            if (/\bWh\b/i.test(s))
                return 'Wh';
            if (/\bV\b/i.test(s) || /voltage/i.test(s))
                return 'V';
            if (/\bA\b/i.test(s) || /current/i.test(s))
                return 'A';
            if (/Hz/i.test(s) || /frequency/i.test(s))
                return 'Hz';
            if (/W\b/i.test(s) || /power/i.test(s))
                return 'W';
            return undefined;
        };
        for (const m of decMatches) {
            const code = m.trim();
            functions.push({
                code,
                name: nameCandidate || code,
                description: raw.trim(),
                unit: guessUnit(raw) || undefined,
                brand: 'hexing',
                group: 'General',
                attributeId: 2,
            });
        }
        for (const h of hexMatches) {
            if (h.length !== 12)
                continue;
            const a = h.substring(0, 2);
            const b = h.substring(2, 4);
            const c = h.substring(4, 6);
            const d = h.substring(6, 8);
            const e = h.substring(8, 10);
            const f = h.substring(10, 12);
            const code = `${parseInt(a, 16)}-${parseInt(b, 16)}:${parseInt(c, 16)}.${parseInt(d, 16)}.${parseInt(e, 16)}.${parseInt(f, 16)}`;
            functions.push({
                code,
                name: nameCandidate || code,
                description: raw.trim(),
                unit: guessUnit(raw) || undefined,
                brand: 'hexing',
                group: 'General',
                attributeId: 2,
            });
        }
    }
    return functions;
}
/**
 * Parse Hexcell OBIS List from TSV file
 * Format: YES/NO | Name/Attributes | Class Id | OBIS Code | Attribute/Method | Method Id | Data Type | Data Length | Scaler | Unit | Description
 */
function parseHexcellObis(filePath) {
    const content = fs_1.default.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const functions = [];
    const obisRegex = /(\d+-\d+:\d+\.\d+\.\d+\.\d+)/g;
    const hexRegex = /\{?([0-9A-Fa-f]{12})\}?/g;
    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        if (!raw || !raw.trim())
            continue;
        const parts = raw.split('\t').map(p => p.replace(/^"|"$/g, '').trim()).filter(Boolean);
        if (parts.length && parts[0] && parts[0].match(/^\d+\s+/)) {
            // section header
            // capture group name from header
            continue;
        }
        const decMatches = Array.from(raw.matchAll(obisRegex)).map(m => m[1]);
        const hexMatches = Array.from(raw.matchAll(hexRegex)).map(m => m[1]);
        const nameCandidate = parts[1] || parts[0] || '';
        const guessUnit = (s) => {
            if (!s)
                return undefined;
            if (/\bWh\b/i.test(s))
                return 'Wh';
            if (/\bV\b/i.test(s) || /voltage/i.test(s))
                return 'V';
            if (/\bA\b/i.test(s) || /current/i.test(s))
                return 'A';
            if (/Hz/i.test(s) || /frequency/i.test(s))
                return 'Hz';
            if (/W\b/i.test(s) || /power/i.test(s))
                return 'W';
            return undefined;
        };
        for (const m of decMatches) {
            const code = m.trim();
            functions.push({
                code,
                name: nameCandidate || code,
                description: raw.trim(),
                unit: guessUnit(raw) || undefined,
                brand: 'hexcell',
                group: 'General',
                attributeId: 2,
            });
        }
        for (const h of hexMatches) {
            if (h.length !== 12)
                continue;
            const a = h.substring(0, 2);
            const b = h.substring(2, 4);
            const c = h.substring(4, 6);
            const d = h.substring(6, 8);
            const e = h.substring(8, 10);
            const f = h.substring(10, 12);
            const code = `${parseInt(a, 16)}-${parseInt(b, 16)}:${parseInt(c, 16)}.${parseInt(d, 16)}.${parseInt(e, 16)}.${parseInt(f, 16)}`;
            functions.push({
                code,
                name: nameCandidate || code,
                description: raw.trim(),
                unit: guessUnit(raw) || undefined,
                brand: 'hexcell',
                group: 'General',
                attributeId: 2,
            });
        }
    }
    return functions;
}
/**
 * Convert EnhancedObisCode to ObisFunction format
 */
function convertToObisFunction(enhanced) {
    return {
        code: enhanced.code,
        name: enhanced.name,
        description: enhanced.description,
        unit: enhanced.unit,
        scaler: enhanced.scaler,
        dataType: enhanced.dataType,
        classId: enhanced.classId?.toString(),
        attributeId: enhanced.attributeId,
        group: enhanced.category || enhanced.subcategory || 'General',
        brand: enhanced.brand,
        accessRight: enhanced.accessRight?.read ? (enhanced.accessRight?.write ? 'RW' : 'R') : 'W',
    };
}
/**
 * Load and parse all OBIS functions from both brands
 * Now integrates with software configuration parsers for complete meter data
 */
function loadObisFunctions() {
    const hexingPath = path_1.default.join(__dirname, '../../uploads/Hexing OBIS Function.txt');
    const hexcellPath = path_1.default.join(__dirname, '../../uploads/Hexcell AMI System Unified OBIS List.txt');
    // Load from TSV files (legacy method)
    const hexingFromTsv = fs_1.default.existsSync(hexingPath) ? parseHexingObis(hexingPath) : [];
    const hexcellFromTsv = fs_1.default.existsSync(hexcellPath) ? parseHexcellObis(hexcellPath) : [];
    // Load from software configurations (NEW - comprehensive data)
    let hexingFromSoftware = [];
    let hexcellFromSoftware = [];
    try {
        const softwareConfigs = (0, softwareConfigParser_1.loadSoftwareConfigurations)();
        hexingFromSoftware = softwareConfigs.hexing.map(convertToObisFunction);
        hexcellFromSoftware = softwareConfigs.hexcell.map(convertToObisFunction);
        console.log(`[OBIS] Loaded ${hexingFromSoftware.length} Hexing OBIS codes from software config`);
        console.log(`[OBIS] Loaded ${hexcellFromSoftware.length} Hexcell OBIS codes from software config`);
    }
    catch (error) {
        console.error(`[OBIS] Error loading software configurations: ${error.message}`);
    }
    // Merge TSV and software config data (software config takes precedence for richer metadata)
    const mergeArrays = (tsv, software) => {
        const map = new Map();
        // Add TSV data first
        tsv.forEach(f => map.set(f.code.toUpperCase(), f));
        // Override/enhance with software config data (has better metadata)
        software.forEach(f => {
            const key = f.code.toUpperCase();
            if (map.has(key)) {
                // Merge: keep software config data but preserve any TSV data not in software config
                const existing = map.get(key);
                map.set(key, {
                    ...existing,
                    ...f,
                    // Preserve better name/description if available
                    name: f.name || existing.name,
                    description: f.description || existing.description,
                });
            }
            else {
                map.set(key, f);
            }
        });
        return Array.from(map.values());
    };
    const hexing = mergeArrays(hexingFromTsv, hexingFromSoftware);
    const hexcell = mergeArrays(hexcellFromTsv, hexcellFromSoftware);
    console.log(`[OBIS] Total Hexing OBIS functions after merge: ${hexing.length}`);
    console.log(`[OBIS] Total Hexcell OBIS functions after merge: ${hexcell.length}`);
    // Create unified list (avoid duplicates by code)
    const codeMap = new Map();
    hexing.forEach(f => codeMap.set(f.code.toUpperCase(), { ...f, brand: 'hexing' }));
    hexcell.forEach(f => {
        const key = f.code.toUpperCase();
        if (!codeMap.has(key)) {
            codeMap.set(key, { ...f, brand: 'hexcell' });
        }
        else {
            // Mark as available in both brands
            const existing = codeMap.get(key);
            codeMap.set(key, { ...existing, brand: 'hexing,hexcell' });
        }
    });
    const unified = Array.from(codeMap.values());
    console.log(`[OBIS] Total unified OBIS functions: ${unified.length}`);
    return { hexing, hexcell, unified };
}
/**
 * Get function by OBIS code from a specific brand or unified database
 */
function getObisFunctionByCode(code, brand, db) {
    if (!db) {
        db = loadObisFunctions();
    }
    const normalizedCode = code.toUpperCase().trim();
    if (brand === 'hexing') {
        return db.hexing.find(f => f.code.toUpperCase() === normalizedCode) || null;
    }
    else if (brand === 'hexcell') {
        return db.hexcell.find(f => f.code.toUpperCase() === normalizedCode) || null;
    }
    else {
        return db.unified.find(f => f.code.toUpperCase() === normalizedCode) || null;
    }
}
/**
 * Get all functions for a given group
 */
function getObisFunctionsByGroup(group, brand, db) {
    if (!db) {
        db = loadObisFunctions();
    }
    const normalizedGroup = group.toLowerCase().trim();
    let source = brand === 'hexing' ? db.hexing : brand === 'hexcell' ? db.hexcell : db.unified;
    return source.filter(f => f.group?.toLowerCase().includes(normalizedGroup));
}
/**
 * Export to JSON for caching/reference
 */
function exportToJson(dbPath, db) {
    if (!db) {
        db = loadObisFunctions();
    }
    fs_1.default.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log(`OBIS functions exported to ${dbPath}`);
}
// Example usage
if (require.main === module) {
    const db = loadObisFunctions();
    console.log(`Loaded ${db.hexing.length} Hexing OBIS functions`);
    console.log(`Loaded ${db.hexcell.length} Hexcell OBIS functions`);
    console.log(`Total unified: ${db.unified.length}`);
    // Export for reference
    const outPath = path_1.default.join(__dirname, '../../data/obis-functions.json');
    const outDir = path_1.default.dirname(outPath);
    if (!fs_1.default.existsSync(outDir))
        fs_1.default.mkdirSync(outDir, { recursive: true });
    exportToJson(outPath, db);
}
//# sourceMappingURL=parseObisFunctions.js.map