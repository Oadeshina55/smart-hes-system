import { Meter } from '../models/Meter.model';
import { Consumption } from '../models/Consumption.model';
import { Event } from '../models/Event.model';
import { socketIO } from '../server';
import logger from '../utils/logger';

export interface DLMSReadRequest {
  meterId?: string;
  meterNumber?: string;
  obisCode: string;
  classId?: number;
  attributeId?: number;
}

export interface DLMSWriteRequest {
  meterId?: string;
  meterNumber?: string;
  obisCode: string;
  value: any;
  classId?: number;
  attributeId?: number;
}

export interface DLMSReadResponse {
  success: boolean;
  meterId: string;
  meterNumber: string;
  obisCode: string;
  value: any;
  unit?: string;
  scaler?: number;
  timestamp: Date;
  error?: string;
}

export interface DLMSWriteResponse {
  success: boolean;
  meterId: string;
  meterNumber: string;
  obisCode: string;
  message: string;
  error?: string;
}

class DLMSService {
  /**
   * Read single OBIS code from meter
   */
  async readObis(request: DLMSReadRequest): Promise<DLMSReadResponse> {
    try {
      const meter = request.meterId
        ? await Meter.findById(request.meterId)
        : await Meter.findOne({ meterNumber: request.meterNumber });

      if (!meter) {
        throw new Error('Meter not found');
      }

      // In a real implementation, this would communicate with the physical meter
      // via DLMS/COSEM protocol (TCP/IP, Serial, or other transport)
      // For now, we'll simulate the read operation

      logger.info(`Reading OBIS ${request.obisCode} from meter ${meter.meterNumber}`);

      // Emit socket event to trigger real meter communication
      const responsePromise = new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Meter read timeout'));
        }, 30000); // 30 second timeout

        // Listen for meter response
        socketIO.once(`dlms-response-${meter._id}`, (data) => {
          clearTimeout(timeout);
          resolve(data);
        });

