# Python DLMS Communication Service

A Python-based microservice for DLMS/COSEM communication with Hexing and Hexcell energy meters.

## Features

- **Dual Implementation**:
  - Native vendor DLL support (Windows) for optimal performance
  - Gurux DLMS library fallback (cross-platform)

- **Full DLMS Operations**:
  - Single OBIS code read
  - Batch read (multiple OBIS codes)
  - OBIS code write
  - Load profile reading
  - Connection management

- **RESTful API**: FastAPI-based HTTP interface for easy integration
- **Automatic Fallback**: Gracefully falls back to Gurux if DLLs unavailable
- **Connection Pooling**: Maintains active connections for performance

## Architecture

```
┌─────────────────────────────────────────────┐
│         Node.js Backend (Main HES)          │
│                                             │
│   ┌─────────────────────────────────────┐  │
│   │   DLMS Routes (dlms.routes.ts)      │  │
│   └──────────────┬──────────────────────┘  │
└──────────────────┼─────────────────────────┘
                   │ HTTP Requests
                   ▼
┌─────────────────────────────────────────────┐
│   Python DLMS Service (Port 8001)           │
│                                             │
│   ┌─────────────────────────────────────┐  │
│   │   FastAPI (api.py)                  │  │
│   └──────────────┬──────────────────────┘  │
│                  │                          │
│   ┌──────────────▼──────────────────────┐  │
│   │   DLMSClient (dlms_client.py)       │  │
│   └──┬───────────────────────────────┬──┘  │
│      │                               │      │
│   ┌──▼────────────┐     ┌───────────▼───┐  │
│   │ Vendor DLLs   │     │ Gurux Library │  │
│   │ (Windows)     │     │ (Cross-plat)  │  │
│   └───────┬───────┘     └───────┬───────┘  │
└───────────┼─────────────────────┼──────────┘
            │                     │
            ▼                     ▼
┌───────────────────────────────────────────┐
│   Smart Meters (Hexing/Hexcell)           │
│   - DLMS/COSEM Protocol                   │
│   - TCP/IP or Serial                      │
└───────────────────────────────────────────┘
```

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- For Windows DLL support: Windows OS
- For serial communication: Physical serial port or USB-to-serial adapter

### Setup

1. **Clone/Navigate to the service directory:**
   ```bash
   cd python-dlms-service
   ```

2. **Create virtual environment:**
   ```bash
   python3 -m venv venv

   # Activate on Linux/Mac:
   source venv/bin/activate

   # Activate on Windows:
   venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Usage

### Starting the Service

**Development:**
```bash
python src/api.py
```

**Production (with Uvicorn):**
```bash
uvicorn src.api:app --host 0.0.0.0 --port 8001 --workers 4
```

**With Docker:**
```bash
docker build -t dlms-service .
docker run -p 8001:8001 dlms-service
```

### API Endpoints

#### 1. Health Check
```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T12:00:00",
  "active_connections": 3
}
```

#### 2. Connect to Meter
```http
POST /connect
Content-Type: application/json

{
  "meter_number": "14512345678",
  "brand": "hexing",
  "connection_type": "tcp",
  "ip_address": "192.168.1.100",
  "port": 4059,
  "server_address": 1,
  "client_address": 16,
  "auth_type": "None",
  "timeout": 30000
}
```

#### 3. Read Single OBIS Code
```http
POST /read
Content-Type: application/json

{
  "meter_number": "14512345678",
  "obis_code": "1-0:1.8.0.255",
  "class_id": 3,
  "attribute_id": 2
}
```

Response:
```json
{
  "success": true,
  "meterNumber": "14512345678",
  "data": {
    "success": true,
    "obisCode": "1-0:1.8.0.255",
    "value": "12345.67",
    "unit": "kWh",
    "scaler": -2
  }
}
```

#### 4. Batch Read Multiple OBIS Codes
```http
POST /read-multiple
Content-Type: application/json

{
  "meter_number": "14512345678",
  "obis_codes": [
    {"code": "1-0:1.8.0.255", "classId": 3, "attributeId": 2},
    {"code": "1-0:32.7.0.255", "classId": 3, "attributeId": 2},
    {"code": "1-0:31.7.0.255", "classId": 3, "attributeId": 2}
  ]
}
```

Response:
```json
{
  "success": true,
  "meterNumber": "14512345678",
  "total": 3,
  "successful": 3,
  "failed": 0,
  "data": {
    "readings": [
      {"obisCode": "1-0:1.8.0.255", "value": "12345.67", "success": true},
      {"obisCode": "1-0:32.7.0.255", "value": "230.5", "success": true},
      {"obisCode": "1-0:31.7.0.255", "value": "5.2", "success": true}
    ]
  }
}
```

#### 5. Write OBIS Code
```http
POST /write
Content-Type: application/json

{
  "meter_number": "14512345678",
  "obis_code": "0-0:1.0.0.255",
  "value": "2025-11-16T12:00:00",
  "class_id": 8,
  "attribute_id": 2
}
```

#### 6. Read Load Profile
```http
POST /load-profile
Content-Type: application/json

