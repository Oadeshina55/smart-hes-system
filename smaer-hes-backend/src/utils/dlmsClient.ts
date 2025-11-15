/**
 * DLMS TCP/IP Client
 *
 * Handles TCP/IP communication with DLMS/COSEM compliant smart meters
 * Supports Hexing and Hexcell meters
 */

import * as net from 'net';
import { EventEmitter } from 'events';
import logger from './logger';
import {
  HDLCFrame,
  COSEMApdu,
  DLMSData,
  parseObisCode,
  ObisCode,
  DLMS_CONSTANTS,
} from './dlmsProtocol';

export interface DLMSClientConfig {
  host: string;
  port: number;
  clientId?: number;
  password?: string;
  timeout?: number;
  logicalDeviceAddress?: number;
  physicalDeviceAddress?: number;
}

export interface DLMSReadResult {
  success: boolean;
  obisCode: string;
  classId: number;
  attributeId: number;
  value: any;
  unit?: string;
  scaler?: number;
  timestamp: Date;
  error?: string;
}

export class DLMSClient extends EventEmitter {
  private config: DLMSClientConfig;
  private socket: net.Socket | null = null;
  private connected: boolean = false;
  private associated: boolean = false;
  private receiveBuffer: Buffer = Buffer.alloc(0);
  private pendingRequests: Map<number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private invokeId: number = 0;

  constructor(config: DLMSClientConfig) {
    super();
    this.config = {
      timeout: 30000,
      clientId: 16,
      logicalDeviceAddress: 1,
      physicalDeviceAddress: 1,
      ...config,
    };
  }

  /**
   * Connect to the meter
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        return resolve();
      }

      this.socket = new net.Socket();

      const timeout = setTimeout(() => {
        this.socket?.destroy();
        reject(new Error('Connection timeout'));
      }, this.config.timeout);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        this.connected = true;
        logger.info(`Connected to meter at ${this.config.host}:${this.config.port}`);
        this.emit('connected');
        resolve();
      });

      this.socket.on('data', (data: Buffer) => {
        this.handleData(data);
      });

      this.socket.on('error', (error: Error) => {
        logger.error(`Socket error: ${error.message}`);
        this.emit('error', error);
      });

      this.socket.on('close', () => {
        this.connected = false;
        this.associated = false;
        logger.info('Connection closed');
        this.emit('disconnected');
      });

      this.socket.connect(this.config.port, this.config.host);
    });
  }

  /**
   * Disconnect from the meter
   */
  async disconnect(): Promise<void> {
    if (this.associated) {
      await this.releaseAssociation();
    }

    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }

