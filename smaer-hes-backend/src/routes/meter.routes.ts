import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Meter } from '../models/Meter.model';
import { parseObisForBrand } from '../utils/obisParser';
import { Consumption } from '../models/Consumption.model';
import { MeterReading, IObisReading } from '../models/MeterReading.model';
import { Event, EVENT_TYPES } from '../models/Event.model';
import { Alert, ALERT_TYPES } from '../models/Alert.model';
import { Area } from '../models/Area.model';
import { SimCard } from '../models/SimCard.model';
import { MeterStatusService } from '../services/meterStatus.service';
import { meterPollingService } from '../services/meterPolling.service';
import obisFunctionService from '../services/obisFunction.service';
import { socketIO } from '../server';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Create meter
router.post('/', authenticate, authorize('admin', 'operator'), async (req: any, res) => {
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

    // Validate meter number is 11 or 13 digits
    if (!/^\d{11}$|^\d{13}$/.test(body.meterNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid meter number format',
        error: 'Meter number must be exactly 11 or 13 digits'
      });
    }

    // Check if meter number already exists
    const existingMeter = await Meter.findOne({ meterNumber: body.meterNumber });
    if (existingMeter) {
      return res.status(409).json({
        success: false,
        message: 'Meter number already exists',
        error: `Meter with number ${body.meterNumber} already exists in the system`
      });
    }

    // Validate area exists
    const areaExists = await Area.findById(body.area);
    if (!areaExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid area',
        error: 'The specified area does not exist'
      });
    }

    // normalize brand
    if (body.brand) body.brand = String(body.brand).toLowerCase();

    // set default IP/PORT if missing
    if (!body.ipAddress) body.ipAddress = process.env.METER_HOST || '0.0.0.0';
    if (!body.port) body.port = process.env.METER_PORT ? Number(process.env.METER_PORT) : 5000;

    const meter = await Meter.create(body);

    // Log success
    console.log(`✓ Meter created: ${meter.meterNumber} (${meter._id})`);

    res.status(201).json({
      success: true,
      message: 'Meter created successfully',
      data: meter
    });
  } catch (error: any) {
    console.error('Error creating meter:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
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
router.put('/:id', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    const meter = await Meter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!meter) return res.status(404).json({ success: false, message: 'Meter not found' });
    res.json({ success: true, message: 'Meter updated', data: meter });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update meter', error: error.message });
  }
});

// Delete (soft) meter
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const meter = await Meter.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!meter) return res.status(404).json({ success: false, message: 'Meter not found' });
    res.json({ success: true, message: 'Meter deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete meter', error: error.message });
  }
});

// Import meters via CSV
router.post('/import', authenticate, authorize('admin', 'operator'), upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file is required' });

    const results: any[] = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        const rowResults: any[] = [];
        for (let i = 0; i < results.length; i++) {
          const row = results[i];
          try {
            const createBody: any = {
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

            const meter = await Meter.create(createBody);
            rowResults.push({ index: i, success: true, data: meter });
          } catch (err: any) {
            rowResults.push({ index: i, success: false, error: err.message || String(err), row });
          }
        }

        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          // ignore
        }

        const successCount = rowResults.filter(r => r.success).length;
        const failures = rowResults.filter(r => !r.success).map(r => ({ index: r.index, error: r.error, row: r.row }));

        res.json({ success: true, message: `Processed ${results.length} rows`, total: results.length, successCount, failures, details: rowResults });
      });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to import meters', error: error.message });
  }
});

// Get all meters with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, area, customer, search, page = 1, limit = 10 } = req.query;
    
    const filter: any = { isActive: true };
    
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
    
    const meters = await Meter.find(filter)
      .populate('area', 'name code')
      .populate('customer', 'customerName accountNumber')
      .populate('simCard', 'simNumber ipAddress')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    
    const total = await Meter.countDocuments(filter);
    
    res.json({
      success: true,
      data: meters,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meters',
      error: error.message,
    });
  }
});

// Get single meter by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const param = req.params.id;
    let meter = null;

    // Try by object ID first, otherwise treat as meterNumber
    try {
      meter = await Meter.findById(param)
        .populate('area', 'name code')
        .populate('customer', 'firstName lastName accountNumber email phoneNumber')
        .populate('simCard', 'iccid phoneNumber provider status');
    } catch (e) {
      // If not a valid ObjectId, try meterNumber
    }

    if (!meter) {
      meter = await Meter.findOne({ meterNumber: String(param).toUpperCase() })
        .populate('area', 'name code')
        .populate('customer', 'firstName lastName accountNumber email phoneNumber')
        .populate('simCard', 'iccid phoneNumber provider status');
    }

    if (!meter) {
      return res.status(404).json({
        success: false,
        message: 'Meter not found'
      });
    }

    res.json({
      success: true,
      data: meter
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter',
      error: error.message
    });
  }
});

