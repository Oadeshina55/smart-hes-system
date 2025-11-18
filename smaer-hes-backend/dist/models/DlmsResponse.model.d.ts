/**
 * DLMS/COSEM Response Models
 * Standard DLMS (Device Language Message Specification) response format
 */
/**
 * DLMS Attribute - represents a single OBIS code value with unit and metadata
 */
export interface DlmsAttribute {
    obisCode: string;
    name: string;
    value: string | number | boolean;
    unit?: string;
    scaler?: number;
    actualValue?: number;
    dataType?: string;
    classId?: string;
    attributeId?: number;
    timestamp?: string;
}
/**
 * DLMS Group - collection of related attributes
 */
export interface DlmsGroup {
    groupName: string;
    attributes: DlmsAttribute[];
    readTime?: string;
    quality?: number;
}
/**
 * DLMS Response - complete reading response from meter
 */
export interface DlmsResponse {
    meterId: string;
    meterType: string;
    timestamp: string;
    protocol: 'DLMS/COSEM' | 'IEC 62056-21' | 'MODBUS';
    groups: DlmsGroup[];
    totalAttributes?: number;
    readSuccess: boolean;
    errorMessage?: string;
}
/**
 * Build actual value from raw value and scaler
 * actualValue = rawValue * 10^scaler
 */
export declare function applyScaler(rawValue: number, scaler?: number): number;
/**
 * Format value with unit for display
 */
export declare function formatValueWithUnit(value: number, unit?: string, scaler?: number): string;
/**
 * Create a DLMS attribute from a reading
 */
export declare function createDlmsAttribute(obisCode: string, name: string, value: any, unit?: string, scaler?: number, dataType?: string, classId?: string, attributeId?: number): DlmsAttribute;
/**
 * Create a DLMS group
 */
export declare function createDlmsGroup(groupName: string, attributes: DlmsAttribute[]): DlmsGroup;
/**
 * Create a DLMS response
 */
export declare function createDlmsResponse(meterId: string, meterType: string, groups: DlmsGroup[], readSuccess?: boolean, errorMessage?: string): DlmsResponse;
/**
 * Convert flat reading object to DLMS groups using OBIS function metadata
 * @param readings - Key-value pairs of OBIS code -> value
 * @param obisFunctions - OBIS function definitions with groups and units
 */
export declare function formatReadingsAsDlms(meterId: string, meterType: string, readings: Record<string, any>, obisFunctions: Map<string, any>): DlmsResponse;
//# sourceMappingURL=DlmsResponse.model.d.ts.map