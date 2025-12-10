const mqtt = require('mqtt');

// Configuration
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const METER_COUNT = parseInt(process.env.METER_COUNT || '1');
const SEND_INTERVAL = parseInt(process.env.SEND_INTERVAL || '30000'); // 30 seconds

// Meter simulator class
class MeterSimulator {
  constructor(meterId) {
    this.meterId = meterId;
    this.client = null;
    this.connected = false;

    // Initial meter values
    this.cumulativeEnergy = Math.random() * 1000 + 5000; // Start between 5000-6000 kWh
    this.powerConsumption = Math.random() * 3 + 1; // 1-4 kW
    this.voltage = Math.random() * 10 + 225; // 225-235V
    this.current = this.powerConsumption / (this.voltage / 1000); // Calculate current
    this.tamperStatus = false;
    this.connected = false;
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

      // Send initial status
      this.sendStatus();

      // Start sending data periodically
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
          this.connected = true;
          this.sendStatus();
          break;

        case 'DISCONNECT':
          console.log(`[${this.meterId}] ⚡ Meter relay DISCONNECTED`);
          this.connected = false;
          this.sendStatus();
          break;

        default:
          console.log(`[${this.meterId}] ⚠️  Unknown command: ${command.command}`);
      }
    } catch (error) {
      console.error(`[${this.meterId}] Error handling command:`, error.message);
    }
  }

  startDataTransmission() {
    // Send data at intervals
    setInterval(() => {
      if (this.connected) {
        this.sendMeterData();
      }
    }, SEND_INTERVAL);

    // Send status updates every 2 minutes
    setInterval(() => {
      this.sendStatus();
    }, 120000);
  }

  sendMeterData() {
    // Simulate energy accumulation
    this.cumulativeEnergy += (this.powerConsumption * (SEND_INTERVAL / 3600000)); // kWh

    // Add some variation to power consumption
    this.powerConsumption += (Math.random() - 0.5) * 0.5;
    this.powerConsumption = Math.max(0.5, Math.min(10, this.powerConsumption)); // Keep between 0.5-10 kW

    // Add voltage variation
    this.voltage += (Math.random() - 0.5) * 2;
    this.voltage = Math.max(220, Math.min(240, this.voltage)); // Keep between 220-240V

    // Calculate current based on power and voltage
    this.current = this.powerConsumption / (this.voltage / 1000);

    // Occasionally trigger tamper event (1% chance)
    if (Math.random() < 0.01) {
      this.tamperStatus = true;
      this.sendAlert('tamper', 'Magnetic interference detected');
    }

    const data = {
      // OBIS codes
      '1.8.0': this.cumulativeEnergy, // Cumulative active energy
      '3.8.0': this.cumulativeEnergy * 0.1, // Reactive energy (10% of active)
      '1.7.0': this.powerConsumption, // Instantaneous power
      '32.7.0': this.voltage, // Voltage Phase A
      '31.7.0': this.current, // Current Phase A
      '13.7.0': 0.95 + Math.random() * 0.05, // Power factor (0.95-1.0)
      '96.5.5': this.connected ? 'connected' : 'disconnected', // Connection status

      // Additional data
      rssi: Math.floor(Math.random() * 30) - 80, // Signal strength -80 to -50 dBm
      tamper: this.tamperStatus,
      timestamp: new Date().toISOString(),
    };

    this.client.publish(`meter/${this.meterId}/data`, JSON.stringify(data), { qos: 1 });
    console.log(`[${this.meterId}] 📤 Sent meter data - Energy: ${this.cumulativeEnergy.toFixed(2)} kWh, Power: ${this.powerConsumption.toFixed(2)} kW`);

    // Clear tamper status after sending
    if (this.tamperStatus) {
      this.tamperStatus = false;
    }
  }

  sendStatus() {
    const status = {
      online: this.connected,
      connectionStatus: this.connected ? 'connected' : 'disconnected',
      lastSeen: new Date().toISOString(),
      firmwareVersion: '1.0.0',
      signalQuality: Math.floor(Math.random() * 100),
    };

    this.client.publish(`meter/${this.meterId}/status`, JSON.stringify(status), { qos: 1 });
    console.log(`[${this.meterId}] 📡 Sent status update`);
  }

  sendAlert(type, message) {
    const alert = {
      type,
      severity: 'high',
      message,
      timestamp: new Date().toISOString(),
    };

    this.client.publish(`meter/${this.meterId}/alert`, JSON.stringify(alert), { qos: 1 });
    console.log(`[${this.meterId}] 🚨 Sent alert: ${type} - ${message}`);
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      console.log(`[${this.meterId}] 🔌 Disconnected`);
    }
  }
}

// Main execution
console.log('='.repeat(60));
console.log('   SMART METER SIMULATOR');
console.log('='.repeat(60));
console.log(`MQTT Broker: ${MQTT_BROKER}`);
console.log(`Number of meters: ${METER_COUNT}`);
console.log(`Send interval: ${SEND_INTERVAL}ms`);
console.log('='.repeat(60));
console.log('');

// Create and connect meters
const meters = [];
for (let i = 1; i <= METER_COUNT; i++) {
  const meterId = `TEST_METER_${String(i).padStart(3, '0')}`;
  const meter = new MeterSimulator(meterId);
  meter.connect();
  meters.push(meter);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down simulators...');
  meters.forEach(meter => meter.disconnect());
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down simulators...');
  meters.forEach(meter => meter.disconnect());
  process.exit(0);
});

console.log('\n✅ Meter simulators running. Press Ctrl+C to stop.\n');
