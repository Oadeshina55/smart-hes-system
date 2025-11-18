# Guide: Adding Hexcell DDSY1088 Meters to Smart HES

## Meters to Add

1. **46000755036** - Hexcell DDSY1088 (Ikorodu)
2. **46000777832** - Hexcell DDSY1088 (Ikorodu)

## Method 1: Using the Provided Script (Recommended)

### Prerequisites
- MongoDB running and accessible
- Backend dependencies installed (`npm install` in `smaer-hes-backend/`)
- At least one admin user in the database

### Steps

1. **Navigate to backend directory:**
   ```bash
   cd smaer-hes-backend
   ```

2. **Run the TypeScript script:**
   ```bash
   npx ts-node add-ikorodu-meters.ts
   ```

   OR run the JavaScript version:
   ```bash
   node src/scripts/add-meters.js
   ```

3. **Verify the output:**
   ```
   ✅ Connected to MongoDB
   ✅ Ikorodu area found (or created)
   📊 Adding meters...
   ✅ Added: 46000755036
   ✅ Added: 46000777832
   ✅ Total meters in Ikorodu: 2
   ```

## Method 2: Using MongoDB Shell

If you have direct MongoDB access:

```javascript
// Connect to MongoDB
use smart-hes

// Create Ikorodu area (if doesn't exist)
const admin = db.users.findOne({ role: 'admin' })
const area = db.areas.insertOne({
  name: 'Ikorodu',
  code: 'IKD',
  description: 'Ikorodu Area',
  isActive: true,
  createdBy: admin._id,
  coordinates: { latitude: 6.6186, longitude: 3.5105 },
  meterCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
})

// Insert meters
db.meters.insertMany([
  {
    meterNumber: '46000755036',
    brand: 'Hexcell',
    model: 'DDSY1088',
    meterType: 'single-phase',
    firmware: '1.0.0',
    area: area.insertedId,
    status: 'offline',
    relayStatus: 'connected',
    isActive: true,
    currentReading: {
      totalEnergy: 0,
      voltage: 0,
      current: 0,
      power: 0,
      frequency: 0,
      powerFactor: 0,
      timestamp: new Date()
    },
    tamperStatus: {
      coverOpen: false,
      magneticTamper: false,
      reverseFlow: false,
      neutralDisturbance: false
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    meterNumber: '46000777832',
    brand: 'Hexcell',
    model: 'DDSY1088',
    meterType: 'single-phase',
    firmware: '1.0.0',
    area: area.insertedId,
    status: 'offline',
    relayStatus: 'connected',
    isActive: true,
    currentReading: {
      totalEnergy: 0,
      voltage: 0,
      current: 0,
      power: 0,
      frequency: 0,
      powerFactor: 0,
      timestamp: new Date()
    },
    tamperStatus: {
      coverOpen: false,
      magneticTamper: false,
      reverseFlow: false,
      neutralDisturbance: false
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
])

// Update area meter count
db.areas.updateOne(
  { _id: area.insertedId },
  { $set: { meterCount: 2 } }
)
```

## Method 3: Using the API

Start the backend server and use the meters API endpoint:

```bash
# Start backend
cd smaer-hes-backend
npm run dev
```

Then use curl or any API client:

```bash
# Login first to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Astratek","password":"2!1!YDr3"}'

# Add first meter (replace YOUR_TOKEN with actual token)
curl -X POST http://localhost:5000/api/meters \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "meterNumber": "46000755036",
    "brand": "Hexcell",
    "model": "DDSY1088",
    "meterType": "single-phase",
    "firmware": "1.0.0",
    "area": "AREA_ID_HERE"
  }'

# Add second meter
curl -X POST http://localhost:5000/api/meters \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "meterNumber": "46000777832",
    "brand": "Hexcell",
    "model": "DDSY1088",
    "meterType": "single-phase",
    "firmware": "1.0.0",
    "area": "AREA_ID_HERE"
  }'
```

## Verifying the Meters

After adding the meters, verify they appear in the system:

