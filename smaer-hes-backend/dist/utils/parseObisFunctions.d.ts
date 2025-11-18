export interface ObisFunction {
    code: string;
    name: string;
    description?: string;
    unit?: string;
    scaler?: number;
    dataType?: string;
    classId?: string;
    attributeId?: number;
    group?: string;
    brand?: string;
    accessRight?: string;
}
export interface ObisFunctionDatabase {
    hexing: ObisFunction[];
    hexcell: ObisFunction[];
    unified: ObisFunction[];
}
/**
 * Load and parse all OBIS functions from both brands
 * Now integrates with software configuration parsers for complete meter data
 */
export declare function loadObisFunctions(): ObisFunctionDatabase;
/**
 * Get function by OBIS code from a specific brand or unified database
 */
export declare function getObisFunctionByCode(code: string, brand?: 'hexing' | 'hexcell', db?: ObisFunctionDatabase): ObisFunction | null;
/**
 * Get all functions for a given group
 */
export declare function getObisFunctionsByGroup(group: string, brand?: 'hexing' | 'hexcell', db?: ObisFunctionDatabase): ObisFunction[];
/**
 * Export to JSON for caching/reference
 */
export declare function exportToJson(dbPath: string, db?: ObisFunctionDatabase): void;
//# sourceMappingURL=parseObisFunctions.d.ts.map