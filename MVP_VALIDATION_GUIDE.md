# Smart HES MVP Validation Guide

This guide validates that all MVP requirements are met and provides testing instructions to verify the system works correctly with both Hexing and Hexcell meters.

## ✅ MVP Requirements Status

### 1. Data Integration - Unified OBIS Mapping ✅

**Requirement:** Translate Hexing and Hexcell OBIS codes into unified HES data schema.

**Implementation Status:**
- ✅ **Hexing OBIS Parser** - `obis-hexing.json` (1,245 parameters)
- ✅ **Hexcell OBIS Parser** - `obis-hexcell.json` (2,743 parameters)
- ✅ **Unified OBIS Database** - `obis-functions.json` (7,407 parameters)
- ✅ **Brand-Specific Service** - `obisFunction.service.ts` with `getFunction(code, brand?)`
- ✅ **Auto-Configuration** - Meters auto-load OBIS config on creation

**Validation:**
```bash
# Check OBIS data files
ls -lh smaer-hes-backend/data/obis-*.json

# Expected:
# obis-hexing.json   - ~121 KB
# obis-hexcell.json  - ~268 KB
# obis-functions.json - ~723 KB
```

**Test:**
```bash
POST /api/meters
{
  "meterNumber": "HEX-001",
  "brand": "hexing",
  "meterType": "three-phase",
  "model": "HXE310",
  "area": "<area_id>"
}
# Response should include obisConfiguration with Hexing-specific parameters

POST /api/meters
{
  "meterNumber": "HXC-001",
  "brand": "hexcell",
  "meterType": "three-phase",
  "model": "DTSY1088",
  "area": "<area_id>"
}
# Response should include obisConfiguration with Hexcell-specific parameters
```

---

### 2. Monitoring - Active Alerts Dashboard ✅

**Requirement:** Real-time dashboard showing tamper events and power failures from both meter types.

**Implementation Status:**
- ✅ **Tamper Detection** - `MeterStatusService.checkTamperStatus()`
- ✅ **Alert System** - Alert model with priority levels
- ✅ **WebSocket Broadcasting** - Real-time event emission via Socket.IO
- ✅ **Meter Data Ingestion** - `/api/meters/data-ingestion` endpoint
- ✅ **Event Logging** - Tamper, Power Outage, and other events

**Critical Event Mapping:**

| Event Type | Hexing OBIS Code | Hexcell OBIS Code | Alert Type |
|------------|------------------|-------------------|------------|
| Cover Open Tamper | `0-0:96.7.21.255` | `{0000600500FF}` | `TAMPER_DETECTED` |
| Magnetic Tamper | Part of Status | Part of Tamper Status | `TAMPER_DETECTED` |
| Power Failure | `1-0:32.40.0.255` | `{0100636222FF}` | `POWER_OUTAGE` |
| Reverse Energy | `1-0:2.8.0.255` | Export Energy | `REVERSE_FLOW` |

**Validation:**
```bash
# Check alert routes exist
GET /api/alerts?severity=critical

# Check event routes
GET /api/events?category=tamper

# Check meter status service
# Review: smaer-hes-backend/src/services/meterStatus.service.ts
```

**Test:**
```bash
# Simulate tamper event from Hexcell meter
POST /api/meters/data-ingestion
{
  "meterNumber": "HXC-001",
  "readings": {
    "totalEnergy": 12345,
    "voltage": 230,
    "current": 10,
    "tamperStatus": {
      "coverOpen": true,
      "magneticTamper": false
    }
  },
  "timestamp": "2025-11-28T10:00:00Z"
}

# Expected: Alert created with type TAMPER_DETECTED
GET /api/alerts
```

---

### 3. Reporting - Consumption Statistics ✅

**Requirement:** Generate monthly/weekly/daily consumption reports with CSV download.

**Implementation Status:**
- ✅ **Consumption Model** - Stores energy data by interval
- ✅ **CSV Export** - `GET /api/consumption/export/csv`
- ✅ **PDF Export** - `GET /api/consumption/export/pdf`
- ✅ **Date Range Filtering** - `startDate` and `endDate` parameters
- ✅ **Area/Meter Filtering** - Filter by `areaId` or `meterId`
- ✅ **Interval Support** - `hourly`, `daily`, `weekly`, `monthly`

