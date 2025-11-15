# HES Core - IoT Energy Management System

## Overview

HES Core is a professional IoT-enabled Head-End System for smart meter management and energy monitoring. This system provides real-time monitoring, remote control, and comprehensive analytics for smart energy meters.

## IoT Architecture

### Components

1. **IoT Meters (Edge Devices)**
   - Smart meters with cellular/LoRa/Wi-Fi connectivity
   - Embedded firmware for OBIS/DLMS protocol support
   - Real-time data collection and transmission
   - Support for Hexing and Hexcell meter brands

2. **Communication Layer**
   - WebSocket for real-time bidirectional communication
   - MQTT-ready architecture (can be extended)
   - RESTful API for device management
   - SIM card management for cellular connectivity

3. **Backend Services**
   - Node.js/Express server with TypeScript
   - MongoDB for scalable data storage
   - Real-time meter status monitoring
   - Anomaly detection and alerting
   - Data aggregation and analytics

4. **Frontend Application**
   - Modern React application with Material-UI
   - Real-time dashboard with live updates
   - Dark/Light theme support
   - Responsive design for mobile and desktop

## Key IoT Features

### 1. Real-Time Monitoring
- Live meter status updates via WebSocket
- Automatic meter health checks every 30 seconds
- Online/Offline status tracking
- Real-time consumption data visualization

### 2. Remote Operations
- On-demand meter reading requests
- Remote configuration updates
- Remote relay control (connect/disconnect)
- Remote firmware update support

### 3. Data Collection
- Automatic polling at configurable intervals
- OBIS/DLMS data parsing and storage
- Multi-parameter readings:
  - Energy consumption (active, reactive, apparent)
  - Voltage, current, frequency
  - Power factor
  - Tamper detection
  - Event logs

### 4. Device Management
- Bulk meter import via CSV
- SIM card lifecycle management
- Meter-to-customer mapping
- Area-based organization

### 5. Analytics & Alerts
- Anomaly detection for unusual consumption patterns
- Tamper alerts and notifications
- Revenue protection alerts
- Communication failure tracking
- Event analysis and reporting

### 6. AI-Powered Monitoring
- **Intelligent Consumption Analysis**: AI analyzes consumption patterns to detect trends and predict future usage
- **Anomaly Detection**: Automatically identifies unusual consumption spikes, drops, and patterns
- **Smart Alert Prioritization**: AI prioritizes alerts based on severity, age, and impact
- **Predictive Insights**: Generates actionable insights for:
  - Revenue protection opportunities
  - System efficiency improvements
  - Security threat detection
  - Maintenance recommendations
  - Cost-saving opportunities
- **Confidence Scoring**: All AI-detected anomalies include confidence scores (0-100%)
- **Automated Monitoring**: AI runs every 15 minutes to continuously analyze system health

## CSV Import Templates

The system provides CSV templates for bulk operations:

### Download Templates
```bash
GET /api/templates/customers   # Customer import template
GET /api/templates/meters      # Meter import template
GET /api/templates/simcards    # SIM card import template
```

### Template Formats

**Customers Template:**
```csv
customerName,accountNumber,address,phoneNumber,email,area,meterAssigned,customerType,tariffPlan,connectionDate
```

**Meters Template:**
```csv
meterNumber,concentratorId,meterType,brand,model,firmware,ipAddress,port,area,customer,simCard
```

**SIM Cards Template:**
```csv
simNumber,iccid,imsi,msisdn,provider,status,ipAddress,apn,dataLimit,activationDate
```

## IoT Data Flow

### Meter to System (Upstream)
1. Meter collects data
2. Data sent via cellular/network to backend
3. Backend ingests data at `/api/meters/data-ingestion`
4. Data validated and stored in MongoDB
5. Real-time updates pushed to connected clients via WebSocket
6. Anomaly detection runs on new data
7. Alerts generated if thresholds exceeded

### System to Meter (Downstream)
1. User initiates command from dashboard
2. Backend receives request
3. Command sent to meter via WebSocket room
4. Meter executes command
5. Acknowledgment sent back
6. Event logged in system

## Setup and Configuration

### Backend Setup
```bash
cd smaer-hes-backend
npm install
cp .env.example .env
# Configure MongoDB URI, ports, etc.
npm run dev
```

### Frontend Setup
```bash
cd smart-hes-frontend
npm install
npm start
```

### Environment Variables

**Backend (.env):**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hes-system
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
METER_HOST=0.0.0.0
METER_PORT=5000
NODE_ENV=development
```

**Frontend (.env):**
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=http://localhost:5000
```

