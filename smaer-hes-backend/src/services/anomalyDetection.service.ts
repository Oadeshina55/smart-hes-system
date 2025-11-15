import { Meter } from '../models/Meter.model';
import { Consumption } from '../models/Consumption.model';
import { Alert, ALERT_TYPES } from '../models/Alert.model';
import { Event } from '../models/Event.model';
import moment from 'moment';

export class AnomalyDetectionService {
  // Main anomaly detection function
  static async detectAnomalies() {
    try {
      console.log('🔍 Running anomaly detection...');
      
      const meters = await Meter.find({ 
        isActive: true, 
        status: { $in: ['online', 'active'] } 
      }).populate('area');
      
      for (const meter of meters) {
        // Rule 1: Zero consumption detection
        await this.detectZeroConsumption(meter);
        
        // Rule 2: Consumption drop detection
        await this.detectConsumptionDrop(meter);
        
        // Rule 3: Neighborhood comparison
        await this.detectNeighborhoodVariance(meter);
        
        // Rule 4: Unusual pattern detection
        await this.detectUnusualPattern(meter);
      }
      
      console.log('✅ Anomaly detection completed');
      return true;
    } catch (error) {
      console.error('Error in anomaly detection:', error);
      return false;
    }
  }
  
  // Rule 1: Detect meters with zero consumption for 48+ hours
  static async detectZeroConsumption(meter: any) {
    try {
      const twoDaysAgo = moment().subtract(48, 'hours').toDate();
      
      const recentConsumption = await Consumption.find({
        meter: meter._id,
        timestamp: { $gte: twoDaysAgo },
        interval: 'hourly'
      }).sort('-timestamp');
      
      if (recentConsumption.length === 0) return;
      
      const allZero = recentConsumption.every(c => c.energy.activeEnergy === 0);
      
      if (allZero) {
        // Check if alert already exists
        const existingAlert = await Alert.findOne({
          meter: meter._id,
          alertType: ALERT_TYPES.ANOMALY_ZERO_CONSUMPTION,
          status: { $in: ['active', 'acknowledged'] }
        });
        
        if (!existingAlert) {
            await Alert.create({
            meter: meter._id,
            alertType: ALERT_TYPES.ANOMALY_ZERO_CONSUMPTION,
            alertCode: 'ZERO_CONSUMPTION',
            priority: 'high',
            category: 'anomaly',
            title: 'Zero Consumption Detected',
            description: `Meter ${meter.meterNumber} has reported zero consumption for over 48 hours`,
            isRevenueLoss: true,
            estimatedLoss: 100, // Estimated daily loss
              details: new Map<string, any>([
                ['duration', '48+ hours'],
                ['lastReading', recentConsumption[0]?.timestamp]
              ]),
            triggeredAt: new Date()
          });
          
          await Event.create({
            meter: meter._id,
            eventType: 'ZERO_CONSUMPTION',
            eventCode: 'ANOMALY',
            severity: 'warning',
            category: 'technical',
            description: 'Zero consumption detected for 48+ hours',
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error detecting zero consumption:', error);
    }
  }
  
  // Rule 2: Detect consumption drop > 80% compared to last month
  static async detectConsumptionDrop(meter: any) {
    try {
      const today = moment().startOf('day');
      const yesterday = moment().subtract(1, 'day').startOf('day');
      const lastMonth = moment().subtract(30, 'days').startOf('day');
      
      // Get yesterday's consumption
      const yesterdayConsumption = await Consumption.findOne({
        meter: meter._id,
        timestamp: {
          $gte: yesterday.toDate(),
          $lt: today.toDate()
        },
        interval: 'daily'
      });
      
      // Get last month's average daily consumption
      const lastMonthConsumption = await Consumption.aggregate([
        {
          $match: {
            meter: meter._id,
            timestamp: {
              $gte: lastMonth.toDate(),
              $lt: yesterday.toDate()
            },
            interval: 'daily'
          }
        },
        {
          $group: {
            _id: null,
            avgConsumption: { $avg: '$energy.activeEnergy' }
          }
        }
      ]);
      
      if (yesterdayConsumption && lastMonthConsumption.length > 0) {
        const avgLastMonth = lastMonthConsumption[0].avgConsumption;
        const currentConsumption = yesterdayConsumption.energy.activeEnergy;
        
        if (avgLastMonth > 0) {
          const dropPercentage = ((avgLastMonth - currentConsumption) / avgLastMonth) * 100;
          
          if (dropPercentage > 80) {
            // Check if alert already exists
            const existingAlert = await Alert.findOne({
              meter: meter._id,
              alertType: ALERT_TYPES.ANOMALY_CONSUMPTION_DROP,
              status: { $in: ['active', 'acknowledged'] },
              triggeredAt: { $gte: yesterday.toDate() }
            });
            
            if (!existingAlert) {
              await Alert.create({
                meter: meter._id,
                alertType: ALERT_TYPES.ANOMALY_CONSUMPTION_DROP,
                alertCode: 'CONSUMPTION_DROP',
                priority: 'high',
                category: 'anomaly',
                title: 'Significant Consumption Drop',
                description: `Meter ${meter.meterNumber} consumption dropped by ${dropPercentage.toFixed(1)}% compared to last month's average`,
                isRevenueLoss: true,
                estimatedLoss: avgLastMonth - currentConsumption,
                details: new Map<string, any>([
                  ['dropPercentage', dropPercentage],
                  ['lastMonthAvg', avgLastMonth],
                  ['currentConsumption', currentConsumption]
                ]),
                triggeredAt: new Date()
              });
              
              await Event.create({
                meter: meter._id,
                eventType: 'CONSUMPTION_DROP',
                eventCode: 'ANOMALY',
                severity: 'warning',
                category: 'technical',
                description: `Consumption dropped by ${dropPercentage.toFixed(1)}%`,
                timestamp: new Date()
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error detecting consumption drop:', error);
    }
  }
  
  // Rule 3: Compare with neighborhood average
  static async detectNeighborhoodVariance(meter: any) {
    try {
      if (!meter.area) return;
      
      const yesterday = moment().subtract(1, 'day').startOf('day');
      const today = moment().startOf('day');
      
      // Get meters in the same area
      const areaMeters = await Meter.find({
        area: meter.area._id,
        _id: { $ne: meter._id },
        isActive: true
      });
      
      if (areaMeters.length < 3) return; // Need at least 3 other meters for comparison
      
      // Get yesterday's consumption for all area meters
      const consumptions = await Consumption.find({
        meter: { $in: [...areaMeters.map((m: any) => m._id), meter._id] },
        timestamp: {
          $gte: yesterday.toDate(),
          $lt: today.toDate()
        },
        interval: 'daily'
      });
      
      if (consumptions.length === 0) return;
      
      const meterConsumption = consumptions.find(c => c.meter.toString() === meter._id.toString());
      if (!meterConsumption) return;
      
      const otherConsumptions = consumptions.filter(c => c.meter.toString() !== meter._id.toString());
      if (otherConsumptions.length === 0) return;
      
      const avgAreaConsumption = otherConsumptions.reduce((sum, c) => sum + c.energy.activeEnergy, 0) / otherConsumptions.length;
      
      if (avgAreaConsumption > 0) {
        const variancePercentage = ((avgAreaConsumption - meterConsumption.energy.activeEnergy) / avgAreaConsumption) * 100;
        
        if (variancePercentage > 70) { // Consumption is 70% less than area average
          // Check if alert already exists
          const existingAlert = await Alert.findOne({
            meter: meter._id,
            alertType: ALERT_TYPES.ANOMALY_NEIGHBORHOOD_VARIANCE,
            status: { $in: ['active', 'acknowledged'] },
            triggeredAt: { $gte: yesterday.toDate() }
          });
          
          if (!existingAlert) {
            await Alert.create({
              meter: meter._id,
              alertType: ALERT_TYPES.ANOMALY_NEIGHBORHOOD_VARIANCE,
              alertCode: 'NEIGHBORHOOD_VARIANCE',
              priority: 'medium',
              category: 'anomaly',
              title: 'Abnormal Area Consumption Pattern',
              description: `Meter ${meter.meterNumber} consumption is ${variancePercentage.toFixed(1)}% below area average`,
              isRevenueLoss: true,
              estimatedLoss: avgAreaConsumption - meterConsumption.energy.activeEnergy,
              details: new Map<string, any>([
                ['variancePercentage', variancePercentage],
                ['areaAverage', avgAreaConsumption],
                ['meterConsumption', meterConsumption.energy.activeEnergy],
                ['areaName', meter.area.name]
              ]),
              triggeredAt: new Date()
            });
            
            await Event.create({
              meter: meter._id,
              eventType: 'NEIGHBORHOOD_VARIANCE',
              eventCode: 'ANOMALY',
              severity: 'warning',
              category: 'technical',
              description: `Consumption ${variancePercentage.toFixed(1)}% below area average`,
              timestamp: new Date()
            });
          }
        }
      }
    } catch (error) {
      console.error('Error detecting neighborhood variance:', error);
    }
  }
  
  // Rule 4: Detect unusual consumption patterns
  static async detectUnusualPattern(meter: any) {
    try {
      const lastWeek = moment().subtract(7, 'days').startOf('day');
      
      // Get hourly consumption for the last week
      const hourlyConsumption = await Consumption.find({
        meter: meter._id,
        timestamp: { $gte: lastWeek.toDate() },
        interval: 'hourly'
      }).sort('timestamp');
      
      if (hourlyConsumption.length < 24) return; // Need at least a day's worth of data
      
      // Check for patterns like:
      // 1. No variation in consumption (potential bypass)
      // 2. Negative consumption (reverse flow)
      // 3. Sudden spikes followed by drops
      
      const consumptionValues = hourlyConsumption.map(c => c.energy.activeEnergy);
      const avgConsumption = consumptionValues.reduce((sum, val) => sum + val, 0) / consumptionValues.length;
      const stdDev = Math.sqrt(consumptionValues.reduce((sum, val) => sum + Math.pow(val - avgConsumption, 2), 0) / consumptionValues.length);
      
      // Check for no variation (all values within 5% of average)
      const noVariation = stdDev < (avgConsumption * 0.05);
      
      // Check for negative values
      const hasNegativeValues = consumptionValues.some(val => val < 0);
      
      if (noVariation || hasNegativeValues) {
        const existingAlert = await Alert.findOne({
          meter: meter._id,
          alertType: ALERT_TYPES.ANOMALY_UNUSUAL_PATTERN,
          status: { $in: ['active', 'acknowledged'] },
          triggeredAt: { $gte: lastWeek.toDate() }
        });
        
        if (!existingAlert) {
          const pattern = noVariation ? 'No consumption variation' : 'Negative consumption detected';
          
          await Alert.create({
            meter: meter._id,
            alertType: ALERT_TYPES.ANOMALY_UNUSUAL_PATTERN,
            alertCode: 'UNUSUAL_PATTERN',
            priority: 'high',
            category: 'anomaly',
            title: 'Unusual Consumption Pattern',
            description: `Meter ${meter.meterNumber}: ${pattern}`,
            isRevenueLoss: true,
            estimatedLoss: avgConsumption * 24, // Daily estimated loss
            details: new Map<string, any>([
              ['pattern', pattern],
              ['avgConsumption', avgConsumption],
              ['stdDeviation', stdDev]
            ]),
            triggeredAt: new Date()
          });
          
          await Event.create({
            meter: meter._id,
            eventType: 'UNUSUAL_PATTERN',
            eventCode: 'ANOMALY',
            severity: 'warning',
            category: 'technical',
            description: pattern,
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error detecting unusual patterns:', error);
    }
  }
}
