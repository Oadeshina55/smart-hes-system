# Quick Start Guide - Hexing & Hexcell Meter Integration

## What's New

This update adds full support for **Hexing and Hexcell smart meters** with:
- ✨ **Brand-specific OBIS parameter loading** - Auto-load meter parameters when creating meters
- 🔧 **IP/PORT configuration** - Set meter communication endpoints during creation
- 📊 **Complete energy consumption reports** - Filter by area/meter, export CSV/PDF
- 📈 **Real-time OBIS parameter viewing** - Grouped by category with live values

---

## Setup

### 1. Place OBIS Files
Copy the attached OBIS text files to your backend uploads directory:

```
smart-hes-backend/
├── uploads/
│   ├── Hexing OBIS Function.txt
│   └── Hexcell AMI System Unified OBIS List.txt
```

### 2. Install Dependencies
```bash
# Backend
cd smart-hes-backend
npm install

# Frontend
cd smart-hes-frontend
npm install
```

### 3. Start Servers

**Terminal 1** - Backend (port 5001):
```bash
cd smart-hes-backend
$env:PORT=5001; npm run dev
```

Expected output:
```
🚀 Server is running on port 5001
📡 WebSocket server is ready
✅ Connected to MongoDB
```

**Terminal 2** - Frontend (port 3000):
```bash
cd smart-hes-frontend
npm start
```

Browser opens automatically to `http://localhost:3000`

### 4. Login
Use the seeded admin account:
- **Username**: `admin`
- **Password**: `admin123`

---

## Creating a Hexing Meter

1. **Navigate**: Menu → Meters → Add Meter
2. **Fill Form**:
   - **Meter Number**: `HX-001` (or any unique ID)
   - **Meter Type**: `three-phase`
   - **Brand**: `Hexing` ⭐ (dropdown)
   - **Model**: `HEM-3X30` (or your model)
   - **IP Address**: `192.168.1.100` (optional, defaults to `0.0.0.0`)
   - **Port**: `5000` (optional, defaults to `5000`)
   - **Area**: Select an area
3. **Click**: Create Meter

✅ **Result**: Meter created with OBIS parameters auto-loaded from `Hexing OBIS Function.txt`

---

## Creating a Hexcell Meter

Same steps as above, but select **Hexcell** as the brand.

✅ **Result**: Meter created with OBIS parameters auto-loaded from `Hexcell AMI System Unified OBIS List.txt`

---

## Viewing Meter Parameters

1. **Navigate**: Meters → Meter Reading
2. **Enter**: Meter ID or Meter Number (e.g., `HX-001`)
3. **Click**: Fetch Settings
4. **View**: Right panel shows **OBIS Parameters by Group**
   - Product Information
   - Clock
   - Energy
   - And more...

Each group is collapsible and shows:
- Parameter name
- OBIS code (e.g., `{0100000200FF}`)
- Description
- Current value (if meter has sent reading)

---

## Generating Energy Reports

1. **Navigate**: Reports → Energy Consumption
2. **Configure Filters**:
   - **Area**: Select or leave blank for all
   - **Meter**: Select or leave blank for all
   - **Date Range**: Start and End dates (or leave blank)
   - **Interval**: Hourly / Daily / Weekly / Monthly
3. **Click**: Generate Report

✅ **Result** displays:
- 📊 **Summary Cards**: Total Energy, Avg Power, Avg Voltage, Avg Current
- 📈 **Line Chart**: Energy and Power trends
- 📋 **Data Table**: Detailed readings
- 💾 **Export Options**: Download as CSV or PDF

---

## Exporting Reports

### CSV Export
1. Generate report (see above)
2. Click **Export as CSV**
3. File downloads as `consumption_<timestamp>.csv`
4. Open in Excel/Sheets for further analysis

### PDF Export
1. Generate report (see above)
2. Click **Export as PDF**
3. File downloads as `consumption_<timestamp>.pdf`
4. Open in any PDF reader
5. Print-friendly tabular format

---

## Bulk Import Meters

### Via CSV File

1. **Navigate**: Meters → Meter Management → Import CSV
2. **Prepare CSV** file with columns:
   ```
   meterNumber,meterType,brand,model,ipAddress,port,area
   HX-001,three-phase,hexing,HEM-3X30,192.168.1.100,5000,area_id
   HC-002,single-phase,hexcell,HEM-1X20,192.168.1.101,5001,area_id
   HX-003,three-phase,hexing,HEM-3X30,192.168.1.102,5002,area_id
   ```
3. **Upload** file
4. **View Results**: Success/failure per row

✅ **Each meter auto-populated with OBIS parameters** based on brand

---

## Real-Time Meter Readings

### Request a Meter Read

1. **Navigate**: Meters → Meter Reading
2. **Enter**: Meter ID or Number
3. **Click**: Request Read
4. **Wait**: Meter processes request (socket event sent)
5. **View**: "Current Reading" section updates with latest values

