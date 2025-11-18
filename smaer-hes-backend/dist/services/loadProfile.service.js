"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadProfileService = void 0;
const LoadProfile_model_1 = require("../models/LoadProfile.model");
const Meter_model_1 = require("../models/Meter.model");
const dlms_service_1 = __importDefault(require("./dlms.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class LoadProfileService {
    /**
     * Request load profile from meter
     */
    async requestLoadProfile(meterId, startTime, endTime, profileType = 'hourly', captureInterval = 60) {
        try {
            const meter = await Meter_model_1.Meter.findById(meterId);
            if (!meter) {
                throw new Error('Meter not found');
            }
            // Create load profile record
            const loadProfile = await LoadProfile_model_1.LoadProfile.create({
                meter: meterId,
                profileType,
                captureInterval,
                startTime,
                endTime,
                status: 'pending',
                entries: []
            });
            logger_1.default.info(`Load profile requested for meter ${meter.meterNumber}: ${startTime} to ${endTime}`);
            // Initiate reading process (async)
            this.readLoadProfileFromMeter(loadProfile._id.toString()).catch(err => {
                logger_1.default.error(`Load profile read failed for ${loadProfile._id}: ${err.message}`);
            });
            return loadProfile;
        }
        catch (error) {
            logger_1.default.error(`Error requesting load profile: ${error.message}`);
            throw error;
        }
    }
    /**
     * Read load profile data from meter (background process)
     */
    async readLoadProfileFromMeter(loadProfileId) {
        try {
            const loadProfile = await LoadProfile_model_1.LoadProfile.findById(loadProfileId).populate('meter');
            if (!loadProfile) {
                throw new Error('Load profile not found');
            }
            loadProfile.status = 'reading';
            await loadProfile.save();
            const meter = loadProfile.meter;
            // Read load profile from meter using DLMS
            const result = await dlms_service_1.default.readLoadProfile({ meterId: meter._id.toString() }, loadProfile.startTime, loadProfile.endTime);
            if (result.success && result.profileData) {
                // Parse profile data and create entries
                const entries = this.parseLoadProfileData(result.profileData, loadProfile.captureInterval);
                loadProfile.entries = entries;
                loadProfile.totalEntries = entries.length;
                loadProfile.status = entries.length > 0 ? 'completed' : 'partial';
                logger_1.default.info(`Load profile read completed: ${entries.length} entries`);
            }
            else {
                loadProfile.status = 'failed';
                loadProfile.errorMessage = 'Failed to read load profile from meter';
            }
            await loadProfile.save();
        }
        catch (error) {
            logger_1.default.error(`Load profile read error: ${error.message}`);
            const loadProfile = await LoadProfile_model_1.LoadProfile.findById(loadProfileId);
            if (loadProfile) {
                loadProfile.status = 'failed';
                loadProfile.errorMessage = error.message;
                await loadProfile.save();
            }
        }
    }
    /**
     * Parse raw load profile data from meter
     */
    parseLoadProfileData(profileData, captureInterval) {
        const entries = [];
        try {
            // Profile data format varies by meter brand
            // This is a generic parser - customize based on actual meter response
            if (Array.isArray(profileData)) {
                profileData.forEach((entry) => {
                    entries.push({
                        timestamp: new Date(entry.timestamp || entry.time),
                        voltage: entry.voltage ? {
                            L1: entry.voltage.L1,
                            L2: entry.voltage.L2,
                            L3: entry.voltage.L3,
                            average: entry.voltage.average
                        } : undefined,
                        current: entry.current ? {
                            L1: entry.current.L1,
                            L2: entry.current.L2,
                            L3: entry.current.L3,
                            total: entry.current.total
                        } : undefined,
                        power: entry.power ? {
                            active: entry.power.active,
                            reactive: entry.power.reactive,
                            apparent: entry.power.apparent
                        } : undefined,
                        energy: entry.energy ? {
                            activeImport: entry.energy.activeImport,
                            activeExport: entry.energy.activeExport,
                            reactiveImport: entry.energy.reactiveImport,
                            reactiveExport: entry.energy.reactiveExport
                        } : undefined,
                        powerFactor: entry.powerFactor,
                        frequency: entry.frequency,
                        metadata: new Map(Object.entries(entry.metadata || {}))
                    });
                });
            }
        }
        catch (error) {
            logger_1.default.error(`Error parsing load profile data: ${error.message}`);
        }
        return entries;
    }
    /**
     * Get load profiles for a meter
     */
    async getLoadProfiles(meterId, options = {}) {
        try {
            const query = { meter: meterId };
            if (options.startDate || options.endDate) {
                query.startTime = {};
                if (options.startDate)
                    query.startTime.$gte = options.startDate;
                if (options.endDate)
                    query.startTime.$lte = options.endDate;
            }
            if (options.profileType) {
                query.profileType = options.profileType;
            }
            if (options.status) {
                query.status = options.status;
            }
            const total = await LoadProfile_model_1.LoadProfile.countDocuments(query);
            const loadProfiles = await LoadProfile_model_1.LoadProfile.find(query)
                .sort({ startTime: -1 })
                .limit(options.limit || 50)
                .skip(options.skip || 0)
                .populate('meter', 'meterNumber brand model');
            return { loadProfiles, total };
        }
        catch (error) {
            logger_1.default.error(`Error getting load profiles: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get load profile by ID
     */
    async getLoadProfile(loadProfileId) {
        try {
            return await LoadProfile_model_1.LoadProfile.findById(loadProfileId).populate('meter', 'meterNumber brand model');
        }
        catch (error) {
            logger_1.default.error(`Error getting load profile: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get load profile statistics
     */
    async getLoadProfileStatistics(loadProfileId) {
        try {
            const loadProfile = await LoadProfile_model_1.LoadProfile.findById(loadProfileId);
            if (!loadProfile) {
                throw new Error('Load profile not found');
            }
            const entries = loadProfile.entries;
            if (entries.length === 0) {
                return { message: 'No entries to analyze' };
            }
            // Calculate statistics
            const stats = {
                totalEntries: entries.length,
                duration: loadProfile.duration,
                voltage: this.calculateStats(entries.map(e => e.voltage?.average).filter(Boolean)),
                current: this.calculateStats(entries.map(e => e.current?.total).filter(Boolean)),
                power: this.calculateStats(entries.map(e => e.power?.active).filter(Boolean)),
                powerFactor: this.calculateStats(entries.map(e => e.powerFactor).filter(Boolean)),
                frequency: this.calculateStats(entries.map(e => e.frequency).filter(Boolean)),
                energy: {
                    totalImport: entries.reduce((sum, e) => sum + (e.energy?.activeImport || 0), 0),
                    totalExport: entries.reduce((sum, e) => sum + (e.energy?.activeExport || 0), 0)
                }
            };
            return stats;
        }
        catch (error) {
            logger_1.default.error(`Error calculating load profile statistics: ${error.message}`);
            throw error;
        }
    }
    /**
     * Calculate min, max, average for a dataset
     */
    calculateStats(data) {
        if (data.length === 0) {
            return null;
        }
        const sorted = [...data].sort((a, b) => a - b);
        return {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            average: data.reduce((a, b) => a + b, 0) / data.length,
            median: sorted[Math.floor(sorted.length / 2)]
        };
    }
    /**
     * Delete load profile
     */
    async deleteLoadProfile(loadProfileId) {
        try {
            await LoadProfile_model_1.LoadProfile.findByIdAndDelete(loadProfileId);
            logger_1.default.info(`Load profile deleted: ${loadProfileId}`);
        }
        catch (error) {
            logger_1.default.error(`Error deleting load profile: ${error.message}`);
            throw error;
        }
    }
}
exports.loadProfileService = new LoadProfileService();
exports.default = exports.loadProfileService;
//# sourceMappingURL=loadProfile.service.js.map