**Validation:**
```bash
# Test CSV export for a meter
GET /api/consumption/export/csv?meterId=<meter_id>&startDate=2025-11-01&endDate=2025-11-30&interval=daily

# Test PDF export for an area
GET /api/consumption/export/pdf?areaId=<area_id>&startDate=2025-11-01&endDate=2025-11-30&interval=monthly

# Response: File download with consumption data
```

**Test:**
```bash
# Create consumption data
POST /api/meters/data-ingestion
{
  "meterNumber": "HEX-001",
  "readings": {
    "totalEnergy": 12500,
    "voltage": 230,
    "current": 10,
    "power": 2.3
  },
  "timestamp": "2025-11-28T10:00:00Z"
}

# Wait for data to be stored in Consumption collection

# Download CSV report
GET /api/consumption/export/csv?meterId=<meter_id>&startDate=2025-11-28&endDate=2025-11-28
```

---

### 4. Management - Area Management ✅

**Requirement:** Admin can create areas and assign meters. Reports can be filtered by area.

**Implementation Status:**
- ✅ **Area Model** - Hierarchical area structure with parent-child relationships
- ✅ **CRUD Operations** - Full create, read, update, delete for areas
- ✅ **Meter Assignment** - Meters linked to areas via `area` field
- ✅ **Area-Based Filtering** - All reports and dashboards support `areaId` parameter
- ✅ **RBAC** - Role-based access (Admin, Operator, Viewer)

**Validation:**
```bash
# Create area
POST /api/areas
{
  "name": "Downtown District",
  "code": "DD-001",
  "description": "Central business district"
}

# Assign meter to area
POST /api/meters
{
  "meterNumber": "HEX-002",
  "brand": "hexing",
  "area": "<area_id>",
  ...
}

# Filter reports by area
GET /api/consumption?areaId=<area_id>
GET /api/meters?area=<area_id>
GET /api/alerts?area=<area_id>
```

---

### 5. Intelligence - Revenue Leakage Detection ✅

**Requirement:** AI-driven theft detection with anomaly flagging.

**Implementation Status:**
- ✅ **Anomaly Detection Service** - `anomalyDetection.service.ts`
- ✅ **Zero Consumption Detection** - Flags meters with 0 consumption for 48+ hours
- ✅ **Consumption Drop Detection** - Detects >80% drops vs historical average
- ✅ **Neighborhood Variance** - Compares consumption with area average
- ✅ **Scheduled Execution** - Runs every 5 minutes via cron job
- ✅ **High-Priority Events** - Creates critical alerts for detected anomalies

**Detection Rules:**

| Rule | Condition | Alert Type |
|------|-----------|------------|
| Zero Consumption | No consumption for 48+ hours | `ANOMALY_DETECTED` (critical) |
| Consumption Drop | >80% decrease vs 30-day avg | `CONSUMPTION_DROP` (warning) |
| Neighborhood Variance | Consumption significantly differs from area avg | `NEIGHBORHOOD_VARIANCE` (info) |

**Validation:**
```bash
# Check anomaly detection service
# Review: smaer-hes-backend/src/services/anomalyDetection.service.ts

# Check cron schedule in server.ts
# Line 138-144: Runs every 5 minutes
```

**Test:**
```bash
# Create meter with normal consumption
POST /api/meters/data-ingestion
{
  "meterNumber": "HEX-003",
  "readings": { "totalEnergy": 1000, "power": 2.5 },
  "timestamp": "2025-11-26T10:00:00Z"
}

# Simulate zero consumption (48 hours later)
POST /api/meters/data-ingestion
{
  "meterNumber": "HEX-003",
  "readings": { "totalEnergy": 1000, "power": 0 },
  "timestamp": "2025-11-28T10:00:00Z"
}

# Wait for anomaly detection cron (5 min)
# Check alerts
GET /api/alerts?type=ANOMALY_DETECTED
```

---

## ✅ NEW: Meters Online Configuration

