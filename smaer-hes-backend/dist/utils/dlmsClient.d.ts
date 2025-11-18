/**
 * DLMS TCP/IP Client
 *
 * Handles TCP/IP communication with DLMS/COSEM compliant smart meters
 * Supports Hexing and Hexcell meters
 */
import { EventEmitter } from 'events';
import { ObisCode } from './dlmsProtocol';
export interface DLMSClientConfig {
    host: string;
    port: number;
    clientId?: number;
    password?: string;
    timeout?: number;
    logicalDeviceAddress?: number;
    physicalDeviceAddress?: number;
}
export interface DLMSReadResult {
    success: boolean;
    obisCode: string;
    classId: number;
    attributeId: number;
    value: any;
    unit?: string;
    scaler?: number;
    timestamp: Date;
    error?: string;
}
export declare class DLMSClient extends EventEmitter {
    private config;
    private socket;
    private connected;
    private associated;
    private receiveBuffer;
    private pendingRequests;
    private invokeId;
    constructor(config: DLMSClientConfig);
    /**
     * Connect to the meter
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the meter
     */
    disconnect(): Promise<void>;
    /**
     * Establish DLMS association
     */
    associate(): Promise<void>;
    /**
     * Release DLMS association
     */
    releaseAssociation(): Promise<void>;
    /**
     * Read OBIS object
     */
    readObis(obisCode: string | ObisCode, classId?: number, attributeId?: number): Promise<DLMSReadResult>;
    /**
     * Read multiple OBIS objects
     */
    readMultiple(requests: Array<{
        obisCode: string;
        classId?: number;
        attributeId?: number;
    }>): Promise<DLMSReadResult[]>;
    /**
     * Write OBIS object
     */
    writeObis(obisCode: string | ObisCode, value: any, classId?: number, attributeId?: number): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Execute meter action/method
     */
    executeAction(obisCode: string | ObisCode, classId: number, methodId: number, parameters?: any): Promise<{
        success: boolean;
        result?: any;
        error?: string;
    }>;
    /**
     * Send SNRM frame
     */
    private sendSNRM;
    /**
     * Send APDU and wait for response
     */
    private sendApdu;
    /**
     * Send data to socket
     */
    private send;
    /**
     * Handle incoming data
     */
    private handleData;
    /**
     * Process HDLC frame
     */
    private processFrame;
    /**
     * Parse GET response
     */
    private parseGetResponse;
    /**
     * Get unit string from unit code
     */
    private getUnitString;
}
export default DLMSClient;
//# sourceMappingURL=dlmsClient.d.ts.map