{
  "meter_number": "14512345678",
  "obis_code": "1-0:99.1.0.255",
  "start_date": "2025-11-01T00:00:00",
  "end_date": "2025-11-16T23:59:59"
}
```

#### 7. List Active Connections
```http
GET /connections
```

#### 8. Disconnect from Meter
```http
POST /disconnect?meter_number=14512345678
```

## Integration with Node.js Backend

The Node.js backend should proxy DLMS requests to this Python service:

```typescript
// dlms.service.ts (Node.js backend)
import axios from 'axios';

const PYTHON_DLMS_SERVICE_URL = process.env.PYTHON_DLMS_URL || 'http://localhost:8001';

export async function readObis(meterNumber: string, obisCode: string) {
  const response = await axios.post(`${PYTHON_DLMS_SERVICE_URL}/read`, {
    meter_number: meterNumber,
    obis_code: obisCode,
    class_id: 3,
    attribute_id: 2
  });
  return response.data;
}

export async function readMultipleObis(meterNumber: string, obisCodes: any[]) {
  const response = await axios.post(`${PYTHON_DLMS_SERVICE_URL}/read-multiple`, {
    meter_number: meterNumber,
    obis_codes: obisCodes
  });
  return response.data;
}
```

## DLL Integration (Windows)

### Hexcell DLL (WinDLMSClientDLL.dll)

The service automatically detects and uses the Hexcell DLL on Windows:

- Location: `../../uploads/DLMS MD/WinDLMSClientDLL.dll`
- Functions used:
  - `Connect(ip, port, timeout)` - Establish connection
  - `ReadOBIS(obisCode, buffer, maxLen)` - Read OBIS code
  - `WriteOBIS(obisCode, value)` - Write OBIS code
  - `Disconnect()` - Close connection

### Hexing DLL

For Hexing meters, the service uses Gurux library by default. To use Hexing DLLs:

1. Implement wrapper for `DLMS.Core.dll`
2. Update `_init_hexing_dll()` in `dlms_client.py`

## Gurux DLMS Library (Cross-Platform)

When DLLs are unavailable (Linux, Mac, or DLL load failure), the service uses Gurux:

- Pure Python implementation
- Supports TCP/IP and serial connections
- Full DLMS/COSEM protocol support
- Open source and well-maintained

## Deployment

### Production Deployment (Linux)

1. **Install as systemd service:**

Create `/etc/systemd/system/dlms-service.service`:
```ini
[Unit]
Description=DLMS Communication Service
After=network.target

[Service]
Type=simple
User=hes
WorkingDirectory=/opt/smart-hes-system/smaer-hes-backend/python-dlms-service
Environment="PATH=/opt/smart-hes-system/smaer-hes-backend/python-dlms-service/venv/bin"
ExecStart=/opt/smart-hes-system/smaer-hes-backend/python-dlms-service/venv/bin/uvicorn src.api:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
```

2. **Enable and start:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable dlms-service
sudo systemctl start dlms-service
```

### Windows Deployment (with DLL support)

1. **Install Python 3.8+ for Windows**
2. **Install dependencies:**
   ```cmd
   pip install -r requirements.txt
   ```
3. **Run as Windows Service** (using NSSM or similar)

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/
COPY .env .

EXPOSE 8001

CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8001"]
```

Build and run:
```bash
docker build -t dlms-service .
docker run -d -p 8001:8001 --name dlms-service dlms-service
```

## Testing

### Manual Testing

```bash
# Health check
curl http://localhost:8001/health

# Connect to meter
curl -X POST http://localhost:8001/connect \
  -H "Content-Type: application/json" \
  -d '{
    "meter_number": "14512345678",
    "brand": "hexing",
    "connection_type": "tcp",
    "ip_address": "192.168.1.100",
    "port": 4059
  }'

# Read OBIS code
curl -X POST http://localhost:8001/read \
  -H "Content-Type: application/json" \
  -d '{
    "meter_number": "14512345678",
    "obis_code": "1-0:1.8.0.255",
    "class_id": 3,
    "attribute_id": 2
  }'
```

### Unit Tests

```bash
pytest tests/
```

## Troubleshooting

### DLL Not Found (Windows)

**Error:** `FileNotFoundError: Hexcell DLL not found`

**Solution:**
- Verify DLL path in `.env` file
- Ensure DLL exists in `uploads/DLMS MD/` directory
- Check file permissions

### Connection Timeout

**Error:** `Connection timeout`

**Solution:**
- Verify meter IP address and port
- Check network connectivity (ping meter)
- Ensure firewall allows connection
- Verify meter is powered on and configured

### Import Error: gurux_dlms

**Error:** `ImportError: No module named 'gurux_dlms'`

**Solution:**
```bash
pip install gurux-dlms gurux-serial gurux-net
```

## Performance Considerations

- **Connection Pooling**: Connections are kept alive for reuse
- **Batch Reading**: Use `/read-multiple` for better performance
- **Timeout Configuration**: Adjust timeout based on network latency
- **Concurrent Requests**: Service supports multiple simultaneous meter connections

## Security

- **API Key Authentication**: Enable `ENABLE_API_KEY` in production
- **Network Security**: Deploy behind reverse proxy (nginx)
- **Encryption**: Use HTTPS for API communication
- **Input Validation**: All inputs validated by Pydantic models

## License

Proprietary - New Hampshire Capital

## Support

For issues or questions, contact the HES development team.