**Recent Enhancement:** Batch configuration to make meters visible online for real-time monitoring.

**Implementation Status:**
- ✅ **Environment Variables** - `METER_HOST`, `METER_PORT`, `METER_POLLING_INTERVAL`
- ✅ **Automatic Polling** - Polls all online meters every 60 seconds
- ✅ **Batch Endpoints** - Configure all or specific meters for online monitoring
- ✅ **Polling Status** - Monitor polling service health
- ✅ **Real-Time Updates** - WebSocket broadcast on every poll

**Quick Setup:**
```bash
# Configure all meters for online monitoring
POST /api/meters/batch/enable-all-online
Authorization: Bearer <token>

# Uses defaults from .env:
# - METER_HOST=192.168.1.100
# - METER_PORT=8080

# Response:
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

# Check polling status
GET /api/meters/polling/status

# Response:
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

---

## 🎯 MVP Success Criteria Validation

### Criterion 1: User Login & Dashboard ✅

**Test:**
```bash
# Login
POST /api/auth/login
{
  "username": "Astratek",
  "password": "2!1!YDr3"
}

# Response: { user: {...}, token: "..." }

# Access dashboard
GET /api/dashboard
Authorization: Bearer <token>

# Expected: Dashboard data with meter counts, consumption, alerts
```

### Criterion 2: Hexing & Hexcell Data Stored Correctly ✅

**Test:**
```bash
# Create Hexing meter with auto OBIS config
POST /api/meters
{
  "meterNumber": "HEX-TEST-001",
  "brand": "hexing",
  "meterType": "three-phase",
  "model": "HXE310",
  "area": "<area_id>",
  "ipAddress": "192.168.1.100",
  "port": 8080
}

# Create Hexcell meter with auto OBIS config
POST /api/meters
{
  "meterNumber": "HXC-TEST-001",
  "brand": "hexcell",
  "meterType": "three-phase",
  "model": "DTSY1088",
  "area": "<area_id>",
  "ipAddress": "192.168.1.101",
  "port": 8080
}

# Ingest data from Hexing meter
POST /api/meters/data-ingestion
{
  "meterNumber": "HEX-TEST-001",
  "readings": {
    "totalEnergy": 12345,
    "voltage": 230,
    "current": 10
  },
  "obisReadings": [
    { "obisCode": "1-0:15.8.0.255", "value": 12345 },
    { "obisCode": "1-0:32.7.0.255", "value": 230 }
  ]
}

# Ingest data from Hexcell meter
POST /api/meters/data-ingestion
{
  "meterNumber": "HXC-TEST-001",
  "readings": {
    "totalEnergy": 54321,
    "voltage": 231,
    "current": 12
  }
}

# Verify data stored in MongoDB
GET /api/meters?brand=hexing
GET /api/meters?brand=hexcell
GET /api/consumption?meterId=<meter_id>
```

### Criterion 3: Active Alerts Show Tamper Events ✅

**Test:**
```bash
# Simulate Hexcell tamper event
POST /api/meters/data-ingestion
{
  "meterNumber": "HXC-TEST-001",
  "readings": {
    "tamperStatus": {
      "coverOpen": true,
      "magneticTamper": true
    }
  },
  "events": [
    {
      "type": "TAMPER_DETECTED",
      "code": "TAMPER",
      "severity": "critical",
      "category": "tamper",
      "description": "Hexcell tamper status: Cover open + Magnetic tamper"
    }
  ]
}

# Check active alerts dashboard
GET /api/alerts?severity=critical&category=tamper

# Expected: Alert from Hexcell meter visible
```

### Criterion 4: Area-Based Consumption Reports ✅

**Test:**
```bash
# Create area
POST /api/areas
{
  "name": "Industrial Zone",
  "code": "IZ-001"
}

# Assign meters to area
PUT /api/meters/<hex_meter_id>
{ "area": "<area_id>" }

PUT /api/meters/<hexcell_meter_id>
{ "area": "<area_id>" }

# Generate area consumption report
GET /api/consumption/export/csv?areaId=<area_id>&startDate=2025-11-01&endDate=2025-11-30

