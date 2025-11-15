# Smart Head End System (HES Core)

A modern, real-time Head End System for smart meter management with AI-driven theft detection, revenue protection, and comprehensive meter monitoring capabilities.

## 🚀 Features

### Core Features
- **Real-time Meter Monitoring**: Track meter status, readings, and communication in real-time
- **Area Management**: Organize meters by geographical areas with hierarchical structure
- **Consumption Statistics**: Daily, weekly, monthly consumption reports with export capabilities
- **Event Reporting**: Comprehensive event logging and analysis
- **Active Alerts**: Real-time tamper and anomaly alerts with priority levels
- **Revenue Leakage Management**: AI-driven theft detection and revenue loss monitoring
- **Remote Control**: Remote relay control and parameter configuration
- **Multi-role User Management**: Admin, Operator, and Customer access levels
- **CSV Import/Export**: Batch operations with per-row error tracking
- **OBIS Parameter Management**: Read and write meter settings and configurations

### AI-Driven Anomaly Detection Rules
1. **Zero Consumption Detection**: Identifies meters with no consumption for 48+ hours
2. **Consumption Drop Detection**: Flags >80% consumption drops compared to historical average
3. **Neighborhood Variance**: Compares consumption with area average

---

## 🔧 Setup Instructions

### Prerequisites
- Node.js 14+ and npm
- MongoDB running locally or connection string to MongoDB Atlas
- Environment variables configured

### Backend Setup

1. **Navigate to backend directory:**
   ```powershell
   cd smart-hes-backend
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Create `.env` file with required variables:**
   ```
   MONGODB_URI=mongodb://localhost:27017/smart-hes
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRE=30d
   PORT=5000
   ```

4. **Seed the database:**
   ```powershell
   npm run seed
   ```
   Creates admin user:
   - Username: `Astratek`
   - Email: `samuelopeyemi61@gmal.com`
   - Password: `2!1!YDr3`

5. **Start development server:**
   ```powershell
   npm run dev
   ```
   Backend runs on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```powershell
   cd smart-hes-frontend
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Create `.env` file (optional):**
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```

4. **Start development server:**
   ```powershell
   npm start
   ```
   Frontend runs on `http://localhost:3000`

---

