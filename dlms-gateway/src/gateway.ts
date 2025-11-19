import net from 'net';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import * as dotenv from 'dotenv';
import {
  HDLCFrame,
  COSEMApdu,
  DLMSData,
  parseObisCode,
  obisToBytes,
  obisToString,
  DLMS_CONSTANTS,
} from './dlmsProtocol';

dotenv.config();

// Configuration
const DLMS_PORT = parseInt(process.env.DLMS_PORT || '4000');
const GATEWAY_HOST = process.env.GATEWAY_HOST || '0.0.0.0';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:5000/api';

// Store connected meters
interface MeterConnection {
  socket: net.Socket;
  meterNumber?: string;
  meterId?: string;
  lastActivity: Date;
  authenticated: boolean;
  clientId?: number;
}

const connectedMeters = new Map<string, MeterConnection>();

// Socket.IO client connection to backend
let backendSocket: Socket;

function connectToBackend() {
  console.log(`🔄 Connecting to backend at ${BACKEND_URL}...`);

  backendSocket = io(BACKEND_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  backendSocket.on('connect', () => {
    console.log('✅ Connected to backend Socket.IO');
  });

  backendSocket.on('disconnect', () => {
    console.log('⚠️  Disconnected from backend Socket.IO');
  });

  backendSocket.on('connect_error', (error) => {
    console.error('❌ Backend connection error:', error.message);
  });

  // Listen for commands from backend
  backendSocket.on('remote-load', (data) => {
    console.log('📥 Received remote-load command:', data);
    handleRemoteLoad(data);
  });

  backendSocket.on('remote-control', (data) => {
    console.log('📥 Received remote-control command:', data);
    handleRemoteControl(data);
  });

  backendSocket.on('read-meter', (data) => {
    console.log('📥 Received read-meter command:', data);
    handleReadMeter(data);
  });
}

// Create TCP server for DLMS meters
const dlmsServer = net.createServer((socket) => {
  const clientInfo = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log('🔌 Meter connected:', clientInfo);

  const connectionId = `${socket.remoteAddress}-${socket.remotePort}`;

  connectedMeters.set(connectionId, {
    socket,
    lastActivity: new Date(),
    authenticated: false,
  });

  // Buffer for incomplete frames
  let dataBuffer = Buffer.alloc(0);

  // Handle incoming DLMS data
  socket.on('data', async (data) => {
    console.log('📊 Received data from meter:', clientInfo);
    console.log('📦 Data (hex):', data.toString('hex'));
    console.log('📦 Data length:', data.length, 'bytes');

    const meterConnection = connectedMeters.get(connectionId);
    if (meterConnection) {
      meterConnection.lastActivity = new Date();
    }

    // Append to buffer
    dataBuffer = Buffer.concat([dataBuffer, data]);

    try {
      // Parse DLMS frames from buffer
      const result = parseDLMSFrame(dataBuffer);

      if (result.frame) {
        console.log('✅ Parsed DLMS frame:', result.frameType);

        // Process the frame
        const response = await processDLMSFrame(result.frame, result.frameType, meterConnection);

        // Send response to meter
        if (response) {
          socket.write(response);
          console.log('✅ Sent response to meter (', response.length, 'bytes)');
        }

        // Remove processed frame from buffer
        dataBuffer = dataBuffer.slice(result.bytesConsumed);
      }

    } catch (error: any) {
      console.error('❌ Error processing DLMS data:', error.message);
      dataBuffer = Buffer.alloc(0); // Clear buffer on error
    }
  });

  socket.on('error', (err) => {
    console.error('❌ Meter socket error:', clientInfo, err.message);
    connectedMeters.delete(connectionId);
  });

  socket.on('close', () => {
    console.log('🔌 Meter disconnected:', clientInfo);
    connectedMeters.delete(connectionId);
  });

  socket.on('timeout', () => {
    console.log('⏱️  Meter connection timeout:', clientInfo);
    socket.end();
    connectedMeters.delete(connectionId);
  });

  // Set timeout (5 minutes of inactivity)
  socket.setTimeout(300000);
});

// Parse DLMS frame from buffer
function parseDLMSFrame(buffer: Buffer): { frame: Buffer | null; frameType: string | null; bytesConsumed: number } {
  // Look for HDLC frame (starts with 0x7E)
  const startIndex = buffer.indexOf(0x7E);

  if (startIndex === -1) {
    return { frame: null, frameType: null, bytesConsumed: 0 };
  }

  if (startIndex > 0) {
    // Skip garbage data before frame
    return { frame: null, frameType: null, bytesConsumed: startIndex };
  }

  // Check if we have enough data for format field
  if (buffer.length < 3) {
    return { frame: null, frameType: null, bytesConsumed: 0 };
  }

  // Get frame length from format field
  const formatField = (buffer[1] << 8) | buffer[2];
  const frameLength = (formatField & 0x7FF);

  // Check if we have the complete frame
  if (buffer.length < frameLength) {
    return { frame: null, frameType: null, bytesConsumed: 0 };
  }

  // Extract frame
  const frame = buffer.slice(0, frameLength);

  // Check end flag
  if (frame[frameLength - 1] !== 0x7E) {
    console.log('⚠️  Invalid frame: missing end flag');
    return { frame: null, frameType: null, bytesConsumed: frameLength };
  }

  // Determine frame type from control field
  const controlField = frame[4]; // Position of control field in HDLC frame
  let frameType = 'UNKNOWN';

  if (controlField === DLMS_CONSTANTS.HDLC_SNRM) {
    frameType = 'SNRM'; // Connection request
  } else if (controlField === DLMS_CONSTANTS.HDLC_DISC) {
    frameType = 'DISC'; // Disconnection request
  } else if ((controlField & 0xEF) === DLMS_CONSTANTS.HDLC_I) {
    frameType = 'I'; // Information frame
  } else if (controlField === DLMS_CONSTANTS.HDLC_RR) {
    frameType = 'RR'; // Receiver Ready
  }

  console.log(`🔍 Frame type: ${frameType}, Length: ${frameLength} bytes`);

  return { frame, frameType, bytesConsumed: frameLength };
}

// Process DLMS frame and generate response
async function processDLMSFrame(
  frame: Buffer,
  frameType: string,
  meterConnection?: MeterConnection
): Promise<Buffer | null> {

  switch (frameType) {
    case 'SNRM':
      // Connection request - respond with UA (Unnumbered Acknowledgement)
      console.log('📨 Processing SNRM (connection request)');
      return createUAResponse();

    case 'I':
      // Information frame - contains APDU
      console.log('📨 Processing Information frame');
      return await processInformationFrame(frame, meterConnection);

    case 'DISC':
      // Disconnection request - respond with UA
      console.log('📨 Processing DISC (disconnection request)');
      if (meterConnection) {
        meterConnection.authenticated = false;
      }
      return createUAResponse();

    case 'RR':
      // Receiver Ready - no response needed
      console.log('📨 Received RR (receiver ready)');
      return null;

    default:
      console.log(`⚠️  Unknown frame type: ${frameType}`);
      return null;
  }
}

// Create UA (Unnumbered Acknowledgement) response
function createUAResponse(): Buffer {
  const frame = new HDLCFrame();
  frame.addByte(DLMS_CONSTANTS.HDLC_UA);
  return frame.build();
}

// Process Information frame (contains APDU)
async function processInformationFrame(frame: Buffer, meterConnection?: MeterConnection): Promise<Buffer | null> {
  // Extract information field (between HCS and FCS)
  // HDLC frame structure: Flag | Format | Dst | Src | Ctrl | HCS | Info | FCS | Flag
  const infoStart = 8; // After Flag(1) + Format(2) + Dst(1) + Src(1) + Ctrl(1) + HCS(2)
  const infoEnd = frame.length - 3; // Before FCS(2) + Flag(1)

  if (infoStart >= infoEnd) {
    console.log('⚠️  No information field in frame');
    return null;
  }

  const apdu = frame.slice(infoStart, infoEnd);
  console.log('📦 APDU (hex):', apdu.toString('hex'));

  const apduTag = apdu[0];

  switch (apduTag) {
    case DLMS_CONSTANTS.TAG_AARQ:
      // Association Request
      console.log('📨 Processing AARQ (association request)');
      if (meterConnection) {
        meterConnection.authenticated = true;

        // Try to extract meter number from AARQ (if present in calling AP title)
        const meterNumber = extractMeterNumberFromAARQ(apdu);
        if (meterNumber && meterConnection) {
          meterConnection.meterNumber = meterNumber;
          console.log(`📋 Meter identified: ${meterNumber}`);

          // Get meter ID from backend
          const meter = await getMeterByNumber(meterNumber);
          if (meter) {
            meterConnection.meterId = meter._id;
          }
        }
      }
      return createAAREResponse();

    case DLMS_CONSTANTS.TAG_GET_REQUEST:
      // Get Request - meter reading our server
      console.log('📨 Processing GET request from meter');
      return await processGetRequest(apdu, meterConnection);

    case DLMS_CONSTANTS.TAG_GET_RESPONSE:
      // Get Response - meter responding to our read
      console.log('📨 Processing GET response from meter');
      await processGetResponse(apdu, meterConnection);
      return null; // No response needed

    case DLMS_CONSTANTS.TAG_SET_RESPONSE:
      // Set Response - meter confirming our write
      console.log('📨 Processing SET response from meter');
      await processSetResponse(apdu, meterConnection);
      return null;

    case DLMS_CONSTANTS.TAG_ACTION_RESPONSE:
      // Action Response - meter confirming our action
      console.log('📨 Processing ACTION response from meter');
      await processActionResponse(apdu, meterConnection);
      return null;

    case DLMS_CONSTANTS.TAG_RLRQ:
      // Release Request
      console.log('📨 Processing RLRQ (release request)');
      if (meterConnection) {
        meterConnection.authenticated = false;
      }
      return createRLREResponse();

    default:
      console.log(`⚠️  Unknown APDU tag: 0x${apduTag.toString(16)}`);
      return null;
  }
}

// Extract meter number from AARQ
function extractMeterNumberFromAARQ(apdu: Buffer): string | undefined {
  // This is simplified - actual parsing depends on meter manufacturer
  // Some meters include serial number in calling AP title
  // For now, return undefined and rely on IP mapping
  return undefined;
}

// Create AARE (Association Response) response
function createAAREResponse(): Buffer {
  const aare = Buffer.from([
    DLMS_CONSTANTS.TAG_AARE,
    0x29, // Length
    // Application context name
    0xA1, 0x09,
    0x06, 0x07,
    0x60, 0x85, 0x74, 0x05, 0x08, 0x01, 0x01,
    // Result
    0xA2, 0x03,
    0x02, 0x01, 0x00, // Accepted
    // Result source diagnostic
    0xA3, 0x05,
    0xA1, 0x03,
    0x02, 0x01, 0x00, // Null
    // Responding AP title
    0xA4, 0x0A,
    0x04, 0x08,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
    // User information
    0xBE, 0x10,
    0x04, 0x0E,
    0x08, 0x00, 0x06, 0x5F, 0x1F, 0x04, 0x00, 0x00, 0x18, 0x1D, 0x04, 0x00, 0x00, 0x07,
  ]);

  const frame = new HDLCFrame();
  frame.addBytes(aare);
  return frame.build();
}

// Create RLRE (Release Response)
function createRLREResponse(): Buffer {
  const rlre = COSEMApdu.buildRLRQ(); // Reuse the RLRQ structure
  const frame = new HDLCFrame();
  frame.addBytes(rlre);
  return frame.build();
}

// Process GET request from meter
async function processGetRequest(apdu: Buffer, meterConnection?: MeterConnection): Promise<Buffer> {
  // Simplified - return error response
  // In reality, you'd parse the request and provide the requested data
  const response = Buffer.from([
    DLMS_CONSTANTS.TAG_GET_RESPONSE,
    DLMS_CONSTANTS.GET_REQUEST_NORMAL,
    0x00, // Invoke ID
    0x01, // Data access result: object-unavailable
  ]);

  const frame = new HDLCFrame();
  frame.addBytes(response);
  return frame.build();
}

// Process GET response from meter
async function processGetResponse(apdu: Buffer, meterConnection?: MeterConnection): Promise<void> {
  try {
    // Parse GET response
    // Structure: TAG | RequestType | InvokeID | Result | Data
    const invokeId = apdu[2];
    const result = apdu[3];

    if (result === 0x00) {
      // Success - data follows
      const data = apdu.slice(4);
      console.log('✅ GET response successful, data:', data.toString('hex'));

      // Forward to backend
      if (meterConnection?.meterId) {
        await forwardMeterData({
          meterId: meterConnection.meterId,
          meterNumber: meterConnection.meterNumber,
          type: 'reading',
          data: data.toString('hex'),
          timestamp: new Date(),
        });
      }
    } else {
      console.log(`❌ GET response error: ${result}`);
    }
  } catch (error: any) {
    console.error('Error processing GET response:', error.message);
  }
}

// Process SET response from meter
async function processSetResponse(apdu: Buffer, meterConnection?: MeterConnection): Promise<void> {
  try {
    const result = apdu[3];

    if (result === 0x00) {
      console.log('✅ SET request successful');
    } else {
      console.log(`❌ SET request failed: ${result}`);
    }

    // Notify backend
    if (meterConnection?.meterId) {
      backendSocket.emit('meter-command-result', {
        meterId: meterConnection.meterId,
        command: 'SET',
        success: result === 0x00,
      });
    }
  } catch (error: any) {
    console.error('Error processing SET response:', error.message);
  }
}

// Process ACTION response from meter
async function processActionResponse(apdu: Buffer, meterConnection?: MeterConnection): Promise<void> {
  try {
    const result = apdu[3];

    if (result === 0x00) {
      console.log('✅ ACTION request successful');
    } else {
      console.log(`❌ ACTION request failed: ${result}`);
    }

    // Notify backend
    if (meterConnection?.meterId) {
      backendSocket.emit('meter-command-result', {
        meterId: meterConnection.meterId,
        command: 'ACTION',
        success: result === 0x00,
      });
    }
  } catch (error: any) {
    console.error('Error processing ACTION response:', error.message);
  }
}

// Forward meter data to backend
async function forwardMeterData(data: any): Promise<void> {
  try {
    if (data.meterId) {
      backendSocket.emit('meter-update', data);
      console.log('✅ Forwarded data to backend via Socket.IO');
    }
  } catch (error: any) {
    console.error('❌ Error forwarding to backend:', error.message);
  }
}

// Get meter by number from backend
async function getMeterByNumber(meterNumber: string): Promise<any> {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/meters`, {
      params: { meterNumber },
    });
    return response.data.data?.[0];
  } catch (error: any) {
    console.error('Error fetching meter:', error.message);
    return null;
  }
}

// Handle remote load command from backend
function handleRemoteLoad(data: any) {
  const { meterId, token, amount } = data;

  // Find meter connection
  const meterConnection = Array.from(connectedMeters.values()).find(
    (conn) => conn.meterId === meterId
  );

  if (meterConnection && meterConnection.authenticated) {
    // Create DLMS command to load token
    const dlmsCommand = createLoadTokenCommand(token, amount);
    meterConnection.socket.write(dlmsCommand);
    console.log('✅ Sent load token command to meter');
  } else {
    console.error('❌ Meter not connected or not authenticated:', meterId);
  }
}

// Handle remote control command from backend
function handleRemoteControl(data: any) {
  const { meterId, action } = data;

  // Find meter connection
  const meterConnection = Array.from(connectedMeters.values()).find(
    (conn) => conn.meterId === meterId
  );

  if (meterConnection && meterConnection.authenticated) {
    // Create DLMS command for relay control
    const dlmsCommand = createRelayControlCommand(action);
    meterConnection.socket.write(dlmsCommand);
    console.log(`✅ Sent ${action} command to meter`);
  } else {
    console.error('❌ Meter not connected or not authenticated:', meterId);
  }
}

// Handle read meter command from backend
function handleReadMeter(data: any) {
  const { meterId, obisCode } = data;

  // Find meter connection
  const meterConnection = Array.from(connectedMeters.values()).find(
    (conn) => conn.meterId === meterId
  );

  if (meterConnection && meterConnection.authenticated) {
    // Create DLMS read command
    const dlmsCommand = createReadCommand(obisCode);
    meterConnection.socket.write(dlmsCommand);
    console.log(`✅ Sent read command for ${obisCode} to meter`);
  } else {
    console.error('❌ Meter not connected or not authenticated:', meterId);
  }
}

// Create DLMS command to load token
function createLoadTokenCommand(token: string, amount?: number): Buffer {
  // OBIS code for credit/token loading (prepayment)
  // Standard OBIS: 0-0:19.1.0.255 (Credit amount)
  // Some meters use: 0-0:19.2.0.255 (Credit register)

  const obisCode = parseObisCode('0-0:19.1.0.255');
  const classId = 3; // Register class
  const attributeId = 2; // Value

  // Encode token as visible string or the amount as double long unsigned
  let value: Buffer;
  if (token) {
    // Token is typically a 20-digit number encoded as string
    value = DLMSData.encodeVisibleString(token);
  } else if (amount) {
    // Or amount in currency units
    value = DLMSData.encodeDoubleLongUnsigned(amount * 100); // Convert to cents
  } else {
    throw new Error('Either token or amount must be provided');
  }

  const apdu = COSEMApdu.buildSetRequest(obisCode, classId, attributeId, value);

  const frame = new HDLCFrame();
  frame.addBytes(apdu);

  return frame.build();
}

// Create DLMS command for relay control
function createRelayControlCommand(action: string): Buffer {
  // OBIS code for relay control: 0-0:96.3.10.255
  // Class ID: 70 (Disconnect control)
  // Method 1: remote_reconnect (connect)
  // Method 2: remote_disconnect (disconnect)

  const obisCode = parseObisCode('0-0:96.3.10.255');
  const classId = 70;
  const methodId = action === 'disconnect' ? 2 : 1;

  // No parameters needed for relay control
  const apdu = COSEMApdu.buildActionRequest(obisCode, classId, methodId);

  const frame = new HDLCFrame();
  frame.addBytes(apdu);

  return frame.build();
}

// Create DLMS read command
function createReadCommand(obisCodeString: string): Buffer {
  const obisCode = parseObisCode(obisCodeString);

  // Most readings are from Register (class 3) or Data (class 1)
  // Attribute 2 is the value
  const classId = 3;
  const attributeId = 2;

  const apdu = COSEMApdu.buildGetRequest(obisCode, classId, attributeId);

  const frame = new HDLCFrame();
  frame.addBytes(apdu);

  return frame.build();
}

// Start DLMS server
dlmsServer.listen(DLMS_PORT, GATEWAY_HOST, () => {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║         DLMS Gateway for Smart HES                    ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log(`✅ DLMS Gateway listening on ${GATEWAY_HOST}:${DLMS_PORT}`);
  console.log(`📡 Backend URL: ${BACKEND_URL}`);
  console.log(`🔌 Waiting for meters to connect...`);
  console.log('');
  console.log('Supported commands:');
  console.log('  - Read meter (OBIS codes)');
  console.log('  - Relay control (connect/disconnect)');
  console.log('  - Token loading (prepayment)');
  console.log('');
});

dlmsServer.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${DLMS_PORT} is already in use`);
  } else {
    console.error('❌ DLMS server error:', err);
  }
  process.exit(1);
});

// Connect to backend on startup
connectToBackend();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gateway...');

  // Close all meter connections
  connectedMeters.forEach((conn) => {
    conn.socket.end();
  });

  // Close DLMS server
  dlmsServer.close(() => {
    console.log('✅ DLMS server closed');
  });

  // Disconnect from backend
  if (backendSocket) {
    backendSocket.disconnect();
  }

  process.exit(0);
});
