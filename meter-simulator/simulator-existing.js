const mqtt = require('mqtt');

// Configuration - can be overridden via environment variables or command line
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const SEND_INTERVAL = parseInt(process.env.SEND_INTERVAL || '30000'); // 30 seconds

// Get meter IDs from command line arguments or use defaults
const meterIds = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : ['14534557799', '46000755036']; // Your existing meter IDs

console.log('='.repeat(70));
console.log('   SMART METER SIMULATOR - Configured for Your Meters');
console.log('='.repeat(70));
console.log(`MQTT Broker: ${MQTT_BROKER}`);
console.log(`Meter IDs to simulate: ${meterIds.join(', ')}`);
console.log(`Send interval: ${SEND_INTERVAL}ms`);
console.log('='.repeat(70));
console.log('');

// Meter simulator class
class MeterSimulator {
  constructor(meterId, initialEnergy = null) {
    this.meterId = meterId;
    this.client = null;
    this.connected = false;

    // Initial meter values - use provided or generate
    this.cumulativeEnergy = initialEnergy || (Math.random() * 1000 + 5000);
    this.powerConsumption = Math.random() * 3 + 1; // 1-4 kW
    this.voltage = Math.random() * 10 + 225; // 225-235V
    this.current = this.powerConsumption / (this.voltage / 1000);
    this.tamperStatus = false;
    this.relayConnected = true;
  }

  connect() {
    console.log(`[${this.meterId}] Connecting to MQTT broker: ${MQTT_BROKER}`);

    this.client = mqtt.connect(MQTT_BROKER, {
      clientId: `meter_${this.meterId}_${Date.now()}`,
      clean: true,
    });

    this.client.on('connect', () => {
      console.log(`[${this.meterId}] ✅ Connected to MQTT broker`);
      this.connected = true;

      // Subscribe to command topic
      this.client.subscribe(`meter/${this.meterId}/command`, (err) => {
        if (!err) {
          console.log(`[${this.meterId}] 📡 Subscribed to commands`);
        }
      });

      // Send initial status and data
      this.sendStatus();
      this.sendMeterData();

      // Start periodic transmission
      this.startDataTransmission();
    });

    this.client.on('message', (topic, message) => {
      this.handleCommand(topic, message);
    });

    this.client.on('error', (error) => {
      console.error(`[${this.meterId}] ❌ MQTT Error:`, error.message);
    });

    this.client.on('offline', () => {
      console.log(`[${this.meterId}] ⚠️  Offline`);
      this.connected = false;
    });

    this.client.on('reconnect', () => {
      console.log(`[${this.meterId}] 🔄 Reconnecting...`);
    });
  }

  handleCommand(topic, message) {
    try {
      const command = JSON.parse(message.toString());
      console.log(`[${this.meterId}] 📥 Received command:`, command.command);

      switch (command.command) {
        case 'READ_ALL':
          console.log(`[${this.meterId}] 📤 Responding to READ_ALL command`);
          this.sendMeterData();
          break;

        case 'CONNECT':
          console.log(`[${this.meterId}] ⚡ Meter relay CONNECTED`);
          this.relayConnected = true;
          this.sendStatus();
          this.sendMeterData();
          break;

        case 'DISCONNECT':
          console.log(`[${this.meterId}] ⚡ Meter relay DISCONNECTED`);
          this.relayConnected = false;
          this.sendStatus();
          this.sendMeterData();
          break;

        default:
          console.log(`[${this.meterId}] ⚠️  Unknown command: ${command.command}`);
      }
    } catch (error) {
      console.error(`[${this.meterId}] Error handling command:`, error.message);
    }
  }

  startDataTransmission() {
    // Send data at configured intervals
    setInterval(() => {
      if (this.connected) {
        this.sendMeterData();
      }
    }, SEND_INTERVAL);

    // Send status updates every 2 minutes
    setInterval(() => {
      this.sendStatus();
    }, 120000);

    // Occasional tamper simulation (very rare - 0.5% chance)
    setInterval(() => {
      if (Math.random() < 0.005 && !this.tamperStatus) {
        this.simulateTamper();
      }
    }, 60000); // Check every minute
  }