## 📚 Complete API Documentation

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/login` | User login | No |
| POST | `/register` | User registration | No |
| GET | `/me` | Get current user profile | Yes |

**POST /login**
```json
Request: { "username": "string", "password": "string" }
Response: { "user": { ... }, "token": "string" }
```

**POST /register**
```json
Request: { 
  "username": "string", 
  "email": "string", 
  "password": "string",
  "firstName": "string (optional)",
  "lastName": "string (optional)"
}
Response: { "user": { ... }, "token": "string" }
```

### Meter Routes (`/api/meters`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | List meters with filters | Yes | All |
| POST | `/` | Create meter | Yes | Admin, Operator |
| PUT | `/:id` | Update meter | Yes | Admin, Operator |
| DELETE | `/:id` | Soft delete meter | Yes | Admin |
| POST | `/import` | Import meters from CSV | Yes | Admin, Operator |
| POST | `/:id/read` | Request immediate meter read | Yes | Admin, Operator |
| GET | `/:id/settings` | Fetch OBIS configuration | Yes | Admin, Operator |
| POST | `/:id/settings` | Update meter settings | Yes | Admin, Operator |
| POST | `/data-ingestion` | Meter data submission endpoint | No | Meter |

**GET /meters - Query Parameters:**
- `status` (optional): 'online', 'offline', 'active', 'warehouse', 'faulty'
- `area` (optional): Area ObjectId
- `customer` (optional): Customer ObjectId
- `search` (optional): Search term for meterNumber or brand
- `page` (default: 1): Pagination page
- `limit` (default: 10): Items per page

**POST /meters/import - CSV Format:**
```csv
meterNumber,concentratorId,meterType,brand,model,firmware,ipAddress,port,area,customer,simCard
MGT-001,CONC-001,single-phase,Hexing,DDS645,v1.0.0,192.168.1.100,9600,,
```

**Response: Per-Row Import Results**
```json
{
  "success": true,
  "message": "Processed 10 rows",
  "total": 10,
  "successCount": 8,
  "failures": [
    {
      "index": 2,
      "error": "meterNumber is required",
      "row": { ... }
    }
  ],
  "details": [
    { "index": 0, "success": true, "data": { meter object } },
    { "index": 1, "success": false, "error": "error message", "row": { ... } }
  ]
}
```

### Area Routes (`/api/areas`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | List areas | Yes | All |
| POST | `/` | Create area | Yes | Admin, Operator |
| PUT | `/:id` | Update area | Yes | Admin, Operator |
| DELETE | `/:id` | Soft delete area | Yes | Admin |

**POST /areas**
```json
{
  "name": "Ikorodu",
  "code": "IKD",
  "description": "Lagos North Zone",
  "coordinates": { "latitude": 6.5244, "longitude": 3.3792 }
}
```

### Customer Routes (`/api/customers`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | List customers | Yes | Admin, Operator |
| POST | `/` | Create customer | Yes | Admin, Operator |
| PUT | `/:id` | Update customer | Yes | Admin, Operator |
| DELETE | `/:id` | Soft delete customer | Yes | Admin |
| POST | `/import` | Import customers from CSV | Yes | Admin, Operator |

**CSV Import Format:**
```csv
customerName,accountNumber,email,phoneNumber,street,city,state,postalCode,country
John Doe,ACC-001,john@example.com,+2348000000001,123 Main St,Lagos,Lagos,100001,Nigeria
```

### SIM Card Routes (`/api/sims`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | List SIM cards | Yes | Admin, Operator |
| POST | `/` | Create SIM | Yes | Admin, Operator |
| PUT | `/:id` | Update SIM | Yes | Admin, Operator |
| DELETE | `/:id` | Delete SIM | Yes | Admin |

### Event Routes (`/api/events`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | List events | Yes | All |
| POST | `/` | Create event | Yes | System |
| POST | `/:id/acknowledge` | Acknowledge event | Yes | Admin, Operator |

**GET /events - Query Parameters:**
- `meter` (optional): Meter ObjectId or meterNumber
- `eventType` (optional): Event type filter
- `severity` (optional): 'info', 'warning', 'error'
- `page` (default: 1): Pagination page
- `limit` (default: 20): Items per page

### Alert Routes (`/api/alerts`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | List alerts | Yes | All |
| POST | `/` | Create alert | Yes | System |
| POST | `/:id/acknowledge` | Acknowledge alert | Yes | Admin, Operator |
| POST | `/:id/resolve` | Resolve alert | Yes | Admin, Operator |
| GET | `/active-count` | Get active alert count | Yes | All |

### Consumption Routes (`/api/consumption`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Query consumption data | Yes | All |
| GET | `/export` | Export consumption as CSV | Yes | Admin, Operator |

**GET /consumption - Query Parameters:**
- `meter` (required): Meter ID
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `interval` (optional): 'hourly', 'daily', 'monthly'
- `page` (default: 1): Pagination page
- `limit` (default: 50): Items per page

### Remote Control Routes (`/api/remote`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/load` | Send token load to meter | Yes | Admin, Operator |
| POST | `/control` | Remote relay control | Yes | Admin, Operator |

**POST /remote/load**
```json
{
  "meterId": "meter_object_id",
  "token": "token_string",
  "amount": 5000
}
```

**POST /remote/control**
```json
{
  "meterId": "meter_object_id",
  "action": "disconnect" // or "connect"
}
```

### User Routes (`/api/users`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | List users | Yes | Admin |
| GET | `/:id` | Get user profile | Yes | Admin, Self |
| PUT | `/:id` | Update user | Yes | Admin, Self |
| DELETE | `/:id` | Deactivate user | Yes | Admin |

### Dashboard Routes (`/api/dashboard`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/area-stats` | Area-wise meter statistics | Yes | All |

---

## 🎨 Frontend Pages & Routes

### Public Pages
- **`/login`** - User login page
- **`/register`** - User registration page

### Authenticated Pages (All Roles)
- **`/dashboard`** - Main dashboard with statistics
- **`/profile`** - User profile and settings
- **`/task-query/monitoring`** - Real-time meter monitoring dashboard
- **`/task-query/events`** - Event list and details
- **`/task-query/online-rate`** - Area-wise online rate statistics
- **`/reports/consumption`** - Energy consumption reports

