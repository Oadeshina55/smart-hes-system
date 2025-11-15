import axios from 'axios';
import * as cron from 'node-cron';

// Configuration
const API_URL = 'http://localhost:5000/api';
const SIMULATION_CONFIG = {
  numberOfMeters: 10,
  sendInterval: 30, // seconds
  baseEnergyConsumption: 100, // kWh
  energyIncrement: 0.5, // kWh per interval
};

// Simulated meters data
const simulatedMeters = [
  { meterNumber: 'MTR001', area: 'Downtown', baseVoltage: 230, baseCurrent: 10 },
  { meterNumber: 'MTR002', area: 'Downtown', baseVoltage: 231, baseCurrent: 15 },
  { meterNumber: 'MTR003', area: 'North Suburbs', baseVoltage: 229, baseCurrent: 8 },
  { meterNumber: 'MTR004', area: 'North Suburbs', baseVoltage: 232, baseCurrent: 12 },
  { meterNumber: 'MTR005', area: 'Industrial Park', baseVoltage: 228, baseCurrent: 25 },
  { meterNumber: 'MTR006', area: 'Industrial Park', baseVoltage: 230, baseCurrent: 30 },
  { meterNumber: 'MTR007', area: 'Downtown', baseVoltage: 231, baseCurrent: 11 },
  { meterNumber: 'MTR008', area: 'North Suburbs', baseVoltage: 230, baseCurrent: 9 },
  { meterNumber: 'MTR009', area: 'Industrial Park', baseVoltage: 229, baseCurrent: 28 },
  { meterNumber: 'MTR010', area: 'Downtown', baseVoltage: 230, baseCurrent: 13 },
];

// Store meter states
const meterStates = new Map<string, any>();

// Initialize meter states
simulatedMeters.forEach(meter => {
  meterStates.set(meter.meterNumber, {
    totalEnergy: SIMULATION_CONFIG.baseEnergyConsumption + Math.random() * 100,
    lastReading: Date.now(),
    tamperStatus: {
      coverOpen: false,
      magneticTamper: false,
      reverseFlow: false,
      neutralDisturbance: false,
    },
  });
});

// Function to generate random variation
function randomVariation(base: number, percentage: number): number {
  const variation = base * (percentage / 100);
  return base + (Math.random() * 2 - 1) * variation;
}

// Function to simulate meter reading
function generateMeterReading(meter: any) {
  const state = meterStates.get(meter.meterNumber);
  const currentTime = Date.now();
  const timeDiff = (currentTime - state.lastReading) / 1000 / 3600; // in hours
  
  // Calculate energy consumption based on power and time
  const power = randomVariation(meter.baseCurrent * meter.baseVoltage / 1000, 10); // kW
  const energyConsumed = power * timeDiff;
  state.totalEnergy += energyConsumed;
  state.lastReading = currentTime;
  
  // Simulate occasional anomalies
  const anomalyChance = Math.random();
  let events = [];
  
  // 5% chance of tamper event
  if (anomalyChance < 0.05) {
    const tamperTypes = ['coverOpen', 'magneticTamper', 'reverseFlow', 'neutralDisturbance'];
    const randomTamper = tamperTypes[Math.floor(Math.random() * tamperTypes.length)];
    state.tamperStatus[randomTamper] = true;
    
    events.push({
      type: 'TAMPER_DETECTED',
      code: 'TAMPER',
      severity: 'critical',
      category: 'tamper',
      description: `Tamper detected: ${randomTamper}`,
      timestamp: new Date(),
    });
  }
  
  // 2% chance of power outage
  if (anomalyChance > 0.05 && anomalyChance < 0.07) {
    events.push({
      type: 'POWER_OUTAGE',
      code: 'PWR_OUT',
      severity: 'warning',
      category: 'power',
      description: 'Power outage detected',
      timestamp: new Date(),
    });
  }
  
  // Generate reading data
  const reading = {
    meterNumber: meter.meterNumber,
    readings: {
      totalEnergy: state.totalEnergy,
      voltage: randomVariation(meter.baseVoltage, 2),
      current: randomVariation(meter.baseCurrent, 15),
      power: power,
      frequency: randomVariation(50, 1),
      powerFactor: randomVariation(0.95, 5),
      reactiveEnergy: state.totalEnergy * 0.3,
      apparentEnergy: state.totalEnergy * 1.1,
      tamperStatus: state.tamperStatus,
      relayStatus: 'connected',
    },
    events: events.length > 0 ? events : undefined,
    timestamp: new Date().toISOString(),
    authentication: process.env.METER_API_KEY || 'simulator-key',
  };
  
  return reading;
}

