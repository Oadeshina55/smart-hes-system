# Quick Start: Testing With Your Existing Meters

This guide shows you how to test the MQTT meter communication system with your existing meters in the database.

## Your Current Meters

Based on your database, you have these meters:

| Meter Number | Type | Brand | Model | Status |
|--------------|------|-------|-------|--------|
| 14534557799 | Single-Phase | Hexing | HXE130 | Offline |
| 46000755036 | Single-Phase | Hexcell | DDSY1088 | Offline |

## Step-by-Step Testing

### Step 1: Install MQTT Broker (If Not Already Installed)

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install mosquitto mosquitto-clients
sudo systemctl start mosquitto
sudo systemctl enable mosquitto
```

**macOS:**
```bash
brew install mosquitto
brew services start mosquitto
```

**Verify it's running:**
```bash
# Should show mosquitto process
ps aux | grep mosquitto

# Test MQTT
mosquitto_sub -t 'test' -v
```

### Step 2: Install Required Node Packages

```bash
# Backend packages
cd smaer-hes-backend
npm install mqtt node-cron

# Simulator packages
cd ../meter-simulator
npm install
```

### Step 3: Configure Backend

Edit `smaer-hes-backend/.env`:

```bash
# Add or update these lines
MQTT_ENABLED=true
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=
METER_READ_INTERVAL=30
```

### Step 4: Start the Backend

**Terminal 1 - Backend:**
```bash
cd smaer-hes-backend
npm run dev
```

**Watch for these success messages:**
```
✅ Connected to MongoDB
✅ MQTT meter communication service initialized
⏰ Meter reading scheduler started (every 30 minutes)
```

If you see errors about MQTT packages not found, install them:
```bash
npm install mqtt node-cron
```

### Step 5: Start Simulator for Your Meters

**Terminal 2 - Meter Simulator:**
```bash
cd meter-simulator

# Simulate your existing meters
npm run simulate-your-meters

# OR manually specify meter IDs
node simulator-existing.js 14534557799 46000755036
```

**Watch for these messages:**
```
[14534557799] ✅ Connected to MQTT broker
[14534557799] 📡 Subscribed to commands
[14534557799] ⚡ 📤 Energy: 5234.56 kWh | Power: 2.45 kW | Voltage: 230.5 V

[46000755036] ✅ Connected to MQTT broker
[46000755036] 📡 Subscribed to commands
[46000755036] ⚡ 📤 Energy: 6123.12 kWh | Power: 3.21 kW | Voltage: 228.3 V
```

### Step 6: Monitor MQTT Traffic (Optional)

**Terminal 3 - MQTT Monitor:**
```bash
# Watch all meter traffic
mosquitto_sub -t 'meter/#' -v

# Watch specific meter
mosquitto_sub -t 'meter/14534557799/#' -v
```

You should see messages like:
```
meter/14534557799/data {"1.8.0":5234.56,"power":2.45,...}
meter/14534557799/status {"online":true,"connectionStatus":"connected",...}
```

### Step 7: Check Backend Logs

In your backend terminal, watch for:
```
✅ Processed data from meter 14534557799
✅ Saved reading for meter 14534557799

✅ Processed data from meter 46000755036
✅ Saved reading for meter 46000755036
```

### Step 8: View in Dashboard

1. Open your HES dashboard: http://localhost:3000
2. Login with your credentials
3. Go to **Meters** page
4. Click on meter **14534557799**

You should see:
- ✅ Status changed to "Active"
- ✅ Last Communication: Just now
- ✅ Real-time consumption data
- ✅ Energy readings updating every 30 seconds

### Step 9: Test Manual Commands

**Read a specific meter:**
```bash
# Using curl (replace YOUR_TOKEN with actual JWT token from login)
curl -X POST http://localhost:5000/api/meter-control/read/14534557799 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Or from dashboard:**
1. Go to Meters → 14534557799
2. Click "Read Meter" button
3. Watch simulator terminal for command received
4. Data will update in dashboard

**Connect/Disconnect meter:**
```bash
# Disconnect
curl -X POST http://localhost:5000/api/meter-control/disconnect/14534557799 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Connect
curl -X POST http://localhost:5000/api/meter-control/connect/14534557799 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Watch the simulator terminal - you'll see:
```
[14534557799] 📥 Received command: DISCONNECT
[14534557799] ⚡ Meter relay DISCONNECTED
[14534557799] ⭕ 📤 Energy: 5234.56 kWh | Power: 2.45 kW | Voltage: 230.5 V
```

### Step 10: Check Database

Verify data is being saved:

```bash
# Open MongoDB shell
mongosh

# Use your database
use smart-hes-system

# Check latest consumption records
db.consumptions.find({}).sort({timestamp: -1}).limit(5).pretty()

