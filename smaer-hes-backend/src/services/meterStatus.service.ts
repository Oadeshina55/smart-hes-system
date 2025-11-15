import { Meter } from '../models/Meter.model';
import { Event, EVENT_TYPES } from '../models/Event.model';
import { Alert, ALERT_TYPES } from '../models/Alert.model';
import { socketIO } from '../server';

export class MeterStatusService {
  // Check all meters status and update accordingly
  static async checkMeterStatus() {
    try {
      const meters = await Meter.find({ isActive: true });
      
      for (const meter of meters) {
        const wasOnline = meter.status === 'online';
        const isNowOnline = meter.isOnline();
        
        // Status changed from online to offline
        if (wasOnline && !isNowOnline) {
          meter.status = 'offline';
          await meter.save();
          
          // Create offline event
          await Event.create({
            meter: meter._id,
            eventType: EVENT_TYPES.METER_OFFLINE,
            eventCode: 'COMM_LOST',
            severity: 'warning',
            category: 'communication',
            description: `Meter ${meter.meterNumber} went offline`,
            timestamp: new Date()
          });
          
          // Create communication failure alert
          await Alert.create({
            meter: meter._id,
            alertType: ALERT_TYPES.TECHNICAL_COMMUNICATION_FAILURE,
            alertCode: 'COMM_FAIL',
            priority: 'medium',
            category: 'communication',
            title: 'Communication Lost',
            description: `Lost communication with meter ${meter.meterNumber}`,
            triggeredAt: new Date()
          });
          
          // Emit socket event
          socketIO.emit('meter-offline', {
            meterId: meter._id,
            meterNumber: meter.meterNumber,
            lastSeen: meter.lastSeen
          });
        }
        
        // Status changed from offline to online
        if (!wasOnline && isNowOnline) {
          meter.status = 'online';
          await meter.save();
          
          // Create online event
          await Event.create({
            meter: meter._id,
            eventType: EVENT_TYPES.METER_ONLINE,
            eventCode: 'COMM_RESTORED',
            severity: 'info',
            category: 'communication',
            description: `Meter ${meter.meterNumber} came online`,
            timestamp: new Date()
          });
          
          // Resolve any active communication alerts
          await Alert.updateMany(
            {
              meter: meter._id,
              alertType: ALERT_TYPES.TECHNICAL_COMMUNICATION_FAILURE,
              status: 'active'
            },
            {
              status: 'resolved',
              resolvedAt: new Date(),
              resolutionNotes: 'Communication restored automatically'
            }
          );
          
          // Emit socket event
          socketIO.emit('meter-online', {
            meterId: meter._id,
            meterNumber: meter.meterNumber
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking meter status:', error);
      return false;
    }
  }
  
  // Update meter reading
  static async updateMeterReading(meterNumber: string, reading: any) {
    try {
      const meter = await Meter.findOne({ meterNumber });
      
      if (!meter) {
        throw new Error('Meter not found');
      }
      
      // Update current reading
      meter.currentReading = {
        totalEnergy: reading.totalEnergy || meter.currentReading.totalEnergy,
        voltage: reading.voltage || meter.currentReading.voltage,
        current: reading.current || meter.currentReading.current,
        power: reading.power || meter.currentReading.power,
        frequency: reading.frequency || meter.currentReading.frequency,
        powerFactor: reading.powerFactor || meter.currentReading.powerFactor,
        timestamp: new Date()
      };
      
      meter.lastSeen = new Date();
      meter.status = 'online';
      
      await meter.save();
      
      // Emit real-time update
      socketIO.emit('meter-reading-update', {
        meterId: meter._id,
        meterNumber: meter.meterNumber,
        reading: meter.currentReading
      });
      
      return meter;
    } catch (error) {
      console.error('Error updating meter reading:', error);
      throw error;
    }
  }
  
  // Check for tamper conditions
  static async checkTamperStatus(meter: any) {
    try {
      const tamperConditions = [];
      
      if (meter.tamperStatus.coverOpen) {
        tamperConditions.push({
          type: ALERT_TYPES.TAMPER_COVER_OPEN,
          description: 'Meter cover is open'
        });
      }
      
      if (meter.tamperStatus.magneticTamper) {
        tamperConditions.push({
          type: ALERT_TYPES.TAMPER_MAGNETIC,
          description: 'Magnetic tamper detected'
        });
      }
      
      if (meter.tamperStatus.reverseFlow) {
        tamperConditions.push({
          type: ALERT_TYPES.TAMPER_REVERSE_FLOW,
          description: 'Reverse energy flow detected'
        });
      }
      
      if (meter.tamperStatus.neutralDisturbance) {
        tamperConditions.push({
          type: ALERT_TYPES.TAMPER_NEUTRAL_DISTURBANCE,
          description: 'Neutral disturbance detected'
        });
      }
      
      // Create alerts for each tamper condition
      for (const condition of tamperConditions) {
        const existingAlert = await Alert.findOne({
          meter: meter._id,
          alertType: condition.type,
          status: 'active'
        });
        
        if (!existingAlert) {
          await Alert.create({
            meter: meter._id,
            alertType: condition.type,
            alertCode: 'TAMPER',
            priority: 'high',
            category: 'tamper',
            title: 'Tamper Alert',
            description: condition.description,
            isRevenueLoss: true,
            triggeredAt: new Date()
          });
          
          // Create tamper event
          await Event.create({
            meter: meter._id,
            eventType: condition.type,
            eventCode: 'TAMPER',
            severity: 'critical',
            category: 'tamper',
            description: condition.description,
            timestamp: new Date()
          });
          
          // Emit tamper alert
          socketIO.emit('tamper-alert', {
            meterId: meter._id,
            meterNumber: meter.meterNumber,
            tamperType: condition.type,
            description: condition.description
          });
        }
      }
      
      return tamperConditions;
    } catch (error) {
      console.error('Error checking tamper status:', error);
      return [];
    }
  }
}