// Request an immediate meter read (emit to meter via socket)
router.post('/:id/read', authenticate, authorize('admin', 'operator'), async (req: any, res) => {
  try {
    const param = req.params.id;
    let meter = null;

    // try by object id first, otherwise treat as meterNumber
    try {
      meter = await Meter.findById(param);
    } catch (e) {
      // ignore
    }

    if (!meter) {
      meter = await Meter.findOne({ meterNumber: String(param).toUpperCase() });
    }

    if (!meter) return res.status(404).json({ success: false, message: 'Meter not found' });

    // Emit read request to the specific meter room
    socketIO.to(meter._id.toString()).emit('meter-read-request', { requestedBy: req.user ? req.user._id : null });

    // Record event
    const event = await Event.create({
      meter: meter._id,
      eventType: 'METER_READ_REQUEST',
      eventCode: 'METER_READ_REQUEST',
      severity: 'info',
      category: 'technical',
      description: 'Remote meter read requested',
      timestamp: new Date()
    });

    res.json({ success: true, message: 'Meter read request sent', data: { eventId: event._id } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to request meter read', error: error.message });
  }
});

// Get meter settings (OBIS configuration / metadata)
router.get('/:id/settings', authenticate, authorize('admin', 'operator'), async (req: any, res) => {
  try {
    const param = req.params.id;
    let meter: any = null;

    try {
      meter = await Meter.findById(param);
    } catch (e) {}

    if (!meter) {
      meter = await Meter.findOne({ meterNumber: String(param).toUpperCase() });
    }

    if (!meter) return res.status(404).json({ success: false, message: 'Meter not found' });

    res.json({
      success: true,
      data: {
        obisConfiguration: meter.obisConfiguration || {},
        metadata: meter.metadata || {}
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch meter settings', error: error.message });
  }
});

// Update meter settings (and optionally write to meter)
router.post('/:id/settings', authenticate, authorize('admin', 'operator'), async (req: any, res) => {
  try {
    const param = req.params.id;
    const { settings, metadata, writeToMeter } = req.body;

    let meter: any = null;
    try {
      meter = await Meter.findById(param);
    } catch (e) {}

    if (!meter) {
      meter = await Meter.findOne({ meterNumber: String(param).toUpperCase() });
    }

    if (!meter) return res.status(404).json({ success: false, message: 'Meter not found' });

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
      socketIO.to(meter._id.toString()).emit('meter-write-settings', { settings, metadata, requestedBy: req.user ? req.user._id : null });

      await Event.create({
        meter: meter._id,
        eventType: 'METER_SETTINGS_WRITTEN',
        eventCode: 'METER_SETTINGS_WRITTEN',
        severity: 'info',
        category: 'configuration',
        description: 'Meter settings written remotely',
        timestamp: new Date()
      });
    } else {
      await Event.create({
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update meter settings', error: error.message });
  }
});

// CRITICAL: Meter Data Ingestion Endpoint (for meters to send data)
router.post('/data-ingestion', async (req, res) => {
  try {
    const {
      meterNumber,
      readings,
      obisReadings,
      events,
      timestamp,
      authentication,
    } = req.body;

    // Find meter
    const meter = await Meter.findOne({ meterNumber });

    if (!meter) {
      return res.status(404).json({
        success: false,
        message: 'Meter not found',
      });
    }

    // Process OBIS readings if provided
    let processedObisReadings: IObisReading[] = [];
    if (obisReadings) {
      processedObisReadings = processObisReadings(obisReadings, meter.brand);
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
        await MeterStatusService.checkTamperStatus(meter);
      }
    }

    // Update meter status and last seen
    meter.status = 'online';
    meter.lastSeen = new Date();
    await meter.save();

    // Store consumption data (legacy format)
    if (readings) {
      await Consumption.create({
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

    // Store detailed OBIS readings
    if (processedObisReadings.length > 0) {
      await MeterReading.create({
        meter: meter._id,
        meterNumber: meter.meterNumber,
        timestamp: new Date(timestamp || Date.now()),
        readings: processedObisReadings,
        readingType: 'push',
        source: 'meter-push',
        communicationStatus: 'success'
      });
    }

    // Emit real-time update via socket
    socketIO.emit('meter-reading-update', {
      meterId: meter._id,
      meterNumber: meter.meterNumber,
      reading: meter.currentReading,
      obisReadings: processedObisReadings,
    });

    res.json({
      success: true,
      message: 'Data ingested successfully',
      meterId: meter._id,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to ingest data',
      error: error.message,
    });
  }
});

// Read specific OBIS parameters from meter (on-demand)
router.post('/:id/read-obis', authenticate, authorize('admin', 'operator'), async (req: any, res) => {
  try {
    const { obisCodes } = req.body;

    if (!obisCodes || !Array.isArray(obisCodes)) {
      return res.status(400).json({
        success: false,
        message: 'obisCodes array is required'
      });
    }

    const result = await meterPollingService.pollMeterOnDemand(req.params.id, obisCodes);

    res.json({
      success: true,
      message: 'OBIS parameters read successfully',
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to read OBIS parameters',
      error: error.message
    });
  }
});

// Write specific OBIS parameter to meter
router.post('/:id/write-obis', authenticate, authorize('admin', 'operator'), async (req: any, res) => {
  try {
    const { obisCode, value } = req.body;

    if (!obisCode || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'obisCode and value are required'
      });
    }

    const result = await meterPollingService.writeObisParameter(req.params.id, obisCode, value);

    // Create event
    const meter = await Meter.findById(req.params.id);
    if (meter) {
      await Event.create({
        meter: meter._id,
        eventType: 'OBIS_PARAMETER_WRITTEN',
        eventCode: 'OBIS_PARAMETER_WRITTEN',
        severity: 'info',
        category: 'configuration',
        description: `OBIS parameter ${obisCode} set to ${value}`,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'OBIS parameter written successfully',
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to write OBIS parameter',
      error: error.message
    });
  }
});

// Get latest OBIS readings for a meter
router.get('/:id/obis-readings', authenticate, async (req: any, res) => {
  try {
    const latestReading = await MeterReading.getLatestReading(req.params.id);

    if (!latestReading) {
      return res.status(404).json({
        success: false,
        message: 'No readings found for this meter'
      });
    }

    res.json({
      success: true,
      data: latestReading
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch OBIS readings',
      error: error.message
    });
  }
});

// Get OBIS reading history for a meter
router.get('/:id/obis-readings/history', authenticate, async (req: any, res) => {
  try {
    const { startDate, endDate, obisCode } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    let readings;

    if (obisCode) {
      // Get time series for specific OBIS code
      readings = await MeterReading.getObisTimeSeries(
        req.params.id,
        obisCode as string,
        new Date(startDate as string),
        new Date(endDate as string)
      );
    } else {
      // Get all readings in range
      readings = await MeterReading.getReadingsInRange(
        req.params.id,
        new Date(startDate as string),
        new Date(endDate as string)
      );
    }

    res.json({
      success: true,
      data: readings
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch OBIS reading history',
      error: error.message
    });
  }
});

// Helper function to process OBIS readings
function processObisReadings(obisData: any, brand?: 'hexing' | 'hexcell'): IObisReading[] {
  const readings: IObisReading[] = [];

  // Handle array format
  if (Array.isArray(obisData)) {
    for (const item of obisData) {
      const obisFunction = obisFunctionService.getFunction(item.obisCode, brand);
      const reading: IObisReading = {
        obisCode: item.obisCode,
        name: obisFunction?.name || item.name,
        value: item.value,
        unit: obisFunction?.unit || item.unit,
        scaler: obisFunction?.scaler || item.scaler,
        dataType: obisFunction?.dataType || item.dataType,
        classId: obisFunction?.classId || item.classId,
        attributeId: obisFunction?.attributeId || item.attributeId,
        quality: item.quality || 'good'
      };

      // Calculate actual value with scaler
      if (reading.scaler !== undefined && typeof item.value === 'number') {
        reading.actualValue = item.value * Math.pow(10, reading.scaler);
      }

      readings.push(reading);
    }
  }
  // Handle object format { "obisCode": value, ... }
  else if (typeof obisData === 'object') {
    for (const [obisCode, value] of Object.entries(obisData)) {
      if (obisCode.match(/\d+-\d+:\d+\.\d+\.\d+\.\d+/)) {
        const obisFunction = obisFunctionService.getFunction(obisCode, brand);
        const reading: IObisReading = {
          obisCode: obisCode,
          name: obisFunction?.name,
          value: value,
          unit: obisFunction?.unit,
          scaler: obisFunction?.scaler,
          dataType: obisFunction?.dataType,
          classId: obisFunction?.classId,
          attributeId: obisFunction?.attributeId,
          quality: 'good'
        };

        // Calculate actual value with scaler
        if (reading.scaler !== undefined && typeof value === 'number') {
          reading.actualValue = (value as number) * Math.pow(10, reading.scaler);
        }

        readings.push(reading);
      }
    }
  }

  return readings;
}

export default router;
