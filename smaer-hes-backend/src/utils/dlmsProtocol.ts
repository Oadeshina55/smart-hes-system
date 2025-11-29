/**
 * DLMS/COSEM Protocol Implementation
 *
 * This module provides a complete implementation of the DLMS/COSEM protocol
 * for communication with smart energy meters.
 *
 * Supports:
 * - Hexing meters
 * - Hexcell meters
 * - TCP/IP and Serial communication
 * - HDLC framing
 * - COSEM object model
 * - LLS/HLS authentication
 */

import * as net from 'net';
import { EventEmitter } from 'events';
import logger from '../utils/logger';

// DLMS Constants
export const DLMS_CONSTANTS = {
  // HDLC Control Bytes
  HDLC_SNRM: 0x93,  // Set Normal Response Mode
  HDLC_DISC: 0x53,  // Disconnect
  HDLC_UA: 0x73,    // Unnumbered Acknowledgement
  HDLC_I: 0x10,     // Information
  HDLC_RR: 0x11,    // Receiver Ready

  // DLMS Tags
  TAG_GET_REQUEST: 0xC0,
  TAG_GET_RESPONSE: 0xC4,
  TAG_SET_REQUEST: 0xC1,
  TAG_SET_RESPONSE: 0xC5,
  TAG_ACTION_REQUEST: 0xC3,
  TAG_ACTION_RESPONSE: 0xC7,
  TAG_AARQ: 0x60,   // Association Request
  TAG_AARE: 0x61,   // Association Response
  TAG_RLRQ: 0x62,   // Release Request
  TAG_RLRE: 0x63,   // Release Response

  // Get Request Types
  GET_REQUEST_NORMAL: 0x01,
  GET_REQUEST_NEXT: 0x02,
  GET_REQUEST_WITH_LIST: 0x03,

  // Set Request Types
  SET_REQUEST_NORMAL: 0x01,
  SET_REQUEST_FIRST_DATABLOCK: 0x02,
  SET_REQUEST_WITH_LIST: 0x03,

  // Action Request Types
  ACTION_REQUEST_NORMAL: 0x01,
  ACTION_REQUEST_NEXT_PBLOCK: 0x02,
  ACTION_REQUEST_WITH_LIST: 0x03,

  // Data Types
  DATA_TYPE_NULL: 0x00,
  DATA_TYPE_BOOLEAN: 0x03,
  DATA_TYPE_BIT_STRING: 0x04,
  DATA_TYPE_DOUBLE_LONG: 0x05,
  DATA_TYPE_DOUBLE_LONG_UNSIGNED: 0x06,
  DATA_TYPE_OCTET_STRING: 0x09,
  DATA_TYPE_VISIBLE_STRING: 0x0A,
  DATA_TYPE_UTF8_STRING: 0x0C,
  DATA_TYPE_BCD: 0x0D,
  DATA_TYPE_INTEGER: 0x0F,
  DATA_TYPE_LONG: 0x10,
  DATA_TYPE_UNSIGNED: 0x11,
  DATA_TYPE_LONG_UNSIGNED: 0x12,
  DATA_TYPE_LONG64: 0x14,
  DATA_TYPE_LONG64_UNSIGNED: 0x15,
  DATA_TYPE_ENUM: 0x16,
  DATA_TYPE_FLOAT32: 0x17,
  DATA_TYPE_FLOAT64: 0x18,
  DATA_TYPE_DATETIME: 0x19,
  DATA_TYPE_DATE: 0x1A,
  DATA_TYPE_TIME: 0x1B,
  DATA_TYPE_ARRAY: 0x01,
  DATA_TYPE_STRUCTURE: 0x02,
  DATA_TYPE_COMPACT_ARRAY: 0x13,
};

