# Feature Implementation Guide

This document describes the two major features implemented in the Smart HES system:

1. **Meter Settings Page with Read-Then-Write Workflow**
2. **Area-Based Access Control for Customer Users**

---

## 1. Meter Settings Page with Read-Then-Write Workflow

### Overview
The Meter Settings page allows operators to configure writeable parameters on meters. It implements a safe read-then-write workflow where operators must first read the current values from the meter before making any changes.

### Features
- **Display Only Writeable Parameters**: Only shows OBIS parameters with write access (accessRight: 'W' or 'RW')
- **Read Current Values**: Reads current parameter values from the physical meter before allowing writes
- **Individual Parameter Write**: Write parameters one at a time with immediate feedback
- **Grouped Display**: Parameters are organized by category (e.g., Clock, Billing, Demand, etc.)
- **Safety**: Always shows current value vs new value side-by-side before writing

### User Workflow

#### Step 1: Load Writeable Parameters
1. Navigate to **Meters > Meter Settings**
2. Enter the meter ID or meter number
3. Click **"Fetch Writeable Parameters"**
4. System displays all writeable OBIS parameters grouped by category

#### Step 2: Read Current Values
1. Click **"Read Meter Values"** to fetch current values from the physical meter
2. System displays current values next to each parameter
3. Operators can now see what the current settings are

#### Step 3: Write New Values
1. Enter new value in the input field next to the parameter
2. Click **"Write"** button for that specific parameter
3. System writes the new value to the meter
4. After successful write, system automatically re-reads the meter to show updated value

### Technical Implementation

#### Frontend (`smart-hes-frontend/src/pages/Meters/MeterSettings.tsx`)
```typescript
// Three main functions:
1. fetchWriteableParameters() - GET /meters/:id/writeable-parameters
2. readMeterValues() - POST /meters/:id/read-current-values
3. writeParameter() - POST /meters/:id/write-obis
```

#### Backend Endpoints

**GET `/api/meters/:id/writeable-parameters`**
- Returns only writeable OBIS parameters for the meter
- Filters parameters where `accessRight` includes 'W' or 'RW'
- Groups parameters by category
- Location: `smaer-hes-backend/src/routes/meter.routes.ts:430`

**POST `/api/meters/:id/read-current-values`**
- Reads current values from physical meter
- Request body: `{ obisCodes: string[] }`
- Uses meter polling service to communicate with meter
- Location: `smaer-hes-backend/src/routes/meter.routes.ts:488`

**POST `/api/meters/:id/write-obis`**
- Writes a single OBIS value to the meter
- Request body: `{ obisCode: string, value: any }`
- Validates meter connection before writing
- Location: `smaer-hes-backend/src/routes/meter.routes.ts` (existing endpoint)

### Example Usage

```javascript
// 1. Fetch writeable parameters
GET /api/meters/507f1f77bcf86cd799439011/writeable-parameters
Response: {
  writeableParameters: [
    {
      name: "Clock & Time Parameters",
      items: [
        { code: "0-0:1.0.0", name: "Clock", accessRight: "RW", ... }
      ]
    }
  ],
  totalCount: 25
}

// 2. Read current values
POST /api/meters/507f1f77bcf86cd799439011/read-current-values
Body: { obisCodes: ["0-0:1.0.0", "0-0:96.1.0"] }
Response: {
  readings: [
    { obisCode: "0-0:1.0.0", value: "2025-11-29T10:30:00Z", ... }
  ]
}

// 3. Write new value
POST /api/meters/507f1f77bcf86cd799439011/write-obis
Body: { obisCode: "0-0:1.0.0", value: "2025-11-29T11:00:00Z" }
```

---

## 2. Area-Based Access Control for Customer Users

### Overview
Customer users can be restricted to specific geographic areas. They will only see meters, consumption data, and dashboard statistics from their assigned areas. Admin and operator users have access to all areas.

### Features
- **Area Assignment**: Assign one or more areas to customer users
- **Automatic Filtering**: All meter and dashboard queries automatically filter by assigned areas
- **Visual Indicators**: UI shows which areas a customer has access to
- **Registration Support**: Areas can be assigned during user creation
- **Dashboard Restrictions**: Customer dashboards only show data from assigned areas

### User Workflow

#### For Administrators: Assigning Areas to Customers

