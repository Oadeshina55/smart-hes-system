/**
 * DLMS/COSEM Response Models
 * Standard DLMS (Device Language Message Specification) response format
 */

/**
 * DLMS Attribute - represents a single OBIS code value with unit and metadata
 */
export interface DlmsAttribute {
	obisCode: string;                 // e.g., "0-0:1.0.0"
	name: string;                     // Friendly name
	value: string | number | boolean; // Actual value from meter
	unit?: string;                    // Unit of measurement (V, A, Wh, etc.)
	scaler?: number;                  // DLMS scaler factor (-3, -1, 0, 1, etc.)
	actualValue?: number;             // Value * 10^scaler for unit display
	dataType?: string;                // DLMS data type
	classId?: string;                 // DLMS class ID (3 = Register, 8 = Clock, etc.)
	attributeId?: number;             // DLMS attribute ID
	timestamp?: string;               // When this value was read
}

/**
 * DLMS Group - collection of related attributes
 */
export interface DlmsGroup {
	groupName: string;                // e.g., "Energy", "Clock", "Information"
	attributes: DlmsAttribute[];
	readTime?: string;               // When this group was read
	quality?: number;                // Data quality (0-100%, 100 = valid)
}

/**
 * DLMS Response - complete reading response from meter
 */
export interface DlmsResponse {
	meterId: string;                  // Meter ID or number
	meterType: string;               // Brand (hexing, hexcell)
	timestamp: string;               // Reading timestamp
	protocol: 'DLMS/COSEM' | 'IEC 62056-21' | 'MODBUS';
	groups: DlmsGroup[];             // Grouped attributes
	totalAttributes?: number;        // Count of all attributes
	readSuccess: boolean;            // Whether read was successful
	errorMessage?: string;           // Error if read failed
}

/**
 * Build actual value from raw value and scaler
 * actualValue = rawValue * 10^scaler
 */
export function applyScaler(rawValue: number, scaler?: number): number {
	if (scaler === undefined || scaler === 0) return rawValue;
	return rawValue * Math.pow(10, scaler);
}

/**
 * Format value with unit for display
 */
export function formatValueWithUnit(value: number, unit?: string, scaler?: number): string {
	const actualValue = applyScaler(value, scaler);
	if (!unit) return actualValue.toString();
	return `${actualValue} ${unit}`;
}

/**
 * Create a DLMS attribute from a reading
 */
export function createDlmsAttribute(
	obisCode: string,
	name: string,
	value: any,
	unit?: string,
	scaler?: number,
	dataType?: string,
	classId?: string,
	attributeId?: number,
): DlmsAttribute {
	const numValue = typeof value === 'number' ? value : parseFloat(String(value));
	return {
		obisCode,
		name,
		value,
		unit,
		scaler,
		actualValue: !isNaN(numValue) ? applyScaler(numValue, scaler) : undefined,
		dataType,
		classId,
		attributeId,
		timestamp: new Date().toISOString(),
	};
}

/**
 * Create a DLMS group
 */
export function createDlmsGroup(groupName: string, attributes: DlmsAttribute[]): DlmsGroup {
	return {
		groupName,
		attributes,
		readTime: new Date().toISOString(),
		quality: 100, // Assume valid for now
	};
}

/**
 * Create a DLMS response
 */
export function createDlmsResponse(
	meterId: string,
	meterType: string,
	groups: DlmsGroup[],
	readSuccess: boolean = true,
	errorMessage?: string,
): DlmsResponse {
	return {
		meterId,
		meterType,
		timestamp: new Date().toISOString(),
		protocol: 'DLMS/COSEM',
		groups,
		totalAttributes: groups.reduce((sum, g) => sum + g.attributes.length, 0),
		readSuccess,
		errorMessage,
	};
}

/**
 * Convert flat reading object to DLMS groups using OBIS function metadata
 * @param readings - Key-value pairs of OBIS code -> value
 * @param obisFunctions - OBIS function definitions with groups and units
 */
export function formatReadingsAsDlms(
	meterId: string,
	meterType: string,
	readings: Record<string, any>,
	obisFunctions: Map<string, any>,
): DlmsResponse {
	const groupMap = new Map<string, DlmsAttribute[]>();

	// Iterate through readings and map to DLMS attributes
	Object.entries(readings).forEach(([code, value]) => {
		const obisFunc = obisFunctions.get(code);

		const attr = createDlmsAttribute(
			code,
			obisFunc?.name || code,
			value,
			obisFunc?.unit,
			obisFunc?.scaler,
			obisFunc?.dataType,
			obisFunc?.classId,
			obisFunc?.attributeId || 2,
		);

		const groupName = obisFunc?.group || 'Other';
		if (!groupMap.has(groupName)) {
			groupMap.set(groupName, []);
		}
		groupMap.get(groupName)!.push(attr);
	});

	// Convert grouped attributes to DLMS groups
	const groups: DlmsGroup[] = [];
	groupMap.forEach((attributes, groupName) => {
		groups.push(createDlmsGroup(groupName, attributes));
	});

	return createDlmsResponse(meterId, meterType, groups);
}