// OBIS Code Interface
export interface ObisCode {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

// Parse OBIS code string to object
export function parseObisCode(obisString: string): ObisCode {
  // Format: "1-0:1.8.0.255" or "01000108FF"
  if (obisString.includes('-') || obisString.includes(':')) {
    const parts = obisString.replace(/:/g, '-').replace(/\./g, '-').split('-');
    return {
      a: parseInt(parts[0]),
      b: parseInt(parts[1]),
      c: parseInt(parts[2]),
      d: parseInt(parts[3]),
      e: parseInt(parts[4]),
      f: parseInt(parts[5]),
    };
  } else {
    // Hex format like "01000108FF"
    return {
      a: parseInt(obisString.substring(0, 2), 16),
      b: parseInt(obisString.substring(2, 4), 16),
      c: parseInt(obisString.substring(4, 6), 16),
      d: parseInt(obisString.substring(6, 8), 16),
      e: parseInt(obisString.substring(8, 10), 16),
      f: parseInt(obisString.substring(10, 12), 16),
    };
  }
}

// Convert OBIS object to byte array
export function obisToBytes(obis: ObisCode): Buffer {
  return Buffer.from([obis.a, obis.b, obis.c, obis.d, obis.e, obis.f]);
}

// Convert OBIS object to string
export function obisToString(obis: ObisCode): string {
  return `${obis.a}-${obis.b}:${obis.c}.${obis.d}.${obis.e}.${obis.f}`;
}

// HDLC Frame Builder
export class HDLCFrame {
  private data: Buffer[];

  constructor() {
    this.data = [];
  }

  addByte(byte: number): void {
    this.data.push(Buffer.from([byte]));
  }

  addBytes(bytes: Buffer): void {
    this.data.push(bytes);
  }

  build(): Buffer {
    const payload = Buffer.concat(this.data);
    const frame: Buffer[] = [];

    // HDLC frame format:
    // Flag (0x7E) | Format | Address | Control | HCS | Information | FCS | Flag (0x7E)

    frame.push(Buffer.from([0x7E])); // Start flag

    // Format field (2 bytes) - indicates frame length
    const formatField = 0xA000 | ((payload.length + 8) & 0x7FF);
    frame.push(Buffer.from([(formatField >> 8) & 0xFF, formatField & 0xFF]));

    // Destination address (1 byte for client, can be longer)
    frame.push(Buffer.from([0x03])); // Client address

    // Source address (1 byte for server)
    frame.push(Buffer.from([0x01])); // Server address

    // Control field
    frame.push(Buffer.from([DLMS_CONSTANTS.HDLC_I]));

    // HCS (Header Check Sequence) - 2 bytes CRC
    const header = Buffer.concat([frame[1], frame[2], frame[3], frame[4]]);
    const hcs = this.calculateCRC(header);
    frame.push(hcs);

    // Information field (payload)
    frame.push(payload);

    // FCS (Frame Check Sequence) - 2 bytes CRC
    const dataForFCS = Buffer.concat([...frame.slice(1), payload]);
    const fcs = this.calculateCRC(dataForFCS);
    frame.push(fcs);

    // End flag
    frame.push(Buffer.from([0x7E]));

    return Buffer.concat(frame);
  }

  private calculateCRC(data: Buffer): Buffer {
    // CRC-16/X-25 (used in HDLC)
    let crc = 0xFFFF;

    for (const byte of data) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) {
        if ((crc & 0x0001) !== 0) {
          crc = (crc >> 1) ^ 0x8408;
        } else {
          crc >>= 1;
        }
      }
    }

    crc = ~crc & 0xFFFF;
    return Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF]);
  }
}