### Monitor Meter Status

The app listens for socket events:
- `meter-reading-update` - New readings arrive
- `meter-status-change` - Online/offline status
- `new-alert` - Tamper/anomaly alerts
- `new-event` - System events

Automatic real-time updates in:
- Real-Time Monitoring page
- Dashboard
- Meter Reading page

---

## Configuration

### Environment Variables

Create `.env` in `smart-hes-backend/` if customization needed:

```
# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/smart-hes

# JWT Secret
JWT_SECRET=your-secret-key

# Default Meter IP/Port (if not provided in form)
METER_HOST=0.0.0.0
METER_PORT=5000

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Defaults
If not set:
- `METER_HOST` defaults to `0.0.0.0`
- `METER_PORT` defaults to `5000`

---

## Common Tasks

### Task: Change all meters to IP 192.168.1.1
1. **Meter Management** → Select all meters → Bulk Edit (if available)
   - Or edit individually via Update Meter
2. Update **IP Address** to `192.168.1.1`
3. Save

### Task: Export monthly consumption for a specific area
1. **Energy Consumption** Report
2. Select **Area**
3. Set **Interval** to `Monthly`
4. Set dates for the month
5. Click **Generate Report**
6. Click **Export as PDF**

### Task: Compare two meters' energy usage
1. **Energy Consumption** Report
2. Generate report for **Meter 1** → **Export as CSV**
3. Generate report for **Meter 2** → **Export as CSV**
4. Compare CSVs in Excel

---

## Troubleshooting

### "OBIS configuration not loading"
- ✅ Ensure OBIS files are in `smart-hes-backend/uploads/`
- ✅ Check file names match exactly:
  - `Hexing OBIS Function.txt`
  - `Hexcell AMI System Unified OBIS List.txt`
- ✅ Restart backend after placing files

### "Port 5000 already in use"
- Kill any existing Node processes
- Or set `$env:PORT=5002; npm run dev` to use alternate port

### "PDF download not working"
- ✅ Ensure `pdfkit` is installed: `npm install` in backend
- ✅ Check browser console for errors
- ✅ Verify backend is running and accessible

### "Meter parameters show as empty"
- ✅ Click **Fetch Settings** to load OBIS from meter
- ✅ Meter must have been created with supported brand (Hexing/Hexcell)
- ✅ Check meter's `obisConfiguration` field in MongoDB

---

## Architecture

### Backend Flow
```
AddMeter Request → normalize brand → set IP/Port defaults → 
parseObisForBrand() → save with obisConfiguration → response
```

### Frontend Flow
```
AddMeter Form → POST /api/meters → success → redirect to Meter Management
```

### Report Flow
```
Filter Selection → GET /api/consumption → display table/chart → 
Export CSV (GET /api/consumption/export) or 
Export PDF (GET /api/consumption/export/pdf)
```

---

## API Endpoints

### Meter Management
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/meters` | GET | List all meters |
| `/api/meters` | POST | Create meter (auto-loads OBIS) |
| `/api/meters/:id` | PUT | Update meter |
| `/api/meters/import` | POST | Bulk import (auto-loads OBIS) |
| `/api/meters/:id/read` | POST | Request meter read |
| `/api/meters/:id/settings` | GET | Fetch OBIS configuration |
| `/api/meters/:id/settings` | POST | Update OBIS parameters |

### Consumption Reports
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/consumption` | GET | Query consumption data |
| `/api/consumption/export` | GET | Export as CSV |
| `/api/consumption/export/pdf` | GET | Export as PDF ⭐ |

---

## File Reference

### Key Files Modified
- `smart-hes-backend/src/utils/obisParser.ts` - OBIS parsing logic
- `smart-hes-backend/src/routes/meter.routes.ts` - Meter API with OBIS
- `smart-hes-backend/src/routes/consumption.routes.ts` - Consumption + PDF export
- `smart-hes-frontend/src/pages/Meters/AddMeter.tsx` - Form with brand dropdown
- `smart-hes-frontend/src/pages/Meters/MeterReading.tsx` - Grouped OBIS display
- `smart-hes-frontend/src/pages/Reports/EnergyConsumption.tsx` - Report page

---

## Next Steps

1. ✅ Place OBIS files in `uploads/`
2. ✅ Install dependencies
3. ✅ Start backend and frontend
4. ✅ Login with admin account
5. ✅ Create a test Hexing or Hexcell meter
6. ✅ View OBIS parameters in Meter Reading
7. ✅ Generate an energy consumption report
8. ✅ Export as PDF and verify

---

## Support

For issues or questions:
1. Check **Troubleshooting** section above
2. Verify all OBIS files are in place
3. Review backend logs in terminal
4. Check browser console for frontend errors
5. Ensure MongoDB is running

---

**Version**: 1.0.0  
**Last Updated**: November 14, 2025  
**Status**: ✅ Production Ready
