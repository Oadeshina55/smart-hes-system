/**
 * Meter Communication Service
 *
 * Unified service for communicating with different meter brands
 * Supports: Hexing, Hexcell
 */
import { HexingReadingData } from '../drivers/hexingMeter.driver';
import { HexcellReadingData } from '../drivers/hexcellMeter.driver';
export type MeterReadingData = HexingReadingData | HexcellReadingData;
export interface MeterCommunicationResult {
    success: boolean;
    data?: MeterReadingData;
    error?: string;
    timestamp: Date;
}
/**
 * Meter Communication Service Class
 */
export declare class MeterCommunicationService {
    private activeConnections;
    /**
     * Create appropriate driver based on meter brand
     */
    private createDriver;
    /**
     * Get or create driver connection
     */
    private getDriver;
    /**
     * Close driver connection
     */
    private closeDriver;
    /**
     * Read meter data
     */
    readMeterData(meterId: string): Promise<MeterCommunicationResult>;
    /**
     * Read meter by meter number
     */
    readMeterByNumber(meterNumber: string): Promise<MeterCommunicationResult>;
    /**
     * Read specific OBIS code from meter
     */
    readObisCode(meterId: string, obisCode: string, classId?: number, attributeId?: number): Promise<{
        success: boolean;
        value?: any;
        error?: string;
    }>;
    /**
     * Control meter relay
     */
    controlRelay(meterId: string, action: 'connect' | 'disconnect'): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Set meter time
     */
    setMeterTime(meterId: string, dateTime?: Date): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Bulk read multiple meters
     */
    readMultipleMeters(meterIds: string[]): Promise<Map<string, MeterCommunicationResult>>;
    /**
     * Save consumption data to database
     */
    private saveConsumptionData;
    /**
     * Close all active connections
     */
    closeAllConnections(): Promise<void>;
}
export declare const meterCommunicationService: MeterCommunicationService;
export default meterCommunicationService;
//# sourceMappingURL=meterCommunication.service.d.ts.map