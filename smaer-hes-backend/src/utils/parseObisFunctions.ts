import fs from 'fs';
import path from 'path';
import { loadSoftwareConfigurations, EnhancedObisCode } from './softwareConfigParser';
import { translateChinese, containsChinese } from './translateObis';

export interface ObisFunction {
	code: string;                    // OBIS code (e.g., "0-0:96.7.21.255")
	name: string;                    // Function name (e.g., "Number of Short Power Failure in Any Phases")
	description?: string;            // Description (e.g., "任意相短时间掉电次数")
	unit?: string;                   // Unit (e.g., "Wh", "V", "A", "Hz")
	scaler?: number;                 // DLMS scaler (e.g., -3, 1, -1)
	dataType?: string;               // Data type (e.g., "double-long-unsigned", "long-unsigned")
	classId?: string;                // DLMS Class ID (e.g., "3" for Register, "8" for Clock)
	attributeId?: number;            // DLMS Attribute ID (usually 2 for value)
	group?: string;                  // Group/category (Information, Energy, Clock, etc.)
	brand?: string;                  // Brand (hexing, hexcell)
	accessRight?: string;            // Access right (R, RW)
}

export interface ObisFunctionDatabase {
	hexing: ObisFunction[];
	hexcell: ObisFunction[];
	unified: ObisFunction[];  // Combined with duplicates marked
}

/**
 * Parse Hexing OBIS Functions from TSV file
 * Format: Tab-separated with Function | Class ID | OBIS Code | ... | Unit | Comments
 */
