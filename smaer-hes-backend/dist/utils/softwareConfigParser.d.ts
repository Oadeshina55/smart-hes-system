export interface EnhancedObisCode {
    code: string;
    name: string;
    description: string;
    classId: number;
    attributeId: number;
    methodId?: number;
    dataType: string;
    dataLength?: number;
    scaler?: number;
    unit?: string;
    accessRight: {
        read: boolean;
        write: boolean;
    };
    brand: 'hexing' | 'hexcell';
    category?: string;
    subcategory?: string;
}
export interface MeterConfiguration {
    brand: 'hexing' | 'hexcell';
    model: string;
    connectionParams?: {
        baudRate?: number;
        dataBits?: number;
        stopBits?: number;
        parity?: number;
        serverAddress?: string;
        clientAddress?: string;
    };
    obisCodes: EnhancedObisCode[];
}
/**
 * Parse Hexcell OBIS List from text file
 */
export declare function parseHexcellObisList(filePath: string): EnhancedObisCode[];
/**
 * Parse Hexing OBIS Function from text file
 */
export declare function parseHexingObisList(filePath: string): EnhancedObisCode[];
/**
 * Parse DLMS MD config.xml for Hexcell connection parameters
 * Simple regex-based parsing (xml2js not available in this environment)
 */
export declare function parseDLMSConfig(filePath: string): any;
/**
 * Load and merge all software configurations
 */
export declare function loadSoftwareConfigurations(): {
    hexcell: EnhancedObisCode[];
    hexing: EnhancedObisCode[];
};
/**
 * Get meter-specific configuration including OBIS codes and connection params
 */
export declare function getMeterModelConfiguration(brand: 'hexing' | 'hexcell', model?: string): MeterConfiguration;
//# sourceMappingURL=softwareConfigParser.d.ts.map