# Check meter status updated
db.meters.findOne({meterNumber: "14534557799"})
```

You should see:
- ✅ Recent consumption records with timestamps
- ✅ Meter `lastCommunication` field updated
- ✅ Status changed from "offline" to "active"

---

## Troubleshooting

### Issue: Backend can't connect to MQTT

**Error:**
```
❌ Failed to initialize MQTT service: connect ECONNREFUSED
```

**Solution:**
```bash
# Check if Mosquitto is running
sudo systemctl status mosquitto

# If not running, start it
sudo systemctl start mosquitto

# Test MQTT manually
mosquitto_sub -t 'test' -v
```

### Issue: Simulator connects but no data in database

**Check 1: Verify meter exists in database**
```bash
mongosh
use smart-hes-system
db.meters.findOne({meterNumber: "14534557799"})
```

If meter doesn't exist, the backend will log:
```
⚠️  Meter 14534557799 not found in database
```

**Check 2: Look at backend logs carefully**

You should see:
```
✅ Processed data from meter 14534557799
✅ Saved reading for meter 14534557799
```

If you see errors, check:
- MongoDB connection is active
- Meter has a valid `customerNetwork` field
- Consumption model validation is passing

### Issue: "mqtt" module not found

**Error:**
```
Error: Cannot find module 'mqtt'
```

**Solution:**
```bash
cd smaer-hes-backend
npm install mqtt node-cron

# Restart backend
npm run dev
```

### Issue: Simulator shows "Offline" in backend logs

**Check:** Ensure MQTT topics match exactly

Simulator publishes to: `meter/14534557799/data`
Backend subscribes to: `meter/+/data`

These should match automatically.

---

## What Data is Being Generated

The simulator generates realistic data for all 14 OBIS parameters:

### Billing Parameters
- **1.8.0** (Cumulative Energy): Increases realistically based on power consumption
- **3.8.0** (Reactive Energy): 10% of active energy
- **1.6.0** (Max Demand): Peak power recorded

### Power Quality
- **1.7.0** (Power): Random variations between 0.5-10 kW
- **32.7.0** (Voltage): Stays within 220-240V (realistic grid variation)
- **31.7.0** (Current): Calculated from power and voltage
- **13.7.0** (Power Factor): Typical range 0.95-1.0

### Status
- **96.5.5** (Connection Status): Connected/Disconnected
- RSSI (Signal): -80 to -50 dBm
- Tamper alerts: 0.5% chance per minute

---

## Next Steps

### 1. Add More Meters

```bash
# Simulate additional meters
node simulator-existing.js 14534557799 46000755036 12345678901 98765432109

# Each meter ID you add will be simulated
```

### 2. Test Scheduled Reading

The backend reads all meters every 30 minutes automatically. To test:

```bash
# Trigger manual reading of all meters
curl -X POST http://localhost:5000/api/meter-control/trigger-reading \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Watch the backend logs:
```
🔄 Starting scheduled meter reading...
📡 Reading 2 meters...
📤 Command sent to meter 14534557799: READ_ALL
📤 Command sent to meter 46000755036: READ_ALL
✅ Scheduled meter reading completed: 2 successful, 0 failed
```

### 3. Test Network-Wide Reading

If both meters belong to the same customer network:

```bash
curl -X POST http://localhost:5000/api/meter-control/read-network/YOUR_NETWORK_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Monitor System Health

```bash
curl http://localhost:5000/api/meter-control/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "schedulerRunning": true,
    "mqttConnected": true,
    "statistics": {
      "totalMeters": 2,
      "activeMeters": 2,
      "onlineMeters": 2,
      "recentlyActiveMeters": 2,
      "offlineMeters": 0
    }
  }
}
```

---

## Ready for Real Meters?

Once you've tested with the simulator, you can connect real DLMS meters:

1. Configure meter IP addresses or GSM connection
2. Update `meterComm.service.ts` to add DLMS protocol support
3. Install meter communication hardware (GSM gateway, LoRa gateway, etc.)
4. Configure firewall rules for meter communication
5. Test with one meter first, then scale up

See `METER_COMMUNICATION_SETUP.md` for detailed real meter integration guide.

---

## Quick Command Reference

```bash
# Start everything
cd smaer-hes-backend && npm run dev              # Terminal 1
cd meter-simulator && npm run simulate-your-meters  # Terminal 2

# Monitor MQTT
mosquitto_sub -t 'meter/#' -v                     # Terminal 3

# Check database
mongosh
use smart-hes-system
db.consumptions.find().sort({timestamp: -1}).limit(5)

# Test commands
curl -X POST http://localhost:5000/api/meter-control/read/14534557799 \
  -H "Authorization: Bearer YOUR_TOKEN"

# System status
curl http://localhost:5000/api/meter-control/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

Happy testing! Your meters should now be communicating with the HES system. 📊⚡
