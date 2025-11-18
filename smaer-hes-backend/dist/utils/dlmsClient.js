"use strict";
/**
 * DLMS TCP/IP Client
 *
 * Handles TCP/IP communication with DLMS/COSEM compliant smart meters
 * Supports Hexing and Hexcell meters
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DLMSClient = void 0;
const net = __importStar(require("net"));
const events_1 = require("events");
const logger_1 = __importDefault(require("./logger"));
const dlmsProtocol_1 = require("./dlmsProtocol");
class DLMSClient extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.socket = null;
        this.connected = false;
        this.associated = false;
        this.receiveBuffer = Buffer.alloc(0);
        this.pendingRequests = new Map();
        this.invokeId = 0;
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
    async connect() {
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
                logger_1.default.info(`Connected to meter at ${this.config.host}:${this.config.port}`);
                this.emit('connected');
                resolve();
            });
            this.socket.on('data', (data) => {
                this.handleData(data);
            });
            this.socket.on('error', (error) => {
                logger_1.default.error(`Socket error: ${error.message}`);
                this.emit('error', error);
            });
            this.socket.on('close', () => {
                this.connected = false;
                this.associated = false;
                logger_1.default.info('Connection closed');
                this.emit('disconnected');
            });
            this.socket.connect(this.config.port, this.config.host);
        });
    }
    /**
     * Disconnect from the meter
     */
    async disconnect() {
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
    async associate() {
        if (this.associated) {
            return;
        }
        if (!this.connected) {
            await this.connect();
        }
        // Send SNRM (Set Normal Response Mode)
        await this.sendSNRM();
        // Send AARQ (Association Request)
        const aarqApdu = dlmsProtocol_1.COSEMApdu.buildAARQ(this.config.clientId, this.config.password);
        const response = await this.sendApdu(aarqApdu);
        // Parse AARE (Association Response)
        if (response[0] === dlmsProtocol_1.DLMS_CONSTANTS.TAG_AARE) {
            this.associated = true;
            logger_1.default.info('Association established');
            this.emit('associated');
        }
        else {
            throw new Error('Association failed');
        }
    }
    /**
     * Release DLMS association
     */
    async releaseAssociation() {
        if (!this.associated) {
            return;
        }
        const rlrqApdu = dlmsProtocol_1.COSEMApdu.buildRLRQ();
        await this.sendApdu(rlrqApdu);
        this.associated = false;
        logger_1.default.info('Association released');
    }
    /**
     * Read OBIS object
     */
    async readObis(obisCode, classId = 3, attributeId = 2) {
        try {
            if (!this.associated) {
                await this.associate();
            }
            const obis = typeof obisCode === 'string' ? (0, dlmsProtocol_1.parseObisCode)(obisCode) : obisCode;
            const getRequest = dlmsProtocol_1.COSEMApdu.buildGetRequest(obis, classId, attributeId);
            const response = await this.sendApdu(getRequest);
            // Parse GET response
            if (response[0] === dlmsProtocol_1.DLMS_CONSTANTS.TAG_GET_RESPONSE) {
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
            }
            else {
                throw new Error('Invalid GET response');
            }
        }
        catch (error) {
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
    async readMultiple(requests) {
        const results = [];
        for (const request of requests) {
            const result = await this.readObis(request.obisCode, request.classId || 3, request.attributeId || 2);
            results.push(result);
        }
        return results;
    }
    /**
     * Write OBIS object
     */
    async writeObis(obisCode, value, classId = 3, attributeId = 2) {
        try {
            if (!this.associated) {
                await this.associate();
            }
            const obis = typeof obisCode === 'string' ? (0, dlmsProtocol_1.parseObisCode)(obisCode) : obisCode;
            // Encode value based on type
            let encodedValue;
            if (typeof value === 'number') {
                if (value < 256) {
                    encodedValue = dlmsProtocol_1.DLMSData.encodeUnsigned(value);
                }
                else if (value < 65536) {
                    encodedValue = dlmsProtocol_1.DLMSData.encodeLongUnsigned(value);
                }
                else {
                    encodedValue = dlmsProtocol_1.DLMSData.encodeDoubleLongUnsigned(value);
                }
            }
            else if (typeof value === 'string') {
                encodedValue = dlmsProtocol_1.DLMSData.encodeVisibleString(value);
            }
            else if (value instanceof Date) {
                encodedValue = dlmsProtocol_1.DLMSData.encodeDateTime(value);
            }
            else if (Buffer.isBuffer(value)) {
                encodedValue = dlmsProtocol_1.DLMSData.encodeOctetString(value);
            }
            else {
                throw new Error('Unsupported value type');
            }
            const setRequest = dlmsProtocol_1.COSEMApdu.buildSetRequest(obis, classId, attributeId, encodedValue);
            const response = await this.sendApdu(setRequest);
            // Parse SET response
            if (response[0] === dlmsProtocol_1.DLMS_CONSTANTS.TAG_SET_RESPONSE) {
                return { success: true };
            }
            else {
                throw new Error('Invalid SET response');
            }
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * Execute meter action/method
     */
    async executeAction(obisCode, classId, methodId, parameters) {
        try {
            if (!this.associated) {
                await this.associate();
            }
            const obis = typeof obisCode === 'string' ? (0, dlmsProtocol_1.parseObisCode)(obisCode) : obisCode;
            let encodedParams;
            if (parameters !== undefined) {
                if (typeof parameters === 'number') {
                    encodedParams = dlmsProtocol_1.DLMSData.encodeDoubleLongUnsigned(parameters);
                }
                else if (Buffer.isBuffer(parameters)) {
                    encodedParams = parameters;
                }
            }
            const actionRequest = dlmsProtocol_1.COSEMApdu.buildActionRequest(obis, classId, methodId, encodedParams);
            const response = await this.sendApdu(actionRequest);
            // Parse ACTION response
            if (response[0] === dlmsProtocol_1.DLMS_CONSTANTS.TAG_ACTION_RESPONSE) {
                return { success: true };
            }
            else {
                throw new Error('Invalid ACTION response');
            }
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * Send SNRM frame
     */
    async sendSNRM() {
        const frame = new dlmsProtocol_1.HDLCFrame();
        frame.addByte(dlmsProtocol_1.DLMS_CONSTANTS.HDLC_SNRM);
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
    async sendApdu(apdu) {
        const frame = new dlmsProtocol_1.HDLCFrame();
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
    async send(data) {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                return reject(new Error('Not connected'));
            }
            this.socket.write(data, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    /**
     * Handle incoming data
     */
    handleData(data) {
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
    processFrame(frame) {
        this.emit('frameReceived', frame);
        // Extract APDU from HDLC frame
        // Simple extraction - in production, validate HCS and FCS
        const control = frame[4];
        if (control === dlmsProtocol_1.DLMS_CONSTANTS.HDLC_UA) {
            // UA response to SNRM
            return;
        }
        // Extract information field (skip HDLC headers and trailers)
        const apdu = frame.slice(7, frame.length - 3);
        // Resolve pending request
        if (this.pendingRequests.size > 0) {
            const entry = this.pendingRequests.entries().next();
            if (entry.value) {
                const [requestId, request] = entry.value;
                clearTimeout(request.timeout);
                this.pendingRequests.delete(requestId);
                request.resolve(apdu);
            }
        }
    }
    /**
     * Parse GET response
     */
    parseGetResponse(response) {
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
        const decoded = dlmsProtocol_1.DLMSData.decodeData(response, offset);
        // Check if it's a structure (for values with unit and scaler)
        if (response[offset] === dlmsProtocol_1.DLMS_CONSTANTS.DATA_TYPE_STRUCTURE) {
            const numElements = response[offset + 1];
            offset += 2;
            if (numElements === 2) {
                // Value and scaler_unit
                const valueDecoded = dlmsProtocol_1.DLMSData.decodeData(response, offset);
                offset += valueDecoded.length;
                const scalerUnitDecoded = dlmsProtocol_1.DLMSData.decodeData(response, offset);
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
    getUnitString(unitCode) {
        const units = {
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
exports.DLMSClient = DLMSClient;
exports.default = DLMSClient;
//# sourceMappingURL=dlmsClient.js.map