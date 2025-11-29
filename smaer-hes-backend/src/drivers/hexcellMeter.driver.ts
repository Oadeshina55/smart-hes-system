/**
 * Hexcell Meter Driver
 *
 * Implements DLMS/COSEM communication for Hexcell AMI meters
 * Based on DLMS MD configuration
 */

import DLMSClient, { DLMSClientConfig, DLMSReadResult } from '../utils/dlmsClient';
import { parseObisCode } from '../utils/dlmsProtocol';
import logger from '../utils/logger';

export interface HexcellMeterConfig extends DLMSClientConfig {
  meterSerialNumber?: string;
  authenticationKey?: string;
  encryptionKey?: string;
  systemTitle?: string;
}

export interface HexcellReadingData {
  // Energy data
  totalActiveEnergy?: number;
  activeEnergyTOU1?: number;
  activeEnergyTOU2?: number;
  activeEnergyTOU3?: number;
  activeEnergyTOU4?: number;
  importActiveEnergy?: number;
  exportActiveEnergy?: number;
  totalReactiveEnergy?: number;

  // Instantaneous values
  voltage?: number;
  current?: number;
  activePower?: number;
  reactivePower?: number;
  apparentPower?: number;
  powerFactor?: number;
  frequency?: number;

  // Meter info
  serialNumber?: string;
  firmwareVersion?: string;
  hardwareVersion?: string;
  meterTime?: Date;

  // Status
  meterStatus?: number;
  tamperStatus?: number;
}

/**
 * Hexcell Meter Driver Class
 */
export class HexcellMeterDriver {
  private client: DLMSClient;
  private config: HexcellMeterConfig;

  // Standard OBIS codes for Hexcell meters (from DLMS MD config)
  private static readonly OBIS_CODES = {
    // Meter Information
    SERIAL_NUMBER: '0-0:96.1.0.255',
    FIRMWARE_VERSION: '1-0:0.2.0.255',
    HARDWARE_VERSION: '0-0:96.1.1.255',
    METER_TIME: '0-0:1.0.0.255',

    // Energy - Total
    TOTAL_ACTIVE_ENERGY: '1-0:15.8.0.255',
    ACTIVE_ENERGY_TOU1: '1-0:15.8.1.255',
    ACTIVE_ENERGY_TOU2: '1-0:15.8.2.255',
    ACTIVE_ENERGY_TOU3: '1-0:15.8.3.255',
    ACTIVE_ENERGY_TOU4: '1-0:15.8.4.255',

    // Energy - Import/Export
    IMPORT_ACTIVE_ENERGY: '1-0:1.8.0.255',
    IMPORT_ACTIVE_TOU1: '1-0:1.8.1.255',
    IMPORT_ACTIVE_TOU2: '1-0:1.8.2.255',
    IMPORT_ACTIVE_TOU3: '1-0:1.8.3.255',
    IMPORT_ACTIVE_TOU4: '1-0:1.8.4.255',

    EXPORT_ACTIVE_ENERGY: '1-0:2.8.0.255',

    // Instantaneous Values
    VOLTAGE_L1: '1-0:32.7.0.255',
    VOLTAGE_L2: '1-0:52.7.0.255',
    VOLTAGE_L3: '1-0:72.7.0.255',

    CURRENT_L1: '1-0:31.7.0.255',
    CURRENT_L2: '1-0:51.7.0.255',
    CURRENT_L3: '1-0:71.7.0.255',

    ACTIVE_POWER_TOTAL: '1-0:1.7.0.255',
    REACTIVE_POWER_TOTAL: '1-0:3.7.0.255',
    APPARENT_POWER_TOTAL: '1-0:9.7.0.255',
    POWER_FACTOR_TOTAL: '1-0:13.7.0.255',
    FREQUENCY: '1-0:14.7.0.255',

    // Status
    METER_STATUS: '0-0:97.97.0.255',
    TAMPER_STATUS: '0-0:96.5.0.255',
  };

  constructor(config: HexcellMeterConfig) {
    this.config = {
      clientId: 16,
      timeout: 30000,
      ...config,
    };

    this.client = new DLMSClient(this.config);
  }

  /**
   * Connect to the meter
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect();
      await this.client.associate();
      logger.info(`Connected to Hexcell meter at ${this.config.host}:${this.config.port}`);
    } catch (error: any) {
      logger.error(`Failed to connect to Hexcell meter: ${error.message}`);
      throw error;
    }
  }

  /**
   * Disconnect from the meter
   */
  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  /**
   * Read meter serial number
   */
  async readSerialNumber(): Promise<string> {
    const result = await this.client.readObis(HexcellMeterDriver.OBIS_CODES.SERIAL_NUMBER, 1, 2);
    if (result.success && Buffer.isBuffer(result.value)) {
      return result.value.toString('ascii');
    }
    throw new Error('Failed to read serial number');
  }

