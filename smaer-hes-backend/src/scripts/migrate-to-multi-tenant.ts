/**
 * Migration Script: Area-based to Multi-Tenant Architecture
 *
 * This script migrates the system from geographical area-based to customer network-based:
 * - Area → CustomerNetwork (utility companies)
 * - Customer → EndCustomer (electricity consumers)
 * - Updates all meters to link to customerNetwork
 * - Updates users to link to customerNetwork
 *
 * RUN THIS ONLY ONCE!
 */

import mongoose from 'mongoose';
import { Area } from '../models/Area.model';
import { Customer } from '../models/Customer.model';
import { User } from '../models/User.model';
import { Meter } from '../models/Meter.model';
import { CustomerNetwork } from '../models/CustomerNetwork.model';
import { EndCustomer } from '../models/EndCustomer.model';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hes';

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function migrateAreasToCustomerNetworks() {
  console.log('\n📦 Step 1: Migrating Areas to CustomerNetworks...');

  const areas = await Area.find({ isActive: true });
  const areaToNetworkMap = new Map<string, string>();

  for (const area of areas) {
    try {
      // Create CustomerNetwork from Area
      const network = new CustomerNetwork({
        networkName: area.name,
        networkCode: area.code,
        description: area.description || `${area.name} Utility Network`,
        parentCompany: 'New Hampshire',
        contactInfo: {
          email: `contact@${area.code.toLowerCase()}.com`,
          phoneNumber: '+234-000-000-0000',
          address: 'TBD - Update from admin'
        },
        serviceArea: {
          region: area.name,
          state: 'TBD',
          country: 'Nigeria',
          coordinates: area.coordinates
        },
        meterCount: area.meterCount || 0,
        endCustomerCount: 0,
        settings: {
          canAddMeters: true,
          canAddCustomers: true,
          canManageOperators: true,
          features: []
        },
        subscriptionStatus: 'active',
        isActive: area.isActive,
        createdBy: area.createdBy
      });

      await network.save();
      areaToNetworkMap.set(area._id.toString(), network._id.toString());

      console.log(`  ✅ Migrated: ${area.name} → ${network.networkName} (Network)`);
    } catch (error: any) {
      console.error(`  ❌ Failed to migrate area ${area.name}:`, error.message);
    }
  }

  console.log(`\n✅ Migrated ${areaToNetworkMap.size} areas to customer networks`);
  return areaToNetworkMap;
}

async function migrateCustomersToEndCustomers(areaToNetworkMap: Map<string, string>) {
  console.log('\n📦 Step 2: Migrating Customers to EndCustomers...');

  const customers = await Customer.find({ isActive: true });
  const customerToEndCustomerMap = new Map<string, string>();

  for (const customer of customers) {
    try {
      // Determine which customer network this end customer belongs to
      let customerNetworkId: any = null;

      if (customer.assignedAreas && customer.assignedAreas.length > 0) {
        // Use the first assigned area
        const areaId = customer.assignedAreas[0].toString();
        customerNetworkId = areaToNetworkMap.get(areaId);
      }

      // If no network found, skip this customer (needs manual assignment)
      if (!customerNetworkId) {
        console.log(`  ⚠️  Skipping customer ${customer.customerName} - no area assigned`);
        continue;
      }

      // Create EndCustomer from Customer
      const endCustomer = new EndCustomer({
        customerName: customer.customerName,
        accountNumber: customer.accountNumber,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
        address: customer.address,
        customerNetwork: customerNetworkId,
        meterNumber: customer.meterNumber,
        meter: customer.meter,
        simNumber: customer.simNumber,
        tariffPlan: customer.tariffPlan,
        connectionType: customer.connectionType,
        connectionDate: customer.connectionDate,
        status: customer.status,
        billingInfo: customer.billingInfo,
        metadata: customer.metadata,
        isActive: customer.isActive,
        createdBy: customer.createdBy
      });

      await endCustomer.save();
      customerToEndCustomerMap.set(customer._id.toString(), endCustomer._id.toString());

      console.log(`  ✅ Migrated: ${customer.customerName} → EndCustomer`);
    } catch (error: any) {
      console.error(`  ❌ Failed to migrate customer ${customer.customerName}:`, error.message);
    }
  }

  console.log(`\n✅ Migrated ${customerToEndCustomerMap.size} customers to end customers`);
  return customerToEndCustomerMap;
}

