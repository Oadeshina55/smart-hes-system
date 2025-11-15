import { loadObisFunctions, getObisFunctionByCode, getObisFunctionsByGroup, ObisFunction } from '../utils/parseObisFunctions';
import { 
	createDlmsAttribute, 
	createDlmsGroup, 
	createDlmsResponse, 
	formatReadingsAsDlms,
	DlmsResponse,
	DlmsAttribute,
	DlmsGroup,
} from '../models/DlmsResponse.model';

class ObisFunctionService {
	private db: any;
	private functionMap: Map<string, ObisFunction>;

	constructor() {
		this.db = loadObisFunctions();
		this.functionMap = new Map();
		this.db.unified.forEach((func: ObisFunction) => {
			this.functionMap.set(func.code.toUpperCase(), func);
		});
	}

	/**
	 * Get a single OBIS function by code
	 */
	getFunction(code: string): ObisFunction | null {
		const normalized = code.toUpperCase().trim();
		return this.functionMap.get(normalized) || null;
	}

	/**
	 * Get all functions for a brand
	 */
	getAllFunctions(brand?: 'hexing' | 'hexcell'): ObisFunction[] {
		if (brand === 'hexing') {
			return this.db.hexing;
		} else if (brand === 'hexcell') {
			return this.db.hexcell;
		}
		return this.db.unified;
	}

	/**
	 * Get functions by group
	 */
	getFunctionsByGroup(group: string, brand?: 'hexing' | 'hexcell'): ObisFunction[] {
		const source = brand === 'hexing' ? this.db.hexing : brand === 'hexcell' ? this.db.hexcell : this.db.unified;
		return source.filter((f: ObisFunction) => 
			f.group?.toLowerCase().includes(group.toLowerCase())
		);
	}

	/**
	 * Get unique group names
	 */
	getGroups(brand?: 'hexing' | 'hexcell'): string[] {
		const source = brand === 'hexing' ? this.db.hexing : brand === 'hexcell' ? this.db.hexcell : this.db.unified;
		const groups = new Set<string>();
		source.forEach((f: ObisFunction) => {
			if (f.group) groups.add(f.group);
		});
		return Array.from(groups).sort();
	}

	/**
	 * Format raw meter readings as DLMS response with units
	 * readings: { "0-0:1.0.0": value, "0-1:32.7.0": 230.5, ... }
	 */
	formatReadingsAsDlms(
		meterId: string,
		meterType: string,
		readings: Record<string, any>,
	): DlmsResponse {
		const groupMap = new Map<string, DlmsAttribute[]>();

		// Map readings to OBIS functions and group by category
		Object.entries(readings).forEach(([code, value]) => {
			const obisFunc = this.getFunction(code);
			if (!obisFunc) {
				// Still create attribute even if function not found
				const attr = createDlmsAttribute(code, code, value);
				const group = 'Unknown';
				if (!groupMap.has(group)) groupMap.set(group, []);
				groupMap.get(group)!.push(attr);
				return;
			}

			const attr = createDlmsAttribute(
				code,
				obisFunc.name,
				value,
				obisFunc.unit,
				obisFunc.scaler,
				obisFunc.dataType,
				obisFunc.classId,
				obisFunc.attributeId,
			);

			const groupName = obisFunc.group || 'Other';
			if (!groupMap.has(groupName)) groupMap.set(groupName, []);
			groupMap.get(groupName)!.push(attr);
		});

		// Sort groups and attributes
		const groups: DlmsGroup[] = Array.from(groupMap.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([name, attrs]) => createDlmsGroup(name, attrs));

		return createDlmsResponse(meterId, meterType, groups, true);
	}

	/**
	 * Create a DLMS attribute from OBIS code and value
	 */
	createAttributeFromCode(code: string, value: any): DlmsAttribute {
		const obisFunc = this.getFunction(code);
		return createDlmsAttribute(
			code,
			obisFunc?.name || code,
			value,
			obisFunc?.unit,
			obisFunc?.scaler,
			obisFunc?.dataType,
			obisFunc?.classId,
			obisFunc?.attributeId,
		);
	}

	/**
	 * Get unit for a given OBIS code
	 */
	getUnit(code: string): string | undefined {
		return this.getFunction(code)?.unit;
	}

	/**
	 * Get scaler for a given OBIS code
	 */
	getScaler(code: string): number | undefined {
		return this.getFunction(code)?.scaler;
	}

	/**
	 * Format a value with its unit and scaler
	 */
	formatValueWithUnit(code: string, value: number): string {
		const obisFunc = this.getFunction(code);
		if (!obisFunc) return String(value);

		const actualValue = obisFunc.scaler ? value * Math.pow(10, obisFunc.scaler) : value;
		const unit = obisFunc.unit ? ` ${obisFunc.unit}` : '';
		return `${actualValue}${unit}`;
	}

	/**
	 * Export statistics about loaded OBIS functions
	 */
	getStatistics() {
		return {
			hexingTotal: this.db.hexing.length,
			hexcellTotal: this.db.hexcell.length,
			unifiedTotal: this.db.unified.length,
			groups: this.getGroups(),
			hexingGroups: this.getGroups('hexing'),
			hexcellGroups: this.getGroups('hexcell'),
		};
	}
}

export default new ObisFunctionService();
