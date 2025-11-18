"use strict";
/**
 * Hexcell Meter Driver
 *
 * Implements DLMS/COSEM communication for Hexcell AMI meters
 * Based on DLMS MD configuration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HexcellMeterDriver = void 0;
const dlmsClient_1 = __importDefault(require("../utils/dlmsClient"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Hexcell Meter Driver Class
 */
class HexcellMeterDriver {
    constructor(config) {
        this.config = {
            clientId: 16,
            timeout: 30000,
            ...config,
        };
        this.client = new dlmsClient_1.default(this.config);
    }
    /**
     * Connect to the meter
     */
    async connect() {
        try {
            await this.client.connect();
            await this.client.associate();
            logger_1.default.info(`Connected to Hexcell meter at ${this.config.host}:${this.config.port}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to connect to Hexcell meter: ${error.message}`);
            throw error;
        }
    }
    /**
     * Disconnect from the meter
     */
    async disconnect() {
        await this.client.disconnect();
    }
    /**
     * Read meter serial number
     */
    async readSerialNumber() {
        const result = await this.client.readObis(HexcellMeterDriver.OBIS_CODES.SERIAL_NUMBER, 1, 2);
        if (result.success && Buffer.isBuffer(result.value)) {
            return result.value.toString('ascii');
        }
        throw new Error('Failed to read serial number');
    }
    /**
     * Read firmware version
     */
    async readFirmwareVersion() {
        const result = await this.client.readObis(HexcellMeterDriver.OBIS_CODES.FIRMWARE_VERSION, 1, 2);
        if (result.success && result.value) {
            return result.value.toString();
        }
        throw new Error('Failed to read firmware version');
    }
    /**
     * Read meter time/clock
     */
    async readMeterTime() {
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
    async setMeterTime(dateTime) {
        await this.client.writeObis(HexcellMeterDriver.OBIS_CODES.METER_TIME, dateTime, 8, 2);
    }
    /**
     * Read total active energy
     */
    async readTotalActiveEnergy() {
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
    async readVoltage() {
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
    async readCurrent() {
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
    async readPower() {
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
    async readFrequency() {
        const result = await this.client.readObis(HexcellMeterDriver.OBIS_CODES.FREQUENCY, 3, 2);
        return this.applyScaler(result);
    }
    /**
     * Read all TOU energy values
     */
    async readTOUEnergy() {
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
    async readAllData() {
        const [serialNumber, firmwareVersion, meterTime, touEnergy, voltage, current, power, frequency,] = await Promise.allSettled([
            this.readSerialNumber(),
            this.readFirmwareVersion(),
            this.readMeterTime(),
            this.readTOUEnergy(),
            this.readVoltage(),
            this.readCurrent(),
            this.readPower(),
            this.readFrequency(),
        ]);
        const data = {};
        if (serialNumber.status === 'fulfilled')
            data.serialNumber = serialNumber.value;
        if (firmwareVersion.status === 'fulfilled')
            data.firmwareVersion = firmwareVersion.value;
        if (meterTime.status === 'fulfilled')
            data.meterTime = meterTime.value;
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
    async relayControl(action) {
        const relayObisCode = '0-0:96.3.10.255';
        const methodId = action === 'disconnect' ? 2 : 1; // Method 1: Connect, Method 2: Disconnect
        const result = await this.client.executeAction(relayObisCode, 70, methodId);
        if (!result.success) {
            throw new Error(`Relay ${action} failed: ${result.error}`);
        }
        logger_1.default.info(`Relay ${action} successful`);
    }
    /**
     * Helper: Apply scaler to value
     */
    applyScaler(result) {
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
    async readCustomObis(obisCode, classId = 3, attributeId = 2) {
        const result = await this.client.readObis(obisCode, classId, attributeId);
        if (result.success) {
            return this.applyScaler(result);
        }
        throw new Error(`Failed to read OBIS ${obisCode}: ${result.error}`);
    }
}
exports.HexcellMeterDriver = HexcellMeterDriver;
// Standard OBIS codes for Hexcell meters (from DLMS MD config)
HexcellMeterDriver.OBIS_CODES = {
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
exports.default = HexcellMeterDriver;
//# sourceMappingURL=hexcellMeter.driver.js.map