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
export declare const DLMS_CONSTANTS: {
    HDLC_SNRM: number;
    HDLC_DISC: number;
    HDLC_UA: number;
    HDLC_I: number;
    HDLC_RR: number;
    TAG_GET_REQUEST: number;
    TAG_GET_RESPONSE: number;
    TAG_SET_REQUEST: number;
    TAG_SET_RESPONSE: number;
    TAG_ACTION_REQUEST: number;
    TAG_ACTION_RESPONSE: number;
    TAG_AARQ: number;
    TAG_AARE: number;
    TAG_RLRQ: number;
    TAG_RLRE: number;
    GET_REQUEST_NORMAL: number;
    GET_REQUEST_NEXT: number;
    GET_REQUEST_WITH_LIST: number;
    SET_REQUEST_NORMAL: number;
    SET_REQUEST_FIRST_DATABLOCK: number;
    SET_REQUEST_WITH_LIST: number;
    ACTION_REQUEST_NORMAL: number;
    ACTION_REQUEST_NEXT_PBLOCK: number;
    ACTION_REQUEST_WITH_LIST: number;
    DATA_TYPE_NULL: number;
    DATA_TYPE_BOOLEAN: number;
    DATA_TYPE_BIT_STRING: number;
    DATA_TYPE_DOUBLE_LONG: number;
    DATA_TYPE_DOUBLE_LONG_UNSIGNED: number;
    DATA_TYPE_OCTET_STRING: number;
    DATA_TYPE_VISIBLE_STRING: number;
    DATA_TYPE_UTF8_STRING: number;
    DATA_TYPE_BCD: number;
    DATA_TYPE_INTEGER: number;
    DATA_TYPE_LONG: number;
    DATA_TYPE_UNSIGNED: number;
    DATA_TYPE_LONG_UNSIGNED: number;
    DATA_TYPE_LONG64: number;
    DATA_TYPE_LONG64_UNSIGNED: number;
    DATA_TYPE_ENUM: number;
    DATA_TYPE_FLOAT32: number;
    DATA_TYPE_FLOAT64: number;
    DATA_TYPE_DATETIME: number;
    DATA_TYPE_DATE: number;
    DATA_TYPE_TIME: number;
    DATA_TYPE_ARRAY: number;
    DATA_TYPE_STRUCTURE: number;
    DATA_TYPE_COMPACT_ARRAY: number;
};
export interface ObisCode {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
}
export declare function parseObisCode(obisString: string): ObisCode;
export declare function obisToBytes(obis: ObisCode): Buffer;
export declare function obisToString(obis: ObisCode): string;
export declare class HDLCFrame {
    private data;
    constructor();
    addByte(byte: number): void;
    addBytes(bytes: Buffer): void;
    build(): Buffer;
    private calculateCRC;
}
export declare class COSEMApdu {
    static buildAARQ(clientId?: number, password?: string): Buffer;
    static buildGetRequest(obisCode: ObisCode, classId: number, attributeId: number): Buffer;
    static buildSetRequest(obisCode: ObisCode, classId: number, attributeId: number, value: Buffer): Buffer;
    static buildActionRequest(obisCode: ObisCode, classId: number, methodId: number, parameters?: Buffer): Buffer;
    static buildRLRQ(): Buffer;
}
export declare class DLMSData {
    static encodeUnsigned(value: number): Buffer;
    static encodeLongUnsigned(value: number): Buffer;
    static encodeDoubleLongUnsigned(value: number): Buffer;
    static encodeOctetString(data: Buffer | string): Buffer;
    static encodeVisibleString(text: string): Buffer;
    static encodeDateTime(date: Date): Buffer;
    static decodeData(buffer: Buffer, offset?: number): {
        value: any;
        length: number;
    };
}
declare const _default: {
    DLMS_CONSTANTS: {
        HDLC_SNRM: number;
        HDLC_DISC: number;
        HDLC_UA: number;
        HDLC_I: number;
        HDLC_RR: number;
        TAG_GET_REQUEST: number;
        TAG_GET_RESPONSE: number;
        TAG_SET_REQUEST: number;
        TAG_SET_RESPONSE: number;
        TAG_ACTION_REQUEST: number;
        TAG_ACTION_RESPONSE: number;
        TAG_AARQ: number;
        TAG_AARE: number;
        TAG_RLRQ: number;
        TAG_RLRE: number;
        GET_REQUEST_NORMAL: number;
        GET_REQUEST_NEXT: number;
        GET_REQUEST_WITH_LIST: number;
        SET_REQUEST_NORMAL: number;
        SET_REQUEST_FIRST_DATABLOCK: number;
        SET_REQUEST_WITH_LIST: number;
        ACTION_REQUEST_NORMAL: number;
        ACTION_REQUEST_NEXT_PBLOCK: number;
        ACTION_REQUEST_WITH_LIST: number;
        DATA_TYPE_NULL: number;
        DATA_TYPE_BOOLEAN: number;
        DATA_TYPE_BIT_STRING: number;
        DATA_TYPE_DOUBLE_LONG: number;
        DATA_TYPE_DOUBLE_LONG_UNSIGNED: number;
        DATA_TYPE_OCTET_STRING: number;
        DATA_TYPE_VISIBLE_STRING: number;
        DATA_TYPE_UTF8_STRING: number;
        DATA_TYPE_BCD: number;
        DATA_TYPE_INTEGER: number;
        DATA_TYPE_LONG: number;
        DATA_TYPE_UNSIGNED: number;
        DATA_TYPE_LONG_UNSIGNED: number;
        DATA_TYPE_LONG64: number;
        DATA_TYPE_LONG64_UNSIGNED: number;
        DATA_TYPE_ENUM: number;
        DATA_TYPE_FLOAT32: number;
        DATA_TYPE_FLOAT64: number;
        DATA_TYPE_DATETIME: number;
        DATA_TYPE_DATE: number;
        DATA_TYPE_TIME: number;
        DATA_TYPE_ARRAY: number;
        DATA_TYPE_STRUCTURE: number;
        DATA_TYPE_COMPACT_ARRAY: number;
    };
    parseObisCode: typeof parseObisCode;
    obisToBytes: typeof obisToBytes;
    obisToString: typeof obisToString;
    HDLCFrame: typeof HDLCFrame;
    COSEMApdu: typeof COSEMApdu;
    DLMSData: typeof DLMSData;
};
export default _default;
//# sourceMappingURL=dlmsProtocol.d.ts.map