  sendMeterData() {
    // Simulate realistic energy accumulation
    const timeInHours = SEND_INTERVAL / 3600000; // Convert ms to hours
    this.cumulativeEnergy += this.powerConsumption * timeInHours;

    // Add realistic variations
    this.powerConsumption += (Math.random() - 0.5) * 0.5;
    this.powerConsumption = Math.max(0.5, Math.min(10, this.powerConsumption));

    this.voltage += (Math.random() - 0.5) * 2;
    this.voltage = Math.max(220, Math.min(240, this.voltage));

    this.current = this.powerConsumption / (this.voltage / 1000);

    // Calculate power factor (typical range)
    const powerFactor = 0.95 + Math.random() * 0.05;

    const data = {
      // OBIS codes matching your 14 priority parameters
      '1.8.0': this.cumulativeEnergy, // Cumulative active energy (kWh)
      '3.8.0': this.cumulativeEnergy * 0.1, // Reactive energy (kVArh)
      '1.7.0': this.powerConsumption, // Instantaneous power (kW)
      '32.7.0': this.voltage, // Voltage Phase A (V)
      '31.7.0': this.current, // Current Phase A (A)
      '13.7.0': powerFactor, // Power factor
      '96.5.5': this.relayConnected ? 'connected' : 'disconnected', // Connection status
      '1.6.0': this.powerConsumption * 1.2, // Max demand (slightly higher than current)

      // Additional fields for compatibility
      activeEnergy: this.cumulativeEnergy,
      reactiveEnergy: this.cumulativeEnergy * 0.1,
      power: this.powerConsumption,
      voltage: this.voltage,
      current: this.current,
      powerFactor: powerFactor,
      connectionStatus: this.relayConnected ? 'connected' : 'disconnected',

      // Communication quality
      rssi: Math.floor(Math.random() * 30) - 80, // -80 to -50 dBm
      signalStrength: Math.floor(Math.random() * 100), // 0-100%

      // Status
      tamper: this.tamperStatus,
      tamperStatus: this.tamperStatus,
      timestamp: new Date().toISOString(),
    };

    this.client.publish(`meter/${this.meterId}/data`, JSON.stringify(data), { qos: 1 });

    const statusIcon = this.relayConnected ? '⚡' : '⭕';
    console.log(
      `[${this.meterId}] ${statusIcon} 📤 Energy: ${this.cumulativeEnergy.toFixed(2)} kWh | ` +
      `Power: ${this.powerConsumption.toFixed(2)} kW | ` +
      `Voltage: ${this.voltage.toFixed(1)} V`
    );

    // Clear tamper status after sending
    if (this.tamperStatus) {
      this.tamperStatus = false;
    }
  }

  sendStatus() {
    const status = {
      online: this.connected,
      connectionStatus: this.relayConnected ? 'connected' : 'disconnected',
      lastSeen: new Date().toISOString(),
      firmwareVersion: '1.0.0',
      signalQuality: Math.floor(Math.random() * 100),
      meterType: 'single-phase',
      brand: 'hexing',
      model: 'HXE130',
    };

    this.client.publish(`meter/${this.meterId}/status`, JSON.stringify(status), { qos: 1 });
    console.log(`[${this.meterId}] 📡 Status update sent`);
  }

  simulateTamper() {
    const tamperTypes = ['cover_open', 'magnetic_field', 'phase_reversal', 'neutral_disturbance'];
    const tamperType = tamperTypes[Math.floor(Math.random() * tamperTypes.length)];

    this.tamperStatus = true;

    const alert = {
      type: 'tamper',
      severity: 'high',
      message: `Tamper detected: ${tamperType.replace('_', ' ')}`,
      details: {
        tamperType: tamperType,
        detectedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    this.client.publish(`meter/${this.meterId}/alert`, JSON.stringify(alert), { qos: 1 });
    console.log(`[${this.meterId}] 🚨 TAMPER ALERT: ${tamperType}`);
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      console.log(`[${this.meterId}] 🔌 Disconnected`);
    }
  }
}

// Create and connect meters
const meters = [];

meterIds.forEach((meterId, index) => {
  // Stagger connection to avoid overwhelming the broker
  setTimeout(() => {
    const meter = new MeterSimulator(meterId);
    meter.connect();
    meters.push(meter);
  }, index * 1000); // 1 second delay between each meter
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down simulators...');
  meters.forEach(meter => meter.disconnect());
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down simulators...');
  meters.forEach(meter => meter.disconnect());
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

console.log('\n✅ Meter simulators starting. Press Ctrl+C to stop.\n');
console.log('💡 TIP: You can specify custom meter IDs as arguments:');
console.log('   node simulator-existing.js 14534557799 46000755036 12345678901\n');