1. Navigate to **Advanced > User Access Control**
2. Find the customer user in the table
3. Click the **Edit** icon (pencil) next to the user
4. In the dialog:
   - The **"Area Access Control"** section appears for customer users
   - Click on area cards to select/deselect areas
   - Selected areas have a blue border and checkbox
5. Click **"Save Permissions"** to save the changes

#### For Customer Users: Viewing Their Data

1. Customer logs in with their credentials
2. Dashboard automatically shows only data from their assigned areas:
   - Total meters count (only from assigned areas)
   - Active meters count (only from assigned areas)
   - Consumption data (only from assigned areas)
   - Top consumers (only from assigned areas)
3. Meters page shows only meters from assigned areas
4. All reports and analytics filtered to assigned areas

### Technical Implementation

#### Backend Models

**User Model** (`smaer-hes-backend/src/models/User.model.ts`)
```typescript
interface IUser {
  // ... existing fields
  assignedAreas?: mongoose.Types.ObjectId[]; // For customer role
}
```

**Customer Model** (`smaer-hes-backend/src/models/Customer.model.ts`)
```typescript
interface ICustomer {
  // ... existing fields
  assignedAreas?: mongoose.Types.ObjectId[];
}
```

#### Auth Middleware

**Area Filter Helper** (`smaer-hes-backend/src/middleware/auth.middleware.ts:104`)
```typescript
export const getAreaFilter = (user?: IUser): any => {
  // Admin/operator: no filtering (access all areas)
  if (!user || user.role === 'admin' || user.role === 'operator') {
    return null;
  }

  // Customer with assigned areas: filter by those areas
  if (user.role === 'customer' && user.assignedAreas && user.assignedAreas.length > 0) {
    return { area: { $in: user.assignedAreas } };
  }

  // Customer with no assigned areas: return filter that matches nothing
  return { area: { $in: [] } };
};
```

#### Route Implementations

**Meter Routes** (`smaer-hes-backend/src/routes/meter.routes.ts:206`)
```typescript
// GET /api/meters - List all meters
router.get('/', authenticate, async (req: any, res) => {
  const filter: any = {};

  // Apply area-based filtering for customer users
  const areaFilter = getAreaFilter(req.user);
  if (areaFilter) {
    Object.assign(filter, areaFilter);
  }

  const meters = await Meter.find(filter);
  // ...
});
```

**Dashboard Routes** (`smaer-hes-backend/src/routes/dashboard.routes.ts`)
- Line 21: `/stats` endpoint - filtered by area
- Line 124: `/consumption-chart` endpoint - filtered by area
- Line 304: `/top-consumers` endpoint - filtered by area

**Auth Routes** (`smaer-hes-backend/src/routes/auth.routes.ts`)
- Line 102: Registration - accepts `assignedAreas` parameter
- Line 233: Login - populates and returns `assignedAreas` in token
- Line 340: Get current user - populates `assignedAreas`

#### Frontend Implementation

**User Access Control Page** (`smart-hes-frontend/src/pages/Advanced/UserAccessControl.tsx`)
- Displays assigned areas in user table
- Shows area selection dialog for customer users
- Allows selecting/deselecting areas with visual feedback
- Saves assignedAreas when updating customer users

### Database Schema

