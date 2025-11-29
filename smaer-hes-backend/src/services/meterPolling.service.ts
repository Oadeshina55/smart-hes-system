import cron from 'node-cron';
import { Meter } from '../models/Meter.model';
import { MeterReading, IObisReading } from '../models/MeterReading.model';
import obisFunctionService from './obisFunction.service';
import { io } from '../server';
import axios from 'axios';
import logger from '../utils/logger';

/**
 * Meter Polling Service
 * Actively polls meters at regular intervals to pull data
 */
class MeterPollingService {
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private pollingIntervalMs = 60000; // Default: 60 seconds
  private maxConcurrentPolls = 10;
  private activePolls = 0;

  /**
   * Start the polling service
   */
  start(intervalMs: number = 60000) {
    if (this.isPolling) {
      logger.info('Meter polling service already running');
      return;
    }

    this.pollingIntervalMs = intervalMs;
    this.isPolling = true;

    // Start polling immediately
    this.pollAllMeters();

    // Set up cron job for continuous polling
    const intervalSeconds = Math.floor(intervalMs / 1000);
    const cronExpression = `*/${intervalSeconds} * * * * *`;

    cron.schedule(cronExpression, async () => {
      if (!this.isPolling) return;
      await this.pollAllMeters();
    });

    logger.info(`Meter polling service started with interval: ${intervalMs}ms`);
  }

  /**
   * Stop the polling service
   */
  stop() {
    this.isPolling = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    logger.info('Meter polling service stopped');
  }

  /**
   * Poll all online meters
   */
  private async pollAllMeters() {
    try {
      // Get all online meters
      const meters = await Meter.find({
        status: 'online',
        ipAddress: { $exists: true, $ne: null }
      }).select('_id meterNumber ipAddress port brand obisConfiguration');

      if (meters.length === 0) {
        return;
      }

      logger.info(`Polling ${meters.length} online meters...`);

      // Poll meters in batches to avoid overwhelming the system
      const batches = this.createBatches(meters, this.maxConcurrentPolls);

      for (const batch of batches) {
        await Promise.all(batch.map(meter => this.pollMeter(meter)));
      }

      logger.info(`Completed polling cycle for ${meters.length} meters`);
    } catch (error: any) {
      logger.error('Error polling meters:', error);
    }
  }

