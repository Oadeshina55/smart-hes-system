# DLMS Gateway

A gateway service that bridges DLMS/COSEM smart meters to the Smart HES backend via Socket.IO.

## Overview

This gateway acts as a protocol translator between:
- **Physical DLMS meters** (TCP on port 4000)
- **Smart HES Backend** (Socket.IO on port 5000)

## Features

- ✅ Full HDLC frame parsing and building
- ✅ COSEM APDU handling (AARQ, AARE, GET, SET, ACTION, RLRQ)
- ✅ Token loading for prepaid meters
- ✅ Remote relay control (connect/disconnect)
- ✅ Meter reading with any OBIS code
- ✅ Real-time data forwarding to backend via Socket.IO
- ✅ Automatic meter registration and authentication

## Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│  DLMS Meters    │◄──TCP──►│  Gateway     │◄─Socket─►│  Backend        │
│  (Port 4000)    │  DLMS   │  (Bridge)    │   .IO   │  (Port 5000)    │
└─────────────────┘         └──────────────┘         └─────────────────┘
```

## Installation

```bash
cd dlms-gateway
npm install
```

## Configuration

Edit `.env` file:

```bash
DLMS_PORT=4000              # Port for meter connections
GATEWAY_HOST=0.0.0.0        # Listen on all interfaces
BACKEND_URL=http://localhost:5000
BACKEND_API_URL=http://localhost:5000/api
```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## Meter Configuration

Configure your DLMS meters to connect to:
- **IP Address**: Gateway server IP (e.g., 192.168.1.100)
- **Port**: 4000
- **Protocol**: DLMS/TCP

## Supported Commands

### 1. Token Loading
Load prepaid tokens to meters via backend:
```typescript
// Backend emits: 'remote-load'
{
  meterSerialNumber: "12345678",
  token: "12345678901234567890",
  amount: 5000
}
```

### 2. Relay Control
Connect/disconnect meter relay:
```typescript
// Backend emits: 'remote-control'
{
  meterSerialNumber: "12345678",
  action: "disconnect" | "connect"
}
```

### 3. Meter Reading
Read any OBIS parameter:
```typescript
// Backend emits: 'read-meter'
{
  meterSerialNumber: "12345678",
  obisCode: "1-0:1.8.0.255"
}
```

## OBIS Codes Reference

Common OBIS codes used:

| OBIS Code | Description |
|-----------|-------------|
| `0-0:19.1.0.255` | Credit amount (token loading) |
| `0-0:96.3.10.255` | Relay/disconnect control |
| `1-0:1.8.0.255` | Total active energy import |
| `1-0:32.7.0.255` | Instantaneous voltage L1 |
| `1-0:31.7.0.255` | Instantaneous current L1 |
| `1-0:14.7.0.255` | Supply frequency |

## Protocol Flow

### Meter Connection
1. Meter connects to gateway TCP port 4000
2. Meter sends SNRM (Set Normal Response Mode)
3. Gateway responds with UA (Unnumbered Acknowledgement)
4. Meter sends AARQ (Association Request)
5. Gateway responds with AARE (Association Response)
6. Connection established - meter registered in backend

### Command Execution
1. Backend emits command via Socket.IO
2. Gateway receives command
3. Gateway builds DLMS frame (HDLC + COSEM APDU)
4. Gateway sends frame to meter via TCP
5. Meter executes command and responds
6. Gateway parses response
7. Gateway forwards result to backend via Socket.IO

## Troubleshooting

### Meter not connecting
- Verify meter IP configuration points to gateway
- Check port 4000 is not blocked by firewall
- Ensure gateway is running: `npm run dev`

### Backend not receiving data
- Verify BACKEND_URL in .env is correct
- Check backend Socket.IO server is running on port 5000
- Check network connectivity between gateway and backend

### Commands not executing
- Check meter AARQ/AARE handshake completed
- Verify OBIS codes match meter manufacturer specs
- Check gateway logs for DLMS protocol errors

## Development

### File Structure
```
dlms-gateway/
├── src/
│   ├── gateway.ts         # Main gateway logic
│   └── dlmsProtocol.ts    # DLMS protocol utilities
├── package.json
├── tsconfig.json
├── .env
└── README.md
```

### Adding New Commands

1. Add command handler in `gateway.ts`:
```typescript
socket.on('your-command', (data) => {
  // Create DLMS frame
  const frame = createYourCommand(data);
  // Send to meter
  meterSocket.write(frame);
});
```

2. Implement DLMS frame builder:
```typescript
function createYourCommand(params: any): Buffer {
  const obisCode = parseObisCode('your-obis-code');
  const apdu = COSEMApdu.buildGetRequest(obisCode, classId, attributeId);
  const frame = new HDLCFrame();
  frame.addBytes(apdu);
  return frame.build();
}
```

## License

ISC
