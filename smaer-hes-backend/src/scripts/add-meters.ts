import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Meter } from '../models/Meter.model';
import { Area } from '../models/Area.model';
import { User } from '../models/User.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hes';

async function addMeters() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find or create Ikorodu area
    let ikoroduArea = await Area.findOne({ name: 'Ikorodu' });

    if (!ikoroduArea) {
      console.log('📍 Ikorodu area not found. Creating...');

      // Find any admin user to use as createdBy
      const adminUser = await User.findOne({ role: 'admin' });

      if (!adminUser) {
        throw new Error('No admin user found. Please create an admin user first.');
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
        }
      });

      console.log('✅ Ikorodu area created:', ikoroduArea.name);
    } else {
      console.log('✅ Ikorodu area found:', ikoroduArea.name);
    }

    // Meters to add
    const metersToAdd = [
      {
        meterNumber: '46000755036',
        brand: 'Hexcell',
        model: 'DDSY1088',
        meterType: 'single-phase',
        firmware: '1.0.0',
        area: ikoroduArea._id,
        status: 'offline',
        relayStatus: 'connected',
        isActive: true,
        currentReading: {
          totalEnergy: 0,
          voltage: 0,
          current: 0,
          power: 0,
          frequency: 0,
          powerFactor: 0,
          timestamp: new Date()
        },
        tamperStatus: {
          coverOpen: false,
          magneticTamper: false,
          reverseFlow: false,
          neutralDisturbance: false
        }
      },
      {
        meterNumber: '46000777832',
        brand: 'Hexcell',
        model: 'DDSY1088',
        meterType: 'single-phase',
        firmware: '1.0.0',
        area: ikoroduArea._id,
        status: 'offline',
        relayStatus: 'connected',
        isActive: true,
        currentReading: {
          totalEnergy: 0,
          voltage: 0,
          current: 0,
          power: 0,
          frequency: 0,
          powerFactor: 0,
          timestamp: new Date()
        },
        tamperStatus: {
          coverOpen: false,
          magneticTamper: false,
          reverseFlow: false,
          neutralDisturbance: false
        }
      }
    ];

    // Add meters
    console.log('\n📊 Adding meters...\n');

    for (const meterData of metersToAdd) {
      // Check if meter already exists
      const existingMeter = await Meter.findOne({ meterNumber: meterData.meterNumber });

      if (existingMeter) {
        console.log(`⚠️  Meter ${meterData.meterNumber} already exists. Skipping...`);
        continue;
      }

      const meter = await Meter.create(meterData);
      console.log(`✅ Added meter: ${meter.meterNumber} (${meter.brand} ${meter.model})`);
    }

    // Update area meter count
    const meterCount = await Meter.countDocuments({ area: ikoroduArea._id });
    ikoroduArea.meterCount = meterCount;
    await ikoroduArea.save();

    console.log(`\n✅ Updated Ikorodu area meter count: ${meterCount}`);

    // Display summary
    console.log('\n📋 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const allMeters = await Meter.find({ area: ikoroduArea._id }).select('meterNumber brand model status');

    allMeters.forEach((meter: any, index: number) => {
      console.log(`${index + 1}. ${meter.meterNumber} - ${meter.brand} ${meter.model} [${meter.status}]`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
addMeters();
