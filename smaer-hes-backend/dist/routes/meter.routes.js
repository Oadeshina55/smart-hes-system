"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const Meter_model_1 = require("../models/Meter.model");
const obisParser_1 = require("../utils/obisParser");
const Consumption_model_1 = require("../models/Consumption.model");
const Event_model_1 = require("../models/Event.model");
const Area_model_1 = require("../models/Area.model");
const meterStatus_service_1 = require("../services/meterStatus.service");
const server_1 = require("../server");
const multer_1 = __importDefault(require("multer"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
// Create meter
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const body = { ...(req.body || {}) };
        // Validate required fields
        if (!body.meterNumber) {
            return res.status(400).json({
                success: false,
                message: 'Meter number is required',
                error: 'meterNumber is a required field'
            });
        }
        if (!body.area) {
            return res.status(400).json({
                success: false,
                message: 'Area is required',
                error: 'area is a required field'
            });
        }
        // Normalize meter number to uppercase
        body.meterNumber = String(body.meterNumber).toUpperCase();
        // Check if meter number already exists
        const existingMeter = await Meter_model_1.Meter.findOne({ meterNumber: body.meterNumber });
        if (existingMeter) {
            return res.status(409).json({
                success: false,
                message: 'Meter number already exists',
                error: `Meter with number ${body.meterNumber} already exists in the system`
            });
        }
        // Validate area exists
        const areaExists = await Area_model_1.Area.findById(body.area);
        if (!areaExists) {
            return res.status(400).json({
                success: false,
                message: 'Invalid area',
                error: 'The specified area does not exist'
            });
        }
        // normalize brand
        if (body.brand)
            body.brand = String(body.brand).toLowerCase();
        // Validate brand-specific meter number patterns
        if (body.brand) {
            const brandPatterns = {
                hexing: /^145\d{7,}$/,
                hexcell: /^46\d{7,}$/,
            };
            if (brandPatterns[body.brand] && !brandPatterns[body.brand].test(body.meterNumber)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid meter number format for brand',
                    error: body.brand === 'hexing'
                        ? 'Hexing meters must start with "145"'
                        : 'Hexcell meters must start with "46"'
                });
            }
        }
        // set default IP/PORT if missing
        if (!body.ipAddress)
            body.ipAddress = process.env.METER_HOST || '0.0.0.0';
        if (!body.port)
            body.port = process.env.METER_PORT ? Number(process.env.METER_PORT) : 5000;
        // if brand is known and no obisConfiguration provided, parse default OBIS for brand
        if (body.brand && !body.obisConfiguration && ['hexing', 'hexcell'].includes(body.brand)) {
            try {
                const parsed = (0, obisParser_1.parseObisForBrand)(body.brand);
                body.obisConfiguration = parsed;
            }
            catch (e) {
                console.error('Failed to parse OBIS for brand:', e);
                // ignore parsing errors
            }
        }
        const meter = await Meter_model_1.Meter.create(body);
        // Log success
        console.log(`✓ Meter created: ${meter.meterNumber} (${meter._id})`);
        res.status(201).json({
            success: true,
            message: 'Meter created successfully',
            data: meter
        });
    }
    catch (error) {
        console.error('Error creating meter:', error);
        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err) => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: messages.join(', ')
            });
        }
        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Meter number already exists',
                error: 'A meter with this number already exists in the system'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to create meter',
            error: error.message
        });
    }
});
// Update meter
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const meter = await Meter_model_1.Meter.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!meter)
            return res.status(404).json({ success: false, message: 'Meter not found' });
        res.json({ success: true, message: 'Meter updated', data: meter });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update meter', error: error.message });
    }
});
// Delete (soft) meter
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), async (req, res) => {
    try {
        const meter = await Meter_model_1.Meter.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!meter)
            return res.status(404).json({ success: false, message: 'Meter not found' });
        res.json({ success: true, message: 'Meter deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete meter', error: error.message });
    }
});
// Import meters via CSV
router.post('/import', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ success: false, message: 'CSV file is required' });
        const results = [];
        const filePath = req.file.path;
        fs_1.default.createReadStream(filePath)
            .pipe((0, csv_parser_1.default)())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
            const rowResults = [];
            for (let i = 0; i < results.length; i++) {
                const row = results[i];
                try {
                    const createBody = {
                        meterNumber: (row.meterNumber || row.meter || '').toString().toUpperCase(),
                        concentratorId: row.concentratorId || '',
                        meterType: row.meterType || 'single-phase',
                        brand: row.brand ? String(row.brand).toLowerCase() : '',
                        model: row.model || '',
                        firmware: row.firmware || '',
                        ipAddress: row.ipAddress || process.env.METER_HOST || '0.0.0.0',
                        port: row.port ? Number(row.port) : (process.env.METER_PORT ? Number(process.env.METER_PORT) : 5000),
                        area: row.area || undefined,
                        customer: row.customer || undefined,
                        simCard: row.simCard || undefined,
                    };
                    // attach parsed OBIS if brand known
                    if (createBody.brand && ['hexing', 'hexcell'].includes(createBody.brand) && !createBody.obisConfiguration) {
                        try {
                            createBody.obisConfiguration = (0, obisParser_1.parseObisForBrand)(createBody.brand);
                        }
                        catch (e) {
                            // ignore
                        }
                    }
                    const meter = await Meter_model_1.Meter.create(createBody);
                    rowResults.push({ index: i, success: true, data: meter });
                }
                catch (err) {
                    rowResults.push({ index: i, success: false, error: err.message || String(err), row });
                }
            }
            try {
                fs_1.default.unlinkSync(filePath);
            }
            catch (e) {
                // ignore
            }
            const successCount = rowResults.filter(r => r.success).length;
            const failures = rowResults.filter(r => !r.success).map(r => ({ index: r.index, error: r.error, row: r.row }));
            res.json({ success: true, message: `Processed ${results.length} rows`, total: results.length, successCount, failures, details: rowResults });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to import meters', error: error.message });
    }
});
// Get all meters with filters
router.get('/', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { status, area, customer, search, page = 1, limit = 10 } = req.query;
        const filter = { isActive: true };
        if (status && status !== 'all') {
            filter.status = status;
        }
        if (area && area !== 'all') {
            filter.area = area;
        }
        if (customer) {
            filter.customer = customer;
        }
        if (search) {
            filter.$or = [
                { meterNumber: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } },
            ];
        }
        const meters = await Meter_model_1.Meter.find(filter)
            .populate('area', 'name code')
            .populate('customer', 'customerName accountNumber')
            .populate('simCard', 'simNumber ipAddress')
            .sort('-createdAt')
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
        const total = await Meter_model_1.Meter.countDocuments(filter);
        res.json({
            success: true,
            data: meters,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch meters',
            error: error.message,
        });
    }
});
// Request an immediate meter read (emit to meter via socket)
router.post('/:id/read', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const param = req.params.id;
        let meter = null;
        // try by object id first, otherwise treat as meterNumber
        try {
            meter = await Meter_model_1.Meter.findById(param);
        }
        catch (e) {
            // ignore
        }
        if (!meter) {
            meter = await Meter_model_1.Meter.findOne({ meterNumber: String(param).toUpperCase() });
        }
        if (!meter)
            return res.status(404).json({ success: false, message: 'Meter not found' });
        // Emit read request to the specific meter room
        server_1.socketIO.to(meter._id.toString()).emit('meter-read-request', { requestedBy: req.user ? req.user._id : null });
        // Record event
        const event = await Event_model_1.Event.create({
            meter: meter._id,
            eventType: 'METER_READ_REQUEST',
            eventCode: 'METER_READ_REQUEST',
            severity: 'info',
            category: 'technical',
            description: 'Remote meter read requested',
            timestamp: new Date()
        });
        res.json({ success: true, message: 'Meter read request sent', data: { eventId: event._id } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to request meter read', error: error.message });
    }
});
// Get meter settings (OBIS configuration / metadata)
router.get('/:id/settings', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const param = req.params.id;
        let meter = null;
        try {
            meter = await Meter_model_1.Meter.findById(param);
        }
        catch (e) { }
        if (!meter) {
            meter = await Meter_model_1.Meter.findOne({ meterNumber: String(param).toUpperCase() });
        }
        if (!meter)
            return res.status(404).json({ success: false, message: 'Meter not found' });
        res.json({
            success: true,
            data: {
                obisConfiguration: meter.obisConfiguration || {},
                metadata: meter.metadata || {}
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch meter settings', error: error.message });
    }
});
// Update meter settings (and optionally write to meter)
router.post('/:id/settings', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const param = req.params.id;
        const { settings, metadata, writeToMeter } = req.body;
        let meter = null;
        try {
            meter = await Meter_model_1.Meter.findById(param);
        }
        catch (e) { }
        if (!meter) {
            meter = await Meter_model_1.Meter.findOne({ meterNumber: String(param).toUpperCase() });
        }
        if (!meter)
            return res.status(404).json({ success: false, message: 'Meter not found' });
        // Apply settings locally
        if (settings) {
            // store in obisConfiguration map
            meter.obisConfiguration = { ...(meter.obisConfiguration || {}), ...settings };
        }
        if (metadata) {
            meter.metadata = { ...(meter.metadata || {}), ...metadata };
        }
        await meter.save();
        // If requested, send settings to the meter device via socket
        if (writeToMeter) {
            server_1.socketIO.to(meter._id.toString()).emit('meter-write-settings', { settings, metadata, requestedBy: req.user ? req.user._id : null });
            await Event_model_1.Event.create({
                meter: meter._id,
                eventType: 'METER_SETTINGS_WRITTEN',
                eventCode: 'METER_SETTINGS_WRITTEN',
                severity: 'info',
                category: 'configuration',
                description: 'Meter settings written remotely',
                timestamp: new Date()
            });
        }
        else {
            await Event_model_1.Event.create({
                meter: meter._id,
                eventType: 'METER_SETTINGS_UPDATED',
                eventCode: 'METER_SETTINGS_UPDATED',
                severity: 'info',
                category: 'configuration',
                description: 'Meter settings updated in system',
                timestamp: new Date()
            });
        }
        res.json({ success: true, message: 'Meter settings updated', data: { obisConfiguration: meter.obisConfiguration, metadata: meter.metadata } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update meter settings', error: error.message });
    }
});
// CRITICAL: Meter Data Ingestion Endpoint (for meters to send data)
router.post('/data-ingestion', async (req, res) => {
    try {
        const { meterNumber, readings, events, timestamp, authentication, } = req.body;
        // Find meter
        const meter = await Meter_model_1.Meter.findOne({ meterNumber });
        if (!meter) {
            return res.status(404).json({
                success: false,
                message: 'Meter not found',
            });
        }
        // Update meter readings
        if (readings) {
            meter.currentReading = {
                totalEnergy: readings.totalEnergy || meter.currentReading.totalEnergy,
                voltage: readings.voltage || meter.currentReading.voltage,
                current: readings.current || meter.currentReading.current,
                power: readings.power || meter.currentReading.power,
                frequency: readings.frequency || meter.currentReading.frequency,
                powerFactor: readings.powerFactor || meter.currentReading.powerFactor,
                timestamp: new Date(timestamp || Date.now()),
            };
            // Update tamper status if provided
            if (readings.tamperStatus) {
                meter.tamperStatus = {
                    ...meter.tamperStatus,
                    ...readings.tamperStatus,
                };
                // Check for tamper alerts
                await meterStatus_service_1.MeterStatusService.checkTamperStatus(meter);
            }
        }
        // Update meter status and last seen
        meter.status = 'online';
        meter.lastSeen = new Date();
        await meter.save();
        // Store consumption data
        if (readings) {
            await Consumption_model_1.Consumption.create({
                meter: meter._id,
                area: meter.area,
                timestamp: new Date(timestamp || Date.now()),
                interval: 'hourly',
                energy: {
                    activeEnergy: readings.totalEnergy || 0,
                    reactiveEnergy: readings.reactiveEnergy || 0,
                    apparentEnergy: readings.apparentEnergy || 0,
                    exportedEnergy: readings.exportedEnergy || 0,
                },
                power: {
                    activePower: readings.power || 0,
                    reactivePower: readings.reactivePower || 0,
                    apparentPower: readings.apparentPower || 0,
                    maxDemand: readings.maxDemand || 0,
                },
                voltage: {
                    phaseA: readings.voltageL1 || readings.voltage || 0,
                    phaseB: readings.voltageL2 || 0,
                    phaseC: readings.voltageL3 || 0,
                    average: readings.voltage || 0,
                },
                current: {
                    phaseA: readings.currentL1 || readings.current || 0,
                    phaseB: readings.currentL2 || 0,
                    phaseC: readings.currentL3 || 0,
                    neutral: readings.currentNeutral || 0,
                    average: readings.current || 0,
                },
                powerFactor: {
                    phaseA: readings.powerFactorL1 || readings.powerFactor || 0,
                    phaseB: readings.powerFactorL2 || 0,
                    phaseC: readings.powerFactorL3 || 0,
                    average: readings.powerFactor || 0,
                },
                frequency: readings.frequency || 50,
            });
        }
        // Emit real-time update via socket
        server_1.socketIO.emit('meter-reading-update', {
            meterId: meter._id,
            meterNumber: meter.meterNumber,
            reading: meter.currentReading,
        });
        res.json({
            success: true,
            message: 'Data ingested successfully',
            meterId: meter._id,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to ingest data',
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=meter.routes.js.map