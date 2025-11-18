"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.powerQualityService = void 0;
const PowerQuality_model_1 = require("../models/PowerQuality.model");
const Meter_model_1 = require("../models/Meter.model");
const dlms_service_1 = __importDefault(require("./dlms.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class PowerQualityService {
    /**
     * Record power quality measurement
     */
    async recordMeasurement(meterId, data) {
        try {
            const measurement = await PowerQuality_model_1.PowerQuality.create({
                meter: meterId,
                timestamp: new Date(),
                ...data
            });
            // Check for power quality events
            const events = this.detectPowerQualityEvents(measurement);
            if (events.length > 0) {
                measurement.events = events;
                await measurement.save();
                logger_1.default.warn(`Power quality issues detected for meter ${meterId}: ${events.length} events`);
            }
            return measurement;
        }
        catch (error) {
            logger_1.default.error(`Error recording power quality measurement: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get power quality measurements for a meter
     */
    async getMeasurements(meterId, options = {}) {
        try {
            const query = { meter: meterId };
            if (options.startDate || options.endDate) {
                query.timestamp = {};
                if (options.startDate)
                    query.timestamp.$gte = options.startDate;
                if (options.endDate)
                    query.timestamp.$lte = options.endDate;
            }
            if (options.minQualityScore !== undefined) {
                query.qualityScore = { $gte: options.minQualityScore };
            }
            if (options.eventType) {
                query['events.eventType'] = options.eventType;
            }
            const total = await PowerQuality_model_1.PowerQuality.countDocuments(query);
            const measurements = await PowerQuality_model_1.PowerQuality.find(query)
                .sort({ timestamp: -1 })
                .limit(options.limit || 100)
                .skip(options.skip || 0)
                .populate('meter', 'meterNumber brand model');
            return { measurements, total };
        }
        catch (error) {
            logger_1.default.error(`Error getting power quality measurements: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get power quality statistics for a meter
     */
    async getStatistics(meterId, startDate, endDate) {
        try {
            const measurements = await PowerQuality_model_1.PowerQuality.find({
                meter: meterId,
                timestamp: { $gte: startDate, $lte: endDate }
            });
            if (measurements.length === 0) {
                return { message: 'No measurements found for the specified period' };
            }
            // Calculate statistics
            const stats = {
                totalMeasurements: measurements.length,
                period: { start: startDate, end: endDate },
                averageQualityScore: measurements.reduce((sum, m) => sum + m.qualityScore, 0) / measurements.length,
                voltage: {
                    average: this.calculateAverage(measurements.map(m => m.voltage.average).filter(Boolean)),
                    thd: this.calculateAverage(measurements.map(m => m.voltage.thd).filter(Boolean)),
                    unbalance: this.calculateAverage(measurements.map(m => m.voltage.unbalance).filter(Boolean))
                },
                current: {
                    average: this.calculateAverage(measurements.map(m => m.current.L1).filter(Boolean)),
                    thd: this.calculateAverage(measurements.map(m => m.current.thd).filter(Boolean)),
                    unbalance: this.calculateAverage(measurements.map(m => m.current.unbalance).filter(Boolean))
                },
                powerFactor: {
                    average: this.calculateAverage(measurements.map(m => m.powerFactor.total).filter(Boolean)),
                    min: Math.min(...measurements.map(m => m.powerFactor.total).filter(Boolean)),
                    max: Math.max(...measurements.map(m => m.powerFactor.total).filter(Boolean))
                },
                frequency: {
                    average: this.calculateAverage(measurements.map(m => m.frequency.value).filter(Boolean)),
                    deviation: this.calculateAverage(measurements.map(m => Math.abs(m.frequency.deviation)).filter(Boolean))
                },
                events: {
                    total: measurements.reduce((sum, m) => sum + m.events.length, 0),
                    byType: this.groupEventsByType(measurements),
                    bySeverity: this.groupEventsBySeverity(measurements)
                },
                compliance: {
                    compliantPercentage: (measurements.filter(m => m.compliance.compliant).length / measurements.length) * 100,
                    violations: this.aggregateViolations(measurements)
                }
            };
            return stats;
        }
        catch (error) {
            logger_1.default.error(`Error calculating power quality statistics: ${error.message}`);
            throw error;
        }
    }
    /**
     * Detect power quality events from measurement data
     */
    detectPowerQualityEvents(measurement) {
        const events = [];
        const nominalVoltage = 230; // V (adjust based on region)
        const nominalFrequency = 50; // Hz (adjust based on region)
        // Voltage sag detection (voltage drop > 10%)
        ['L1', 'L2', 'L3'].forEach((phase) => {
            const voltage = measurement.voltage[phase];
            if (voltage && voltage < nominalVoltage * 0.9) {
                events.push({
                    eventType: 'sag',
                    severity: voltage < nominalVoltage * 0.7 ? 'critical' : 'high',
                    phase: phase,
                    startTime: measurement.timestamp,
                    value: voltage,
                    threshold: nominalVoltage * 0.9,
                    unit: 'V',
                    description: `Voltage sag detected on ${phase}: ${voltage.toFixed(2)}V`
                });
            }
            // Voltage swell detection (voltage rise > 10%)
            if (voltage && voltage > nominalVoltage * 1.1) {
                events.push({
                    eventType: 'swell',
                    severity: voltage > nominalVoltage * 1.2 ? 'critical' : 'medium',
                    phase: phase,
                    startTime: measurement.timestamp,
                    value: voltage,
                    threshold: nominalVoltage * 1.1,
                    unit: 'V',
                    description: `Voltage swell detected on ${phase}: ${voltage.toFixed(2)}V`
                });
            }
        });
        // THD detection (> 5% is concerning)
        if (measurement.voltage.thd && measurement.voltage.thd > 5) {
            events.push({
                eventType: 'harmonics',
                severity: measurement.voltage.thd > 8 ? 'high' : 'medium',
                startTime: measurement.timestamp,
                value: measurement.voltage.thd,
                threshold: 5,
                unit: '%',
                description: `High voltage THD: ${measurement.voltage.thd.toFixed(2)}%`
            });
        }
        // Frequency deviation detection (> 0.5 Hz)
        if (Math.abs(measurement.frequency.deviation) > 0.5) {
            events.push({
                eventType: 'frequency_deviation',
                severity: Math.abs(measurement.frequency.deviation) > 1 ? 'critical' : 'medium',
                startTime: measurement.timestamp,
                value: measurement.frequency.value,
                threshold: 0.5,
                unit: 'Hz',
                description: `Frequency deviation: ${measurement.frequency.value.toFixed(3)}Hz (${measurement.frequency.deviation > 0 ? '+' : ''}${measurement.frequency.deviation.toFixed(3)}Hz)`
            });
        }
        // Voltage unbalance detection (> 2%)
        if (measurement.voltage.unbalance && measurement.voltage.unbalance > 2) {
            events.push({
                eventType: 'unbalance',
                severity: measurement.voltage.unbalance > 5 ? 'high' : 'medium',
                phase: 'all',
                startTime: measurement.timestamp,
                value: measurement.voltage.unbalance,
                threshold: 2,
                unit: '%',
                description: `Voltage unbalance: ${measurement.voltage.unbalance.toFixed(2)}%`
            });
        }
        return events;
    }
    calculateAverage(values) {
        if (values.length === 0)
            return null;
        return values.reduce((sum, v) => sum + v, 0) / values.length;
    }
    groupEventsByType(measurements) {
        const groups = {};
        measurements.forEach(m => {
            m.events.forEach(event => {
                groups[event.eventType] = (groups[event.eventType] || 0) + 1;
            });
        });
        return groups;
    }
    groupEventsBySeverity(measurements) {
        const groups = {};
        measurements.forEach(m => {
            m.events.forEach(event => {
                groups[event.severity] = (groups[event.severity] || 0) + 1;
            });
        });
        return groups;
    }
    aggregateViolations(measurements) {
        const violations = new Set();
        measurements.forEach(m => {
            m.compliance.violations.forEach(v => violations.add(v));
        });
        return Array.from(violations);
    }
    /**
     * Get real-time power quality data from meter
     */
    async getRealTimePowerQuality(meterId) {
        try {
            const meter = await Meter_model_1.Meter.findById(meterId);
            if (!meter) {
                throw new Error('Meter not found');
            }
            // Read power quality parameters from meter
            const obisCodes = [
                '1-0:32.7.0.255', // Voltage L1
                '1-0:52.7.0.255', // Voltage L2
                '1-0:72.7.0.255', // Voltage L3
                '1-0:31.7.0.255', // Current L1
                '1-0:51.7.0.255', // Current L2
                '1-0:71.7.0.255', // Current L3
                '1-0:13.7.0.255', // Power factor
                '1-0:14.7.0.255', // Frequency
            ];
            const results = await dlms_service_1.default.readMultipleObis(meterId, obisCodes);
            // Parse results and create measurement
            const measurement = await this.recordMeasurement(meterId, {
                voltage: {
                    L1: this.findValue(results, '1-0:32.7.0.255'),
                    L2: this.findValue(results, '1-0:52.7.0.255'),
                    L3: this.findValue(results, '1-0:72.7.0.255'),
                },
                current: {
                    L1: this.findValue(results, '1-0:31.7.0.255'),
                    L2: this.findValue(results, '1-0:51.7.0.255'),
                    L3: this.findValue(results, '1-0:71.7.0.255'),
                },
                powerFactor: {
                    total: this.findValue(results, '1-0:13.7.0.255')
                },
                frequency: {
                    value: this.findValue(results, '1-0:14.7.0.255') || 50,
                    deviation: (this.findValue(results, '1-0:14.7.0.255') || 50) - 50
                }
            });
            return measurement;
        }
        catch (error) {
            logger_1.default.error(`Error getting real-time power quality: ${error.message}`);
            throw error;
        }
    }
    findValue(results, obisCode) {
        const result = results.find(r => r.obisCode === obisCode);
        return result?.value !== undefined ? parseFloat(result.value) : undefined;
    }
}
exports.powerQualityService = new PowerQualityService();
exports.default = exports.powerQualityService;
//# sourceMappingURL=powerQuality.service.js.map