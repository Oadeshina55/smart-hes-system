export interface DLMSReadRequest {
    meterId?: string;
    meterNumber?: string;
    obisCode: string;
    classId?: number;
    attributeId?: number;
}
export interface DLMSWriteRequest {
    meterId?: string;
    meterNumber?: string;
    obisCode: string;
    value: any;
    classId?: number;
    attributeId?: number;
}
export interface DLMSReadResponse {
    success: boolean;
    meterId: string;
    meterNumber: string;
    obisCode: string;
    value: any;
    unit?: string;
    scaler?: number;
    timestamp: Date;
    error?: string;
}
export interface DLMSWriteResponse {
    success: boolean;
    meterId: string;
    meterNumber: string;
    obisCode: string;
    message: string;
    error?: string;
}
declare class DLMSService {
    private pythonServiceUrl;
    private usePythonService;
    constructor();
    /**
     * Ensure meter is connected to Python DLMS service
     */
    private ensureConnection;
    /**
     * Read single OBIS code from meter
     */
    readObis(request: DLMSReadRequest): Promise<DLMSReadResponse>;
    /**
     * Read multiple OBIS codes from meter (batch read)
     */
    readMultipleObis(meterIdentifier: string | {
        meterId?: string;
        meterNumber?: string;
    }, obisCodes: Array<string | {
        code: string;
        classId?: number;
        attributeId?: number;
    }>): Promise<DLMSReadResponse[]>;
    /**
     * Write value to OBIS code on meter
     */
    writeObis(request: DLMSWriteRequest): Promise<DLMSWriteResponse>;
    /**
     * Read meter profile (load profile data)
     */
    readLoadProfile(meterIdentifier: {
        meterId?: string;
        meterNumber?: string;
    }, startDate: Date, endDate: Date): Promise<any>;
    /**
     * Get common meter data (energy, voltage, current, power)
     */
    getCommonMeterData(meterIdentifier: {
        meterId?: string;
        meterNumber?: string;
    }): Promise<any>;
    /**
     * Read meter time/clock
     */
    readMeterTime(meterIdentifier: {
        meterId?: string;
        meterNumber?: string;
    }): Promise<any>;
    /**
     * Set meter time/clock
     */
    setMeterTime(meterIdentifier: {
        meterId?: string;
        meterNumber?: string;
    }, dateTime: Date): Promise<DLMSWriteResponse>;
}
export declare const dlmsService: DLMSService;
export default dlmsService;
//# sourceMappingURL=dlms.service.d.ts.map