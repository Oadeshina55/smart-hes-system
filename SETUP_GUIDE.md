# Smart HES System - Complete Setup & Deployment Checklist

This comprehensive guide covers everything needed to make the Smart HES system fully operational.

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Database Setup (MongoDB)](#database-setup-mongodb)
3. [Backend Setup](#backend-setup)
4. [Python DLMS Service Setup](#python-dlms-service-setup)
5. [Frontend Setup](#frontend-setup)
6. [Environment Configuration](#environment-configuration)
7. [Testing the System](#testing-the-system)
8. [Initial Data Setup](#initial-data-setup)
9. [Deployment Checklist](#deployment-checklist)
10. [Troubleshooting](#troubleshooting)

---

## 1. System Requirements

### Hardware Requirements

**Development:**
- CPU: 4+ cores
- RAM: 8GB minimum
- Storage: 20GB free space
- Network: Internet connection

**Production:**
- CPU: 8+ cores
- RAM: 16GB minimum
- Storage: 100GB+ SSD
- Network: Low-latency connection to meters

### Software Requirements

**All Environments:**
- ✅ **Node.js** v18.x or v20.x - [Download](https://nodejs.org/)
- ✅ **MongoDB** v6.0+ - [Download](https://www.mongodb.com/try/download/community)
- ✅ **Python** 3.8+ - [Download](https://www.python.org/downloads/)
- ✅ **Git** - [Download](https://git-scm.com/downloads/)

**Optional (Production):**
- ✅ **PM2** - Process manager: `npm install -g pm2`
- ✅ **Nginx** - Reverse proxy
- ✅ **Docker** - Containerization (optional)

---

## 2. Database Setup (MongoDB)

### Option A: Local MongoDB Installation

#### Ubuntu/Debian:
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

#### macOS:
```bash
# Install using Homebrew
brew tap mongodb/brew
brew update
brew install mongodb-community@6.0

# Start MongoDB
brew services start mongodb-community@6.0

# Verify
brew services list | grep mongodb
```

#### Windows:
1. Download MongoDB Community Server from [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Run the installer
3. Choose "Complete" installation
4. Install as a Windows Service
5. Use default data directory: `C:\data\db`

### Option B: MongoDB Atlas (Cloud)

1. **Create Account:**
   - Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free account

2. **Create Cluster:**
   - Create a free M0 cluster
   - Choose region closest to you
   - Click "Create Cluster"

3. **Configure Access:**
   - Database Access → Add New Database User
   - Create username/password (save these!)
   - Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)

4. **Get Connection String:**
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your password
   - Example: `mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/smart-hes?retryWrites=true&w=majority`

### Create Database and User (Local MongoDB)

```bash
# Connect to MongoDB
mongosh

# Switch to admin database
use admin

# Create admin user
db.createUser({
  user: "admin",
  pwd: "YOUR_STRONG_PASSWORD",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" }
  ]
})

# Create smart-hes database
use smart-hes

# Create hes user for the database
db.createUser({
  user: "hesuser",
  pwd: "ANOTHER_STRONG_PASSWORD",
  roles: [
    { role: "readWrite", db: "smart-hes" }
  ]
})

# Exit
exit
```

### Enable Authentication (Production)

```bash
# Edit MongoDB config
sudo nano /etc/mongod.conf

# Add/uncomment these lines:
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod
```

---

## 3. Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd /path/to/smart-hes-system/smaer-hes-backend
```

### Step 2: Install Dependencies

```bash
# Install all Node.js dependencies
npm install

# This will install:
# - express, mongoose, cors, dotenv
# - TypeScript and type definitions
# - socket.io
# - bcryptjs, jsonwebtoken
# - And all other dependencies from package.json
```

### Step 3: Create Environment File

```bash
# Copy the production example
cp .env.production.example .env

# Edit the .env file
nano .env
```

**Update `.env` with your values:**

```env
# Server
PORT=5000
NODE_ENV=development  # or 'production'

# Database
# For Local MongoDB with auth:
MONGODB_URI=mongodb://hesuser:YOUR_PASSWORD@localhost:27017/smart-hes?authSource=smart-hes

# OR for MongoDB Atlas:
MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/smart-hes?retryWrites=true&w=majority

# Authentication
JWT_SECRET=$(openssl rand -base64 32)  # Generate a strong secret
JWT_EXPIRE=30d

# CORS
CORS_ORIGIN=http://localhost:3000  # Frontend URL (change for production)

# Meter Communication (Legacy - not actively used)
METER_IP=192.168.1.100
METER_PORT=8080

# Python DLMS Service
PYTHON_DLMS_URL=http://localhost:8001
USE_PYTHON_DLMS=true

# Logging
LOG_LEVEL=info
```

**Generate Strong JWT Secret:**
```bash
# Linux/Mac:
openssl rand -base64 32

# Copy the output and use it as JWT_SECRET
```

### Step 4: Build TypeScript

```bash
# Compile TypeScript to JavaScript
npm run build

# This creates the 'dist' folder with compiled JS files
```

### Step 5: Test Backend

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

**Verify Backend is Running:**
```bash
# In another terminal:
curl http://localhost:5000/health

# Expected output:
{
  "status": "ok",
  "timestamp": "2025-11-16T...",
  "mongodb": "connected"
}
```

---

## 4. Python DLMS Service Setup

### Step 1: Navigate to Python Service Directory

```bash
cd /path/to/smart-hes-system/smaer-hes-backend/python-dlms-service
```

### Step 2: Create Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# Linux/Mac:
source venv/bin/activate

# Windows:
venv\Scripts\activate
```

### Step 3: Install Python Dependencies

```bash
# Upgrade pip first
pip install --upgrade pip

# Install all requirements
pip install -r requirements.txt

# This installs:
# - fastapi, uvicorn (web framework)
# - pydantic (data validation)
# - pyserial (serial communication)
# - gurux-dlms (DLMS library)
# - pywin32 (Windows only - for DLL support)
```

**If installation fails:**
```bash
# Try installing without optional dependencies
pip install fastapi uvicorn pydantic python-dotenv pyserial requests

# Then try Gurux libraries separately
pip install gurux-dlms gurux-serial gurux-net
```

### Step 4: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit configuration
nano .env
```

**Update `.env`:**
```env
DLMS_SERVICE_PORT=8001
ENV=development
LOG_LEVEL=INFO
DEFAULT_TIMEOUT=30000
DEFAULT_CLIENT_ADDRESS=16
DEFAULT_SERVER_ADDRESS=1
ENABLE_API_KEY=false
```

### Step 5: Test Python Service

```bash
# Start the service
python src/api.py

# Or with uvicorn directly:
uvicorn src.api:app --host 0.0.0.0 --port 8001 --reload
```

**Verify Python Service:**
```bash
# In another terminal:
curl http://localhost:8001/health

# Expected output:
{
  "status": "healthy",
  "timestamp": "2025-11-16T...",
  "active_connections": 0
}
```

---

## 5. Frontend Setup

### Step 1: Navigate to Frontend Directory

```bash
cd /path/to/smart-hes-system/smart-hes-frontend
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# This may take 5-10 minutes
# Installs React, Material-UI, recharts, axios, etc.
```

**If you get errors:**
```bash
# Try with legacy peer deps
npm install --legacy-peer-deps

# Or clean install
rm -rf node_modules package-lock.json
npm install
```

### Step 3: Create Environment File

```bash
# For development
cp .env.production.example .env.development.local

# Edit the file
nano .env.development.local
```

**Update `.env.development.local`:**
```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000

# Application
REACT_APP_NAME=Smart HES System
REACT_APP_VERSION=1.0.0

# Environment
NODE_ENV=development
```

### Step 4: Test Frontend

```bash
# Start development server
npm start

# Browser should automatically open at http://localhost:3000
```

**Verify Frontend:**
- Browser opens to login page
- No console errors
- Material-UI components load correctly

---

## 6. Environment Configuration

### Complete Environment Setup Summary

#### Backend `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://hesuser:PASSWORD@localhost:27017/smart-hes
JWT_SECRET=<generated-32-char-secret>
JWT_EXPIRE=30d
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
PYTHON_DLMS_URL=http://localhost:8001
USE_PYTHON_DLMS=true
```

#### Python Service `.env`:
```env
DLMS_SERVICE_PORT=8001
ENV=development
LOG_LEVEL=INFO
DEFAULT_TIMEOUT=30000
```

#### Frontend `.env.development.local`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
NODE_ENV=development
```

---

## 7. Testing the System

### Test 1: Health Checks

```bash
# Backend
curl http://localhost:5000/health

# Python DLMS Service
curl http://localhost:8001/health

# Frontend (in browser)
http://localhost:3000
```

### Test 2: Create Admin User

```bash
# Using curl
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "Admin@123456",
    "role": "admin"
  }'

# Or use the frontend registration page
```

### Test 3: Login

```bash
# Via API
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@123456"
  }'

# Save the token from response

# Or login via frontend at http://localhost:3000/login
```

### Test 4: Create Test Data

```bash
# Get your auth token from login response
TOKEN="your-jwt-token-here"

# Create an area
curl -X POST http://localhost:5000/api/areas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Area",
    "region": "Lagos",
    "code": "AREA001"
  }'

# Create a meter
curl -X POST http://localhost:5000/api/meters \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "meterNumber": "14512345678",
    "meterType": "three-phase",
    "brand": "hexing",
    "model": "HXE330",
    "area": "AREA_ID_FROM_ABOVE",
    "ipAddress": "192.168.1.100",
    "port": 4059
  }'
```

---

## 8. Initial Data Setup

### Required Initial Setup

1. **Create Admin User** (via registration or API)
2. **Create Areas/Regions** (for meter organization)
3. **Create Customer Records** (optional)
4. **Import Meters** (via CSV or manually)

### Using the Frontend

1. **Login** as admin
2. **Go to System → Areas** and create areas
3. **Go to Meters → Add Meter** or **Import CSV**
4. **Go to Customers** and add customers (optional)

### Sample CSV for Meter Import

Create `meters.csv`:
```csv
meterNumber,meterType,brand,model,area,ipAddress,port,firmware
14512345678,three-phase,hexing,HXE330,AREA_ID,192.168.1.100,4059,1.0.0
14512345679,three-phase,hexing,HXE330,AREA_ID,192.168.1.101,4059,1.0.0
4612345678,single-phase,hexcell,HCE410,AREA_ID,192.168.1.102,4059,1.0.1
```

Then import via frontend: **Meters → Import CSV**

---

## 9. Deployment Checklist

### Pre-Deployment Checklist

- [ ] MongoDB installed and running with authentication enabled
- [ ] Backend dependencies installed (`npm install`)
- [ ] Python service dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] All `.env` files created and configured
- [ ] Strong JWT_SECRET generated
- [ ] Database user credentials secure
- [ ] Admin user created
- [ ] Test data created (areas, meters)
- [ ] Health checks passing for all services
- [ ] Can login to frontend
- [ ] Can create/view meters in frontend

### Production Deployment Additional Steps

- [ ] Change `NODE_ENV=production` in backend
- [ ] Use production MongoDB credentials
- [ ] Enable MongoDB authentication
- [ ] Configure firewall (allow only necessary ports)
- [ ] Set up SSL/TLS with Let's Encrypt
- [ ] Configure Nginx reverse proxy
- [ ] Set up PM2 for Node.js process management
- [ ] Set up systemd service for Python service
- [ ] Build frontend for production (`npm run build`)
- [ ] Configure environment-specific URLs
- [ ] Set up monitoring and logging
- [ ] Configure automated backups
- [ ] Test all features in production environment

---

## 10. Troubleshooting

### Backend Won't Start

**Problem:** Backend crashes immediately

**Solutions:**
```bash
# Check MongoDB is running
sudo systemctl status mongod

# Check connection string in .env
cat .env | grep MONGODB_URI

# Test MongoDB connection
mongosh "YOUR_MONGODB_URI"

# Check logs
npm run dev
# Look for specific error messages
```

### Python Service Won't Start

**Problem:** Python service fails to start

**Solutions:**
```bash
# Verify virtual environment is activated
which python  # Should show venv path

# Check dependencies
pip list

# Try reinstalling
pip install -r requirements.txt --force-reinstall

# Check for port conflicts
lsof -i :8001  # Linux/Mac
netstat -ano | findstr :8001  # Windows

# Run with verbose logging
python src/api.py
```

### Frontend Build Errors

**Problem:** `npm install` or `npm start` fails

**Solutions:**
```bash
# Clear cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still fails, try:
npm install --legacy-peer-deps

# Check Node version
node --version  # Should be v18 or v20
```

### Cannot Connect to MongoDB

**Problem:** "MongoNetworkError" or "ECONNREFUSED"

**Solutions:**
```bash
# 1. Check MongoDB is running
sudo systemctl status mongod

# 2. Check MongoDB is listening
sudo netstat -tulpn | grep 27017

# 3. Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# 4. Try connecting directly
mongosh

# 5. Verify connection string format
# Local: mongodb://localhost:27017/smart-hes
# With auth: mongodb://user:pass@localhost:27017/smart-hes
# Atlas: mongodb+srv://user:pass@cluster.mongodb.net/smart-hes
```

### CORS Errors in Browser

**Problem:** "Access-Control-Allow-Origin" errors

**Solution:**
```bash
# Check CORS_ORIGIN in backend .env
# Should match frontend URL exactly

# Development:
CORS_ORIGIN=http://localhost:3000

# Production:
CORS_ORIGIN=https://yourdomain.com

# Restart backend after changing
```

### Python Service - DLL Not Found (Windows)

**Problem:** "WinDLMSClientDLL.dll not found"

**Solution:**
```bash
# Verify DLL exists
dir uploads\DLMS MD\WinDLMSClientDLL.dll

# Check path in code matches actual location

# Install Visual C++ Redistributable
# Download from: https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist

# Try using Gurux instead (set in code)
# Edit dlms_client.py and force Gurux usage
```

---

## Quick Start Commands

### Start Everything (Development)

**Terminal 1 - Backend:**
```bash
cd smaer-hes-backend
npm run dev
```

**Terminal 2 - Python Service:**
```bash
cd smaer-hes-backend/python-dlms-service
source venv/bin/activate  # or venv\Scripts\activate on Windows
python src/api.py
```

**Terminal 3 - Frontend:**
```bash
cd smart-hes-frontend
npm start
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Python DLMS: http://localhost:8001

---

## Verification Commands

### Verify All Services Running

```bash
# Check all ports
netstat -tulpn | grep -E '3000|5000|8001|27017'

# Or on Windows
netstat -ano | findstr "3000 5000 8001 27017"

# Expected output should show all 4 ports listening
```

### Quick Health Check Script

Create `health-check.sh`:
```bash
#!/bin/bash

echo "Checking MongoDB..."
mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1 && echo "✅ MongoDB OK" || echo "❌ MongoDB DOWN"

echo "Checking Backend..."
curl -s http://localhost:5000/health > /dev/null && echo "✅ Backend OK" || echo "❌ Backend DOWN"

echo "Checking Python Service..."
curl -s http://localhost:8001/health > /dev/null && echo "✅ Python Service OK" || echo "❌ Python Service DOWN"

echo "Checking Frontend..."
curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend DOWN"
```

Run it:
```bash
chmod +x health-check.sh
./health-check.sh
```

---

## Success Criteria

✅ **System is fully operational when:**

1. MongoDB is running and accepting connections
2. Backend responds to `/health` endpoint
3. Python DLMS service responds to `/health` endpoint
4. Frontend loads without errors in browser
5. Can register and login
6. Can create areas and meters
7. Can navigate all pages without errors
8. Can request load profile (even if meter not connected)
9. Can view power quality dashboard
10. All console errors are resolved

---

## Next Steps After Setup

1. **Add Real Meters:** Configure actual meter IP addresses
2. **Test DLMS Communication:** Try reading from a real meter
3. **Configure Tariffs:** Set up billing tariffs
4. **Import Customer Data:** Add customer records
5. **Set Up Alerts:** Configure alert rules
6. **Schedule Jobs:** Set up automated meter reading schedules
7. **Deploy to Production:** Follow production deployment guide

---

## Support Resources

- **MongoDB Documentation:** https://www.mongodb.com/docs/
- **Node.js Documentation:** https://nodejs.org/docs/
- **Python FastAPI Documentation:** https://fastapi.tiangolo.com/
- **React Documentation:** https://react.dev/
- **Material-UI Documentation:** https://mui.com/

---

**Last Updated:** 2025-11-16
**Version:** 1.0.0
