# Multi-Tenant Architecture Transformation

## 📋 Overview

This document describes the complete transformation of the Smart HES system from a geographical area-based architecture to a multi-tenant customer network-based architecture.

### Previous Architecture
- **Areas**: Geographical regions (Ikorodu, Benin)
- **Customers**: End-users/electricity consumers
- Single admin manages all meters

### New Architecture
- **CustomerNetwork**: Utility companies (Urabus, Cooperative 1)
- **EndCustomer**: Actual electricity consumers
- **Parent Company**: New Hampshire (HES provider)
- Multi-tenant with network isolation

---

## ✅ PHASE 1: COMPLETED - Models & Core Infrastructure

### New Models Created

#### 1. CustomerNetwork Model
**Location**: `/smaer-hes-backend/src/models/CustomerNetwork.model.ts`

Represents utility companies/networks:
- `networkName`: e.g., "Urabus", "Cooperative 1"
- `networkCode`: Unique identifier
- `parentCompany`: "New Hampshire"
- `contactInfo`: Email, phone, address
- `serviceArea`: Optional geographical reference
- `meterCount`, `endCustomerCount`, `activeMeters`: Statistics
- `subscriptionStatus`: active, suspended, trial, expired
- `settings.canAddMeters`, `canAddCustomers`, `canManageOperators`

#### 2. EndCustomer Model
**Location**: `/smaer-hes-backend/src/models/EndCustomer.model.ts`

Represents actual electricity consumers:
- Links to `customerNetwork` (required)
- `meter` and `endCustomer` fields
- `prepaymentData`: STS keys, TID counter, credit balance
- Billing information

### Updated Models

#### 3. User Model
**Changes**:
- Added role: `'customer-operator'` (manages a network)
- Added `customerNetwork` field
- `assignedAreas` marked as DEPRECATED

#### 4. Meter Model
**Changes**:
- Added `customerNetwork` field (required)
- Added `endCustomer` field
- `area` and `customer` marked as DEPRECATED
- New indexes for network-based queries

### Migration Script
**Location**: `/smaer-hes-backend/src/scripts/migrate-to-multi-tenant.ts`

**Run with**:
```bash
cd smaer-hes-backend
npx ts-node src/scripts/migrate-to-multi-tenant.ts
```

**What it does**:
1. Converts all Areas → CustomerNetworks
2. Converts all Customers → EndCustomers
3. Updates all Meters with customerNetwork
4. Updates Users with network assignments
5. Updates statistics

⚠️ **IMPORTANT**: Backup database before running!

### Middleware Updates
**Location**: `/smaer-hes-backend/src/middleware/auth.middleware.ts`

**New Functions**:
- `getNetworkFilter(user)`: Returns network-based filter
- `hasAccessToNetwork(user, networkId)`: Permission check

**Deprecated Functions** (kept for compatibility):
- `getAreaFilter(user)`
- `hasAccessToArea(user, areaId)`

### Routes Created
**Location**: `/smaer-hes-backend/src/routes/customerNetwork.routes.ts`

- `POST /customer-networks` - Create network (admin only)
- `GET /customer-networks` - List networks (admin/operator)
- `GET /customer-networks/:id` - Get network details
- `PUT /customer-networks/:id` - Update network (admin only)
- `GET /customer-networks/:id/stats` - Network statistics
- `DELETE /customer-networks/:id` - Deactivate network

---

## 🚧 PHASE 2: PENDING - Backend Routes & API

### Routes to Update

#### 1. Meter Routes
**File**: `/smaer-hes-backend/src/routes/meter.routes.ts`

**Changes needed**:
- Replace `getAreaFilter()` with `getNetworkFilter()`
- Update meter creation to require `customerNetwork`
- Update authorization for customer-operators
- Add endpoints for customer-operators to add meters

#### 2. Dashboard Routes
**File**: `/smaer-hes-backend/src/routes/dashboard.routes.ts`