### Admin & Operator Pages
- **`/meters`** - Meter list and management
- **`/meters/add`** - Create new meter
- **`/meters/import`** - Import meters from CSV (with per-row error feedback)
- **`/meters/reading`** - Request and view meter readings
- **`/meters/settings`** - Edit OBIS parameters and configuration
- **`/meters/sims`** - Manage SIM cards
- **`/customers`** - Customer list and management
- **`/customers/import`** - Import customers from CSV
- **`/system/areas`** - Area management
- **`/remote/loading`** - Token/credit loading
- **`/remote/control`** - Relay control (connect/disconnect)

### Admin Only Pages
- **`/users`** - User management and roles

---

## 🔐 Role-Based Access Control

### Admin
- Full system access
- User and role management
- System configuration
- All data access and operations

### Operator
- Meter management (CRUD)
- Customer management (CRUD)
- Remote operations (load, control)
- Event and alert management
- Event acknowledgment
- Read consumption data

### Customer
- Read-only access to own meter
- View personal consumption
- Profile management

---

## 📡 Real-Time Updates via Socket.IO

### Client Connection
```typescript
const socket = io(SOCKET_URL, {
  auth: { token: jwtToken },
  transports: ['websocket', 'polling'],
});

socket.emit('join-room', { room: userRole, userId: userId });
```

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `meter-reading-update` | `{ meterId, meterNumber, reading }` | New meter reading received |
| `meter-status-change` | `{ meterId, status, lastSeen }` | Meter status changed |
| `meter-online` | `{ meterId, meterNumber }` | Meter came online |
| `meter-offline` | `{ meterId, meterNumber }` | Meter went offline |
| `new-alert` | Alert object | New alert created |
| `tamper-alert` | `{ meterId, meterNumber, description }` | Tamper detected |
| `alert-acknowledged` | `{ alertId, status }` | Alert acknowledged |
| `alert-resolved` | `{ alertId }` | Alert resolved |
| `new-event` | Event object | New event logged |

---

## 💾 Data Models

### Meter Model
```typescript
{
  _id: ObjectId
  meterNumber: string (unique, required)
  concentratorId?: string
  meterType: 'single-phase' | 'three-phase' | 'prepaid' | 'postpaid'
  brand: string (required)
  model: string (required)
  firmware: string
  area: ObjectId (required, ref: Area)
  customer?: ObjectId (ref: Customer)
  simCard?: ObjectId (ref: SimCard)
  ipAddress?: string
  port?: number
  status: 'online' | 'offline' | 'active' | 'warehouse' | 'faulty'
  lastSeen?: Date
  installationDate?: Date
  commissionDate?: Date
  coordinates?: { latitude: number, longitude: number }
  currentReading: {
    totalEnergy: number
    voltage: number
    current: number
    power: number
    frequency: number
    powerFactor: number
    timestamp: Date
  }
  relayStatus: 'connected' | 'disconnected'
  tamperStatus: {
    coverOpen: boolean
    magneticTamper: boolean
    reverseFlow: boolean
    neutralDisturbance: boolean
  }
  obisConfiguration?: Map<string, any>
  metadata?: Map<string, any>
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Alert Model
```typescript
{
  _id: ObjectId
  meter: ObjectId (ref: Meter, required)
  title: string (required)
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'anomaly' | 'tamper' | 'offline' | 'custom'
  message: string
  status: 'active' | 'acknowledged' | 'resolved'
  timestamp: Date
  acknowledgedBy?: ObjectId (ref: User)
  acknowledgedAt?: Date
  resolvedBy?: ObjectId (ref: User)
  resolvedAt?: Date
}
```

### Event Model
```typescript
{
  _id: ObjectId
  meter: ObjectId (ref: Meter, required)
  eventType: string (required)
  eventCode: string
  severity: 'info' | 'warning' | 'error'
  category: string
  description: string
  timestamp: Date
  acknowledged: boolean
  acknowledgedBy?: ObjectId (ref: User)
  acknowledgedAt?: Date
}
```

---

## 🧪 Testing Workflow

1. **Start Backend & Seed Data:**
   ```powershell
   cd smart-hes-backend
   npm run seed
   npm run dev
   ```

2. **Start Frontend:**
   ```powershell
   cd smart-hes-frontend
   npm start
   ```

3. **Login:**
   - Visit `http://localhost:3000/login`
   - Username: `Astratek`
   - Password: `2!1!YDr3`

