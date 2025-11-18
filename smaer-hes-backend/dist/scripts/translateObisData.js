"use strict";
/**
 * Script to translate Chinese text in OBIS data files
 * Run with: npx ts-node src/scripts/translateObisData.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateObisData = main;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const translateObis_1 = require("../utils/translateObis");
const dataDir = path_1.default.join(__dirname, '../../data');
async function translateObisFile(filename) {
    console.log(`\nProcessing ${filename}...`);
    const filePath = path_1.default.join(dataDir, filename);
    try {
        // Read the file
        const content = fs_1.default.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        let translatedCount = 0;
        // Translate functions array
        if (data.functions && Array.isArray(data.functions)) {
            data.functions = data.functions.map((func) => {
                const hasChinese = (0, translateObis_1.containsChinese)(JSON.stringify(func));
                if (hasChinese) {
                    translatedCount++;
                    return (0, translateObis_1.translateObisFunction)(func);
                }
                return func;
            });
        }
        // Write back to file
        if (translatedCount > 0) {
            fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
            console.log(`✓ Translated ${translatedCount} functions in ${filename}`);
        }
        else {
            console.log(`  No Chinese text found in ${filename}`);
        }
    }
    catch (error) {
        console.error(`✗ Error processing ${filename}:`, error.message);
    }
}
async function main() {
    console.log('Starting OBIS data translation...');
    console.log('=================================');
    const obisFiles = [
        'obis-hexing.json',
        'obis-hexcell.json',
        'obis-functions.json',
    ];
    for (const file of obisFiles) {
        await translateObisFile(file);
    }
    console.log('\n=================================');
    console.log('Translation complete!');
}
// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=translateObisData.js.map