  /**
   * Read firmware version
   */
  async readFirmwareVersion(): Promise<string> {
    const result = await this.client.readObis(HexcellMeterDriver.OBIS_CODES.FIRMWARE_VERSION, 1, 2);
    if (result.success && result.value) {
      return result.value.toString();
    }
    throw new Error('Failed to read firmware version');
  }

  /**
   * Read meter time/clock
   */
  async readMeterTime(): Promise<Date> {
    const result = await this.client.readObis(HexcellMeterDriver.OBIS_CODES.METER_TIME, 8, 2);
    if (result.success && result.value) {
      // Parse DLMS date-time format
      return new Date(result.value);
    }
    throw new Error('Failed to read meter time');
  }

  /**
   * Set meter time/clock
   */
  async setMeterTime(dateTime: Date): Promise<void> {
    await this.client.writeObis(HexcellMeterDriver.OBIS_CODES.METER_TIME, dateTime, 8, 2);
  }

  /**
   * Read total active energy
   */
  async readTotalActiveEnergy(): Promise<number> {
    const result = await this.client.readObis(HexcellMeterDriver.OBIS_CODES.TOTAL_ACTIVE_ENERGY, 3, 2);
    if (result.success && typeof result.value === 'number') {
      // Apply scaler if present
      if (result.scaler !== undefined) {
        return result.value * Math.pow(10, result.scaler);
      }
      return result.value;
    }
    throw new Error('Failed to read total active energy');
  }

  /**
   * Read instantaneous voltage (all phases)
   */
  async readVoltage(): Promise<{ l1: number; l2?: number; l3?: number }> {
    const results = await this.client.readMultiple([
      { obisCode: HexcellMeterDriver.OBIS_CODES.VOLTAGE_L1, classId: 3, attributeId: 2 },
      { obisCode: HexcellMeterDriver.OBIS_CODES.VOLTAGE_L2, classId: 3, attributeId: 2 },
      { obisCode: HexcellMeterDriver.OBIS_CODES.VOLTAGE_L3, classId: 3, attributeId: 2 },
    ]);

    return {
      l1: this.applyScaler(results[0]),
      l2: results[1].success ? this.applyScaler(results[1]) : undefined,
      l3: results[2].success ? this.applyScaler(results[2]) : undefined,
    };
  }

  /**
   * Read instantaneous current (all phases)
   */
  async readCurrent(): Promise<{ l1: number; l2?: number; l3?: number }> {
    const results = await this.client.readMultiple([
      { obisCode: HexcellMeterDriver.OBIS_CODES.CURRENT_L1, classId: 3, attributeId: 2 },
      { obisCode: HexcellMeterDriver.OBIS_CODES.CURRENT_L2, classId: 3, attributeId: 2 },
      { obisCode: HexcellMeterDriver.OBIS_CODES.CURRENT_L3, classId: 3, attributeId: 2 },
    ]);

    return {
      l1: this.applyScaler(results[0]),
      l2: results[1].success ? this.applyScaler(results[1]) : undefined,
      l3: results[2].success ? this.applyScaler(results[2]) : undefined,
    };
  }

  /**
   * Read all instantaneous power values
   */
  async readPower(): Promise<{
    active: number;
    reactive: number;
    apparent: number;
    powerFactor: number;
  }> {
    const results = await this.client.readMultiple([
      { obisCode: HexcellMeterDriver.OBIS_CODES.ACTIVE_POWER_TOTAL, classId: 3, attributeId: 2 },
      { obisCode: HexcellMeterDriver.OBIS_CODES.REACTIVE_POWER_TOTAL, classId: 3, attributeId: 2 },
      { obisCode: HexcellMeterDriver.OBIS_CODES.APPARENT_POWER_TOTAL, classId: 3, attributeId: 2 },
      { obisCode: HexcellMeterDriver.OBIS_CODES.POWER_FACTOR_TOTAL, classId: 3, attributeId: 2 },
    ]);

    return {
      active: this.applyScaler(results[0]),
      reactive: this.applyScaler(results[1]),
      apparent: this.applyScaler(results[2]),
      powerFactor: this.applyScaler(results[3]),
    };
  }

