import { Meter } from '../models/Meter.model';
import { Consumption } from '../models/Consumption.model';
import { Event } from '../models/Event.model';
import { socketIO } from '../server';
import logger from '../utils/logger';
import axios from 'axios';

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

// Python DLMS Service configuration
const PYTHON_DLMS_SERVICE_URL = process.env.PYTHON_DLMS_URL || 'http://localhost:8001';
const USE_PYTHON_SERVICE = process.env.USE_PYTHON_DLMS === 'true' || true; // Default to true

class DLMSService {
  private pythonServiceUrl: string;
  private usePythonService: boolean;

  constructor() {
    this.pythonServiceUrl = PYTHON_DLMS_SERVICE_URL;
    this.usePythonService = USE_PYTHON_SERVICE;
    logger.info(`DLMS Service initialized. Python service: ${this.usePythonService ? 'ENABLED' : 'DISABLED'} at ${this.pythonServiceUrl}`);
  }

  /**
   * Ensure meter is connected to Python DLMS service
   */
  private async ensureConnection(meter: any): Promise<boolean> {
    if (!this.usePythonService) {
      return true; // Skip if not using Python service
    }

    try {
      const response = await axios.post(`${this.pythonServiceUrl}/connect`, {
        meter_number: meter.meterNumber,
        brand: meter.brand || 'hexing',
        connection_type: 'tcp',
        ip_address: meter.ipAddress || meter.ip,
        port: meter.port || 4059,
        server_address: meter.serverAddress || 1,
        client_address: meter.clientAddress || 16,
        auth_type: meter.authType || 'None',
        password: meter.password,
        timeout: 30000,
      }, {
        timeout: 35000,
        validateStatus: (status) => status < 500,
      });

      if (response.data.success) {
        logger.info(`Meter ${meter.meterNumber} connected to Python DLMS service`);
        return true;
      } else {
        logger.warn(`Failed to connect meter ${meter.meterNumber}: ${response.data.message}`);
        return false;
      }
    } catch (error: any) {
      logger.error(`Connection error for meter ${meter.meterNumber}: ${error.message}`);
      return false;
    }
  }
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

      logger.info(`Reading OBIS ${request.obisCode} from meter ${meter.meterNumber}`);

      let result: any;

      if (this.usePythonService) {
        // Use Python DLMS service
        await this.ensureConnection(meter);

        const response = await axios.post(
          `${this.pythonServiceUrl}/read`,
          {
            meter_number: meter.meterNumber,
            obis_code: request.obisCode,
            class_id: request.classId || 3,
            attribute_id: request.attributeId || 2,
          },
          { timeout: 35000 }
        );

        if (!response.data.success) {
          throw new Error(response.data.data?.error || 'Read failed');
        }

        result = response.data.data;
      } else {
        // Fallback to Socket.IO communication
        const responsePromise = new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Meter read timeout'));
          }, 30000);

          socketIO.once(`dlms-response-${meter._id}`, (data) => {
            clearTimeout(timeout);
            resolve(data);
          });

          socketIO.to(meter._id.toString()).emit('dlms-read', {
            obisCode: request.obisCode,
            classId: request.classId || 3,
            attributeId: request.attributeId || 2,
          });
        });

        result = await responsePromise;
      }

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
   * Read multiple OBIS codes from meter (batch read)
   */
  async readMultipleObis(
    meterIdentifier: string | { meterId?: string; meterNumber?: string },
    obisCodes: Array<string | { code: string; classId?: number; attributeId?: number }>
  ): Promise<DLMSReadResponse[]> {
    try {
      const meter = typeof meterIdentifier === 'string'
        ? await Meter.findOne({ meterNumber: meterIdentifier })
        : meterIdentifier.meterId
          ? await Meter.findById(meterIdentifier.meterId)
          : await Meter.findOne({ meterNumber: meterIdentifier.meterNumber });

      if (!meter) {
        throw new Error('Meter not found');
      }

      logger.info(`Batch reading ${obisCodes.length} OBIS codes from meter ${meter.meterNumber}`);

      let results: DLMSReadResponse[] = [];

      if (this.usePythonService) {
        // Use Python DLMS service for batch reading (much faster!)
        await this.ensureConnection(meter);

        const formattedCodes = obisCodes.map(code =>
          typeof code === 'string'
            ? { code, classId: 3, attributeId: 2 }
            : { code: code.code, classId: code.classId || 3, attributeId: code.attributeId || 2 }
        );

        const response = await axios.post(
          `${this.pythonServiceUrl}/read-multiple`,
          {
            meter_number: meter.meterNumber,
            obis_codes: formattedCodes,
          },
          { timeout: 60000 } // Longer timeout for batch
        );

        if (response.data.success) {
          const readings = response.data.data?.readings || [];
          results = readings.map((reading: any) => ({
            success: reading.success || false,
            meterId: meter._id.toString(),
            meterNumber: meter.meterNumber,
            obisCode: reading.obisCode || reading.code,
            value: reading.value,
            unit: reading.unit,
            scaler: reading.scaler,
            timestamp: new Date(),
            error: reading.error,
          }));
        } else {
          throw new Error('Batch read failed');
        }
      } else {
        // Fallback to sequential reading (slower)
        for (const obisCode of obisCodes) {
          try {
            const codeStr = typeof obisCode === 'string' ? obisCode : obisCode.code;
            const request: DLMSReadRequest = {
              meterId: meter._id.toString(),
              obisCode: codeStr,
              classId: typeof obisCode === 'object' ? obisCode.classId : undefined,
              attributeId: typeof obisCode === 'object' ? obisCode.attributeId : undefined,
            };

            const result = await this.readObis(request);
            results.push(result);
          } catch (error: any) {
            results.push({
              success: false,
              meterId: meter._id.toString(),
              meterNumber: meter.meterNumber,
              obisCode: typeof obisCode === 'string' ? obisCode : obisCode.code,
              value: null,
              error: error.message,
              timestamp: new Date(),
            });
          }
        }
      }

      return results;
    } catch (error: any) {
      logger.error(`Batch read error: ${error.message}`);
      throw error;
    }
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

      if (this.usePythonService) {
        // Use Python DLMS service
        await this.ensureConnection(meter);

        const response = await axios.post(
          `${this.pythonServiceUrl}/write`,
          {
            meter_number: meter.meterNumber,
            obis_code: request.obisCode,
            value: request.value,
            class_id: request.classId || 3,
            attribute_id: request.attributeId || 2,
          },
          { timeout: 35000 }
        );

        if (!response.data.success) {
          throw new Error(response.data.data?.error || 'Write failed');
        }
      } else {
        // Fallback to Socket.IO communication
        const responsePromise = new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Meter write timeout'));
          }, 30000);

          socketIO.once(`dlms-write-response-${meter._id}`, (data) => {
            clearTimeout(timeout);
            resolve(data);
          });

          socketIO.to(meter._id.toString()).emit('dlms-write', {
            obisCode: request.obisCode,
            value: request.value,
            classId: request.classId || 3,
            attributeId: request.attributeId || 2,
          });
        });

        await responsePromise;
      }

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