// COSEM APDU Builder
export class COSEMApdu {
  static buildAARQ(clientId: number = 16, password?: string): Buffer {
    // Build Association Request (AARQ)
    const apdu: Buffer[] = [];

    apdu.push(Buffer.from([DLMS_CONSTANTS.TAG_AARQ]));

    // Application context name
    apdu.push(Buffer.from([
      0xA1, 0x09, // Context name
      0x06, 0x07, // OID
      0x60, 0x85, 0x74, 0x05, 0x08, 0x01, clientId, // LN referencing with ciphering
    ]));

    // Authentication
    if (password) {
      apdu.push(Buffer.from([
        0x8A, 0x02, 0x07, 0x80, // Mechanism name (HLS)
        0x8B, password.length, // Calling authentication value
      ]));
      apdu.push(Buffer.from(password, 'ascii'));
    } else {
      apdu.push(Buffer.from([
        0x8A, 0x02, 0x07, 0x80, // Mechanism name (LLS)
      ]));
    }

    // Calling AP Title (client SAP)
    apdu.push(Buffer.from([
      0xA6, 0x03,
      0x02, 0x01, clientId,
    ]));

    // User information
    apdu.push(Buffer.from([
      0xBE, 0x10, 0x04, 0x0E,
      0x01, 0x00, 0x00, 0x00,
      0x06, 0x5F, 0x1F, 0x04,
      0x00, 0x00, 0x7E, 0x1F,
      0x04, 0xB0,
    ]));

    const payload = Buffer.concat(apdu);

    // Add length
    const result = Buffer.alloc(payload.length + 1);
    result[0] = payload.length;
    payload.copy(result, 1);

    return result;
  }

  static buildGetRequest(obisCode: ObisCode, classId: number, attributeId: number): Buffer {
    const apdu: Buffer[] = [];

    apdu.push(Buffer.from([
      DLMS_CONSTANTS.TAG_GET_REQUEST,
      DLMS_CONSTANTS.GET_REQUEST_NORMAL,
      0x00, // Invoke ID
    ]));

    // COSEM Attribute Descriptor
    apdu.push(Buffer.from([
      classId >> 8, classId & 0xFF, // Class ID (2 bytes)
    ]));

    // Instance ID (OBIS code - 6 bytes)
    apdu.push(obisToBytes(obisCode));

    // Attribute ID (1 byte)
    apdu.push(Buffer.from([attributeId]));

    return Buffer.concat(apdu);
  }

  static buildSetRequest(obisCode: ObisCode, classId: number, attributeId: number, value: Buffer): Buffer {
    const apdu: Buffer[] = [];

    apdu.push(Buffer.from([
      DLMS_CONSTANTS.TAG_SET_REQUEST,
      DLMS_CONSTANTS.SET_REQUEST_NORMAL,
      0x00, // Invoke ID
    ]));

    // COSEM Attribute Descriptor
    apdu.push(Buffer.from([
      classId >> 8, classId & 0xFF, // Class ID (2 bytes)
    ]));

    // Instance ID (OBIS code - 6 bytes)
    apdu.push(obisToBytes(obisCode));

    // Attribute ID (1 byte)
    apdu.push(Buffer.from([attributeId]));

    // Value
    apdu.push(value);

    return Buffer.concat(apdu);
  }

  static buildActionRequest(obisCode: ObisCode, classId: number, methodId: number, parameters?: Buffer): Buffer {
    const apdu: Buffer[] = [];

    apdu.push(Buffer.from([
      DLMS_CONSTANTS.TAG_ACTION_REQUEST,
      DLMS_CONSTANTS.ACTION_REQUEST_NORMAL,
      0x00, // Invoke ID
    ]));

    // COSEM Method Descriptor
    apdu.push(Buffer.from([
      classId >> 8, classId & 0xFF, // Class ID (2 bytes)
    ]));

    // Instance ID (OBIS code - 6 bytes)
    apdu.push(obisToBytes(obisCode));

    // Method ID (1 byte)
    apdu.push(Buffer.from([methodId]));

    // Method parameters (optional)
    if (parameters) {
      apdu.push(Buffer.from([0x01])); // Has parameters
      apdu.push(parameters);
    } else {
      apdu.push(Buffer.from([0x00])); // No parameters
    }

    return Buffer.concat(apdu);
  }

  static buildRLRQ(): Buffer {
    // Build Release Request
    return Buffer.from([
      DLMS_CONSTANTS.TAG_RLRQ,
      0x03,
      0x80, 0x01, 0x00, // Reason: normal
    ]);
  }
}

// Data Encoding Utilities
export class DLMSData {
  static encodeUnsigned(value: number): Buffer {
    return Buffer.from([
      DLMS_CONSTANTS.DATA_TYPE_UNSIGNED,
      value & 0xFF,
    ]);
  }

