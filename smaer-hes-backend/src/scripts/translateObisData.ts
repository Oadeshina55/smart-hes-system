/**
 * Script to translate Chinese text in OBIS data files
 * Run with: npx ts-node src/scripts/translateObisData.ts
 */

import fs from 'fs';
import path from 'path';
import { translateObisFunction, containsChinese } from '../utils/translateObis';

const dataDir = path.join(__dirname, '../../data');

async function translateObisFile(filename: string): Promise<void> {
  console.log(`\nProcessing ${filename}...`);

  const filePath = path.join(dataDir, filename);

  try {
    // Read the file
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    let translatedCount = 0;

    // Translate functions array
    if (data.functions && Array.isArray(data.functions)) {
      data.functions = data.functions.map((func: any) => {
        const hasChinese = containsChinese(JSON.stringify(func));
        if (hasChinese) {
          translatedCount++;
          return translateObisFunction(func);
        }
        return func;
      });
    }

    // Write back to file
    if (translatedCount > 0) {
      fs.writeFileSync(
        filePath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );
      console.log(`✓ Translated ${translatedCount} functions in ${filename}`);
    } else {
      console.log(`  No Chinese text found in ${filename}`);
    }
  } catch (error: any) {
    console.error(`✗ Error processing ${filename}:`, error.message);
  }
}

async function main(): Promise<void> {
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

export { main as translateObisData };
