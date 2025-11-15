/**
 * Script to parse and generate OBIS functions database
 * Run with: npm run obis:parse
 */

import { loadObisFunctions, exportToJson } from './src/utils/parseObisFunctions';
import path from 'path';
import fs from 'fs';

try {
	console.log('🔍 Parsing OBIS functions from meter brand files...\n');

	const db = loadObisFunctions();

	console.log(`✅ Hexing: ${db.hexing.length} functions`);
	console.log(`✅ Hexcell: ${db.hexcell.length} functions`);
	console.log(`✅ Unified: ${db.unified.length} functions`);

	// Create data directory if it doesn't exist
	const dataDir = path.join(__dirname, 'data');
	if (!fs.existsSync(dataDir)) {
		fs.mkdirSync(dataDir, { recursive: true });
	}

	// Export to JSON files
	const mainPath = path.join(dataDir, 'obis-functions.json');
	exportToJson(mainPath, db);

	// Also export individual brand databases
	const hexingPath = path.join(dataDir, 'obis-hexing.json');
	fs.writeFileSync(hexingPath, JSON.stringify({ functions: db.hexing }, null, 2));
	console.log(`✅ Exported ${db.hexing.length} Hexing functions to ${hexingPath}`);

	const hexcellPath = path.join(dataDir, 'obis-hexcell.json');
	fs.writeFileSync(hexcellPath, JSON.stringify({ functions: db.hexcell }, null, 2));
	console.log(`✅ Exported ${db.hexcell.length} Hexcell functions to ${hexcellPath}`);

	// Export statistics
	const groups = new Set<string>();
	const hexingGroups = new Set<string>();
	const hexcellGroups = new Set<string>();

	db.unified.forEach(f => f.group && groups.add(f.group));
	db.hexing.forEach(f => f.group && hexingGroups.add(f.group));
	db.hexcell.forEach(f => f.group && hexcellGroups.add(f.group));

	const stats = {
		generatedAt: new Date().toISOString(),
		totals: {
			hexing: db.hexing.length,
			hexcell: db.hexcell.length,
			unified: db.unified.length,
		},
		groups: {
			unified: Array.from(groups).sort(),
			hexing: Array.from(hexingGroups).sort(),
			hexcell: Array.from(hexcellGroups).sort(),
		},
		groupCounts: {
			unified: groups.size,
			hexing: hexingGroups.size,
			hexcell: hexcellGroups.size,
		},
	};

	const statsPath = path.join(dataDir, 'obis-statistics.json');
	fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
	console.log(`\n📊 Statistics:\n${JSON.stringify(stats, null, 2)}`);

	console.log(`\n✨ All OBIS data successfully parsed and exported!`);
	process.exit(0);
} catch (err: any) {
	console.error('❌ Error parsing OBIS data:', err.message);
	process.exit(1);
}
