"use strict";
/**
 * Script to enhance existing OBIS JSON files with data from software configuration files
 *
 * This script:
 * 1. Parses Hexcell and Hexing software configuration text files
 * 2. Merges with existing OBIS JSON data
 * 3. Enriches with proper class IDs, attribute IDs, data types, scalers, and units
 * 4. Outputs enhanced JSON files
 */
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const softwareConfigParser_1 = require("../utils/softwareConfigParser");
/**
 * Merge existing OBIS data with software config data
 */
function mergeObisData(existing, softwareConfig) {
    const merged = [];
    const softwareMap = new Map();
    // Create lookup map from software config
    softwareConfig.forEach(config => {
        softwareMap.set(config.code, config);
    });
    // Merge existing with software config
    existing.forEach(existingFunc => {
        const enhanced = softwareMap.get(existingFunc.code);
        if (enhanced) {
            // Merge data, prioritizing software config for technical details
            merged.push({
                ...existingFunc,
                classId: enhanced.classId || existingFunc.classId,
                attributeId: enhanced.attributeId || existingFunc.attributeId,
                unit: enhanced.unit || existingFunc.unit,
                name: existingFunc.name || enhanced.name,
                description: existingFunc.description || enhanced.description,
            });
            // Remove from map to track what's been merged
            softwareMap.delete(existingFunc.code);
        }
        else {
            // Keep existing if no match in software config
            merged.push(existingFunc);
        }
    });
    // Add remaining software config entries that weren't in existing data
    softwareMap.forEach(config => {
        merged.push({
            code: config.code,
            name: config.name,
            description: config.description,
            unit: config.unit,
            brand: config.brand,
            group: config.category || 'General',
            classId: config.classId,
            attributeId: config.attributeId,
        });
    });
    return merged;
}
/**
 * Main execution
 */
async function main() {
    console.log('🚀 Enhancing OBIS data with software configuration files...\n');
    const dataDir = path.join(__dirname, '../../data');
    const uploadsDir = path.join(__dirname, '../../uploads');
    // Parse software configuration files
    console.log('📖 Parsing Hexcell software configuration...');
    const hexcellConfigPath = path.join(uploadsDir, 'Hexcell AMI System Unified OBIS List.txt');
    const hexcellSoftwareConfig = fs.existsSync(hexcellConfigPath)
        ? (0, softwareConfigParser_1.parseHexcellObisList)(hexcellConfigPath)
        : [];
    console.log(`✓ Found ${hexcellSoftwareConfig.length} Hexcell OBIS codes\n`);
    console.log('📖 Parsing Hexing software configuration...');
    const hexingConfigPath = path.join(uploadsDir, 'Hexing OBIS Function.txt');
    const hexingSoftwareConfig = fs.existsSync(hexingConfigPath)
        ? (0, softwareConfigParser_1.parseHexingObisList)(hexingConfigPath)
        : [];
    console.log(`✓ Found ${hexingSoftwareConfig.length} Hexing OBIS codes\n`);
    // Load existing OBIS JSON files
    console.log('📖 Loading existing OBIS JSON files...');
    const hexcellJsonPath = path.join(dataDir, 'obis-hexcell.json');
    const hexingJsonPath = path.join(dataDir, 'obis-hexing.json');
    let hexcellExisting = { functions: [] };
    let hexingExisting = { functions: [] };
    if (fs.existsSync(hexcellJsonPath)) {
        const content = fs.readFileSync(hexcellJsonPath, 'utf-8');
        hexcellExisting = JSON.parse(content);
        console.log(`✓ Loaded ${hexcellExisting.functions?.length || 0} existing Hexcell functions`);
    }
    if (fs.existsSync(hexingJsonPath)) {
        const content = fs.readFileSync(hexingJsonPath, 'utf-8');
        hexingExisting = JSON.parse(content);
        console.log(`✓ Loaded ${hexingExisting.functions?.length || 0} existing Hexing functions\n`);
    }
    // Merge data
    console.log('🔄 Merging software config with existing data...');
    const mergedHexcell = mergeObisData(hexcellExisting.functions || [], hexcellSoftwareConfig);
    const mergedHexing = mergeObisData(hexingExisting.functions || [], hexingSoftwareConfig);
    console.log(`✓ Merged Hexcell: ${mergedHexcell.length} total functions`);
    console.log(`✓ Merged Hexing: ${mergedHexing.length} total functions\n`);
    // Save enhanced JSON files
    console.log('💾 Saving enhanced OBIS data...');
    const enhancedHexcellPath = path.join(dataDir, 'obis-hexcell-enhanced.json');
    const enhancedHexingPath = path.join(dataDir, 'obis-hexing-enhanced.json');
    fs.writeFileSync(enhancedHexcellPath, JSON.stringify({ functions: mergedHexcell }, null, 2), 'utf-8');
    console.log(`✓ Saved ${enhancedHexcellPath}`);
    fs.writeFileSync(enhancedHexingPath, JSON.stringify({ functions: mergedHexing }, null, 2), 'utf-8');
    console.log(`✓ Saved ${enhancedHexingPath}\n`);
    // Generate summary statistics
    console.log('📊 Summary Statistics:');
    console.log('═'.repeat(50));
    console.log(`Hexcell OBIS Codes: ${mergedHexcell.length}`);
    console.log(`  - With Class ID: ${mergedHexcell.filter(f => f.classId).length}`);
    console.log(`  - With Attribute ID: ${mergedHexcell.filter(f => f.attributeId).length}`);
    console.log(`  - With Unit: ${mergedHexcell.filter(f => f.unit).length}`);
    console.log();
    console.log(`Hexing OBIS Codes: ${mergedHexing.length}`);
    console.log(`  - With Class ID: ${mergedHexing.filter(f => f.classId).length}`);
    console.log(`  - With Attribute ID: ${mergedHexing.filter(f => f.attributeId).length}`);
    console.log(`  - With Unit: ${mergedHexing.filter(f => f.unit).length}`);
    console.log('═'.repeat(50));
    console.log('\n✅ OBIS data enhancement complete!');
    console.log('\nNext steps:');
    console.log('1. Review the enhanced JSON files');
    console.log('2. Update obisFunction.service.ts to use enhanced files');
    console.log('3. Test with real meter readings');
}
// Run the script
main().catch(error => {
    console.error('❌ Error enhancing OBIS data:', error);
    process.exit(1);
});
//# sourceMappingURL=enhanceObisData.js.map