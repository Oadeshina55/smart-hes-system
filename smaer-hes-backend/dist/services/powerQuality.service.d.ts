import { IPowerQuality } from '../models/PowerQuality.model';
declare class PowerQualityService {
    /**
     * Record power quality measurement
     */
    recordMeasurement(meterId: string, data: Partial<IPowerQuality>): Promise<IPowerQuality>;
    /**
     * Get power quality measurements for a meter
     */
    getMeasurements(meterId: string, options?: {
        startDate?: Date;
        endDate?: Date;
        minQualityScore?: number;
        eventType?: string;
        limit?: number;
        skip?: number;
    }): Promise<{
        measurements: IPowerQuality[];
        total: number;
    }>;
    /**
     * Get power quality statistics for a meter
     */
    getStatistics(meterId: string, startDate: Date, endDate: Date): Promise<any>;
    /**
     * Detect power quality events from measurement data
     */
    private detectPowerQualityEvents;
    private calculateAverage;
    private groupEventsByType;
    private groupEventsBySeverity;
    private aggregateViolations;
    /**
     * Get real-time power quality data from meter
     */
    getRealTimePowerQuality(meterId: string): Promise<IPowerQuality>;
    private findValue;
}
export declare const powerQualityService: PowerQualityService;
export default powerQualityService;
//# sourceMappingURL=powerQuality.service.d.ts.map