// Function to send meter data to server
async function sendMeterData(meterData: any) {
  try {
    const response = await axios.post(`${API_URL}/meters/data-ingestion`, meterData);
    
    if (response.data.success) {
      console.log(`✅ Data sent successfully for meter ${meterData.meterNumber}`);
    } else {
      console.error(`❌ Failed to send data for meter ${meterData.meterNumber}`);
    }
  } catch (error: any) {
    console.error(`❌ Error sending data for meter ${meterData.meterNumber}:`, error.message);
  }
}

// Function to simulate all meters
async function simulateAllMeters() {
  console.log('📊 Sending meter readings...');
  
  for (const meter of simulatedMeters) {
    const reading = generateMeterReading(meter);
    await sendMeterData(reading);
    
    // Add small delay between meters to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('✅ All meter readings sent');
}

// Function to simulate a specific anomaly
async function simulateAnomaly(meterNumber: string, anomalyType: string) {
  const meter = simulatedMeters.find(m => m.meterNumber === meterNumber);
  if (!meter) {
    console.error(`Meter ${meterNumber} not found`);
    return;
  }
  
  const state = meterStates.get(meterNumber);
  let reading: any;
  
  switch (anomalyType) {
    case 'zero-consumption':
      reading = {
        meterNumber,
        readings: {
          totalEnergy: state.totalEnergy, // No increase
          voltage: meter.baseVoltage,
          current: 0,
          power: 0,
          frequency: 50,
          powerFactor: 0,
        },
        timestamp: new Date().toISOString(),
      };
      break;
      
    case 'consumption-drop':
      reading = {
        meterNumber,
        readings: {
          totalEnergy: state.totalEnergy + 0.01, // Very small increase
          voltage: meter.baseVoltage,
          current: meter.baseCurrent * 0.1,
          power: meter.baseVoltage * meter.baseCurrent * 0.1 / 1000,
          frequency: 50,
          powerFactor: 0.95,
        },
        timestamp: new Date().toISOString(),
      };
      break;
      
    case 'tamper':
      state.tamperStatus.coverOpen = true;
      state.tamperStatus.magneticTamper = true;
      reading = {
        meterNumber,
        readings: {
          ...generateMeterReading(meter).readings,
          tamperStatus: state.tamperStatus,
        },
        events: [
          {
            type: 'TAMPER_DETECTED',
            code: 'TAMPER',
            severity: 'critical',
            category: 'tamper',
            description: 'Multiple tamper conditions detected',
            timestamp: new Date(),
          },
        ],
        timestamp: new Date().toISOString(),
      };
      break;
      
    case 'reverse-flow':
      reading = {
        meterNumber,
        readings: {
          totalEnergy: state.totalEnergy - 5, // Negative consumption
          voltage: meter.baseVoltage,
          current: -meter.baseCurrent,
          power: -meter.baseVoltage * meter.baseCurrent / 1000,
          frequency: 50,
          powerFactor: -0.95,
          tamperStatus: {
            ...state.tamperStatus,
            reverseFlow: true,
          },
        },
        timestamp: new Date().toISOString(),
      };
      break;
      
    default:
      console.error(`Unknown anomaly type: ${anomalyType}`);
      return;
  }
  
  reading.authentication = process.env.METER_API_KEY || 'simulator-key';
  await sendMeterData(reading);
  console.log(`🚨 Simulated ${anomalyType} anomaly for meter ${meterNumber}`);
}

// Start the simulator
export function startMeterSimulator() {
  console.log('🚀 Starting meter simulator...');
  console.log(`📊 Simulating ${simulatedMeters.length} meters`);
  console.log(`⏱️  Sending data every ${SIMULATION_CONFIG.sendInterval} seconds`);
  
  // Initial data send
  simulateAllMeters();
  
  // Schedule regular data transmission
  cron.schedule(`*/${SIMULATION_CONFIG.sendInterval} * * * * *`, () => {
    simulateAllMeters();
  });
  
  // Simulate random anomalies every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    const randomMeter = simulatedMeters[Math.floor(Math.random() * simulatedMeters.length)];
    const anomalies = ['zero-consumption', 'consumption-drop', 'tamper', 'reverse-flow'];
    const randomAnomaly = anomalies[Math.floor(Math.random() * anomalies.length)];
    
    simulateAnomaly(randomMeter.meterNumber, randomAnomaly);
  });
  
  console.log('✅ Meter simulator started successfully');
}

// Export for testing purposes
export { simulateAllMeters, simulateAnomaly };

// Run if executed directly
if (require.main === module) {
  startMeterSimulator();
}
