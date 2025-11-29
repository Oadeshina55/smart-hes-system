import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.model';
import { Area } from './src/models/Area.model';
import { Meter } from './src/models/Meter.model';

dotenv.config();

const addMeters = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hes';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find or create Ikorodu area
    let ikoroduArea = await Area.findOne({ name: 'Ikorodu' });

    if (!ikoroduArea) {
      console.log('📍 Ikorodu area not found. Creating...');

      // Find admin user
      const adminUser = await User.findOne({ role: 'admin' });

      if (!adminUser) {
        console.error('❌ No admin user found. Please create an admin user first.');
        process.exit(1);
      }

      ikoroduArea = await Area.create({
        name: 'Ikorodu',
        code: 'IKD',
        description: 'Ikorodu Area',
        isActive: true,
        createdBy: adminUser._id,
        coordinates: {
          latitude: 6.6186,
          longitude: 3.5105
        },
        meterCount: 0
      });

      console.log('✅ Ikorodu area created');
    } else {
      console.log('✅ Ikorodu area found');
    }

    // Meters to add
    const metersData = [
      { meterNumber: '46000755036', brand: 'Hexcell', model: 'DDSY1088' },
      { meterNumber: '46000777832', brand: 'Hexcell', model: 'DDSY1088' }
    ];

    console.log('\n📊 Adding meters...\n');

    for (const data of metersData) {
      const existing = await Meter.findOne({ meterNumber: data.meterNumber });

      if (existing) {
        console.log(`⚠️  Meter ${data.meterNumber} already exists`);
        continue;
      }

      const meter = await Meter.create({
        meterNumber: data.meterNumber,
        brand: data.brand,
        model: data.model,
        meterType: 'single-phase',
        firmware: '1.0.0',
        area: ikoroduArea._id,
        status: 'offline',
        relayStatus: 'connected',
        isActive: true
      });

      console.log(`✅ Added: ${meter.meterNumber}`);
    }

    // Update meter count
    const count = await Meter.countDocuments({ area: ikoroduArea._id });
    await Area.findByIdAndUpdate(ikoroduArea._id, { meterCount: count });

    console.log(`\n✅ Total meters in Ikorodu: ${count}\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

addMeters();