4. **Test CSV Import:**
   - Go to `/customers/import` or `/meters/import`
   - Create/upload CSV file
   - Check per-row results table for success/failure counts and error messages

5. **Test Real-Time Monitoring:**
   - Open RealTimeMonitoring page
   - Select meters
   - Request reads (will emit socket events)
   - Monitor real-time updates

6. **Test Remote Operations:**
   - Go to `/remote/loading` or `/remote/control`
   - Issue commands (creates Event records and emits socket events)
   - Verify events in event log

---

## ✅ TypeScript & Quality Checks

Run TypeScript compilation checks:

```powershell
# Backend
cd smart-hes-backend
npx tsc --noEmit

# Frontend
cd smart-hes-frontend
npx tsc --noEmit
```

Both projects are fully typed with no implicit `any` types in main codebase.

---

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/smart-hes` |
| `JWT_SECRET` | Secret key for JWT signing | `your-super-secret-key` |
| `JWT_EXPIRE` | JWT token expiration | `30d` |
| `PORT` | Backend server port | `5000` |
| `REACT_APP_API_URL` | Frontend API base URL | `http://localhost:5000/api` |
| `REACT_APP_SOCKET_URL` | WebSocket server URL | `http://localhost:5000` |

---

## 🐛 Troubleshooting

### Port Already in Use
```powershell
# Kill process on port 5000 (Windows PowerShell)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
```

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Verify `MONGODB_URI` in `.env`
- For Atlas, check IP whitelist

### Socket Connection Errors
- Verify `REACT_APP_SOCKET_URL` matches backend
- Check firewall allows WebSocket
- Browser console should show connection details

### TypeScript Errors
- Run `npm install` to ensure all types
- Use `npx tsc --noEmit` for details
- Check `node_modules/@types/` for missing packages

---

**Last Updated:** November 14, 2025  
**Version:** 1.0.0 - Production Ready
4. **Unusual Pattern Detection**: Identifies abnormal consumption patterns

## 🛠️ Technology Stack

### Backend
- **Node.js** with TypeScript
- **Express.js** for REST API
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time communication
- **JWT** for authentication
- **Multer** for file uploads
- **Node-cron** for scheduled tasks

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for UI components
- **Recharts** for data visualization
- **Socket.io-client** for real-time updates
- **Axios** for API communication
- **React Query** for data fetching
- **React Router** for navigation

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- MongoDB 4.4+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd smart-hes-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
- Copy `.env.example` to `.env`
- Update MongoDB connection string
- Set JWT secret and other configurations

4. Build the TypeScript code:
```bash
npm run build
```

5. Seed the database with sample data:
```bash
npm run seed
```

6. Start the server:
```bash
npm run dev  # For development
npm start    # For production
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd smart-hes-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
- Create `.env` file
- Add: `REACT_APP_API_URL=http://localhost:5000/api`
- Add: `REACT_APP_SOCKET_URL=http://localhost:5000`

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🔑 Default Login Credentials

After running the seed script, use these credentials:

| Role     | Username   | Password       |
|----------|------------|----------------|
| Admin    | admin      | Admin@123456   |
| Operator | operator   | Operator@123   |
| Customer | customer   | Customer@123   |

## 📡 Meter Data Ingestion

The system provides REST API endpoints for meters to send data:

### Single Meter Data Ingestion
```http
POST /api/meters/data-ingestion
Content-Type: application/json

{
  "meterNumber": "MTR001",
  "readings": {
    "totalEnergy": 1234.56,
    "voltage": 230.5,
    "current": 15.2,
    "power": 3.5,
    "frequency": 50.1,
    "powerFactor": 0.95,
    "tamperStatus": {
      "coverOpen": false,
      "magneticTamper": false,
      "reverseFlow": false,
      "neutralDisturbance": false
    }
  },
  "events": [
    {
      "type": "POWER_OUTAGE",
      "code": "PWR_OUT",
      "severity": "warning",
      "category": "power",
      "description": "Power outage detected",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z",
  "authentication": "your-api-key"
}
```