function parseHexingObis(filePath: string): ObisFunction[] {
	const content = fs.readFileSync(filePath, 'utf8');
	const lines = content.split(/\r?\n/);
	const functions: ObisFunction[] = [];

	const obisRegex = /(\d+-\d+:\d+\.\d+\.\d+\.\d+)/g;
	const hexRegex = /\{?([0-9A-Fa-f]{12})\}?/g;

	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i];
		if (!raw || !raw.trim()) continue;

		const parts = raw.split('\t').map(p => p.replace(/^"|"$/g, '').trim()).filter(Boolean);
		const nameCandidate = parts[1] || parts[0] || '';
		const decMatches = Array.from(raw.matchAll(obisRegex)).map(m => m[1]);
		const hexMatches = Array.from(raw.matchAll(hexRegex)).map(m => m[1]);

		const guessUnit = (s: string) => {
			if (!s) return undefined;
			if (/\bWh\b/i.test(s)) return 'Wh';
			if (/\bV\b/i.test(s) || /voltage/i.test(s)) return 'V';
			if (/\bA\b/i.test(s) || /current/i.test(s)) return 'A';
			if (/Hz/i.test(s) || /frequency/i.test(s)) return 'Hz';
			if (/W\b/i.test(s) || /power/i.test(s)) return 'W';
			return undefined;
		};

		for (const m of decMatches) {
			const code = m.trim();
			const translatedName = containsChinese(nameCandidate) ? translateChinese(nameCandidate) : nameCandidate;
			const translatedDesc = containsChinese(raw) ? translateChinese(raw) : raw;
			const group = categorizeObisCode(code, translatedName, translatedDesc);

			functions.push({
				code,
				name: translatedName || code,
				description: translatedDesc.trim(),
				unit: guessUnit(raw) || undefined,
				brand: 'hexing',
				group,
				attributeId: 2,
			});
		}

		for (const h of hexMatches) {
			if (h.length !== 12) continue;
			const a = h.substring(0, 2);
			const b = h.substring(2, 4);
			const c = h.substring(4, 6);
			const d = h.substring(6, 8);
			const e = h.substring(8, 10);
			const f = h.substring(10, 12);
			const code = `${parseInt(a, 16)}-${parseInt(b, 16)}:${parseInt(c, 16)}.${parseInt(d, 16)}.${parseInt(e, 16)}.${parseInt(f, 16)}`;
			const translatedName = containsChinese(nameCandidate) ? translateChinese(nameCandidate) : nameCandidate;
			const translatedDesc = containsChinese(raw) ? translateChinese(raw) : raw;
			const group = categorizeObisCode(code, translatedName, translatedDesc);

			functions.push({
				code,
				name: translatedName || code,
				description: translatedDesc.trim(),
				unit: guessUnit(raw) || undefined,
				brand: 'hexing',
				group,
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
function parseHexcellObis(filePath: string): ObisFunction[] {
	const content = fs.readFileSync(filePath, 'utf8');
	const lines = content.split(/\r?\n/);
	const functions: ObisFunction[] = [];

	const obisRegex = /(\d+-\d+:\d+\.\d+\.\d+\.\d+)/g;
	const hexRegex = /\{?([0-9A-Fa-f]{12})\}?/g;

	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i];
		if (!raw || !raw.trim()) continue;

		const parts = raw.split('\t').map(p => p.replace(/^"|"$/g, '').trim()).filter(Boolean);
		if (parts.length && parts[0] && parts[0].match(/^\d+\s+/)) {
			// section header
			// capture group name from header
			continue;
		}

		const decMatches = Array.from(raw.matchAll(obisRegex)).map(m => m[1]);
		const hexMatches = Array.from(raw.matchAll(hexRegex)).map(m => m[1]);
		const nameCandidate = parts[1] || parts[0] || '';

		const guessUnit = (s: string) => {
			if (!s) return undefined;
			if (/\bWh\b/i.test(s)) return 'Wh';
			if (/\bV\b/i.test(s) || /voltage/i.test(s)) return 'V';
			if (/\bA\b/i.test(s) || /current/i.test(s)) return 'A';
			if (/Hz/i.test(s) || /frequency/i.test(s)) return 'Hz';
			if (/W\b/i.test(s) || /power/i.test(s)) return 'W';
			return undefined;
		};

		for (const m of decMatches) {
			const code = m.trim();
			const translatedName = containsChinese(nameCandidate) ? translateChinese(nameCandidate) : nameCandidate;
			const translatedDesc = containsChinese(raw) ? translateChinese(raw) : raw;
			const group = categorizeObisCode(code, translatedName, translatedDesc);

			functions.push({
				code,
				name: translatedName || code,
				description: translatedDesc.trim(),
				unit: guessUnit(raw) || undefined,
				brand: 'hexcell',
				group,
				attributeId: 2,
			});
		}

		for (const h of hexMatches) {
			if (h.length !== 12) continue;
			const a = h.substring(0, 2);
			const b = h.substring(2, 4);
			const c = h.substring(4, 6);
			const d = h.substring(6, 8);
			const e = h.substring(8, 10);
			const f = h.substring(10, 12);
			const code = `${parseInt(a, 16)}-${parseInt(b, 16)}:${parseInt(c, 16)}.${parseInt(d, 16)}.${parseInt(e, 16)}.${parseInt(f, 16)}`;
			const translatedName = containsChinese(nameCandidate) ? translateChinese(nameCandidate) : nameCandidate;
			const translatedDesc = containsChinese(raw) ? translateChinese(raw) : raw;
			const group = categorizeObisCode(code, translatedName, translatedDesc);

			functions.push({
				code,
				name: translatedName || code,
				description: translatedDesc.trim(),
				unit: guessUnit(raw) || undefined,
				brand: 'hexcell',
				group,
				attributeId: 2,
			});
		}
	}

	return functions;
}

/**
 * Categorize OBIS code into functional groups
 */
function categorizeObisCode(code: string, name: string, description?: string): string {
	const nameLower = name.toLowerCase();
	const descLower = (description || '').toLowerCase();
	const combined = `${nameLower} ${descLower}`;

	// Energy and consumption
	if (combined.includes('energy') || combined.includes('kwh') || combined.includes('wh') ||
	    combined.includes('电能') || code.includes('1.8') || code.includes('2.8')) {
		return 'Energy';
	}

	// Demand
	if (combined.includes('demand') || combined.includes('maximum') || combined.includes('peak') ||
	    combined.includes('需量') || code.includes('1.6') || code.includes('2.6')) {
		return 'Demand';
	}

	// Instantaneous values
	if (combined.includes('voltage') || combined.includes('current') || combined.includes('power') ||
	    combined.includes('frequency') || combined.includes('电压') || combined.includes('电流') ||
	    combined.includes('功率') || code.includes('32.7') || code.includes('52.7') ||
	    code.includes('31.7') || code.includes('51.7') || code.includes('14.7')) {
		return 'Instantaneous';
	}

	// Thresholds and limits
	if (combined.includes('threshold') || combined.includes('limit') || combined.includes('门限') ||
	    combined.includes('阈值') || combined.includes('upper') || combined.includes('lower') ||
	    nameLower.includes('th_')) {
		return 'Threshold';
	}

	// Events and counters
	if (combined.includes('event') || combined.includes('counter') || combined.includes('count') ||
	    combined.includes('number of') || combined.includes('事件') || combined.includes('次数') ||
	    code.includes('96.7') || code.includes('99.98')) {
		return 'Event';
	}

	// Relay control
	if (combined.includes('relay') || combined.includes('disconnect') || combined.includes('connect') ||
	    combined.includes('继电器') || combined.includes('开关') || code.includes('96.3')) {
		return 'Relay Control';
	}

	// Tariff and billing
	if (combined.includes('tariff') || combined.includes('billing') || combined.includes('rate') ||
	    combined.includes('费率') || code.includes('0-0:11')) {
		return 'Tariff';
	}

	// Clock and time
	if (combined.includes('clock') || combined.includes('time') || combined.includes('date') ||
	    combined.includes('时间') || combined.includes('日期') || code.includes('0-0:1.0.0')) {
		return 'Clock';
	}

	// Status and information
	if (combined.includes('status') || combined.includes('state') || combined.includes('serial') ||
	    combined.includes('version') || combined.includes('状态') || combined.includes('信息') ||
	    code.includes('96.1') || code.includes('0-0:0.')) {
		return 'Information';
	}

	// Tamper detection
	if (combined.includes('tamper') || combined.includes('cover') || combined.includes('magnetic') ||
	    combined.includes('防窃电') || code.includes('96.5')) {
		return 'Tamper Detection';
	}

	// Prepayment
	if (combined.includes('prepayment') || combined.includes('credit') || combined.includes('balance') ||
	    combined.includes('预付费') || code.includes('19.')) {
		return 'Prepayment';
	}

	// Load profile
	if (combined.includes('profile') || combined.includes('load') || code.includes('99.1') || code.includes('99.2')) {
		return 'Load Profile';
	}

	// Configuration
	if (combined.includes('config') || combined.includes('setting') || combined.includes('parameter') ||
	    combined.includes('配置') || combined.includes('设置')) {
		return 'Configuration';
	}

	return 'Other';
}

/**
 * Convert EnhancedObisCode to ObisFunction format with translation
 */
function convertToObisFunction(enhanced: EnhancedObisCode): ObisFunction {
	// Translate name and description if they contain Chinese
	const translatedName = containsChinese(enhanced.name) ? translateChinese(enhanced.name) : enhanced.name;
	const translatedDescription = enhanced.description && containsChinese(enhanced.description)
		? translateChinese(enhanced.description)
		: enhanced.description;

	// Determine better functional grouping
	const functionalGroup = categorizeObisCode(
		enhanced.code,
		translatedName,
		translatedDescription
	);

	return {
		code: enhanced.code,
		name: translatedName,
		description: translatedDescription,
		unit: enhanced.unit,
		scaler: enhanced.scaler,
		dataType: enhanced.dataType,
		classId: enhanced.classId?.toString(),
		attributeId: enhanced.attributeId,
		group: functionalGroup,
		brand: enhanced.brand,
		accessRight: enhanced.accessRight?.read ? (enhanced.accessRight?.write ? 'RW' : 'R') : 'W',
	};
}

/**
 * Load and parse all OBIS functions from both brands
 * Now integrates with software configuration parsers for complete meter data
 */
export function loadObisFunctions(): ObisFunctionDatabase {
	const hexingPath = path.join(__dirname, '../../uploads/Hexing OBIS Function.txt');
	const hexcellPath = path.join(__dirname, '../../uploads/Hexcell AMI System Unified OBIS List.txt');

	// Load from TSV files (legacy method)
	const hexingFromTsv = fs.existsSync(hexingPath) ? parseHexingObis(hexingPath) : [];
	const hexcellFromTsv = fs.existsSync(hexcellPath) ? parseHexcellObis(hexcellPath) : [];

	// Load from software configurations (NEW - comprehensive data)
	let hexingFromSoftware: ObisFunction[] = [];
	let hexcellFromSoftware: ObisFunction[] = [];

	try {
		const softwareConfigs = loadSoftwareConfigurations();
		hexingFromSoftware = softwareConfigs.hexing.map(convertToObisFunction);
		hexcellFromSoftware = softwareConfigs.hexcell.map(convertToObisFunction);
		console.log(`[OBIS] Loaded ${hexingFromSoftware.length} Hexing OBIS codes from software config`);
		console.log(`[OBIS] Loaded ${hexcellFromSoftware.length} Hexcell OBIS codes from software config`);
	} catch (error: any) {
		console.error(`[OBIS] Error loading software configurations: ${error.message}`);
	}

	// Merge TSV and software config data (software config takes precedence for richer metadata)
	const mergeArrays = (tsv: ObisFunction[], software: ObisFunction[]): ObisFunction[] => {
		const map = new Map<string, ObisFunction>();

		// Add TSV data first
		tsv.forEach(f => map.set(f.code.toUpperCase(), f));

		// Override/enhance with software config data (has better metadata)
		software.forEach(f => {
			const key = f.code.toUpperCase();
			if (map.has(key)) {
				// Merge: keep software config data but preserve any TSV data not in software config
				const existing = map.get(key)!;
				map.set(key, {
					...existing,
					...f,
					// Preserve better name/description if available
					name: f.name || existing.name,
					description: f.description || existing.description,
				});
			} else {
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
	const codeMap = new Map<string, ObisFunction>();
	hexing.forEach(f => codeMap.set(f.code.toUpperCase(), { ...f, brand: 'hexing' }));
	hexcell.forEach(f => {
		const key = f.code.toUpperCase();
		if (!codeMap.has(key)) {
			codeMap.set(key, { ...f, brand: 'hexcell' });
		} else {
			// Mark as available in both brands
			const existing = codeMap.get(key)!;
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
export function getObisFunctionByCode(code: string, brand?: 'hexing' | 'hexcell', db?: ObisFunctionDatabase): ObisFunction | null {
	if (!db) {
		db = loadObisFunctions();
	}

	const normalizedCode = code.toUpperCase().trim();

	if (brand === 'hexing') {
		return db.hexing.find(f => f.code.toUpperCase() === normalizedCode) || null;
	} else if (brand === 'hexcell') {
		return db.hexcell.find(f => f.code.toUpperCase() === normalizedCode) || null;
	} else {
		return db.unified.find(f => f.code.toUpperCase() === normalizedCode) || null;
	}
}

/**
 * Get all functions for a given group
 */
export function getObisFunctionsByGroup(group: string, brand?: 'hexing' | 'hexcell', db?: ObisFunctionDatabase): ObisFunction[] {
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
export function exportToJson(dbPath: string, db?: ObisFunctionDatabase): void {
	if (!db) {
		db = loadObisFunctions();
	}
	fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
	console.log(`OBIS functions exported to ${dbPath}`);
}

// Example usage
if (require.main === module) {
	const db = loadObisFunctions();
	console.log(`Loaded ${db.hexing.length} Hexing OBIS functions`);
	console.log(`Loaded ${db.hexcell.length} Hexcell OBIS functions`);
	console.log(`Total unified: ${db.unified.length}`);

	// Export for reference
	const outPath = path.join(__dirname, '../../data/obis-functions.json');
	const outDir = path.dirname(outPath);
	if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
	exportToJson(outPath, db);
}
