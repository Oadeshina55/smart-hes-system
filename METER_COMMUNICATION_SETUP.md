# Meter Communication Setup Guide

This guide will help you set up and test the meter communication features of the Smart HES system.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Testing Setup](#local-testing-setup)
3. [Cloud Deployment](#cloud-deployment)
4. [Testing with Simulator](#testing-with-simulator)
5. [Real Meter Integration](#real-meter-integration)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Software Requirements

- Node.js 18+
- MongoDB 6.0+
- Mosquitto MQTT Broker
- Git

### Install MQTT Broker

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

**Windows:**
Download from: https://mosquitto.org/download/

---

## Local Testing Setup

### Step 1: Install Dependencies

```bash
# Backend
cd smaer-hes-backend
npm install mqtt node-cron

# Simulator
cd ../meter-simulator
npm install
```

### Step 2: Configure Environment

Edit `smaer-hes-backend/.env`:

```bash
# MQTT Configuration
MQTT_ENABLED=true
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=
METER_READ_INTERVAL=30
```

### Step 3: Start Services

**Terminal 1 - MongoDB:**
```bash
mongod --dbpath /path/to/data
```

**Terminal 2 - MQTT Broker:**
```bash
mosquitto -v
```

**Terminal 3 - Backend:**
```bash
cd smaer-hes-backend
npm run dev
```

**Terminal 4 - Frontend:**
```bash
cd smart-hes-frontend
npm start
```

**Terminal 5 - Meter Simulator:**
```bash
cd meter-simulator
npm start
```

### Step 4: Verify Connection

Check backend logs for:
```
✅ Connected to MongoDB
✅ MQTT meter communication service initialized
⏰ Meter reading scheduler started (every 30 minutes)
```

Check simulator logs for:
```
[TEST_METER_001] ✅ Connected to MQTT broker
[TEST_METER_001] 📡 Subscribed to commands
```

---

## Cloud Deployment

### Option 1: Oracle Cloud Free Tier (Recommended)

#### Create Account
1. Go to https://www.oracle.com/cloud/free/
2. Sign up for free tier (credit card required but not charged)
3. Create a VM instance (Always Free tier)

#### Deploy to Oracle Cloud

**1. Create Compute Instance:**
```bash
# Instance specs (Free tier):
- Shape: VM.Standard.E2.1.Micro (1 vCPU, 1GB RAM)
- OR: VM.Standard.A1.Flex (4 vCPU, 24GB RAM) - ARM
- OS: Ubuntu 22.04
```

**2. SSH into Instance:**
```bash
ssh ubuntu@<your-instance-ip>
```

**3. Install Dependencies:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Mosquitto
sudo apt install -y mosquitto mosquitto-clients
sudo systemctl start mosquitto
sudo systemctl enable mosquitto

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

**4. Clone and Deploy:**
```bash
# Clone repository
git clone https://github.com/Oadeshina55/smart-hes-system.git
cd smart-hes-system

# Backend setup
cd smaer-hes-backend
npm install
cp .env.example .env
nano .env  # Edit configuration

# Build and start
npm run build
pm2 start dist/server.js --name hes-backend
pm2 save
pm2 startup

# Frontend setup
cd ../smart-hes-frontend
npm install
npm run build

# Deploy frontend
sudo rm -rf /var/www/html/*
sudo cp -r build/* /var/www/html/
```

**5. Configure Nginx:**
```bash
sudo nano /etc/nginx/sites-available/default
```

```nginx
server {
    listen 80;
    server_name YOUR_IP_OR_DOMAIN;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

```bash
sudo systemctl restart nginx
```

**6. Configure Firewall:**
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 1883  # MQTT
sudo ufw enable
```

### Option 2: DigitalOcean ($6/month)

```bash
# Create droplet via CLI
doctl compute droplet create hes-server \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-2gb \
  --region nyc1

# Follow same deployment steps as Oracle Cloud
```

### Option 3: AWS Lightsail ($3.50-5/month)

1. Create Lightsail instance (Ubuntu)
2. SSH and follow Oracle Cloud deployment steps

---

## Testing with Simulator

### 1. Add Test Meters to Database

Login to HES dashboard and add meters:
- Meter Number: `TEST_METER_001`
- Serial Number: `SIM001`
- Status: Active

Or use MongoDB directly:
```javascript
use smart-hes-system

db.meters.insertOne({
  meterNumber: "TEST_METER_001",
  serialNumber: "SIM001",
  status: "active",
  isActive: true,
  customerNetwork: ObjectId("your-network-id"),
  // ... other fields
})
```

### 2. Start Simulator

**Single Meter:**
```bash
cd meter-simulator
node simulator.js
```

**Multiple Meters:**
```bash
METER_COUNT=10 node simulator.js
```

**Custom Interval (15 seconds):**
```bash
SEND_INTERVAL=15000 node simulator.js
```

### 3. Monitor Data Flow

**Watch MQTT traffic:**
```bash
mosquitto_sub -t 'meter/#' -v
```

**Check backend logs:**
```bash
pm2 logs hes-backend
```

**View in Dashboard:**
1. Login to HES
2. Go to Meters page
3. Click on TEST_METER_001
4. View real-time data updates

### 4. Test Commands

**Manual Read:**
```bash
curl -X POST http://localhost:5000/api/meter-control/read/TEST_METER_001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Connect/Disconnect:**
```bash
# Connect meter
curl -X POST http://localhost:5000/api/meter-control/connect/TEST_METER_001 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Disconnect meter
curl -X POST http://localhost:5000/api/meter-control/disconnect/TEST_METER_001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Real Meter Integration

### DLMS/COSEM Meters

For production integration with real DLMS meters:

**1. Install DLMS Client Library:**
```bash
npm install node-dlms
```

**2. Configure Meter Connection:**

Edit `meterComm.service.ts` to add DLMS support:

```typescript
import { DlmsClient } from 'node-dlms';

async readDlmsMeter(meterIp: string, port: number) {
  const client = new DlmsClient({
    host: meterIp,
    port: port,
    password: 'your-meter-password',
  });

  await client.connect();
  const energy = await client.read('1.8.0'); // Read cumulative energy
  await client.disconnect();

  return energy;
}
```

### GSM/GPRS Meters

**1. SIM Card Configuration:**
- APN settings
- Static IP or dynamic DNS
- VPN tunnel for security

**2. Network Setup:**
```
Meters (GSM) → Mobile Network → VPN → HES Server
```

### LoRaWAN Meters

**1. Install LoRaWAN Gateway**

**2. Configure Network Server:**
```bash
# Use ChirpStack or The Things Network
# Configure application to forward data to HES via MQTT
```

---

## Troubleshooting

### MQTT Connection Issues

**Problem:** Backend can't connect to MQTT
```
❌ Failed to initialize MQTT service
```

**Solutions:**
```bash
# Check if Mosquitto is running
sudo systemctl status mosquitto

# Test MQTT connection
mosquitto_sub -t 'test' -v

# Check firewall
sudo ufw status
sudo ufw allow 1883
```

### No Data from Simulator

**Problem:** Simulator connects but no data in dashboard

**Solutions:**
1. Check meter exists in database with exact ID
2. Verify MQTT topic names match
3. Check backend logs for parsing errors
4. Ensure customer network ID matches

```bash
# Verify meter in database
mongo
use smart-hes-system
db.meters.findOne({meterNumber: "TEST_METER_001"})
```

### Data Not Saving to Database

**Problem:** Data received but not saved

**Solutions:**
1. Check MongoDB connection
2. Verify Consumption model schema matches data
3. Check for validation errors in backend logs

```bash
# Check recent consumption records
db.consumptions.find().sort({timestamp: -1}).limit(5)
```

### High Memory Usage

**Problem:** Server using too much memory

**Solutions:**
```bash
# Limit meter reading frequency
# In .env:
METER_READ_INTERVAL=60  # Change from 30 to 60 minutes

# Limit concurrent reads
# In meterScheduler.service.ts:
const batchSize = 5;  # Reduce from 10 to 5
```

### SSL/TLS for MQTT

**For Production:**
```bash
# Generate certificates
sudo apt install certbot
sudo certbot certonly --standalone -d mqtt.yourdomain.com

# Configure Mosquitto with TLS
sudo nano /etc/mosquitto/conf.d/ssl.conf
```

```
listener 8883
cafile /etc/letsencrypt/live/mqtt.yourdomain.com/chain.pem
certfile /etc/letsencrypt/live/mqtt.yourdomain.com/cert.pem
keyfile /etc/letsencrypt/live/mqtt.yourdomain.com/privkey.pem
```

---

## Performance Tips

### Optimize MongoDB

```javascript
// Create indexes
db.consumptions.createIndex({ meter: 1, timestamp: -1 })
db.consumptions.createIndex({ customerNetwork: 1, timestamp: -1 })

// Use time-series collections (MongoDB 5.0+)
db.createCollection("meter_readings", {
  timeseries: {
    timeField: "timestamp",
    metaField: "meterId",
    granularity: "minutes"
  }
})
```

### Scale Horizontally

**Load Balancer:**
```nginx
upstream hes_backend {
    server backend1:5000;
    server backend2:5000;
}
```

**MQTT Clustering:**
```bash
# Use EMQ X or VerneMQ for clustered MQTT
```

---

## Monitoring

### PM2 Monitoring

```bash
pm2 monit
pm2 status
pm2 logs hes-backend --lines 100
```

### System Status Endpoint

```bash
curl http://localhost:5000/api/meter-control/status
```

Response:
```json
{
  "success": true,
  "data": {
    "schedulerRunning": true,
    "mqttConnected": true,
    "statistics": {
      "totalMeters": 150,
      "activeMeters": 145,
      "onlineMeters": 142,
      "recentlyActiveMeters": 140,
      "offlineMeters": 10
    }
  }
}
```

---

## Cost Estimates

### Development/Testing
- **Local**: Free
- **Oracle Cloud Free Tier**: $0/month (Forever!)
- **DigitalOcean**: $6/month

### Production (1000 meters)
- **Oracle Cloud**: $10-20/month
- **DigitalOcean**: $20-40/month
- **AWS**: $30-60/month

---

## Next Steps

1. ✅ Set up local testing environment
2. ✅ Test with simulator
3. ✅ Deploy to cloud
4. ✅ Test meter commands
5. ⬜ Connect real meters
6. ⬜ Monitor performance
7. ⬜ Scale as needed

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/Oadeshina55/smart-hes-system/issues
- Check logs: `pm2 logs hes-backend`
- Monitor MQTT: `mosquitto_sub -t 'meter/#' -v`

Happy meter monitoring! 📊⚡
