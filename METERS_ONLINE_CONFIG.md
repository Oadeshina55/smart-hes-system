# Meters Online Configuration Guide

This guide explains how to configure meters to be visible online in the Smart HES system based on the latest meter polling implementation.

## Overview

The system includes an **automatic meter polling service** that:
- Polls meters every 60 seconds (configurable)
- Reads OBIS parameters from meters via HTTP
- Updates meter status and readings in real-time
- Broadcasts updates via WebSocket for live monitoring

## Prerequisites

1. ✅ Meter polling service is already implemented and running
2. ✅ OBIS parameter management is configured
3. ✅ Real-time WebSocket communication is enabled

## Configuration Steps

### 1. Environment Variables

The `.env` file has been updated with the following configuration:

```env
# Meter Communication Configuration
METER_HOST=192.168.1.100       # Default IP address for meters
METER_PORT=8080                # Default port for meter communication

# Meter Polling Configuration (in milliseconds)
METER_POLLING_INTERVAL=60000   # Poll every 60 seconds
```

**What changed:**
- Fixed: `METER_IP` → `METER_HOST` (to match code expectations)
- Added: `METER_POLLING_INTERVAL` for configurable polling frequency

### 2. How Meter Online Detection Works

A meter is considered "online" and will be polled when:

1. **Status = 'online'**: Meter status field must be set to 'online'
2. **IP Address configured**: Meter must have a valid `ipAddress`
3. **Port configured** (optional): Defaults to 80 if not specified
4. **OBIS Configuration** (optional): Uses default OBIS codes if not configured

The polling service automatically:
- ✅ Polls all meters matching the criteria above
- ✅ Reads configured OBIS parameters
- ✅ Updates meter status and readings
- ✅ Marks meters offline if they fail to respond
- ✅ Broadcasts updates via WebSocket

### 3. Configure Meters for Online Monitoring

#### Option A: Configure All Meters at Once (Recommended)

Use the batch endpoint to enable online monitoring for all active meters:

**API Call:**
```bash
POST /api/meters/batch/enable-all-online
Authorization: Bearer <token>
Content-Type: application/json

# Optional body (uses .env defaults if not provided):
{
  "ipAddress": "192.168.1.100",  # Optional
  "port": 8080                    # Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configured 10 meters for online monitoring",
  "data": {
    "matchedCount": 10,
    "modifiedCount": 10,
    "configuration": {
      "status": "online",
      "ipAddress": "192.168.1.100",
      "port": 8080
    }
  }
}
```

This will:
- Set all active meters to status='online'
- Configure IP address (from body or METER_HOST env var)
- Configure port (from body or METER_PORT env var)

#### Option B: Configure Specific Meters

To configure only certain meters:

**API Call:**
```bash
POST /api/meters/batch/configure-online
Authorization: Bearer <token>
Content-Type: application/json

{
  "meterIds": ["meter_id_1", "meter_id_2"],
  "ipAddress": "192.168.1.100",
  "port": 8080,
  "status": "online"
}
```

#### Option C: Create Meters with Online Configuration

When creating new meters, they automatically get configured:

```bash
POST /api/meters
Authorization: Bearer <token>
Content-Type: application/json

{
  "meterNumber": "MTR-001",
  "meterType": "three-phase",
  "brand": "hexing",
  "model": "HEM-3X30",
  "area": "area_id_here",
  "ipAddress": "192.168.1.100",  # Optional - uses METER_HOST if not provided
  "port": 8080                    # Optional - uses METER_PORT if not provided
}
```

### 4. Check Polling Status

Monitor the polling service status:

**API Call:**
```bash
GET /api/meters/polling/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isPolling": true,
    "pollingIntervalMs": 60000,
    "activePolls": 2,
    "maxConcurrentPolls": 10,
    "onlineMeterCount": 10
  }
}
```

### 5. Manual Meter Polling (On-Demand)

Trigger an immediate poll of a specific meter:

**API Call:**
```bash
POST /api/meters/:id/read-obis
Authorization: Bearer <token>
Content-Type: application/json

{
  "obisCodes": [
    "1-0:15.8.0.255",  # Total Active Energy
    "1-0:32.7.0.255",  # Voltage L1
    "1-0:31.7.0.255"   # Current L1
  ]
}
```

## Meter Communication Protocol

