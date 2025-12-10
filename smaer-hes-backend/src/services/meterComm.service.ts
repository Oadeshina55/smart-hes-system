import { EventEmitter } from 'events';
import mqtt, { MqttClient } from 'mqtt';
import { Consumption } from '../models/Consumption.model';
import { Meter } from '../models/Meter.model';

interface MeterData {
  meterId: string;
  timestamp: Date;
  energy: {
    activeEnergy: number;
    reactiveEnergy: number;
  };
  power: {
    activePower: number;
    voltage: number;
    current: number;
    powerFactor?: number;
  };
  status: {
    connectionStatus: string;
    tamperStatus: boolean;
  };
  signalQuality: number;
  obisData?: Record<string, any>;
}

export class MeterCommunicationService extends EventEmitter {
  private mqttClient: MqttClient | null = null;
  private connected: boolean = false;

  constructor() {
    super();
  }

  /**
   * Initialize MQTT connection to broker
   */
  async initializeMQTT(brokerUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.mqttClient = mqtt.connect(brokerUrl, {
          clientId: `hes_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          clean: true,
          username: process.env.MQTT_USERNAME || '',
          password: process.env.MQTT_PASSWORD || '',
          reconnectPeriod: 5000,
          connectTimeout: 30000,
        });

        this.mqttClient.on('connect', () => {
          console.log('✅ Connected to MQTT broker');
          this.connected = true;
          this.subscribeToMeterTopics();
          resolve();
        });

        this.mqttClient.on('message', (topic, message) => {
          this.handleMeterData(topic, message);
        });

        this.mqttClient.on('error', (error) => {
          console.error('❌ MQTT Error:', error);
          this.connected = false;
          if (!this.mqttClient) {
            reject(error);
          }
        });

        this.mqttClient.on('offline', () => {
          console.log('⚠️  MQTT client offline');
          this.connected = false;
        });

        this.mqttClient.on('reconnect', () => {
          console.log('🔄 Reconnecting to MQTT broker...');
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Subscribe to all meter data topics
   */
  private subscribeToMeterTopics(): void {
    if (!this.mqttClient || !this.connected) {
      console.warn('⚠️  Cannot subscribe: MQTT client not connected');
      return;
    }

    // Subscribe to all meter data topics using wildcard
    this.mqttClient.subscribe('meter/+/data', { qos: 1 }, (err) => {
      if (err) {
        console.error('❌ Failed to subscribe to meter topics:', err);
      } else {
        console.log('📡 Subscribed to meter/+/data topics');
      }
    });

    // Subscribe to meter status topics
    this.mqttClient.subscribe('meter/+/status', { qos: 1 }, (err) => {
      if (err) {
        console.error('❌ Failed to subscribe to status topics:', err);
      } else {
        console.log('📡 Subscribed to meter/+/status topics');
      }
    });

    // Subscribe to meter alerts
    this.mqttClient.subscribe('meter/+/alert', { qos: 1 }, (err) => {
      if (err) {
        console.error('❌ Failed to subscribe to alert topics:', err);
      } else {
        console.log('📡 Subscribed to meter/+/alert topics');
      }
    });
  }

  /**
   * Handle incoming meter data
   */
  private async handleMeterData(topic: string, message: Buffer): Promise<void> {
    try {
      const topicParts = topic.split('/');
      const meterId = topicParts[1];
      const messageType = topicParts[2]; // data, status, or alert

      const rawData = JSON.parse(message.toString());

      if (messageType === 'data') {
        // Parse and save meter reading
        const parsedData = this.parseOBISData(meterId, rawData);
        await this.saveMeterReading(parsedData);

        // Emit event for real-time updates (WebSocket)
        this.emit('meterData', parsedData);

        console.log(`✅ Processed data from meter ${meterId}`);
      } else if (messageType === 'status') {
        // Update meter status
        await this.updateMeterStatus(meterId, rawData);
        this.emit('meterStatus', { meterId, status: rawData });
      } else if (messageType === 'alert') {
        // Handle meter alert
        await this.handleMeterAlert(meterId, rawData);
        this.emit('meterAlert', { meterId, alert: rawData });
      }

    } catch (error) {
      console.error('❌ Error handling meter data:', error);
    }
  }

  /**
   * Parse OBIS codes from raw meter data
   */
  private parseOBISData(meterId: string, rawData: any): MeterData {
    return {
      meterId,
      timestamp: rawData.timestamp ? new Date(rawData.timestamp) : new Date(),
      energy: {
        // OBIS 1-0:1.8.0.255 - Cumulative Active Energy Import
        activeEnergy: rawData['1.8.0'] || rawData.activeEnergy || 0,
        // OBIS 1-0:3.8.0.255 - Cumulative Reactive Energy Import
        reactiveEnergy: rawData['3.8.0'] || rawData.reactiveEnergy || 0,
      },
      power: {
        // OBIS 1-0:1.7.0.255 - Instantaneous Active Power
        activePower: rawData['1.7.0'] || rawData.power || 0,
        // OBIS 1-0:32.7.0.255 - Instantaneous Voltage (Phase A)
        voltage: rawData['32.7.0'] || rawData.voltage || 0,
        // OBIS 1-0:31.7.0.255 - Instantaneous Current (Phase A)
        current: rawData['31.7.0'] || rawData.current || 0,
        // OBIS 1-0:13.7.0.255 - Power Factor
        powerFactor: rawData['13.7.0'] || rawData.powerFactor,
      },
      status: {
        // OBIS 0-0:96.5.5.255 - Connection Status
        connectionStatus: rawData['96.5.5'] || rawData.connectionStatus || 'unknown',
        tamperStatus: rawData.tamper || rawData.tamperStatus || false,
      },
      signalQuality: rawData.rssi || rawData.signalStrength || 0,
      obisData: rawData, // Store complete raw data for reference
    };
  }

  /**
   * Save meter reading to database
   */
  private async saveMeterReading(data: MeterData): Promise<void> {
    try {
      // Find meter in database
      const meter = await Meter.findOne({ meterNumber: data.meterId });

      if (!meter) {
        console.warn(`⚠️  Meter ${data.meterId} not found in database`);
        return;
      }

      // Create consumption record
      await Consumption.create({
        meter: meter._id,
        customerNetwork: meter.customerNetwork,
        timestamp: data.timestamp,
        interval: 'realtime',
        energy: {
          activeEnergy: data.energy.activeEnergy,
          reactiveEnergy: data.energy.reactiveEnergy,
        },
        power: {
          activePower: data.power.activePower,
          reactivePower: 0, // Calculate if needed
          apparentPower: data.power.activePower, // Approximate
          powerFactor: data.power.powerFactor || 1,
        },
        voltage: data.power.voltage,
        current: data.power.current,
        signalQuality: data.signalQuality,
        dataQuality: {
          completeness: 100, // Can be calculated based on available parameters
          validationStatus: 'valid',
          missingParameters: [],
        },
      });

      // Update meter's last communication time and status
      await Meter.findByIdAndUpdate(meter._id, {
        status: 'active',
        connectionStatus: data.status.connectionStatus,
        lastCommunication: new Date(),
        signalStrength: data.signalQuality,
      });

    } catch (error) {
      console.error('❌ Error saving meter reading:', error);
      throw error;
    }
  }

  /**
   * Update meter status
   */
  private async updateMeterStatus(meterId: string, statusData: any): Promise<void> {
    try {
      await Meter.findOneAndUpdate(
        { meterNumber: meterId },
        {
          connectionStatus: statusData.connectionStatus || 'unknown',
          lastCommunication: new Date(),
          status: statusData.online ? 'active' : 'inactive',
        }
      );
    } catch (error) {
      console.error(`❌ Error updating meter ${meterId} status:`, error);
    }
  }

  /**
   * Handle meter alert
   */
  private async handleMeterAlert(meterId: string, alertData: any): Promise<void> {
    try {
      // Import Alert model dynamically to avoid circular dependencies
      const { Alert } = require('../models/Alert.model');
      const meter = await Meter.findOne({ meterNumber: meterId });

      if (!meter) return;

      // Create alert record
      await Alert.create({
        meter: meter._id,
        customerNetwork: meter.customerNetwork,
        type: alertData.type || 'technical',
        severity: alertData.severity || 'medium',
        message: alertData.message || 'Meter alert received',
        details: alertData,
        status: 'active',
      });

      console.log(`🚨 Alert created for meter ${meterId}: ${alertData.type}`);
    } catch (error) {
      console.error(`❌ Error handling meter alert:`, error);
    }
  }

  /**
   * Send command to a specific meter
   */
  async sendCommand(meterId: string, command: string, params?: any): Promise<boolean> {
    if (!this.mqttClient || !this.connected) {
      throw new Error('MQTT client not connected');
    }

    const topic = `meter/${meterId}/command`;
    const message = JSON.stringify({
      command,
      params,
      timestamp: Date.now(),
      requestId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    return new Promise((resolve, reject) => {
      this.mqttClient!.publish(topic, message, { qos: 1 }, (error) => {
        if (error) {
          console.error(`❌ Failed to send command to meter ${meterId}:`, error);
          reject(error);
        } else {
          console.log(`📤 Command sent to meter ${meterId}: ${command}`);
          resolve(true);
        }
      });
    });
  }

  /**
   * Send read command to meter
   */
  async readMeter(meterId: string): Promise<boolean> {
    return this.sendCommand(meterId, 'READ_ALL');
  }

  /**
   * Send connect/disconnect command to meter
   */
  async controlMeter(meterId: string, action: 'connect' | 'disconnect'): Promise<boolean> {
    return this.sendCommand(meterId, action.toUpperCase());
  }

  /**
   * Check if MQTT is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect(): void {
    if (this.mqttClient) {
      this.mqttClient.end();
      this.connected = false;
      console.log('🔌 Disconnected from MQTT broker');
    }
  }
}

// Export singleton instance
export const meterCommService = new MeterCommunicationService();