  /**
   * Poll a single meter
   */
  private async pollMeter(meter: any) {
    const startTime = Date.now();
    this.activePolls++;

    try {
      // Get OBIS parameters to read from meter configuration
      const obisToRead = this.getObisParametersToRead(meter);

      if (obisToRead.length === 0) {
        logger.warn(`No OBIS parameters configured for meter ${meter.meterNumber}`);
        this.activePolls--;
        return;
      }

      // Read meter data via HTTP
      const meterUrl = `http://${meter.ipAddress}:${meter.port || 80}/api/read`;
      const response = await axios.post(
        meterUrl,
        { obisCodes: obisToRead },
        {
          timeout: 10000, // 10 second timeout
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const responseTime = Date.now() - startTime;

      // Process readings
      const readings = this.processReadings(response.data, meter.brand);

      // Store in database
      const meterReading = new MeterReading({
        meter: meter._id,
        meterNumber: meter.meterNumber,
        timestamp: new Date(),
        readings: readings,
        readingType: 'scheduled',
        source: 'system-poll',
        communicationStatus: 'success',
        responseTime: responseTime
      });

      await meterReading.save();

      // Update meter's current reading
      await this.updateMeterCurrentReading(meter._id, readings);

      // Emit real-time update via Socket.IO
      io.to(`meter-${meter._id}`).emit('meter-reading-update', {
        meterId: meter._id,
        meterNumber: meter.meterNumber,
        readings: readings,
        timestamp: new Date()
      });

      logger.debug(`Successfully polled meter ${meter.meterNumber} in ${responseTime}ms`);
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      // Log error and create failed reading record
      logger.error(`Failed to poll meter ${meter.meterNumber}:`, error.message);

      const meterReading = new MeterReading({
        meter: meter._id,
        meterNumber: meter.meterNumber,
        timestamp: new Date(),
        readings: [],
        readingType: 'scheduled',
        source: 'system-poll',
        communicationStatus: 'failed',
        errorMessage: error.message,
        responseTime: responseTime
      });

      await meterReading.save();

      // Update meter status to offline if communication failed
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        await Meter.findByIdAndUpdate(meter._id, {
          status: 'offline',
          lastSeen: new Date()
        });
      }
    } finally {
      this.activePolls--;
    }
  }

  /**
   * Get OBIS parameters to read from meter configuration
   */
  private getObisParametersToRead(meter: any): string[] {
    const obisCodes: string[] = [];

    // If meter has OBIS configuration, use it
    if (meter.obisConfiguration && meter.obisConfiguration.size > 0) {
      meter.obisConfiguration.forEach((group: any, groupName: string) => {
        if (Array.isArray(group.items)) {
          group.items.forEach((item: any) => {
            if (item.code) {
              obisCodes.push(item.code);
            }
          });
        }
      });
    }

    // If no configuration, read common OBIS codes based on brand
    if (obisCodes.length === 0) {
      obisCodes.push(...this.getDefaultObisCodes(meter.brand));
    }

    return obisCodes;
  }

  /**
   * Get default OBIS codes to read if no configuration exists
   */
  private getDefaultObisCodes(brand?: string): string[] {
    return [
      // Energy
      '1-0:15.8.0.255',  // Total Active Energy
      '1-0:1.8.0.255',   // Active Energy Import
      '1-0:2.8.0.255',   // Active Energy Export

      // Voltage
      '1-0:32.7.0.255',  // Voltage L1
      '1-0:52.7.0.255',  // Voltage L2
      '1-0:72.7.0.255',  // Voltage L3

      // Current
      '1-0:31.7.0.255',  // Current L1
      '1-0:51.7.0.255',  // Current L2
      '1-0:71.7.0.255',  // Current L3

      // Power
      '1-0:1.7.0.255',   // Total Active Power
      '1-0:21.7.0.255',  // Active Power L1
      '1-0:41.7.0.255',  // Active Power L2
      '1-0:61.7.0.255',  // Active Power L3

      // Frequency
      '1-0:14.7.0.255',  // Frequency

      // Power Factor
      '1-0:13.7.0.255',  // Power Factor

      // Clock
      '0-0:1.0.0.255',   // Clock

      // Meter Info
      '0-0:96.1.0.255',  // Meter Serial Number
    ];
  }

  /**
   * Process raw meter readings into OBIS reading format
   */
  private processReadings(data: any, brand?: 'hexing' | 'hexcell'): IObisReading[] {
    const readings: IObisReading[] = [];

    // Handle different response formats
    if (data.readings && Array.isArray(data.readings)) {
      // Format 1: { readings: [ { obisCode, value }, ... ] }
      for (const reading of data.readings) {
        const obisFunction = obisFunctionService.getFunction(reading.obisCode);
        const obisReading: IObisReading = {
          obisCode: reading.obisCode,
          name: obisFunction?.name || reading.name,
          value: reading.value,
          unit: obisFunction?.unit || reading.unit,
          scaler: obisFunction?.scaler || reading.scaler,
          dataType: obisFunction?.dataType || reading.dataType,
          classId: obisFunction?.classId || reading.classId,
          attributeId: obisFunction?.attributeId || reading.attributeId,
          quality: reading.quality || 'good'
        };

        // Calculate actual value with scaler
        if (obisReading.scaler !== undefined && typeof reading.value === 'number') {
          obisReading.actualValue = reading.value * Math.pow(10, obisReading.scaler);
        }

        readings.push(obisReading);
      }
    } else if (typeof data === 'object') {
      // Format 2: { "obisCode": value, ... }
      for (const [obisCode, value] of Object.entries(data)) {
        if (obisCode.match(/\d+-\d+:\d+\.\d+\.\d+\.\d+/)) {
          const obisFunction = obisFunctionService.getFunction(obisCode);
          const obisReading: IObisReading = {
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
          if (obisReading.scaler !== undefined && typeof value === 'number') {
            obisReading.actualValue = (value as number) * Math.pow(10, obisReading.scaler);
          }

          readings.push(obisReading);
        }
      }
    }

    return readings;
  }

  /**
   * Update meter's current reading field
   */
  private async updateMeterCurrentReading(meterId: string, readings: IObisReading[]) {
    const currentReading: any = {
      timestamp: new Date()
    };

    // Extract common values
    for (const reading of readings) {
      switch (reading.obisCode) {
        case '1-0:15.8.0.255':
        case '1-0:1.8.0.255':
          currentReading.totalEnergy = reading.actualValue || reading.value;
          break;
        case '1-0:32.7.0.255':
          currentReading.voltage = reading.actualValue || reading.value;
          break;
        case '1-0:31.7.0.255':
          currentReading.current = reading.actualValue || reading.value;
          break;
        case '1-0:1.7.0.255':
          currentReading.power = reading.actualValue || reading.value;
          break;
        case '1-0:14.7.0.255':
          currentReading.frequency = reading.actualValue || reading.value;
          break;
        case '1-0:13.7.0.255':
          currentReading.powerFactor = reading.actualValue || reading.value;
          break;
      }
    }

    await Meter.findByIdAndUpdate(meterId, {
      currentReading: currentReading,
      lastSeen: new Date(),
      status: 'online'
    });
  }

  /**
   * Create batches for concurrent processing
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Poll a specific meter on demand
   */
  async pollMeterOnDemand(meterId: string, obisCodes?: string[]): Promise<any> {
    const meter = await Meter.findById(meterId).select('_id meterNumber ipAddress port brand obisConfiguration');

    if (!meter) {
      throw new Error('Meter not found');
    }

    if (!meter.ipAddress) {
      throw new Error('Meter has no IP address configured');
    }

    const startTime = Date.now();

    try {
      const obisToRead = obisCodes || this.getObisParametersToRead(meter);
      const meterUrl = `http://${meter.ipAddress}:${meter.port || 80}/api/read`;

      const response = await axios.post(
        meterUrl,
        { obisCodes: obisToRead },
        {
          timeout: 15000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const responseTime = Date.now() - startTime;
      const readings = this.processReadings(response.data, meter.brand);

      // Store in database
      const meterReading = new MeterReading({
        meter: meter._id,
        meterNumber: meter.meterNumber,
        timestamp: new Date(),
        readings: readings,
        readingType: 'on-demand',
        source: 'system-poll',
        communicationStatus: 'success',
        responseTime: responseTime
      });

      await meterReading.save();

      // Update meter's current reading
      await this.updateMeterCurrentReading(meter._id.toString(), readings);

      // Emit real-time update
      io.to(`meter-${meter._id}`).emit('meter-reading-update', {
        meterId: meter._id,
        meterNumber: meter.meterNumber,
        readings: readings,
        timestamp: new Date()
      });

      return {
        success: true,
        meterId: meter._id,
        meterNumber: meter.meterNumber,
        readings: readings,
        responseTime: responseTime
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      // Create failed reading record
      const meterReading = new MeterReading({
        meter: meter._id,
        meterNumber: meter.meterNumber,
        timestamp: new Date(),
        readings: [],
        readingType: 'on-demand',
        source: 'system-poll',
        communicationStatus: 'failed',
        errorMessage: error.message,
        responseTime: responseTime
      });

      await meterReading.save();

      throw new Error(`Failed to poll meter: ${error.message}`);
    }
  }

  /**
   * Write OBIS parameter to meter
   */
  async writeObisParameter(meterId: string, obisCode: string, value: any): Promise<any> {
    const meter = await Meter.findById(meterId).select('_id meterNumber ipAddress port brand');

    if (!meter) {
      throw new Error('Meter not found');
    }

    if (!meter.ipAddress) {
      throw new Error('Meter has no IP address configured');
    }

    try {
      const meterUrl = `http://${meter.ipAddress}:${meter.port || 80}/api/write`;

      const response = await axios.post(
        meterUrl,
        {
          obisCode: obisCode,
          value: value
        },
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      logger.info(`Successfully wrote ${obisCode}=${value} to meter ${meter.meterNumber}`);

      return {
        success: true,
        meterId: meter._id,
        meterNumber: meter.meterNumber,
        obisCode: obisCode,
        value: value,
        response: response.data
      };
    } catch (error: any) {
      logger.error(`Failed to write ${obisCode} to meter ${meter.meterNumber}:`, error.message);
      throw new Error(`Failed to write parameter: ${error.message}`);
    }
  }

  /**
   * Get polling status
   */
  getStatus() {
    return {
      isPolling: this.isPolling,
      pollingIntervalMs: this.pollingIntervalMs,
      activePolls: this.activePolls,
      maxConcurrentPolls: this.maxConcurrentPolls
    };
  }
}

export const meterPollingService = new MeterPollingService();