        // Send read request to meter
        socketIO.to(meter._id.toString()).emit('dlms-read', {
          obisCode: request.obisCode,
          classId: request.classId || 3, // Default to Register class
          attributeId: request.attributeId || 2, // Default to value attribute
        });
      });

      const result = await responsePromise;

      // Record the reading
      await Event.create({
        meter: meter._id,
        eventType: 'DLMS_READ',
        eventCode: 'DLMS_READ',
        severity: 'info',
        category: 'technical',
        description: `DLMS read: ${request.obisCode}`,
        metadata: new Map([
          ['obisCode', request.obisCode],
          ['value', result.value],
        ]),
        timestamp: new Date(),
      });

      return {
        success: true,
        meterId: meter._id.toString(),
        meterNumber: meter.meterNumber,
        obisCode: request.obisCode,
        value: result.value,
        unit: result.unit,
        scaler: result.scaler,
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error(`DLMS read error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Read multiple OBIS codes from meter
   */
  async readMultipleObis(
    meterIdentifier: string | { meterId?: string; meterNumber?: string },
    obisCodes: string[]
  ): Promise<DLMSReadResponse[]> {
    const results: DLMSReadResponse[] = [];

    for (const obisCode of obisCodes) {
      try {
        const request: DLMSReadRequest =
          typeof meterIdentifier === 'string'
            ? { meterNumber: meterIdentifier, obisCode }
            : { ...meterIdentifier, obisCode };

        const result = await this.readObis(request);
        results.push(result);
      } catch (error: any) {
        results.push({
          success: false,
          meterId: '',
          meterNumber: typeof meterIdentifier === 'string' ? meterIdentifier : meterIdentifier.meterNumber || '',
          obisCode,
          value: null,
          error: error.message,
          timestamp: new Date(),
        });
      }
    }

    return results;
  }

  /**
   * Write value to OBIS code on meter
   */
  async writeObis(request: DLMSWriteRequest): Promise<DLMSWriteResponse> {
    try {
      const meter = request.meterId
        ? await Meter.findById(request.meterId)
        : await Meter.findOne({ meterNumber: request.meterNumber });

      if (!meter) {
        throw new Error('Meter not found');
      }

      logger.info(`Writing to OBIS ${request.obisCode} on meter ${meter.meterNumber}`);

      // Emit socket event to trigger real meter communication
      const responsePromise = new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Meter write timeout'));
        }, 30000); // 30 second timeout

        // Listen for meter response
        socketIO.once(`dlms-write-response-${meter._id}`, (data) => {
          clearTimeout(timeout);
          resolve(data);
        });

        // Send write request to meter
        socketIO.to(meter._id.toString()).emit('dlms-write', {
          obisCode: request.obisCode,
          value: request.value,
          classId: request.classId || 3,
          attributeId: request.attributeId || 2,
        });
      });

      await responsePromise;

      // Record the write operation
      await Event.create({
        meter: meter._id,
        eventType: 'DLMS_WRITE',
        eventCode: 'DLMS_WRITE',
        severity: 'info',
        category: 'technical',
        description: `DLMS write: ${request.obisCode}`,
        metadata: new Map([
          ['obisCode', request.obisCode],
          ['value', request.value],
        ]),
        timestamp: new Date(),
      });

      return {
        success: true,
        meterId: meter._id.toString(),
        meterNumber: meter.meterNumber,
        obisCode: request.obisCode,
        message: 'Write operation successful',
      };
    } catch (error: any) {
      logger.error(`DLMS write error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Read meter profile (load profile data)
   */
  async readLoadProfile(
    meterIdentifier: { meterId?: string; meterNumber?: string },
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    try {
      const meter = meterIdentifier.meterId
        ? await Meter.findById(meterIdentifier.meterId)
        : await Meter.findOne({ meterNumber: meterIdentifier.meterNumber });

      if (!meter) {
        throw new Error('Meter not found');
      }

      logger.info(`Reading load profile from meter ${meter.meterNumber}`);

      // Emit socket event
      const responsePromise = new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Load profile read timeout'));
        }, 60000); // 60 second timeout for profile data

        socketIO.once(`dlms-profile-response-${meter._id}`, (data) => {
          clearTimeout(timeout);
          resolve(data);
        });

        socketIO.to(meter._id.toString()).emit('dlms-read-profile', {
          obisCode: '1-0:99.1.0.255', // Generic load profile OBIS
          startDate,
          endDate,
        });
      });

      const profileData = await responsePromise;

      return {
        success: true,
        meterId: meter._id.toString(),
        meterNumber: meter.meterNumber,
        profileData,
        period: { startDate, endDate },
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error(`Load profile read error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get common meter data (energy, voltage, current, power)
   */
  async getCommonMeterData(meterIdentifier: { meterId?: string; meterNumber?: string }): Promise<any> {
    const commonObisCodes = [
      '1-0:1.8.0.255', // Total active energy import
      '1-0:2.8.0.255', // Total active energy export
      '1-0:32.7.0.255', // Voltage L1
      '1-0:31.7.0.255', // Current L1
      '1-0:1.7.0.255', // Active power total
      '1-0:9.7.0.255', // Apparent power total
      '1-0:13.7.0.255', // Power factor total
      '1-0:14.7.0.255', // Frequency
    ];

    const results = await this.readMultipleObis(meterIdentifier, commonObisCodes);

    return {
      success: true,
      data: results,
      timestamp: new Date(),
    };
  }

  /**
   * Read meter time/clock
   */
  async readMeterTime(meterIdentifier: { meterId?: string; meterNumber?: string }): Promise<any> {
    const result = await this.readObis({
      ...meterIdentifier,
      obisCode: '0-0:1.0.0.255', // Clock OBIS code
      classId: 8, // Clock class
      attributeId: 2, // Time attribute
    });

    return result;
  }

  /**
   * Set meter time/clock
   */
  async setMeterTime(
    meterIdentifier: { meterId?: string; meterNumber?: string },
    dateTime: Date
  ): Promise<DLMSWriteResponse> {
    const result = await this.writeObis({
      ...meterIdentifier,
      obisCode: '0-0:1.0.0.255',
      value: dateTime.toISOString(),
      classId: 8,
      attributeId: 2,
    });

    return result;
  }
}

export const dlmsService = new DLMSService();
export default dlmsService;