  /**
   * Read frequency
   */
  async readFrequency(): Promise<number> {
    const result = await this.client.readObis(HexcellMeterDriver.OBIS_CODES.FREQUENCY, 3, 2);
    return this.applyScaler(result);
  }

  /**
   * Read all TOU energy values
   */
  async readTOUEnergy(): Promise<{
    total: number;
    tou1: number;
    tou2: number;
    tou3: number;
    tou4: number;
  }> {
    const results = await this.client.readMultiple([
      { obisCode: HexcellMeterDriver.OBIS_CODES.TOTAL_ACTIVE_ENERGY, classId: 3, attributeId: 2 },
      { obisCode: HexcellMeterDriver.OBIS_CODES.ACTIVE_ENERGY_TOU1, classId: 3, attributeId: 2 },
      { obisCode: HexcellMeterDriver.OBIS_CODES.ACTIVE_ENERGY_TOU2, classId: 3, attributeId: 2 },
      { obisCode: HexcellMeterDriver.OBIS_CODES.ACTIVE_ENERGY_TOU3, classId: 3, attributeId: 2 },
      { obisCode: HexcellMeterDriver.OBIS_CODES.ACTIVE_ENERGY_TOU4, classId: 3, attributeId: 2 },
    ]);

    return {
      total: this.applyScaler(results[0]),
      tou1: this.applyScaler(results[1]),
      tou2: this.applyScaler(results[2]),
      tou3: this.applyScaler(results[3]),
      tou4: this.applyScaler(results[4]),
    };
  }

  /**
   * Read comprehensive meter data
   */
  async readAllData(): Promise<HexcellReadingData> {
    const [
      serialNumber,
      firmwareVersion,
      meterTime,
      touEnergy,
      voltage,
      current,
      power,
      frequency,
    ] = await Promise.allSettled([
      this.readSerialNumber(),
      this.readFirmwareVersion(),
      this.readMeterTime(),
      this.readTOUEnergy(),
      this.readVoltage(),
      this.readCurrent(),
      this.readPower(),
      this.readFrequency(),
    ]);

    const data: HexcellReadingData = {};

    if (serialNumber.status === 'fulfilled') data.serialNumber = serialNumber.value;
    if (firmwareVersion.status === 'fulfilled') data.firmwareVersion = firmwareVersion.value;
    if (meterTime.status === 'fulfilled') data.meterTime = meterTime.value;

    if (touEnergy.status === 'fulfilled') {
      data.totalActiveEnergy = touEnergy.value.total;
      data.activeEnergyTOU1 = touEnergy.value.tou1;
      data.activeEnergyTOU2 = touEnergy.value.tou2;
      data.activeEnergyTOU3 = touEnergy.value.tou3;
      data.activeEnergyTOU4 = touEnergy.value.tou4;
    }

    if (voltage.status === 'fulfilled') {
      data.voltage = voltage.value.l1;
    }

    if (current.status === 'fulfilled') {
      data.current = current.value.l1;
    }

    if (power.status === 'fulfilled') {
      data.activePower = power.value.active;
      data.reactivePower = power.value.reactive;
      data.apparentPower = power.value.apparent;
      data.powerFactor = power.value.powerFactor;
    }

    if (frequency.status === 'fulfilled') {
      data.frequency = frequency.value;
    }

    return data;
  }

  /**
   * Execute relay control (connect/disconnect)
   */
  async relayControl(action: 'connect' | 'disconnect'): Promise<void> {
    const relayObisCode = '0-0:96.3.10.255';
    const methodId = action === 'disconnect' ? 2 : 1; // Method 1: Connect, Method 2: Disconnect

    const result = await this.client.executeAction(relayObisCode, 70, methodId);

    if (!result.success) {
      throw new Error(`Relay ${action} failed: ${result.error}`);
    }

    logger.info(`Relay ${action} successful`);
  }

  /**
   * Helper: Apply scaler to value
   */
  private applyScaler(result: DLMSReadResult): number {
    if (!result.success || typeof result.value !== 'number') {
      return 0;
    }

    if (result.scaler !== undefined) {
      return result.value * Math.pow(10, result.scaler);
    }

    return result.value;
  }

  /**
   * Read custom OBIS code
   */
  async readCustomObis(obisCode: string, classId: number = 3, attributeId: number = 2): Promise<any> {
    const result = await this.client.readObis(obisCode, classId, attributeId);
    if (result.success) {
      return this.applyScaler(result);
    }
    throw new Error(`Failed to read OBIS ${obisCode}: ${result.error}`);
  }
}

export default HexcellMeterDriver;
