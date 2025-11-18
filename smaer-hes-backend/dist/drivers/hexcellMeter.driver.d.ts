/**
 * Hexcell Meter Driver
 *
 * Implements DLMS/COSEM communication for Hexcell AMI meters
 * Based on DLMS MD configuration
 */
import { DLMSClientConfig } from '../utils/dlmsClient';
export interface HexcellMeterConfig extends DLMSClientConfig {
    meterSerialNumber?: string;
    authenticationKey?: string;
    encryptionKey?: string;
    systemTitle?: string;
}
export interface HexcellReadingData {
    totalActiveEnergy?: number;
    activeEnergyTOU1?: number;
    activeEnergyTOU2?: number;
    activeEnergyTOU3?: number;
    activeEnergyTOU4?: number;
    importActiveEnergy?: number;
    exportActiveEnergy?: number;
    totalReactiveEnergy?: number;
    voltage?: number;
    current?: number;
    activePower?: number;
    reactivePower?: number;
    apparentPower?: number;
    powerFactor?: number;
    frequency?: number;
    serialNumber?: string;
    firmwareVersion?: string;
    hardwareVersion?: string;
    meterTime?: Date;
    meterStatus?: number;
    tamperStatus?: number;
}
/**
 * Hexcell Meter Driver Class
 */
export declare class HexcellMeterDriver {
    private client;
    private config;
    private static readonly OBIS_CODES;
    constructor(config: HexcellMeterConfig);
    /**
     * Connect to the meter
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the meter
     */
    disconnect(): Promise<void>;
    /**
     * Read meter serial number
     */
    readSerialNumber(): Promise<string>;
    /**
     * Read firmware version
     */
    readFirmwareVersion(): Promise<string>;
    /**
     * Read meter time/clock
     */
    readMeterTime(): Promise<Date>;
    /**
     * Set meter time/clock
     */
    setMeterTime(dateTime: Date): Promise<void>;
    /**
     * Read total active energy
     */
    readTotalActiveEnergy(): Promise<number>;
    /**
     * Read instantaneous voltage (all phases)
     */
    readVoltage(): Promise<{
        l1: number;
        l2?: number;
        l3?: number;
    }>;
    /**
     * Read instantaneous current (all phases)
     */
    readCurrent(): Promise<{
        l1: number;
        l2?: number;
        l3?: number;
    }>;
    /**
     * Read all instantaneous power values
     */
    readPower(): Promise<{
        active: number;
        reactive: number;
        apparent: number;
        powerFactor: number;
    }>;
    /**
     * Read frequency
     */
    readFrequency(): Promise<number>;
    /**
     * Read all TOU energy values
     */
    readTOUEnergy(): Promise<{
        total: number;
        tou1: number;
        tou2: number;
        tou3: number;
        tou4: number;
    }>;
    /**
     * Read comprehensive meter data
     */
    readAllData(): Promise<HexcellReadingData>;
    /**
     * Execute relay control (connect/disconnect)
     */
    relayControl(action: 'connect' | 'disconnect'): Promise<void>;
    /**
     * Helper: Apply scaler to value
     */
    private applyScaler;
    /**
     * Read custom OBIS code
     */
    readCustomObis(obisCode: string, classId?: number, attributeId?: number): Promise<any>;
}
export default HexcellMeterDriver;
//# sourceMappingURL=hexcellMeter.driver.d.ts.map