import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.model';
import { Area } from '../models/Area.model';
import { Meter } from '../models/Meter.model';
import { Customer } from '../models/Customer.model';
import { SimCard } from '../models/SimCard.model';
import { Consumption } from '../models/Consumption.model';
import { Event } from '../models/Event.model';
import moment from 'moment';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data (be careful with this in production!)
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Area.deleteMany({});
    await Meter.deleteMany({});
    await Customer.deleteMany({});
    await SimCard.deleteMany({});
    await Consumption.deleteMany({});
    await Event.deleteMany({});
    
    console.log('📝 Creating seed data...');
    
    // Create admin user
    const adminUser = await User.create({
      username: 'Astratek',
      email: 'samuelopeyemi61@gmal.com',
      password: '2!1!YDr3',
      role: 'admin',
      firstName: 'Opeyemi',
      lastName: 'Adeshina',
      phoneNumber: '+2348167871931',
      isActive: true,
    });
    console.log('✅ Admin user created');
    
    // Create operator user
    // const operatorUser = await User.create({
    //   username: 'operator',
    //   email: 'operator@smarthes.com',
    //   password: 'Operator@123',
    //   role: 'operator',
    //   firstName: 'John',
    //   lastName: 'Operator',
    //   phoneNumber: '+234000000001',
    //   isActive: true,
    // });
    // console.log('✅ Operator user created');
    
    // Create customer user
    // const customerUser = await User.create({
    //   username: 'customer',
    //   email: 'customer@smarthes.com',
    //   password: 'Customer@123',
    //   role: 'customer',
    //   firstName: 'Jane',
    //   lastName: 'Customer',
    //   phoneNumber: '+234000000002',
    //   isActive: true,
    // });
    // console.log('✅ Customer user created');
    
    // Create areas
    const downtown = await Area.create({
      name: 'Ikorodu',
      code: 'IKD',
      description: 'Lagos North Zone',
      coordinates: { latitude: 6.5244, longitude: 3.3792 },
      createdBy: adminUser._id,
    });
    
    const northSuburbs = await Area.create({
      name: 'Benin',
      code: 'BN',
      description: 'Edo State',
      coordinates: { latitude: 6.6018, longitude: 3.3515 },
      createdBy: adminUser._id,
    });
    
    const industrialPark = await Area.create({
      name: 'Abeokuta',
      code: 'ABK',
      description: 'Ogun State',
      coordinates: { latitude: 6.4474, longitude: 3.4067 },
      createdBy: adminUser._id,
    });
    console.log('✅ Areas created');
    
    // Create SIM cards
    const simCards = [];
    for (let i = 1; i <= 20; i++) {
      const sim = await SimCard.create({
        simNumber: `+23470000000${i.toString().padStart(2, '0')}`,
        iccid: `8923401000000000${i.toString().padStart(4, '0')}`,
        imsi: `62130100000000${i.toString().padStart(2, '0')}`,
        provider: i % 3 === 0 ? 'MTN' : i % 3 === 1 ? 'Glo' : 'Airtel',
        ipAddress: `192.168.1.${100 + i}`,
        port: 8080,
        apn: 'internet.ng',
        status: 'available',
      });
      simCards.push(sim);
    }
    console.log('✅ SIM cards created');
    
    // Create customers
    const customers = [];
    const customerNames = [
      // { first: 'Adebayo', last: 'Ogundimu', company: '' },
      // { first: 'Fatima', last: 'Mohammed', company: '' },
      // { first: 'Chinedu', last: 'Okonkwo', company: '' },
      // { first: 'Aisha', last: 'Ibrahim', company: '' },
      // { first: 'Oluwaseun', last: 'Adeyemi', company: '' },
      { first: '', last: '', company: 'Lagos Industries Ltd' },
      { first: '', last: '', company: 'Tech Hub Nigeria' },
      // { first: 'Emeka', last: 'Nwosu', company: '' },
      // { first: 'Zainab', last: 'Yusuf', company: '' },
      // { first: 'Tunde', last: 'Bakare', company: '' },
    ];
    
    for (let i = 0; i < customerNames.length; i++) {
      const customer = await Customer.create({
        customerName: customerNames[i].company || `${customerNames[i].first} ${customerNames[i].last}`,
        accountNumber: `ACC${(1000000 + i).toString()}`,
        email: customerNames[i].company 
          ? `info@${customerNames[i].company.toLowerCase().replace(/\s+/g, '')}.com`
          : `${customerNames[i].first.toLowerCase()}.${customerNames[i].last.toLowerCase()}@email.com`,
        phoneNumber: `+23480000000${i.toString().padStart(2, '0')}`,
        address: {
          street: `${i + 1} Main Street`,
          city: 'Lagos',
          state: 'Lagos State',
          postalCode: `10000${i}`,
          country: 'Nigeria',
        },
        connectionType: customerNames[i].company ? 'commercial' : 'residential',
        tariffPlan: 'Standard',
        connectionDate: moment().subtract(Math.floor(Math.random() * 365), 'days').toDate(),
        status: 'active',
        createdBy: adminUser._id,
      });
      customers.push(customer);
    }
    console.log('✅ Customers created');
    
    // Create meters
    const meterBrands = ['Hexing', 'Landis+Gyr', 'Iskra', 'Schneider', 'Itron'];
    const meterModels: Record<string, string[]> = {
      'Hexing': ['HXE110', 'HXE310', 'HXF300'],
      'Landis+Gyr': ['E350', 'E450', 'E650'],
      'Iskra': ['MT174', 'MT382', 'ME162'],
      'Schneider': ['ION7650', 'ION8650', 'PM5560'],
      'Itron': ['ACE9000', 'SL7000', 'EM420'],
      'Hexcell': ['DDSY1088', 'DTSY1088']
    };
    
    const meters = [];
    for (let i = 1; i <= 10; i++) {
      const brand = meterBrands[Math.floor(Math.random() * meterBrands.length)];
      const model = meterModels[brand][Math.floor(Math.random() * meterModels[brand].length)];
      const area = i <= 3 ? downtown : i <= 6 ? northSuburbs : industrialPark;
      
      const meter = await Meter.create({
        meterNumber: `MTR${i.toString().padStart(3, '0')}`,
        concentratorId: `CONC${Math.ceil(i / 5).toString().padStart(3, '0')}`,
        meterType: i % 3 === 0 ? 'three-phase' : 'single-phase',
        brand,
        model,
        firmware: 'v2.1.0',
        area: area._id,
        customer: i <= customers.length ? customers[i - 1]._id : null,
        simCard: i <= simCards.length ? simCards[i - 1]._id : null,
        ipAddress: simCards[i - 1]?.ipAddress,
        port: 8080,
        status: Math.random() > 0.2 ? 'online' : 'offline',
        lastSeen: moment().subtract(Math.floor(Math.random() * 60), 'minutes').toDate(),
        installationDate: moment().subtract(Math.floor(Math.random() * 365), 'days').toDate(),
        currentReading: {
          totalEnergy: 1000 + Math.random() * 5000,
          voltage: 220 + Math.random() * 20,
          current: 5 + Math.random() * 25,
          power: 1 + Math.random() * 10,
          frequency: 49.5 + Math.random(),
          powerFactor: 0.85 + Math.random() * 0.15,
          timestamp: new Date(),
        },
        relayStatus: 'connected',
        tamperStatus: {
          coverOpen: false,
          magneticTamper: false,
          reverseFlow: false,
          neutralDisturbance: false,
        },
      });
      meters.push(meter);
      
      // Update SIM card status
      if (i <= simCards.length) {
        simCards[i - 1].meter = meter._id;
        simCards[i - 1].status = 'active';
        await simCards[i - 1].save();
      }
      
      // Update customer meter assignment
      if (i <= customers.length) {
        customers[i - 1].meter = meter._id;
        customers[i - 1].meterNumber = meter.meterNumber;
        await customers[i - 1].save();
      }
    }
    console.log('✅ Meters created');
    
    // Generate historical consumption data
    console.log('📊 Generating consumption data...');
    for (const meter of meters) {
      // Generate hourly data for last 7 days
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const timestamp = moment()
            .subtract(day, 'days')
            .hour(hour)
            .minute(0)
            .second(0)
            .toDate();
          
          await Consumption.create({
            meter: meter._id,
            area: meter.area,
            timestamp,
            interval: 'hourly',
            energy: {
              activeEnergy: 5 + Math.random() * 20,
              reactiveEnergy: 1 + Math.random() * 5,
              apparentEnergy: 6 + Math.random() * 22,
              exportedEnergy: 0,
            },
            power: {
              activePower: 1 + Math.random() * 10,
              reactivePower: 0.2 + Math.random() * 2,
              apparentPower: 1.2 + Math.random() * 12,
              maxDemand: 2 + Math.random() * 15,
            },
            voltage: {
              phaseA: 220 + Math.random() * 20,
              phaseB: meter.meterType === 'three-phase' ? 220 + Math.random() * 20 : 0,
              phaseC: meter.meterType === 'three-phase' ? 220 + Math.random() * 20 : 0,
              average: 220 + Math.random() * 20,
            },
            current: {
              phaseA: 5 + Math.random() * 25,
              phaseB: meter.meterType === 'three-phase' ? 5 + Math.random() * 25 : 0,
              phaseC: meter.meterType === 'three-phase' ? 5 + Math.random() * 25 : 0,
              neutral: 0.1 + Math.random() * 2,
              average: 5 + Math.random() * 25,
            },
            powerFactor: {
              phaseA: 0.85 + Math.random() * 0.15,
              phaseB: meter.meterType === 'three-phase' ? 0.85 + Math.random() * 0.15 : 0,
              phaseC: meter.meterType === 'three-phase' ? 0.85 + Math.random() * 0.15 : 0,
              average: 0.85 + Math.random() * 0.15,
            },
            frequency: 49.5 + Math.random(),
            readingType: 'automatic',
          });
        }
        
        // Generate daily aggregate
        await Consumption.create({
          meter: meter._id,
          area: meter.area,
          timestamp: moment().subtract(day, 'days').startOf('day').toDate(),
          interval: 'daily',
          energy: {
            activeEnergy: 120 + Math.random() * 480,
            reactiveEnergy: 24 + Math.random() * 120,
            apparentEnergy: 144 + Math.random() * 528,
            exportedEnergy: 0,
          },
          power: {
            activePower: 5 + Math.random() * 20,
            reactivePower: 1 + Math.random() * 4,
            apparentPower: 6 + Math.random() * 24,
            maxDemand: 10 + Math.random() * 30,
          },
          voltage: {
            phaseA: 220 + Math.random() * 20,
            phaseB: meter.meterType === 'three-phase' ? 220 + Math.random() * 20 : 0,
            phaseC: meter.meterType === 'three-phase' ? 220 + Math.random() * 20 : 0,
            average: 220 + Math.random() * 20,
          },
          current: {
            phaseA: 5 + Math.random() * 25,
            phaseB: meter.meterType === 'three-phase' ? 5 + Math.random() * 25 : 0,
            phaseC: meter.meterType === 'three-phase' ? 5 + Math.random() * 25 : 0,
            neutral: 0.1 + Math.random() * 2,
            average: 5 + Math.random() * 25,
          },
          powerFactor: {
            phaseA: 0.85 + Math.random() * 0.15,
            phaseB: meter.meterType === 'three-phase' ? 0.85 + Math.random() * 0.15 : 0,
            phaseC: meter.meterType === 'three-phase' ? 0.85 + Math.random() * 0.15 : 0,
            average: 0.85 + Math.random() * 0.15,
          },
          frequency: 49.5 + Math.random(),
          readingType: 'automatic',
        });
      }
    }
    console.log('✅ Consumption data generated');
    
    // Generate some events
    console.log('📝 Generating events...');
    const eventTypes = [
      { type: 'METER_ONLINE', severity: 'info', category: 'communication' },
      { type: 'METER_OFFLINE', severity: 'warning', category: 'communication' },
      { type: 'POWER_OUTAGE', severity: 'warning', category: 'power' },
      { type: 'POWER_RESTORED', severity: 'info', category: 'power' },
      { type: 'COVER_OPEN', severity: 'critical', category: 'tamper' },
      { type: 'TOKEN_LOADED', severity: 'info', category: 'billing' },
    ];
    
    for (const meter of meters) {
      // Generate 5-10 random events per meter
      const numEvents = 5 + Math.floor(Math.random() * 6);
      for (let i = 0; i < numEvents; i++) {
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        await Event.create({
          meter: meter._id,
          eventType: eventType.type,
          eventCode: eventType.type.substring(0, 10),
          severity: eventType.severity as any,
          category: eventType.category as any,
          description: `Event ${eventType.type} occurred on meter ${meter.meterNumber}`,
          timestamp: moment().subtract(Math.floor(Math.random() * 7), 'days').toDate(),
        });
      }
    }
    console.log('✅ Events generated');
    
    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin:    username: Astratek     | password: 2!1!YDr3');
    console.log('Operator: username: operator  | password: Operator@123');
    console.log('Customer: username: customer  | password: Customer@123');
    console.log('\n📊 Created:');
    console.log(`- ${3} users`);
    console.log(`- ${3} areas`);
    console.log(`- ${meters.length} meters`);
    console.log(`- ${customers.length} customers`);
    console.log(`- ${simCards.length} SIM cards`);
    console.log('- 7 days of consumption data');
    console.log('- Random events for each meter');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
};

// Run the seed function
seedDatabase();