**Changes needed**:
- Admin dashboard: Show "New Hampshire Capital-HES System"
- Admin dashboard: Total customers = count of CustomerNetworks
- Customer dashboard: Show "{NetworkName} Head End System"
- Customer dashboard: Total customers = count of EndCustomers with meters
- Network-based statistics filtering

#### 3. End Customer Routes
**New file needed**: `/smaer-hes-backend/src/routes/endCustomer.routes.ts`

**Endpoints to create**:
- POST /end-customers - Add end customer (customer-operator can add)
- GET /end-customers - List end customers (filtered by network)
- GET /end-customers/:id - Get end customer details
- PUT /end-customers/:id - Update end customer
- DELETE /end-customers/:id - Deactivate end customer

#### 4. User Routes
**File**: `/smaer-hes-backend/src/routes/user.routes.ts`

**Changes needed**:
- Support creating customer-operator users
- Link customer-operators to their network
- Network-based user filtering

---

## 🚧 PHASE 3: PENDING - Frontend Updates

### Dashboard Updates

#### 1. Admin Dashboard
**File**: `/smart-hes-frontend/src/pages/Dashboard/Dashboard.tsx`

**Changes needed**:
- Header: "New Hampshire Capital-HES System"
- Total Customers card: Show count of `CustomerNetworks`
- Add "Customer Networks" section showing all utilities
- Update statistics to aggregate across all networks

#### 2. Customer-Operator Dashboard
**Same file, conditional rendering**:
- Header: "{NetworkName} Head End System" (e.g., "Urabus Head End System")
- Total Customers card: Show count of `EndCustomers` with meters in their network
- Statistics filtered to their network only
- Show only their network's meters

### Navigation & Access

#### 3. Update Sidebar
**File**: `/smart-hes-frontend/src/layouts/DashboardLayout.tsx`

**Changes needed**:
- Show "Customer Networks" menu for admin
- Show "My Customers" menu for customer-operators
- Hide system admin features from customer-operators

### Pages to Create/Update

#### 4. Customer Networks Page (Admin)
**New file**: `/smart-hes-frontend/src/pages/CustomerNetworks/NetworkManagement.tsx`

**Features**:
- List all utility companies
- Add new network
- View/edit network details
- View network statistics
- Manage network operators

#### 5. End Customers Page
**Update**: `/smart-hes-frontend/src/pages/Customers/CustomerManagement.tsx`

**Changes**:
- Filter by customerNetwork for customer-operators
- Allow customer-operators to add their own end customers
- Show network name in customer list

#### 6. Meters Page
**Update**: `/smart-hes-frontend/src/pages/Meters/MeterManagement.tsx`

**Changes**:
- Filter by customerNetwork instead of area
- Allow customer-operators to add meters to their network
- Show network name instead of area name

---

## 🚧 PHASE 4: PENDING - OBIS Priority Data Implementation

### Priority OBIS Data Points (From Requirements)

#### Billing & Revenue (Highest Priority)
1. **Cumulative Active Energy (kWh)** - Priority 1
   - OBIS: `1-0:1.8.0.255`
   - Revenue calculation primary index

2. **Cumulative Reactive Energy (kVARh)**
   - OBIS: `1-0:3.8.0.255`

3. **Instantaneous Active Power (kW)** - Priority 6
   - OBIS: `1-0:1.7.0.255`

4. **Time-of-Use (TOU) Energy**
   - Peak: `1-0:1.8.1.255`
   - Off-Peak: `1-0:1.8.2.255`

5. **Maximum Demand** - With timestamp
   - OBIS: `1-0:1.6.0.255`

#### Security & Vending
6. **Current Credit/Unit Balance** - Priority 3
   - Prepaid meter balance

7. **Transaction Identifier (TID) Counter** - Priority 8
   - Prevent token replay attacks

8. **STS Keys**
   - Key Revision Number (KRN)
   - Supplier Group Code (SGC)

#### Diagnostics
9. **Connection Status** - Priority 4
   - Connected/Disconnected/Tripped

10. **Instantaneous Voltage** - Priority 7
    - Per phase: A, B, C