## Real-Time Features

### WebSocket Events

**Client can listen to:**
- `meter-reading-update` - Real-time meter readings
- `meter-status-change` - Online/offline status changes
- `alert-created` - New alerts
- `event-logged` - New events

**Client can emit:**
- `join-room` - Join specific meter/area room
- `meter-update` - Send meter data update

### Example WebSocket Usage
```javascript
socket.on('meter-reading-update', (data) => {
  console.log('New reading:', data.meterNumber, data.reading);
  // Update UI with new reading
});

socket.emit('join-room', { room: 'area-north' });
```

## API Endpoints

### Meter Operations
```
POST   /api/meters                    # Create meter
GET    /api/meters                    # List meters (with filters)
PUT    /api/meters/:id                # Update meter
DELETE /api/meters/:id                # Delete meter
POST   /api/meters/import             # Bulk import
POST   /api/meters/:id/read           # Request reading
GET    /api/meters/:id/settings       # Get configuration
POST   /api/meters/:id/settings       # Update configuration
POST   /api/meters/data-ingestion     # Meter data endpoint (for meters)
```

### Customer Operations
```
POST   /api/customers                 # Create customer
GET    /api/customers                 # List customers
PUT    /api/customers/:id             # Update customer
DELETE /api/customers/:id             # Delete customer
POST   /api/customers/import          # Bulk import
```

### SIM Card Operations
```
POST   /api/sims                      # Create SIM card
GET    /api/sims                      # List SIM cards
PUT    /api/sims/:id                  # Update SIM card
DELETE /api/sims/:id                  # Delete SIM card
POST   /api/sims/import               # Bulk import
```

### Dashboard & Analytics
```
GET    /api/dashboard/stats           # Get dashboard statistics
GET    /api/consumption               # Get consumption data
GET    /api/events                    # Get system events
GET    /api/alerts                    # Get alerts
```

### AI Monitoring Operations
```
GET    /api/ai/insights               # Get AI-generated insights and recommendations
GET    /api/ai/anomalies              # Get detected anomalies
GET    /api/ai/consumption-pattern/:meterId  # Analyze consumption pattern for specific meter
GET    /api/ai/alerts/prioritized     # Get AI-prioritized alerts
POST   /api/ai/analyze                # Run comprehensive AI analysis (admin only)
```

## Security

- JWT-based authentication
- Role-based access control (admin, operator, viewer)
- Secure WebSocket connections
- Input validation and sanitization
- Rate limiting (recommended for production)

## Scalability

### Horizontal Scaling
- Stateless backend services
- MongoDB replica sets for HA
- Load balancer for multiple backend instances
- Redis for session management (recommended)

### Vertical Scaling
- Optimized database queries with indexes
- Cron job optimization for large meter fleets
- Data archiving for historical records
- Pagination on all list endpoints

## Monitoring & Maintenance

### Health Checks
```
GET /health - System health status
```

### Scheduled Jobs
- Meter status check: Every 30 seconds
- Anomaly detection: Every 5 minutes
- AI monitoring and analysis: Every 15 minutes
- Alert cleanup: Daily at midnight

### Logs
- Application logs in console (development)
- Winston logger ready for production
- Event tracking in database

## Production Deployment

### Recommendations
1. Use environment-specific configurations
2. Enable HTTPS for all connections
3. Use secure WebSocket (WSS)
4. Implement rate limiting
5. Set up monitoring (Prometheus, Grafana)
6. Configure database backups
7. Use CDN for frontend assets
8. Implement log aggregation
9. Set up error tracking (Sentry)
10. Use process manager (PM2)

### Docker Deployment
```bash
# Backend
docker build -t hes-backend ./smaer-hes-backend
docker run -p 5000:5000 --env-file .env hes-backend

# Frontend
docker build -t hes-frontend ./smart-hes-frontend
docker run -p 3000:3000 hes-frontend
```

## Troubleshooting

### Common Issues

**Meters showing offline:**
- Check network connectivity
- Verify SIM card status
- Check meter polling configuration
- Review last seen timestamp

**WebSocket not connecting:**
- Verify CORS settings
- Check WebSocket URL configuration
- Ensure firewall allows WebSocket traffic

**Import failures:**
- Validate CSV format matches template
- Check for duplicate meter numbers
- Verify referenced IDs exist (area, customer, sim)

## Support

For issues and feature requests, please refer to the documentation or contact the development team.

---

**Version:** 2.0.0
**Last Updated:** 2025-11-15
**License:** Proprietary