The polling service expects meters to expose an HTTP endpoint:

**Endpoint:** `http://{meter-ip}:{meter-port}/api/read`

**Request:**
```json
POST /api/read
Content-Type: application/json

{
  "obisCodes": [
    "1-0:15.8.0.255",
    "1-0:32.7.0.255",
    ...
  ]
}
```

**Response Format 1 (Array):**
```json
{
  "readings": [
    {
      "obisCode": "1-0:15.8.0.255",
      "value": 12345,
      "unit": "kWh",
      "scaler": -2,
      "quality": "good"
    }
  ]
}
```

**Response Format 2 (Object):**
```json
{
  "1-0:15.8.0.255": 12345,
  "1-0:32.7.0.255": 230,
  ...
}
```

## Default OBIS Codes

If no OBIS configuration is set, the system polls these standard parameters:

### Energy Readings
- `1-0:15.8.0.255` - Total Active Energy
- `1-0:1.8.0.255` - Active Energy Import
- `1-0:2.8.0.255` - Active Energy Export

### Voltage (3-phase)
- `1-0:32.7.0.255` - Voltage L1
- `1-0:52.7.0.255` - Voltage L2
- `1-0:72.7.0.255` - Voltage L3

### Current (3-phase)
- `1-0:31.7.0.255` - Current L1
- `1-0:51.7.0.255` - Current L2
- `1-0:71.7.0.255` - Current L3

### Power
- `1-0:1.7.0.255` - Total Active Power
- `1-0:21.7.0.255` - Active Power L1
- `1-0:41.7.0.255` - Active Power L2
- `1-0:61.7.0.255` - Active Power L3

### Other
- `1-0:14.7.0.255` - Frequency
- `1-0:13.7.0.255` - Power Factor
- `0-0:1.0.0.255` - Clock
- `0-0:96.1.0.255` - Meter Serial Number

## Testing with Meter Simulator

For development/testing, you can use the built-in meter simulator:

```bash
cd smaer-hes-backend
ts-node src/utils/meterSimulator.ts
```

This simulates 10 meters sending data every 30 seconds.

## Real-Time Updates

The system broadcasts meter updates via WebSocket on these events:

1. **Successful Poll**: `meter-reading-update`
2. **Status Change**: `meter-status-change`

Connect to WebSocket at: `ws://localhost:5000`

**Example Socket.IO Client:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

// Join meter room for specific meter updates
socket.emit('join-room', { room: 'meter-{meter-id}' });

// Listen for updates
socket.on('meter-reading-update', (data) => {
  console.log('Meter reading updated:', data);
});
```

## Troubleshooting

### Meters Not Appearing Online

1. **Check meter status:**
   ```bash
   GET /api/meters?status=online
   ```

2. **Verify IP/Port configuration:**
   - Ensure meters have `ipAddress` and `port` set
   - Check `.env` for default values

3. **Check polling status:**
   ```bash
   GET /api/meters/polling/status
   ```

4. **View server logs:**
   - Look for polling errors
   - Check for connection timeouts

### Polling Errors

If a meter fails to respond:
- The system marks it as offline after timeout (10 seconds)
- Failed reading is recorded with `communicationStatus: 'failed'`
- Error details are logged

### Adjust Polling Frequency

Edit `.env`:
```env
# Poll every 2 minutes instead of 1
METER_POLLING_INTERVAL=120000
```

Then restart the server.

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meters/polling/status` | Get polling service status |
| POST | `/api/meters/batch/enable-all-online` | Configure all meters online |
| POST | `/api/meters/batch/configure-online` | Configure specific meters |
| POST | `/api/meters/:id/read-obis` | Manual on-demand meter poll |
| GET | `/api/meters/:id/obis-readings` | Get latest OBIS readings |
| GET | `/api/meters/:id/obis-readings/history` | Get OBIS reading history |
| POST | `/api/meters/:id/write-obis` | Write OBIS parameter to meter |

## Next Steps

1. ✅ Environment configured
2. ✅ Endpoints created for meter configuration
3. ⏳ Configure your meters using batch endpoint
4. ⏳ Verify meters are polling successfully
5. ⏳ Monitor real-time updates in frontend

---

**Note:** The polling service starts automatically when the server boots. No manual intervention needed beyond configuring meters with IP addresses and setting status to 'online'.