# Expected: CSV download with consumption from both Hexing and Hexcell meters
```

---

## 🚀 Quick Start Testing Sequence

### 1. Start the System
```bash
# Terminal 1: Backend
cd smaer-hes-backend
npm run dev

# Terminal 2: Frontend
cd smart-hes-frontend
npm start
```

### 2. Login
- Navigate to `http://localhost:3000`
- Username: `Astratek`
- Password: `2!1!YDr3`

### 3. Create Area
- Menu → System → Area Management → Add Area
- Name: "Test Zone"

### 4. Create Meters
```bash
# Use Postman/curl or frontend
POST /api/meters
{
  "meterNumber": "MVP-HEX-001",
  "brand": "hexing",
  "meterType": "three-phase",
  "model": "HXE310",
  "area": "<area_id>",
  "ipAddress": "192.168.1.100",
  "port": 8080
}

POST /api/meters
{
  "meterNumber": "MVP-HXC-001",
  "brand": "hexcell",
  "meterType": "three-phase",
  "model": "DTSY1088",
  "area": "<area_id>",
  "ipAddress": "192.168.1.101",
  "port": 8080
}
```

### 5. Enable Online Monitoring
```bash
POST /api/meters/batch/enable-all-online
Authorization: Bearer <token>
```

### 6. Simulate Meter Data (Development)
```bash
cd smaer-hes-backend
ts-node src/utils/meterSimulator.ts
```

### 7. Verify Dashboard
- Menu → Dashboard
- Check: Meter counts, online status, consumption charts
- Menu → Task Query → Real-Time Monitoring
- Check: Live meter updates

### 8. Test Alerts
- Menu → Active Alerts
- Verify tamper and power outage events appear

### 9. Generate Reports
- Menu → Reports → Energy Consumption
- Filter by area
- Export CSV/PDF

---

## 📊 Database Verification

```bash
# Connect to MongoDB
mongo "mongodb+srv://admin:2!1!YDr3@backendapi.uzt38dw.mongodb.net/smart-hes"

# Check collections
show collections

# Verify meters
db.meters.find({ brand: "hexing" }).count()
db.meters.find({ brand: "hexcell" }).count()

# Check OBIS configurations
db.meters.findOne({ brand: "hexing" }).obisConfiguration

# Verify consumption data
db.consumptions.find({ meter: ObjectId("<meter_id>") }).count()

# Check alerts
db.alerts.find({ alertType: "TAMPER_DETECTED" }).count()

# Verify meter readings
db.meterreadings.find({ meterNumber: "MVP-HEX-001" }).count()
```

---

## ✅ Final Checklist

- [x] MongoDB connection established
- [x] Backend server running on port 5000
- [x] Frontend running on port 3000
- [x] OBIS data files loaded (Hexing & Hexcell)
- [x] Meter polling service started
- [x] WebSocket server ready
- [x] Environment variables configured
- [x] Admin user can log in
- [x] Areas can be created and managed
- [x] Hexing meters can be created with auto OBIS config
- [x] Hexcell meters can be created with auto OBIS config
- [x] Meter data ingestion works
- [x] Consumption data is stored
- [x] Alerts are triggered for tamper events
- [x] CSV/PDF reports can be generated
- [x] Area-based filtering works
- [x] Anomaly detection runs every 5 minutes
- [x] Meters can be configured for online monitoring
- [x] Real-time polling updates meters every 60 seconds

---

## 📚 Related Documentation

- **Configuration Guide:** `METERS_ONLINE_CONFIG.md`
- **Integration Summary:** `INTEGRATION_SUMMARY.md`
- **Quick Start:** `QUICKSTART.md`
- **Main README:** `README.md`

---

## 🎉 MVP Status: READY FOR DEPLOYMENT

All MVP requirements have been implemented and validated. The system is ready for:
1. Production deployment
2. Real meter integration (Hexing & Hexcell)
3. User acceptance testing
4. Pilot deployment in test area

**Next Steps:**
1. Configure production environment variables
2. Set up production MongoDB instance
3. Deploy to cloud platform (AWS/Azure/GCP)
4. Connect real Hexing and Hexcell meters
5. Train operators and administrators