1. **Via API:**
   ```bash
   curl http://localhost:5000/api/meters \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Via Frontend:**
   - Navigate to http://localhost:3000/meters
   - You should see both meters listed in the Ikorodu area

3. **Via MongoDB:**
   ```javascript
   db.meters.find({ meterNumber: { $in: ['46000755036', '46000777832'] } })
   ```

## Communicating with the Meters

The Hexcell DDSY1088 meters support DLMS/COSEM protocol. To read data from them:

### Connection Requirements

1. **Physical Connection:**
   - RS485 (recommended) or optical probe
   - Ensure proper wiring and termination

2. **Communication Parameters:**
   - Baud Rate: 9600 (default for DDSY1088)
   - Data Bits: 8
   - Stop Bits: 1
   - Parity: None (or Even - check meter manual)
   - Protocol: DLMS/COSEM (IEC 62056-21)

3. **Meter Configuration:**
   - Authentication: Low-Level or High-Level Security
   - Client ID: Typically 16 for HES
   - Server ID: Meter serial number or logical address

### Using the DLMS Service

The backend includes a DLMS service for communication. Example usage:

```typescript
import { DLMSService } from './services/dlms.service';

const dlmsService = new DLMSService();

// Connect to meter
await dlmsService.connect({
  meterNumber: '46000755036',
  ipAddress: '192.168.1.100', // If using TCP/IP
  port: 4059,
  // OR for serial:
  serialPort: '/dev/ttyUSB0',
  baudRate: 9600
});

// Read energy register
const energy = await dlmsService.readRegister('1.0.1.8.0.255'); // Total active energy

// Read instantaneous values
const voltage = await dlmsService.readRegister('1.0.32.7.0.255');
const current = await dlmsService.readRegister('1.0.31.7.0.255');
const power = await dlmsService.readRegister('1.0.1.7.0.255');

// Disconnect
await dlmsService.disconnect();
```

### Common OBIS Codes for DDSY1088

| OBIS Code | Description |
|-----------|-------------|
| 1.0.1.8.0.255 | Total Active Energy Import (kWh) |
| 1.0.32.7.0.255 | Instantaneous Voltage (V) |
| 1.0.31.7.0.255 | Instantaneous Current (A) |
| 1.0.1.7.0.255 | Instantaneous Active Power (kW) |
| 1.0.14.7.0.255 | Instantaneous Frequency (Hz) |
| 1.0.13.7.0.255 | Instantaneous Power Factor |

## Troubleshooting

### Meters Not Showing Up

1. Check MongoDB connection
2. Verify area exists: `db.areas.find({ name: 'Ikorodu' })`
3. Check for duplicate meter numbers
4. Ensure meterNumber field is uppercase

### Cannot Communicate with Meters

1. Verify physical connection (RS485/optical)
2. Check communication parameters match meter settings
3. Ensure meter is powered on
4. Verify IP address/port (if using TCP/IP)
5. Check firewall settings
6. Test with DLMS test tools first (e.g., Gurux Director)

### Authentication Errors

1. Use correct password (Low-Level Security: usually "00000000" or blank)
2. Check client ID (typically 16 for public client)
3. Verify meter's authentication settings

## Next Steps

1. **Configure Communication:**
   - Set up RS485 converter or TCP/IP gateway
   - Configure meter IP addresses (if applicable)
   - Update meter records with connection details

2. **Test Communication:**
   - Use DLMS test tools to verify connectivity
   - Read basic registers (voltage, current)
   - Verify data accuracy

3. **Set Up Auto-Polling:**
   - Configure cron jobs for periodic reading
   - Set up event-driven reading triggers
   - Implement load profile collection

4. **Configure Alerts:**
   - Set up tamper detection alerts
   - Configure power quality thresholds
   - Enable billing cycle notifications

## References

- DLMS/COSEM Specification: IEC 62056-21
- OBIS Codes: IEC 62056-61
- Hexcell DDSY1088 Manual: [Contact manufacturer]
- Smart HES DLMS Implementation: `/smaer-hes-backend/src/services/dlms.service.ts`