async function updateMeters(areaToNetworkMap: Map<string, string>, customerToEndCustomerMap: Map<string, string>) {
  console.log('\n📦 Step 3: Updating Meters with customerNetwork...');

  const meters = await Meter.find({ isActive: true });
  let updatedCount = 0;

  for (const meter of meters) {
    try {
      const areaId = meter.area.toString();
      const customerNetworkId = areaToNetworkMap.get(areaId);

      if (!customerNetworkId) {
        console.log(`  ⚠️  Skipping meter ${meter.meterNumber} - area not migrated`);
        continue;
      }

      // Update meter
      meter.customerNetwork = customerNetworkId as any;

      // Update endCustomer if customer exists
      if (meter.customer) {
        const customerId = meter.customer.toString();
        const endCustomerId = customerToEndCustomerMap.get(customerId);
        if (endCustomerId) {
          meter.endCustomer = endCustomerId as any;
        }
      }

      await meter.save();
      updatedCount++;

      if (updatedCount % 100 === 0) {
        console.log(`  ✅ Updated ${updatedCount} meters...`);
      }
    } catch (error: any) {
      console.error(`  ❌ Failed to update meter ${meter.meterNumber}:`, error.message);
    }
  }

  console.log(`\n✅ Updated ${updatedCount} meters`);
}

async function updateUsers(areaToNetworkMap: Map<string, string>) {
  console.log('\n📦 Step 4: Updating Users with customerNetwork...');

  const users = await User.find({ role: { $in: ['customer', 'operator'] }, isActive: true });
  let updatedCount = 0;

  for (const user of users) {
    try {
      // For users with assigned areas, link them to the first area's network
      if (user.assignedAreas && user.assignedAreas.length > 0) {
        const areaId = user.assignedAreas[0].toString();
        const customerNetworkId = areaToNetworkMap.get(areaId);

        if (customerNetworkId) {
          user.customerNetwork = customerNetworkId as any;

          // Update role to customer-operator if they were 'customer' role
          if (user.role === 'customer') {
            user.role = 'customer-operator';
          }

          await user.save();
          updatedCount++;

          console.log(`  ✅ Updated user: ${user.username} → Network: ${customerNetworkId}`);
        }
      }
    } catch (error: any) {
      console.error(`  ❌ Failed to update user ${user.username}:`, error.message);
    }
  }

  console.log(`\n✅ Updated ${updatedCount} users`);
}

async function updateStatistics() {
  console.log('\n📦 Step 5: Updating CustomerNetwork statistics...');

  const networks = await CustomerNetwork.find({ isActive: true });

  for (const network of networks) {
    try {
      // Count meters
      const meterCount = await Meter.countDocuments({
        customerNetwork: network._id,
        isActive: true
      });

      // Count active meters
      const activeMeters = await Meter.countDocuments({
        customerNetwork: network._id,
        status: { $in: ['online', 'active'] }
      });

      // Count end customers
      const endCustomerCount = await EndCustomer.countDocuments({
        customerNetwork: network._id,
        isActive: true
      });

      network.meterCount = meterCount;
      network.activeMeters = activeMeters;
      network.endCustomerCount = endCustomerCount;

      await network.save();

      console.log(`  ✅ ${network.networkName}: ${meterCount} meters, ${endCustomerCount} customers`);
    } catch (error: any) {
      console.error(`  ❌ Failed to update stats for ${network.networkName}:`, error.message);
    }
  }

  console.log('\n✅ Statistics updated');
}

async function main() {
  console.log('🚀 Starting Multi-Tenant Migration...\n');
  console.log('⚠️  WARNING: This is a one-time migration. Make sure you have a backup!\n');

  await connectDB();

  try {
    // Step 1: Migrate Areas to CustomerNetworks
    const areaToNetworkMap = await migrateAreasToCustomerNetworks();

    // Step 2: Migrate Customers to EndCustomers
    const customerToEndCustomerMap = await migrateCustomersToEndCustomers(areaToNetworkMap);

    // Step 3: Update Meters
    await updateMeters(areaToNetworkMap, customerToEndCustomerMap);

    // Step 4: Update Users
    await updateUsers(areaToNetworkMap);

    // Step 5: Update Statistics
    await updateStatistics();

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Review CustomerNetworks and update contact information');
    console.log('   2. Verify meter assignments');
    console.log('   3. Update frontend to use new models');
    console.log('   4. Test thoroughly before deploying to production\n');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run migration
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