Areas are stored in the `areas` collection:
```javascript
{
  _id: ObjectId("..."),
  name: "Downtown Commercial",
  code: "DTC-001",
  description: "Downtown commercial district",
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

Users reference areas:
```javascript
{
  _id: ObjectId("..."),
  username: "customer1",
  role: "customer",
  assignedAreas: [
    ObjectId("..."), // Reference to area 1
    ObjectId("...")  // Reference to area 2
  ]
}
```

### API Examples

#### Create User with Area Assignment
```javascript
POST /api/auth/register
{
  "username": "customer1",
  "email": "customer1@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "customer",
  "assignedAreas": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ]
}
```

#### Update User Areas
```javascript
PATCH /api/users/507f1f77bcf86cd799439013
{
  "assignedAreas": [
    "507f1f77bcf86cd799439011"
  ]
}
```

#### Login Response (includes areas)
```javascript
POST /api/auth/login
Response: {
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "507f1f77bcf86cd799439013",
    "username": "customer1",
    "role": "customer",
    "assignedAreas": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Downtown Commercial",
        "code": "DTC-001"
      }
    ]
  }
}
```

---

## Testing Guide

### Testing Meter Settings

1. **Create a Test Meter** (if needed)
   - Ensure meter is online and accessible

2. **Test Writeable Parameters Fetch**
   ```bash
   # Should return only writeable parameters
   GET /api/meters/{meterId}/writeable-parameters
   ```

3. **Test Read Current Values**
   ```bash
   # Should read from physical meter
   POST /api/meters/{meterId}/read-current-values
   {
     "obisCodes": ["0-0:1.0.0", "1-0:1.8.0"]
   }
   ```

4. **Test Write Parameter**
   ```bash
   # Should write to meter
   POST /api/meters/{meterId}/write-obis
   {
     "obisCode": "0-0:1.0.0",
     "value": "2025-11-29T12:00:00Z"
   }
   ```

### Testing Area-Based Access Control

1. **Create Test Areas**
   ```bash
   POST /api/areas
   {
     "name": "Area A",
     "code": "AA-001",
     "description": "Test Area A"
   }
   ```

2. **Create Customer User with Area Assignment**
   ```bash
   POST /api/auth/register
   {
     "username": "testcustomer",
     "email": "test@example.com",
     "password": "Test@123",
     "firstName": "Test",
     "lastName": "Customer",
     "role": "customer",
     "assignedAreas": ["<areaId>"]
   }
   ```

3. **Verify Area Filtering**
   - Login as customer user
   - Check dashboard stats - should only show data from assigned areas
   - Check meters list - should only show meters from assigned areas
   - Check consumption data - should only show data from assigned areas

4. **Verify Admin Access**
   - Login as admin
   - Should see ALL meters and data regardless of area

5. **Update User Areas**
   - Go to User Access Control page
   - Edit customer user
   - Change assigned areas
   - Verify changes are saved
   - Login as customer and verify new filtering

---

## Security Considerations

### Meter Settings
- Only admin and operator roles can access writeable parameters
- Meter write operations require authentication
- Values are validated before writing to meter
- Audit logs should track all parameter writes

### Area-Based Access
- Area filtering is enforced at the database query level
- Cannot be bypassed from frontend
- Customer users cannot see or modify other areas' data
- JWT token includes user's role and areas for validation

---

## Troubleshooting

### Meter Settings Issues

**Problem**: No writeable parameters found
- **Solution**: Check that the meter has OBIS functions with accessRight 'W' or 'RW'

**Problem**: Cannot read meter values
- **Solution**:
  - Verify meter is online
  - Check meter polling service is running
  - Verify meter IP/host is correct in .env

**Problem**: Write operation fails
- **Solution**:
  - Ensure meter supports write for that OBIS code
  - Check value format matches expected data type
  - Verify meter connection

### Area Access Issues

**Problem**: Customer sees no meters
- **Solution**: Assign areas to the customer user

**Problem**: Customer sees meters from wrong areas
- **Solution**:
  - Check meters have correct `area` field in database
  - Verify customer's assignedAreas are correct
  - Check area filtering is applied in queries

**Problem**: Areas not showing in UI
- **Solution**:
  - Verify areas exist in database
  - Check `/api/areas` endpoint returns data
  - Ensure frontend fetches areas on page load

---

## Files Modified/Created

### Frontend Files
- `smart-hes-frontend/src/pages/Meters/MeterSettings.tsx` - Meter settings page (already existed, enhanced)
- `smart-hes-frontend/src/pages/Advanced/UserAccessControl.tsx` - User management with area assignment (enhanced)

### Backend Files
- `smaer-hes-backend/src/models/User.model.ts` - Added assignedAreas field (already existed)
- `smaer-hes-backend/src/models/Customer.model.ts` - Added assignedAreas field (already existed)
- `smaer-hes-backend/src/middleware/auth.middleware.ts` - Added getAreaFilter helper (already existed)
- `smaer-hes-backend/src/routes/meter.routes.ts` - Added writeable-parameters and read-current-values endpoints (already existed)
- `smaer-hes-backend/src/routes/dashboard.routes.ts` - Added area filtering (already existed)
- `smaer-hes-backend/src/routes/auth.routes.ts` - Handle assignedAreas in registration/login (already existed)

---

## Summary

Both features are now fully implemented and integrated:

✅ **Meter Settings Page**
- Fetches only writeable parameters
- Reads current values before writing
- Writes individual parameters with immediate feedback
- Grouped display by category

✅ **Area-Based Access Control**
- Admin can assign areas to customer users
- Customer users only see data from assigned areas
- Dashboard, meters, and reports all filtered by area
- Visual UI for area selection and display

All backend and frontend code is complete and pushed to the repository.
