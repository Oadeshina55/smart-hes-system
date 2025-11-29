/**
 * Meter Communication Service
 *
 * Unified service for communicating with different meter brands
 * Supports: Hexing, Hexcell
 */

import { Meter } from '../models/Meter.model';
import { HexingMeterDriver, HexingReadingData } from '../drivers/hexingMeter.driver';
import { HexcellMeterDriver, HexcellReadingData } from '../drivers/hexcellMeter.driver';
import { Consumption } from '../models/Consumption.model';
import { Event } from '../models/Event.model';
import logger from '../utils/logger';

export type MeterReadingData = HexingReadingData | HexcellReadingData;

export interface MeterCommunicationResult {
  success: boolean;
  data?: MeterReadingData;
  error?: string;
  timestamp: Date;
}

/**
 * Meter Communication Service Class
 */
export class MeterCommunicationService {
  private activeConnections: Map<string, HexingMeterDriver | HexcellMeterDriver> = new Map();

  /**
   * Create appropriate driver based on meter brand
   */
  private createDriver(meter: any): HexingMeterDriver | HexcellMeterDriver {
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
        return new HexingMeterDriver(config);

      case 'hexcell':
        return new HexcellMeterDriver(config);

      default:
        // Default to Hexing if brand not specified
        logger.warn(`Unknown meter brand: ${brand}, defaulting to Hexing`);
        return new HexingMeterDriver(config);
    }
  }

  /**
   * Get or create driver connection
   */
  private async getDriver(meter: any): Promise<HexingMeterDriver | HexcellMeterDriver> {
    const meterId = meter._id.toString();

    if (this.activeConnections.has(meterId)) {
      return this.activeConnections.get(meterId)!;
    }

    const driver = this.createDriver(meter);

    try {
      await driver.connect();
      this.activeConnections.set(meterId, driver);
      return driver;
    } catch (error: any) {
      logger.error(`Failed to connect to meter ${meter.meterNumber}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Close driver connection
   */
  private async closeDriver(meterId: string): Promise<void> {
    if (this.activeConnections.has(meterId)) {
      const driver = this.activeConnections.get(meterId)!;
      await driver.disconnect();
      this.activeConnections.delete(meterId);
    }
  }

  /**
   * Read meter data
   */
  async readMeterData(meterId: string): Promise<MeterCommunicationResult> {
    try {
      const meter = await Meter.findById(meterId);

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
      await Meter.findByIdAndUpdate(meterId, {
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
    } catch (error: any) {
      logger.error(`Error reading meter ${meterId}: ${error.message}`);

      // Update meter status to offline
      await Meter.findByIdAndUpdate(meterId, {
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
  async readMeterByNumber(meterNumber: string): Promise<MeterCommunicationResult> {
    const meter = await Meter.findOne({ meterNumber });

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
  async readObisCode(
    meterId: string,
    obisCode: string,
    classId: number = 3,
    attributeId: number = 2
  ): Promise<{ success: boolean; value?: any; error?: string }> {
    try {
      const meter = await Meter.findById(meterId);

      if (!meter) {
        return { success: false, error: 'Meter not found' };
      }

      const driver = await this.getDriver(meter);
      const value = await driver.readCustomObis(obisCode, classId, attributeId);

      await this.closeDriver(meterId);

      return { success: true, value };
    } catch (error: any) {
      logger.error(`Error reading OBIS ${obisCode} from meter ${meterId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Control meter relay
   */
  async controlRelay(
    meterId: string,
    action: 'connect' | 'disconnect'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const meter = await Meter.findById(meterId);

      if (!meter) {
        return { success: false, error: 'Meter not found' };
      }

      const driver = await this.getDriver(meter);
      await driver.relayControl(action);

      // Log event
      await Event.create({
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
    } catch (error: any) {
      logger.error(`Error controlling relay for meter ${meterId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set meter time
   */
  async setMeterTime(meterId: string, dateTime?: Date): Promise<{ success: boolean; error?: string }> {
    try {
      const meter = await Meter.findById(meterId);

      if (!meter) {
        return { success: false, error: 'Meter not found' };
      }

      const driver = await this.getDriver(meter);
      await driver.setMeterTime(dateTime || new Date());

      await this.closeDriver(meterId);

      return { success: true };
    } catch (error: any) {
      logger.error(`Error setting time for meter ${meterId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Bulk read multiple meters
   */
  async readMultipleMeters(meterIds: string[]): Promise<Map<string, MeterCommunicationResult>> {
    const results = new Map<string, MeterCommunicationResult>();

    // Read meters in parallel (limited to 5 concurrent)
    const batchSize = 5;
    for (let i = 0; i < meterIds.length; i += batchSize) {
      const batch = meterIds.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (meterId) => ({
          meterId,
          result: await this.readMeterData(meterId),
        }))
      );

      batchResults.forEach(({ meterId, result }) => {
        results.set(meterId, result);
      });
    }

    return results;
  }

  /**
   * Save consumption data to database
   */
  private async saveConsumptionData(meter: any, data: MeterReadingData): Promise<void> {
    try {
      await Consumption.create({
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
    } catch (error: any) {
      logger.error(`Error saving consumption data: ${error.message}`);
    }
  }

  /**
   * Close all active connections
   */
  async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.activeConnections.keys()).map((meterId) =>
      this.closeDriver(meterId)
    );

    await Promise.all(closePromises);
    logger.info('All meter connections closed');
  }
}

// Export singleton instance
export const meterCommunicationService = new MeterCommunicationService();
export default meterCommunicationService;
