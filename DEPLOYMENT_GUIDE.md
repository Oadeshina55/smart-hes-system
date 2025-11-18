# Smart HES System - Comprehensive Deployment Guide

Complete deployment guide for the Smart Head End System (HES) with DLMS/COSEM integration.

## Table of Contents

1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Development Environment Setup](#development-environment-setup)
5. [Production Deployment](#production-deployment)
6. [Configuration](#configuration)
7. [Testing](#testing)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Security Considerations](#security-considerations)

---

## System Overview

The Smart HES System is a comprehensive Head End System for managing Hexing and Hexcell smart meters via DLMS/COSEM protocol.

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Material-UI (MUI) for components
- React Query for data fetching
- Socket.IO for real-time updates
- Recharts for visualization

**Backend:**
- Node.js with Express.js and TypeScript
- MongoDB for data storage
- Socket.IO for WebSocket communication
- JWT authentication

**Python DLMS Service:**
- FastAPI for REST API
- Gurux DLMS library (cross-platform)
- Vendor DLL support (Windows only)
- Connection pooling

### Key Features

- ✅ OBIS-based parameter grouping and categorization
- ✅ Batch reading (30-60x faster than sequential)
- ✅ Real meter number validation (Hexing: 145*, Hexcell: 46*)
- ✅ Vendor software integration (DLLs, configurations)
- ✅ Python/DLL bridge for meter communication
- ✅ Professional Material-UI frontend
- ✅ Error boundaries and loading states
- ✅ Real-time monitoring dashboard

---

## Prerequisites

### Hardware Requirements

**Development:**
- CPU: 4+ cores
- RAM: 8GB minimum, 16GB recommended
- Storage: 20GB+ free space
- Network: Stable internet connection

**Production:**
- CPU: 8+ cores
- RAM: 16GB minimum, 32GB recommended
- Storage: 100GB+ SSD
- Network: Low-latency connection to meters

### Software Requirements

#### All Environments

- **Node.js:** v18.x or v20.x ([Download](https://nodejs.org/))
- **npm:** v9.x or later (comes with Node.js)
- **MongoDB:** v6.x or later ([Download](https://www.mongodb.com/try/download/community))
- **Python:** 3.8+ ([Download](https://www.python.org/downloads/))
- **Git:** Latest version ([Download](https://git-scm.com/downloads))

#### Windows (for DLL Support)

- **Visual C++ Redistributable** ([Download](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist))
- **Windows 10/11** or Windows Server 2019+

#### Linux (Production)

- **Ubuntu 22.04 LTS** or **CentOS 8+** recommended
- **systemd** for service management
- **nginx** for reverse proxy
- **PM2** or **systemd** for process management

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│          Users (Web Browsers)                   │
└────────────────┬────────────────────────────────┘
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────────────┐
│          Nginx Reverse Proxy                    │
│  - SSL/TLS Termination                          │
│  - Load Balancing                               │
│  - Static File Serving                          │
└──────────┬────────────────────┬─────────────────┘
           │                    │
           ▼                    ▼
┌──────────────────┐  ┌──────────────────────────┐
│  Frontend (3000) │  │  Backend API (5000)      │
│  - React SPA     │  │  - Express.js            │
│  - Material-UI   │  │  - JWT Auth              │
│  - Socket.IO     │  │  - MongoDB ODM           │
└──────────────────┘  └─────────┬────────────────┘
                                │
                                ▼
                ┌───────────────────────────────────┐
                │  Python DLMS Service (8001)       │
                │  - FastAPI REST API               │
                │  - Gurux DLMS / Vendor DLLs       │
                │  - Connection Pooling             │
                └───────┬───────────────────────────┘
                        │ TCP/IP or Serial
                        ▼
                ┌───────────────────────────────────┐
                │  Smart Meters (Field)             │
                │  - Hexing HXE Series              │
                │  - Hexcell HCE Series             │
                │  - DLMS/COSEM Protocol            │
                └───────────────────────────────────┘
```

---

## Development Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/Oadeshina55/smart-hes-system.git
cd smart-hes-system
```

### 2. Backend Setup

```bash
cd smaer-hes-backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-hes
JWT_SECRET=your-development-secret-key
JWT_EXPIRE=30d
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
METER_IP=192.168.1.100
METER_PORT=8080

# Python DLMS Service
PYTHON_DLMS_URL=http://localhost:8001
USE_PYTHON_DLMS=true
EOF

# Start development server
npm run dev
```

Backend will run at `http://localhost:5000`

### 3. Python DLMS Service Setup

```bash
cd ../smaer-hes-backend/python-dlms-service

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env

# Start the service
python src/api.py
```

Python service will run at `http://localhost:8001`

**Alternative (Docker):**
```bash
cd python-dlms-service
docker-compose up -d
```

### 4. Frontend Setup

```bash
cd ../../smart-hes-frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will run at `http://localhost:3000`

### 5. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB Community Edition
# Ubuntu:
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### 6. Verify Installation

```bash
# Check backend
curl http://localhost:5000/health

# Check Python DLMS service
curl http://localhost:8001/health

# Check frontend
open http://localhost:3000
```

---

## Production Deployment

### Option 1: Traditional Server Deployment

#### Step 1: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.10+
sudo apt install -y python3.10 python3.10-venv python3-pip

# Install MongoDB
# (See MongoDB setup section above)

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

#### Step 2: Deploy Backend

```bash
# Create deployment directory
sudo mkdir -p /opt/smart-hes-system
sudo chown $USER:$USER /opt/smart-hes-system
cd /opt/smart-hes-system

# Clone repository
git clone https://github.com/Oadeshina55/smart-hes-system.git .

# Install backend dependencies
cd smaer-hes-backend
npm install --production

# Create production .env
cat > .env << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-hes
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=7d
CORS_ORIGIN=https://yourdomain.com
NODE_ENV=production
PYTHON_DLMS_URL=http://localhost:8001
USE_PYTHON_DLMS=true
EOF

# Build TypeScript
npm run build

# Start with PM2
pm2 start dist/server.js --name "hes-backend"
pm2 save
pm2 startup
```

#### Step 3: Deploy Python DLMS Service

```bash
cd /opt/smart-hes-system/smaer-hes-backend/python-dlms-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create systemd service
sudo tee /etc/systemd/system/dlms-service.service > /dev/null <<EOF
[Unit]
Description=DLMS Communication Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/smart-hes-system/smaer-hes-backend/python-dlms-service
Environment="PATH=/opt/smart-hes-system/smaer-hes-backend/python-dlms-service/venv/bin"
ExecStart=/opt/smart-hes-system/smaer-hes-backend/python-dlms-service/venv/bin/uvicorn src.api:app --host 0.0.0.0 --port 8001 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable dlms-service
sudo systemctl start dlms-service
```

#### Step 4: Deploy Frontend

```bash
cd /opt/smart-hes-system/smart-hes-frontend

# Install dependencies
npm install

# Build for production
npm run build

# Serve with nginx (configured in next step)
```

#### Step 5: Configure Nginx

```bash
# Create nginx configuration
sudo tee /etc/nginx/sites-available/smart-hes << EOF
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /opt/smart-hes-system/smart-hes-frontend/build;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Python DLMS Service (internal only - not exposed publicly)
    # location /dlms/ {
    #     proxy_pass http://localhost:8001/;
    # }

    client_max_body_size 100M;
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/smart-hes /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

#### Step 6: SSL/TLS with Let's Encrypt

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

---

### Option 2: Docker Deployment

#### Step 1: Create Docker Compose Configuration

```bash
cd /opt/smart-hes-system

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: hes-mongodb
    restart: always
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    ports:
      - "27017:27017"
    networks:
      - hes-network

  backend:
    build:
      context: ./smaer-hes-backend
      dockerfile: Dockerfile
    container_name: hes-backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGODB_URI=mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/smart-hes?authSource=admin
      - JWT_SECRET=${JWT_SECRET}
      - PYTHON_DLMS_URL=http://dlms-service:8001
      - USE_PYTHON_DLMS=true
    depends_on:
      - mongodb
      - dlms-service
    networks:
      - hes-network

  dlms-service:
    build:
      context: ./smaer-hes-backend/python-dlms-service
      dockerfile: Dockerfile
    container_name: hes-dlms-service
    restart: always
    ports:
      - "8001:8001"
    volumes:
      - ./smaer-hes-backend/uploads:/app/uploads:ro
    networks:
      - hes-network

  frontend:
    build:
      context: ./smart-hes-frontend
      dockerfile: Dockerfile
    container_name: hes-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - hes-network

volumes:
  mongodb_data:

networks:
  hes-network:
    driver: bridge
EOF

# Create .env for Docker Compose
cat > .env << EOF
MONGO_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
EOF
```

#### Step 2: Create Dockerfiles

**Backend Dockerfile:**
```bash
cd smaer-hes-backend

cat > Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["node", "dist/server.js"]
EOF
```

**Frontend Dockerfile:**
```bash
cd ../smart-hes-frontend

cat > Dockerfile << 'EOF'
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF

# Create nginx.conf
cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://backend:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://backend:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
```

#### Step 3: Deploy with Docker

```bash
cd /opt/smart-hes-system

# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

---

## Configuration

### Environment Variables

#### Backend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Backend server port | `5000` | Yes |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRE` | JWT token expiration | `30d` | No |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:3000` | Yes |
| `NODE_ENV` | Environment | `development` | Yes |
| `PYTHON_DLMS_URL` | Python service URL | `http://localhost:8001` | Yes |
| `USE_PYTHON_DLMS` | Enable Python service | `true` | No |

#### Python DLMS Service (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DLMS_SERVICE_PORT` | Service port | `8001` | No |
| `ENV` | Environment | `development` | No |
| `LOG_LEVEL` | Logging level | `INFO` | No |
| `DEFAULT_TIMEOUT` | Connection timeout (ms) | `30000` | No |

---

## Testing

### Backend Tests

```bash
cd smaer-hes-backend
npm test
```

### Frontend Tests

```bash
cd smart-hes-frontend
npm test
```

### Python Service Tests

```bash
cd python-dlms-service
pytest tests/
```

### End-to-End Testing

```bash
# Test meter connection
curl -X POST http://localhost:8001/connect \
  -H "Content-Type: application/json" \
  -d '{
    "meter_number": "14512345678",
    "brand": "hexing",
    "connection_type": "tcp",
    "ip_address": "192.168.1.100",
    "port": 4059
  }'

# Test OBIS read
curl -X POST http://localhost:8001/read \
  -H "Content-Type: application/json" \
  -d '{
    "meter_number": "14512345678",
    "obis_code": "1-0:1.8.0.255",
    "class_id": 3,
    "attribute_id": 2
  }'
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Backend health
curl http://localhost:5000/health

# Python DLMS service health
curl http://localhost:8001/health

# MongoDB health
mongo --eval "db.adminCommand('ping')"
```

### Log Monitoring

**PM2 Logs:**
```bash
pm2 logs hes-backend
pm2 logs hes-backend --lines 1000
```

**Python Service Logs:**
```bash
# Systemd
sudo journalctl -u dlms-service -f

# Docker
docker logs -f hes-dlms-service
```

### Performance Monitoring

```bash
# PM2 monitoring
pm2 monit

# System resources
htop
```

### Database Backups

```bash
# Backup MongoDB
mongodump --uri="mongodb://localhost:27017/smart-hes" --out=/backups/$(date +%Y%m%d)

# Restore MongoDB
mongorestore --uri="mongodb://localhost:27017/smart-hes" /backups/20250116
```

### Updates

```bash
# Pull latest code
cd /opt/smart-hes-system
git pull origin main

# Update backend
cd smaer-hes-backend
npm install
npm run build
pm2 restart hes-backend

# Update Python service
cd python-dlms-service
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart dlms-service

# Update frontend
cd ../../smart-hes-frontend
npm install
npm run build
# Nginx will serve updated build automatically
```

---

## Troubleshooting

### Common Issues

#### Backend Not Starting

**Symptom:** Backend fails to start or crashes immediately

**Solutions:**
1. Check MongoDB connection:
   ```bash
   mongo --eval "db.adminCommand('ping')"
   ```
2. Verify .env configuration
3. Check port availability:
   ```bash
   sudo lsof -i :5000
   ```
4. Review logs:
   ```bash
   pm2 logs hes-backend --err
   ```

#### Python Service Connection Errors

**Symptom:** `Connection timeout` or `DLL not found`

**Solutions:**
1. Verify service is running:
   ```bash
   curl http://localhost:8001/health
   ```
2. Check DLL paths (Windows):
   ```bash
   ls uploads/DLMS\ MD/WinDLMSClientDLL.dll
   ```
3. Verify Gurux library installation:
   ```bash
   pip list | grep gurux
   ```

#### Meter Communication Failures

**Symptom:** Cannot read from meters

**Solutions:**
1. Verify meter IP/port:
   ```bash
   ping 192.168.1.100
   telnet 192.168.1.100 4059
   ```
2. Check meter configuration
3. Verify OBIS codes are correct
4. Review Python service logs

#### Frontend Build Errors

**Symptom:** `npm run build` fails

**Solutions:**
1. Clear node_modules:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Check TypeScript errors:
   ```bash
   npm run type-check
   ```

---

## Security Considerations

### Production Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall (UFW, iptables)
- [ ] Restrict MongoDB access (bind to localhost or use authentication)
- [ ] Use environment variables for secrets (never commit .env)
- [ ] Enable rate limiting on API endpoints
- [ ] Implement API key authentication for Python service
- [ ] Regular security updates (`apt update && apt upgrade`)
- [ ] Configure CORS properly (whitelist specific domains)
- [ ] Enable MongoDB authentication
- [ ] Backup encryption keys securely
- [ ] Set up monitoring and alerting
- [ ] Regular database backups
- [ ] Log rotation and retention policies

### Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct access to backend (proxy through nginx)
# sudo ufw deny 5000/tcp
# sudo ufw deny 8001/tcp

# Enable firewall
sudo ufw enable
```

### MongoDB Security

```bash
# Enable authentication
mongo
> use admin
> db.createUser({
    user: "admin",
    pwd: "strong_password",
    roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
  })

# Update MongoDB config
sudo nano /etc/mongod.conf

# Add:
security:
  authorization: enabled
```

---

## Support

For issues or questions:
- **GitHub Issues:** https://github.com/Oadeshina55/smart-hes-system/issues
- **Email:** support@newhampshirecapital.com
- **Documentation:** See README.md files in each directory

---

## License

Proprietary - New Hampshire Capital

---

**Last Updated:** 2025-11-16
**Version:** 1.0.0
