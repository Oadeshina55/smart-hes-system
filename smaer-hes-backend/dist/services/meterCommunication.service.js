"use strict";
/**
 * Meter Communication Service
 *
 * Unified service for communicating with different meter brands
 * Supports: Hexing, Hexcell
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.meterCommunicationService = exports.MeterCommunicationService = void 0;
const Meter_model_1 = require("../models/Meter.model");
const hexingMeter_driver_1 = require("../drivers/hexingMeter.driver");
const hexcellMeter_driver_1 = require("../drivers/hexcellMeter.driver");
const Consumption_model_1 = require("../models/Consumption.model");
const Event_model_1 = require("../models/Event.model");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Meter Communication Service Class
 */
class MeterCommunicationService {
    constructor() {
        this.activeConnections = new Map();
    }
    /**
     * Create appropriate driver based on meter brand
     */
    createDriver(meter) {
        const config = {
            host: meter.ipAddress || '127.0.0.1',
            port: meter.port || 4059,
            clientId: 16,
            timeout: 30000,
            password: meter.password,
        };
        const brand = meter.brand?.toLowerCase();
        switch (brand) {
            case 'hexing':
                return new hexingMeter_driver_1.HexingMeterDriver(config);
            case 'hexcell':
                return new hexcellMeter_driver_1.HexcellMeterDriver(config);
            default:
                // Default to Hexing if brand not specified
                logger_1.default.warn(`Unknown meter brand: ${brand}, defaulting to Hexing`);
                return new hexingMeter_driver_1.HexingMeterDriver(config);
        }
    }
    /**
     * Get or create driver connection
     */
    async getDriver(meter) {
        const meterId = meter._id.toString();
        if (this.activeConnections.has(meterId)) {
            return this.activeConnections.get(meterId);
        }
        const driver = this.createDriver(meter);
        try {
            await driver.connect();
            this.activeConnections.set(meterId, driver);
            return driver;
        }
        catch (error) {
            logger_1.default.error(`Failed to connect to meter ${meter.meterNumber}: ${error.message}`);
            throw error;
        }
    }
    /**
     * Close driver connection
     */
    async closeDriver(meterId) {
        if (this.activeConnections.has(meterId)) {
            const driver = this.activeConnections.get(meterId);
            await driver.disconnect();
            this.activeConnections.delete(meterId);
        }
    }
    /**
     * Read meter data
     */
    async readMeterData(meterId) {
        try {
            const meter = await Meter_model_1.Meter.findById(meterId);
            if (!meter) {
                return {
                    success: false,
                    error: 'Meter not found',
                    timestamp: new Date(),
                };
            }
            const driver = await this.getDriver(meter);
            const data = await driver.readAllData();
            // Save consumption data
            await this.saveConsumptionData(meter, data);
            // Update meter's current reading
            await Meter_model_1.Meter.findByIdAndUpdate(meterId, {
                'currentReading.voltage': data.voltage,
                'currentReading.current': data.current,
                'currentReading.activePower': data.activePower,
                'currentReading.reactivePower': data.reactivePower,
                'currentReading.powerFactor': data.powerFactor,
                'currentReading.frequency': data.frequency,
                'currentReading.totalActiveEnergy': data.totalActiveEnergy,
                lastCommunication: new Date(),
                communicationStatus: 'online',
            });
            // Close connection to free resources
            await this.closeDriver(meterId);
            return {
                success: true,
                data,
                timestamp: new Date(),
            };
        }
        catch (error) {
            logger_1.default.error(`Error reading meter ${meterId}: ${error.message}`);
            // Update meter status to offline
            await Meter_model_1.Meter.findByIdAndUpdate(meterId, {
                communicationStatus: 'offline',
                lastCommunication: new Date(),
            });
            return {
                success: false,
                error: error.message,
                timestamp: new Date(),
            };
        }
    }
    /**
     * Read meter by meter number
     */
    async readMeterByNumber(meterNumber) {
        const meter = await Meter_model_1.Meter.findOne({ meterNumber });
        if (!meter) {
            return {
                success: false,
                error: 'Meter not found',
                timestamp: new Date(),
            };
        }
        return this.readMeterData(meter._id.toString());
    }
    /**
     * Read specific OBIS code from meter
     */
    async readObisCode(meterId, obisCode, classId = 3, attributeId = 2) {
        try {
            const meter = await Meter_model_1.Meter.findById(meterId);
            if (!meter) {
                return { success: false, error: 'Meter not found' };
            }
            const driver = await this.getDriver(meter);
            const value = await driver.readCustomObis(obisCode, classId, attributeId);
            await this.closeDriver(meterId);
            return { success: true, value };
        }
        catch (error) {
            logger_1.default.error(`Error reading OBIS ${obisCode} from meter ${meterId}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * Control meter relay
     */
    async controlRelay(meterId, action) {
        try {
            const meter = await Meter_model_1.Meter.findById(meterId);
            if (!meter) {
                return { success: false, error: 'Meter not found' };
            }
            const driver = await this.getDriver(meter);
            await driver.relayControl(action);
            // Log event
            await Event_model_1.Event.create({
                meter: meterId,
                eventType: action === 'disconnect' ? 'RELAY_DISCONNECTED' : 'RELAY_CONNECTED',
                eventCode: action === 'disconnect' ? 'RELAY_OFF' : 'RELAY_ON',
                severity: 'info',
                category: 'technical',
                description: `Relay ${action} command executed successfully`,
                timestamp: new Date(),
            });
            await this.closeDriver(meterId);
            return { success: true };
        }
        catch (error) {
            logger_1.default.error(`Error controlling relay for meter ${meterId}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * Set meter time
     */
    async setMeterTime(meterId, dateTime) {
        try {
            const meter = await Meter_model_1.Meter.findById(meterId);
            if (!meter) {
                return { success: false, error: 'Meter not found' };
            }
            const driver = await this.getDriver(meter);
            await driver.setMeterTime(dateTime || new Date());
            await this.closeDriver(meterId);
            return { success: true };
        }
        catch (error) {
            logger_1.default.error(`Error setting time for meter ${meterId}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * Bulk read multiple meters
     */
    async readMultipleMeters(meterIds) {
        const results = new Map();
        // Read meters in parallel (limited to 5 concurrent)
        const batchSize = 5;
        for (let i = 0; i < meterIds.length; i += batchSize) {
            const batch = meterIds.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map(async (meterId) => ({
                meterId,
                result: await this.readMeterData(meterId),
            })));
            batchResults.forEach(({ meterId, result }) => {
                results.set(meterId, result);
            });
        }
        return results;
    }
    /**
     * Save consumption data to database
     */
    async saveConsumptionData(meter, data) {
        try {
            await Consumption_model_1.Consumption.create({
                meter: meter._id,
                timestamp: new Date(),
                activeEnergyImport: data.totalActiveEnergy || 0,
                activeEnergyExport: 0,
                reactiveEnergyImport: data.totalReactiveEnergy || 0,
                reactiveEnergyExport: 0,
                voltage: data.voltage || 0,
                current: data.current || 0,
                activePower: data.activePower || 0,
                reactivePower: data.reactivePower || 0,
                apparentPower: data.apparentPower || 0,
                powerFactor: data.powerFactor || 0,
                frequency: data.frequency || 0,
                tariff: {
                    tou1: data.activeEnergyTOU1 || 0,
                    tou2: data.activeEnergyTOU2 || 0,
                    tou3: data.activeEnergyTOU3 || 0,
                    tou4: data.activeEnergyTOU4 || 0,
                },
            });
        }
        catch (error) {
            logger_1.default.error(`Error saving consumption data: ${error.message}`);
        }
    }
    /**
     * Close all active connections
     */
    async closeAllConnections() {
        const closePromises = Array.from(this.activeConnections.keys()).map((meterId) => this.closeDriver(meterId));
        await Promise.all(closePromises);
        logger_1.default.info('All meter connections closed');
    }
}
exports.MeterCommunicationService = MeterCommunicationService;
// Export singleton instance
exports.meterCommunicationService = new MeterCommunicationService();
exports.default = exports.meterCommunicationService;
//# sourceMappingURL=meterCommunication.service.js.map