    this.connected = false;
    this.associated = false;
  }

  /**
   * Establish DLMS association
   */
  async associate(): Promise<void> {
    if (this.associated) {
      return;
    }

    if (!this.connected) {
      await this.connect();
    }

    // Send SNRM (Set Normal Response Mode)
    await this.sendSNRM();

    // Send AARQ (Association Request)
    const aarqApdu = COSEMApdu.buildAARQ(this.config.clientId, this.config.password);
    const response = await this.sendApdu(aarqApdu);

    // Parse AARE (Association Response)
    if (response[0] === DLMS_CONSTANTS.TAG_AARE) {
      this.associated = true;
      logger.info('Association established');
      this.emit('associated');
    } else {
      throw new Error('Association failed');
    }
  }

  /**
   * Release DLMS association
   */
  async releaseAssociation(): Promise<void> {
    if (!this.associated) {
      return;
    }

    const rlrqApdu = COSEMApdu.buildRLRQ();
    await this.sendApdu(rlrqApdu);

    this.associated = false;
    logger.info('Association released');
  }

  /**
   * Read OBIS object
   */
  async readObis(
    obisCode: string | ObisCode,
    classId: number = 3,
    attributeId: number = 2
  ): Promise<DLMSReadResult> {
    try {
      if (!this.associated) {
        await this.associate();
      }

      const obis = typeof obisCode === 'string' ? parseObisCode(obisCode) : obisCode;
      const getRequest = COSEMApdu.buildGetRequest(obis, classId, attributeId);

      const response = await this.sendApdu(getRequest);

      // Parse GET response
      if (response[0] === DLMS_CONSTANTS.TAG_GET_RESPONSE) {
        const result = this.parseGetResponse(response);

        return {
          success: true,
          obisCode: typeof obisCode === 'string' ? obisCode : `${obis.a}-${obis.b}:${obis.c}.${obis.d}.${obis.e}.${obis.f}`,
          classId,
          attributeId,
          value: result.value,
          unit: result.unit,
          scaler: result.scaler,
          timestamp: new Date(),
        };
      } else {
        throw new Error('Invalid GET response');
      }
    } catch (error: any) {
      return {
        success: false,
        obisCode: typeof obisCode === 'string' ? obisCode : '',
        classId,
        attributeId,
        value: null,
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  /**
   * Read multiple OBIS objects
   */
  async readMultiple(
    requests: Array<{ obisCode: string; classId?: number; attributeId?: number }>
  ): Promise<DLMSReadResult[]> {
    const results: DLMSReadResult[] = [];

    for (const request of requests) {
      const result = await this.readObis(
        request.obisCode,
        request.classId || 3,
        request.attributeId || 2
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Write OBIS object
   */
  async writeObis(
    obisCode: string | ObisCode,
    value: any,
    classId: number = 3,
    attributeId: number = 2
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.associated) {
        await this.associate();
      }

      const obis = typeof obisCode === 'string' ? parseObisCode(obisCode) : obisCode;

      // Encode value based on type
      let encodedValue: Buffer;
      if (typeof value === 'number') {
        if (value < 256) {
          encodedValue = DLMSData.encodeUnsigned(value);
        } else if (value < 65536) {
          encodedValue = DLMSData.encodeLongUnsigned(value);
        } else {
          encodedValue = DLMSData.encodeDoubleLongUnsigned(value);
        }
      } else if (typeof value === 'string') {
        encodedValue = DLMSData.encodeVisibleString(value);
      } else if (value instanceof Date) {
        encodedValue = DLMSData.encodeDateTime(value);
      } else if (Buffer.isBuffer(value)) {
        encodedValue = DLMSData.encodeOctetString(value);
      } else {
        throw new Error('Unsupported value type');
      }

      const setRequest = COSEMApdu.buildSetRequest(obis, classId, attributeId, encodedValue);
      const response = await this.sendApdu(setRequest);

      // Parse SET response
      if (response[0] === DLMS_CONSTANTS.TAG_SET_RESPONSE) {
        return { success: true };
      } else {
        throw new Error('Invalid SET response');
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute meter action/method
   */
  async executeAction(
    obisCode: string | ObisCode,
    classId: number,
    methodId: number,
    parameters?: any
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      if (!this.associated) {
        await this.associate();
      }

      const obis = typeof obisCode === 'string' ? parseObisCode(obisCode) : obisCode;

      let encodedParams: Buffer | undefined;
      if (parameters !== undefined) {
        if (typeof parameters === 'number') {
          encodedParams = DLMSData.encodeDoubleLongUnsigned(parameters);
        } else if (Buffer.isBuffer(parameters)) {
          encodedParams = parameters;
        }
      }

      const actionRequest = COSEMApdu.buildActionRequest(obis, classId, methodId, encodedParams);
      const response = await this.sendApdu(actionRequest);

      // Parse ACTION response
      if (response[0] === DLMS_CONSTANTS.TAG_ACTION_RESPONSE) {
        return { success: true };
      } else {
        throw new Error('Invalid ACTION response');
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send SNRM frame
   */
  private async sendSNRM(): Promise<void> {
    const frame = new HDLCFrame();
    frame.addByte(DLMS_CONSTANTS.HDLC_SNRM);

    // Add information field with max info field sizes
    frame.addBytes(Buffer.from([
      0x81, 0x80, 0x14, // Max info field size receive (5120)
      0x05, 0x02, 0x08, 0x00, // Max info field size transmit (2048)
      0x06, 0x02, 0x08, 0x00, // Max window size
      0x07, 0x04, 0x00, 0x00, 0x00, 0x01, // Max window size transmit
    ]));

    const hdlcFrame = frame.build();
    await this.send(hdlcFrame);

    // Wait for UA response
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('SNRM timeout'));
      }, 5000);

      const onData = () => {
        clearTimeout(timeout);
        this.removeListener('frameReceived', onData);
        resolve();
      };

      this.once('frameReceived', onData);
    });
  }

  /**
   * Send APDU and wait for response
   */
  private async sendApdu(apdu: Buffer): Promise<Buffer> {
    const frame = new HDLCFrame();
    frame.addBytes(apdu);
    const hdlcFrame = frame.build();

    return new Promise((resolve, reject) => {
      const requestId = this.invokeId++;

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, this.config.timeout);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      this.send(hdlcFrame).catch(reject);
    });
  }

  /**
   * Send data to socket
   */
  private async send(data: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Not connected'));
      }

      this.socket.write(data, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Handle incoming data
   */
  private handleData(data: Buffer): void {
    this.receiveBuffer = Buffer.concat([this.receiveBuffer, data]);

    // Process complete HDLC frames
    while (this.receiveBuffer.length > 0) {
      // Find start flag
      const startIndex = this.receiveBuffer.indexOf(0x7E);
      if (startIndex === -1) {
        this.receiveBuffer = Buffer.alloc(0);
        break;
      }

      if (startIndex > 0) {
        this.receiveBuffer = this.receiveBuffer.slice(startIndex);
      }

      if (this.receiveBuffer.length < 3) {
        break; // Need more data
      }

      // Get frame length from format field
      const formatField = (this.receiveBuffer[1] << 8) | this.receiveBuffer[2];
      const frameLength = (formatField & 0x7FF) + 2; // +2 for flags

      if (this.receiveBuffer.length < frameLength) {
        break; // Need more data
      }

      // Extract frame
      const frame = this.receiveBuffer.slice(0, frameLength);
      this.receiveBuffer = this.receiveBuffer.slice(frameLength);

      // Process frame
      this.processFrame(frame);
    }
  }

  /**
   * Process HDLC frame
   */
  private processFrame(frame: Buffer): void {
    this.emit('frameReceived', frame);

    // Extract APDU from HDLC frame
    // Simple extraction - in production, validate HCS and FCS
    const control = frame[4];

    if (control === DLMS_CONSTANTS.HDLC_UA) {
      // UA response to SNRM
      return;
    }

    // Extract information field (skip HDLC headers and trailers)
    const apdu = frame.slice(7, frame.length - 3);

    // Resolve pending request
    if (this.pendingRequests.size > 0) {
      const [requestId, request] = this.pendingRequests.entries().next().value;
      clearTimeout(request.timeout);
      this.pendingRequests.delete(requestId);
      request.resolve(apdu);
    }
  }

  /**
   * Parse GET response
   */
  private parseGetResponse(response: Buffer): { value: any; unit?: string; scaler?: number } {
    // GET Response format:
    // [TAG] [Type] [Invoke ID] [Result] [Data]

    let offset = 3; // Skip TAG, Type, Invoke ID

    const result = response[offset++];
    if (result !== 0x00) {
      throw new Error(`GET request failed with result code: ${result}`);
    }

    // Data-Access-Result
    const dataAccessResult = response[offset++];
    if (dataAccessResult !== 0x00) {
      throw new Error(`Data access failed with code: ${dataAccessResult}`);
    }

    // Decode data
    const decoded = DLMSData.decodeData(response, offset);

    // Check if it's a structure (for values with unit and scaler)
    if (response[offset] === DLMS_CONSTANTS.DATA_TYPE_STRUCTURE) {
      const numElements = response[offset + 1];
      offset += 2;

      if (numElements === 2) {
        // Value and scaler_unit
        const valueDecoded = DLMSData.decodeData(response, offset);
        offset += valueDecoded.length;

        const scalerUnitDecoded = DLMSData.decodeData(response, offset);

        // scaler_unit is a structure with 2 elements
        if (Buffer.isBuffer(scalerUnitDecoded.value) && scalerUnitDecoded.value.length >= 2) {
          const scaler = scalerUnitDecoded.value[0];
          const unit = scalerUnitDecoded.value[1];

          return {
            value: valueDecoded.value,
            scaler: scaler > 127 ? scaler - 256 : scaler, // Convert to signed
            unit: this.getUnitString(unit),
          };
        }

        return { value: valueDecoded.value };
      }
    }

    return { value: decoded.value };
  }

  /**
   * Get unit string from unit code
   */
  private getUnitString(unitCode: number): string {
    const units: { [key: number]: string } = {
      1: 'a', // Year
      2: 'mo', // Month
      3: 'wk', // Week
      4: 'd', // Day
      5: 'h', // Hour
      6: 'min', // Minute
      7: 's', // Second
      27: 'W', // Active power
      28: 'VA', // Apparent power
      29: 'var', // Reactive power
      30: 'Wh', // Active energy
      31: 'VAh', // Apparent energy
      32: 'varh', // Reactive energy
      33: 'A', // Current
      35: 'V', // Voltage
      44: 'Hz', // Frequency
      46: 'K', // Temperature (Kelvin)
      47: '°C', // Temperature (Celsius)
      255: '', // No unit
    };

    return units[unitCode] || `unit(${unitCode})`;
  }
}

export default DLMSClient;
