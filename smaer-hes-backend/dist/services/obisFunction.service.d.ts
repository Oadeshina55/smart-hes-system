import { ObisFunction } from '../utils/parseObisFunctions';
import { DlmsResponse, DlmsAttribute } from '../models/DlmsResponse.model';
declare class ObisFunctionService {
    private db;
    private functionMap;
    constructor();
    /**
     * Get a single OBIS function by code
     */
    getFunction(code: string): ObisFunction | null;
    /**
     * Get all functions for a brand
     */
    getAllFunctions(brand?: 'hexing' | 'hexcell'): ObisFunction[];
    /**
     * Get functions by group
     */
    getFunctionsByGroup(group: string, brand?: 'hexing' | 'hexcell'): ObisFunction[];
    /**
     * Get unique group names
     */
    getGroups(brand?: 'hexing' | 'hexcell'): string[];
    /**
     * Format raw meter readings as DLMS response with units
     * readings: { "0-0:1.0.0": value, "0-1:32.7.0": 230.5, ... }
     */
    formatReadingsAsDlms(meterId: string, meterType: string, readings: Record<string, any>): DlmsResponse;
    /**
     * Create a DLMS attribute from OBIS code and value
     */
    createAttributeFromCode(code: string, value: any): DlmsAttribute;
    /**
     * Get unit for a given OBIS code
     */
    getUnit(code: string): string | undefined;
    /**
     * Get scaler for a given OBIS code
     */
    getScaler(code: string): number | undefined;
    /**
     * Format a value with its unit and scaler
     */
    formatValueWithUnit(code: string, value: number): string;
    /**
     * Export statistics about loaded OBIS functions
     */
    getStatistics(): {
        hexingTotal: any;
        hexcellTotal: any;
        unifiedTotal: any;
        groups: string[];
        hexingGroups: string[];
        hexcellGroups: string[];
    };
}
declare const _default: ObisFunctionService;
export default _default;
//# sourceMappingURL=obisFunction.service.d.ts.map