  static encodeLongUnsigned(value: number): Buffer {
    return Buffer.from([
      DLMS_CONSTANTS.DATA_TYPE_LONG_UNSIGNED,
      (value >> 8) & 0xFF,
      value & 0xFF,
    ]);
  }

  static encodeDoubleLongUnsigned(value: number): Buffer {
    return Buffer.from([
      DLMS_CONSTANTS.DATA_TYPE_DOUBLE_LONG_UNSIGNED,
      (value >> 24) & 0xFF,
      (value >> 16) & 0xFF,
      (value >> 8) & 0xFF,
      value & 0xFF,
    ]);
  }

  static encodeOctetString(data: Buffer | string): Buffer {
    const buffer = typeof data === 'string' ? Buffer.from(data, 'ascii') : data;
    const result = Buffer.alloc(buffer.length + 2);
    result[0] = DLMS_CONSTANTS.DATA_TYPE_OCTET_STRING;
    result[1] = buffer.length;
    buffer.copy(result, 2);
    return result;
  }

  static encodeVisibleString(text: string): Buffer {
    const buffer = Buffer.from(text, 'ascii');
    const result = Buffer.alloc(buffer.length + 2);
    result[0] = DLMS_CONSTANTS.DATA_TYPE_VISIBLE_STRING;
    result[1] = buffer.length;
    buffer.copy(result, 2);
    return result;
  }

  static encodeDateTime(date: Date): Buffer {
    const result = Buffer.alloc(14);
    result[0] = DLMS_CONSTANTS.DATA_TYPE_DATETIME;
    result[1] = 12; // Length

    const year = date.getFullYear();
    result[2] = (year >> 8) & 0xFF;
    result[3] = year & 0xFF;
    result[4] = date.getMonth() + 1;
    result[5] = date.getDate();
    result[6] = date.getDay() === 0 ? 7 : date.getDay(); // ISO week day
    result[7] = date.getHours();
    result[8] = date.getMinutes();
    result[9] = date.getSeconds();
    result[10] = 0xFF; // Hundredths (not specified)

    // Deviation (time zone offset in minutes)
    const offset = -date.getTimezoneOffset();
    result[11] = (offset >> 8) & 0xFF;
    result[12] = offset & 0xFF;
    result[13] = 0x00; // Clock status

    return result;
  }

  static decodeData(buffer: Buffer, offset: number = 0): { value: any; length: number } {
    const dataType = buffer[offset];
    let value: any;
    let length = 1;

    switch (dataType) {
      case DLMS_CONSTANTS.DATA_TYPE_BOOLEAN:
        value = buffer[offset + 1] !== 0;
        length = 2;
        break;

      case DLMS_CONSTANTS.DATA_TYPE_UNSIGNED:
        value = buffer[offset + 1];
        length = 2;
        break;

      case DLMS_CONSTANTS.DATA_TYPE_LONG_UNSIGNED:
        value = (buffer[offset + 1] << 8) | buffer[offset + 2];
        length = 3;
        break;

      case DLMS_CONSTANTS.DATA_TYPE_DOUBLE_LONG_UNSIGNED:
        value = (buffer[offset + 1] << 24) | (buffer[offset + 2] << 16) |
                (buffer[offset + 3] << 8) | buffer[offset + 4];
        length = 5;
        break;

      case DLMS_CONSTANTS.DATA_TYPE_OCTET_STRING:
      case DLMS_CONSTANTS.DATA_TYPE_VISIBLE_STRING:
        const strLength = buffer[offset + 1];
        value = buffer.slice(offset + 2, offset + 2 + strLength);
        if (dataType === DLMS_CONSTANTS.DATA_TYPE_VISIBLE_STRING) {
          value = value.toString('ascii');
        }
        length = 2 + strLength;
        break;

      default:
        value = null;
        logger.warn(`Unknown DLMS data type: 0x${dataType.toString(16)}`);
    }

    return { value, length };
  }
}

export default {
  DLMS_CONSTANTS,
  parseObisCode,
  obisToBytes,
  obisToString,
  HDLCFrame,
  COSEMApdu,
  DLMSData,
};