11. **Communication Signal Strength (RSSI)** - Priority 10
    - GSM/GPRS signal quality

#### Events & Alarms
12. **Last Tamper Event** - Priority 2
    - Cover open, magnetic field, reverse flow

13. **Power Outage/Restoration** - Priority 5
    - Last outage timestamp

14. **Load Profile Data** - Priority 9
    - 15/30/60 minute intervals

### Implementation Tasks
1. Create OBIS mapping for all 14 priority parameters
2. Add to RealTimeMonitoring page
3. Add to MeterReading page
4. Create dedicated "Priority Metrics" dashboard
5. Add alerts for critical parameters

---

## 🚧 PHASE 5: PENDING - Customer Self-Service

### Features to Implement

#### 1. Customer-Operator Can Add Meters
- API endpoint: `POST /meters` (authorize customer-operator)
- Automatically set `customerNetwork` from user's network
- Validate meter number format
- SIM card assignment

#### 2. Customer-Operator Can Add End Customers
- API endpoint: `POST /end-customers`
- Link to their network automatically
- Account number generation
- Meter assignment

#### 3. Customer-Operator Can Manage Operators
- Add sub-operators within their network
- Assign permissions
- View operator activity

---

## 🔧 Required Configuration Changes

### 1. Environment Variables
No new env vars needed, but update if using:
```env
PARENT_COMPANY_NAME=New Hampshire
```

### 2. Database Indexes
Migration script creates all necessary indexes automatically.

### 3. Package Dependencies
Check `package.json` - no new dependencies required.

---

## 📊 Testing Checklist

### After Migration
- [ ] Run migration script successfully
- [ ] Verify all areas converted to networks
- [ ] Verify all customers converted to end customers
- [ ] Verify all meters have customerNetwork
- [ ] Verify statistics are correct

### API Testing
- [ ] Admin can create customer networks
- [ ] Admin can view all networks
- [ ] Customer-operator can only see their network
- [ ] Customer-operator can add meters to their network
- [ ] Customer-operator can add end customers
- [ ] Network filtering works correctly

### Frontend Testing
- [ ] Admin dashboard shows "New Hampshire Capital-HES"
- [ ] Customer dashboard shows "{NetworkName} Head End System"
- [ ] Statistics are calculated correctly
- [ ] Network isolation is enforced
- [ ] Customer-operators can self-service

---

## 🚀 Deployment Plan

### Step 1: Database Migration (Production)
```bash
# 1. Backup database
mongodump --uri="mongodb://..." --out=/backup/pre-migration

# 2. Run migration
npx ts-node src/scripts/migrate-to-multi-tenant.ts

# 3. Verify migration
# Check CustomerNetwork count
# Check EndCustomer count
# Check meters have customerNetwork

# 4. If issues, restore backup
mongorestore /backup/pre-migration
```

### Step 2: Deploy Backend
```bash
cd smaer-hes-backend
npm install
npm run build
pm2 restart smart-hes-backend
```

### Step 3: Deploy Frontend
```bash
cd smart-hes-frontend
npm install
npm run build
# Copy build folder to web server
```

### Step 4: Post-Deployment
- Update customer network contact information
- Assign customer-operators to networks
- Test end-to-end workflows
- Monitor logs for errors

---

## 📝 Notes & Considerations

### Backward Compatibility
- Old `area` and `customer` fields kept in Meter model
- Old `assignedAreas` field kept in User model
- Old API endpoints still work (deprecated)
- Can run both systems in parallel during transition

### Performance
- New indexes created for `customerNetwork` filtering
- Compound indexes for common queries
- Statistics pre-calculated and cached

### Security
- Network isolation enforced at middleware level
- Customer-operators cannot access other networks
- Admin retains full access
- Audit trail tracks all network operations

---

## 📞 Support

For questions or issues during implementation:
1. Review this document
2. Check migration script logs
3. Test in development environment first
4. Keep database backups

---

**Last Updated**: December 8, 2024
**Status**: Phase 1 Complete, Phases 2-5 Pending
**Version**: 1.0.0