### Batch Data Ingestion
```http
POST /api/meters/batch-ingestion
Content-Type: application/json

{
  "meters": [
    {
      "meterNumber": "MTR001",
      "readings": {...},
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "meterNumber": "MTR002",
      "readings": {...},
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "authentication": "your-api-key"
}
```

## 🧪 Testing with Meter Simulator

The system includes a meter simulator for testing:

```bash
# Run the meter simulator
cd smart-hes-backend
npm run simulator
```

The simulator will:
- Generate readings for 10 simulated meters every 30 seconds
- Create random anomalies every 5 minutes
- Send data to the ingestion endpoint
- Simulate tamper events and power outages

## 📊 System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Smart Meters  │────▶│   HES Backend   │◀────│  Web Dashboard  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                        │
        │                        ▼                        │
        │               ┌─────────────────┐               │
        └──────────────▶│    MongoDB      │◀──────────────┘
                        └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   Socket.io     │
                        │  (Real-time)    │
                        └─────────────────┘
```

## 🚦 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Meters
- `GET /api/meters` - Get all meters with filters
- `GET /api/meters/:id` - Get single meter
- `POST /api/meters` - Create new meter
- `PUT /api/meters/:id` - Update meter
- `DELETE /api/meters/:id` - Delete meter
- `POST /api/meters/import` - Import meters from CSV
- `POST /api/meters/data-ingestion` - Receive meter data
- `POST /api/meters/read-parameters` - Read OBIS parameters
- `POST /api/meters/write-parameters` - Write OBIS parameters

### Areas
- `GET /api/areas` - Get all areas
- `POST /api/areas` - Create area
- `PUT /api/areas/:id` - Update area
- `DELETE /api/areas/:id` - Delete area

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/consumption-chart` - Get consumption chart data
- `GET /api/dashboard/area-stats` - Get area-wise statistics
- `GET /api/dashboard/top-consumers` - Get top energy consumers
- `GET /api/dashboard/revenue-loss` - Get revenue loss summary

### Alerts & Events
- `GET /api/alerts` - Get active alerts
- `POST /api/alerts/:id/acknowledge` - Acknowledge alert
- `POST /api/alerts/:id/resolve` - Resolve alert
- `GET /api/events` - Get events with filters

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- API rate limiting
- Input validation and sanitization
- Secure password hashing with bcrypt
- CORS configuration
- Environment variable protection

## 📱 Real-time Features

The system uses Socket.io for real-time updates:
- Meter status changes (online/offline)
- New alerts and tamper notifications
- Live meter readings
- Event notifications
- Dashboard statistics updates

## 🎯 Performance Optimizations

- Database indexing for faster queries
- Pagination for large datasets
- Caching strategies
- Efficient data aggregation pipelines
- Optimized real-time data transmission
- Background job processing

## 📈 Monitoring & Logging

- Winston logger for comprehensive logging
- Health check endpoints
- System metrics monitoring
- Error tracking and reporting
- Audit logs for user actions

## 🚀 Deployment

### Production Deployment Checklist
1. Set NODE_ENV=production
2. Use strong JWT secrets
3. Configure proper MongoDB connection
4. Enable HTTPS/SSL
5. Set up reverse proxy (nginx/Apache)
6. Configure firewall rules
7. Enable rate limiting
8. Set up backup strategy
9. Configure monitoring tools
10. Use PM2 or similar for process management

### Docker Support
```bash
# Build Docker image
docker build -t hes-core .

# Run container
docker run -d -p 5000:5000 --env-file .env hes-core
```

## 📝 License

This project is proprietary software. All rights reserved.

## 🤝 Support

For support and inquiries:
- Email: support@smarthes.com
- Documentation: https://docs.smarthes.com
- Issues: GitHub Issues

## 🔄 Updates & Maintenance

- Regular security updates
- Feature enhancements based on user feedback
- Performance optimizations
- Bug fixes and patches

---
Built with ❤️ for Smart Grid Management
