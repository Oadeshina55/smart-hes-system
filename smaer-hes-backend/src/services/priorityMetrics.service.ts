import { PriorityMetrics, IPriorityMetrics } from '../models/PriorityMetrics.model';
import { Meter } from '../models/Meter.model';
import mongoose from 'mongoose';
import moment from 'moment';

/**
 * Priority Metrics Service
 *
 * Handles storage, retrieval, and analysis of the 14 priority OBIS metrics
 * for billing, security, and system diagnostics.
 */
export class PriorityMetricsService {
  /**
   * Store or update priority metrics for a meter
   */
  static async storePriorityMetrics(data: Partial<IPriorityMetrics>): Promise<IPriorityMetrics> {
    try {
      // Get meter to extract customerNetwork
      const meter = await Meter.findById(data.meter);
      if (!meter) {
        throw new Error('Meter not found');
      }

      // Calculate data quality
      const dataQuality = this.calculateDataQuality(data);

      const metrics = await PriorityMetrics.create({
        ...data,
        customerNetwork: meter.customerNetwork,
        timestamp: data.timestamp || new Date(),
        dataQuality,
      });

      return metrics;
    } catch (error: any) {
      throw new Error(`Failed to store priority metrics: ${error.message}`);
    }
  }

  /**
   * Get latest priority metrics for a specific meter
   */
  static async getLatestMetrics(meterId: string): Promise<IPriorityMetrics | null> {
    try {
      const metrics = await PriorityMetrics.findOne({ meter: meterId })
        .sort({ timestamp: -1 })
        .populate('meter', 'meterNumber serialNumber')
        .populate('customerNetwork', 'networkName networkCode');

      return metrics;
    } catch (error: any) {
      throw new Error(`Failed to get latest metrics: ${error.message}`);
    }
  }

  /**
   * Get priority metrics history for a meter within a time range
   */
  static async getMetricsHistory(
    meterId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IPriorityMetrics[]> {
    try {
      const metrics = await PriorityMetrics.find({
        meter: meterId,
        timestamp: { $gte: startDate, $lte: endDate },
      })
        .sort({ timestamp: -1 })
        .limit(1000);

      return metrics;
    } catch (error: any) {
      throw new Error(`Failed to get metrics history: ${error.message}`);
    }
  }

  /**
   * Get aggregated priority metrics for a customer network
   */
  static async getNetworkMetricsSummary(customerNetworkId: string): Promise<any> {
    try {
      const summary = await PriorityMetrics.aggregate([
        {
          $match: {
            customerNetwork: new mongoose.Types.ObjectId(customerNetworkId),
            timestamp: { $gte: moment().subtract(24, 'hours').toDate() },
          },
        },
        {
          $group: {
            _id: '$meter',
            latestTimestamp: { $max: '$timestamp' },
            avgPower: { $avg: '$instantaneousPower.value' },
            avgVoltage: { $avg: '$voltage.phaseA' },
            totalEnergy: { $last: '$cumulativeActiveEnergy.value' },
            connectionStatus: { $last: '$connectionStatus.status' },
            signalQuality: { $last: '$signalStrength.signalQuality' },
            hasTamperEvent: {
              $max: {
                $cond: [
                  { $and: ['$lastTamperEvent', { $eq: ['$lastTamperEvent.cleared', false] }] },
                  1,
                  0,
                ],
              },
            },
            hasLowCredit: {
              $max: {
                $cond: [
                  {
                    $and: [
                      '$currentCredit',
                      { $lt: ['$currentCredit.balance', '$currentCredit.lowCreditThreshold'] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalMeters: { $sum: 1 },
            avgPower: { $avg: '$avgPower' },
            avgVoltage: { $avg: '$avgVoltage' },
            totalEnergy: { $sum: '$totalEnergy' },
            connectedMeters: {
              $sum: { $cond: [{ $eq: ['$connectionStatus', 'connected'] }, 1, 0] },
            },
            disconnectedMeters: {
              $sum: { $cond: [{ $eq: ['$connectionStatus', 'disconnected'] }, 1, 0] },
            },
            avgSignalQuality: { $avg: '$signalQuality' },
            metersWithTamper: { $sum: '$hasTamperEvent' },
            metersWithLowCredit: { $sum: '$hasLowCredit' },
          },
        },
      ]);

      return summary[0] || {};
    } catch (error: any) {
      throw new Error(`Failed to get network metrics summary: ${error.message}`);
    }
  }

  /**
   * Get critical alerts from priority metrics
   */
  static async getCriticalAlerts(customerNetworkId?: string): Promise<any[]> {
    try {
      const match: any = {
        timestamp: { $gte: moment().subtract(24, 'hours').toDate() },
      };

      if (customerNetworkId) {
        match.customerNetwork = new mongoose.Types.ObjectId(customerNetworkId);
      }

      const alerts = await PriorityMetrics.aggregate([
        { $match: match },
        {
          $sort: { meter: 1, timestamp: -1 },
        },
        {
          $group: {
            _id: '$meter',
            latestMetrics: { $first: '$$ROOT' },
          },
        },
        {
          $replaceRoot: { newRoot: '$latestMetrics' },
        },
        {
          $match: {
            $or: [
              { 'lastTamperEvent.cleared': false },
              { 'connectionStatus.status': 'disconnected' },
              { 'voltage.underVoltageAlarm': true },
              { 'voltage.overVoltageAlarm': true },
              { 'signalStrength.signalQuality': { $lt: 30 } },
              {
                $expr: {
                  $lt: ['$currentCredit.balance', '$currentCredit.lowCreditThreshold'],
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'meters',
            localField: 'meter',
            foreignField: '_id',
            as: 'meterInfo',
          },
        },
        {
          $unwind: '$meterInfo',
        },
        {
          $project: {
            meter: '$meterInfo.meterNumber',
            serialNumber: '$meterInfo.serialNumber',
            alerts: {
              $filter: {
                input: [
                  {
                    type: 'tamper',
                    severity: 'critical',
                    message: 'Tamper event detected',
                    condition: { $eq: ['$lastTamperEvent.cleared', false] },
                  },
                  {
                    type: 'disconnection',
                    severity: 'high',
                    message: 'Meter disconnected',
                    condition: { $eq: ['$connectionStatus.status', 'disconnected'] },
                  },
                  {
                    type: 'voltage',
                    severity: 'high',
                    message: 'Voltage alarm',
                    condition: {
                      $or: ['$voltage.underVoltageAlarm', '$voltage.overVoltageAlarm'],
                    },
                  },
                  {
                    type: 'signal',
                    severity: 'medium',
                    message: 'Poor signal quality',
                    condition: { $lt: ['$signalStrength.signalQuality', 30] },
                  },
                  {
                    type: 'credit',
                    severity: 'medium',
                    message: 'Low credit balance',
                    condition: {
                      $lt: ['$currentCredit.balance', '$currentCredit.lowCreditThreshold'],
                    },
                  },
                ],
                as: 'alert',
                cond: '$$alert.condition',
              },
            },
            timestamp: 1,
          },
        },
      ]);

      return alerts;
    } catch (error: any) {
      throw new Error(`Failed to get critical alerts: ${error.message}`);
    }
  }

  /**
   * Get billing-related metrics for revenue calculation
   */
  static async getBillingMetrics(
    meterId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    try {
      const metrics = await PriorityMetrics.aggregate([
        {
          $match: {
            meter: new mongoose.Types.ObjectId(meterId),
            timestamp: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $sort: { timestamp: 1 },
        },
        {
          $group: {
            _id: null,
            startEnergy: { $first: '$cumulativeActiveEnergy.value' },
            endEnergy: { $last: '$cumulativeActiveEnergy.value' },
            startReactiveEnergy: { $first: '$cumulativeReactiveEnergy.value' },
            endReactiveEnergy: { $last: '$cumulativeReactiveEnergy.value' },
            maxDemand: { $max: '$maximumDemand.value' },
            peakEnergyStart: { $first: '$touEnergy.peak.value' },
            peakEnergyEnd: { $last: '$touEnergy.peak.value' },
            offPeakEnergyStart: { $first: '$touEnergy.offPeak.value' },
            offPeakEnergyEnd: { $last: '$touEnergy.offPeak.value' },
            avgPowerFactor: {
              $avg: {
                $cond: [
                  { $gt: ['$cumulativeReactiveEnergy.value', 0] },
                  {
                    $divide: [
                      '$cumulativeActiveEnergy.value',
                      {
                        $sqrt: {
                          $add: [
                            { $pow: ['$cumulativeActiveEnergy.value', 2] },
                            { $pow: ['$cumulativeReactiveEnergy.value', 2] },
                          ],
                        },
                      },
                    ],
                  },
                  1,
                ],
              },
            },
          },
        },
        {
          $project: {
            totalActiveEnergy: { $subtract: ['$endEnergy', '$startEnergy'] },
            totalReactiveEnergy: {
              $subtract: ['$endReactiveEnergy', '$startReactiveEnergy'],
            },
            maxDemand: 1,
            peakEnergyConsumption: { $subtract: ['$peakEnergyEnd', '$peakEnergyStart'] },
            offPeakEnergyConsumption: {
              $subtract: ['$offPeakEnergyEnd', '$offPeakEnergyStart'],
            },
            avgPowerFactor: 1,
          },
        },
      ]);

      return metrics[0] || {};
    } catch (error: any) {
      throw new Error(`Failed to get billing metrics: ${error.message}`);
    }
  }

  /**
   * Calculate data quality score
   */
  private static calculateDataQuality(data: Partial<IPriorityMetrics>): any {
    const requiredFields = [
      'cumulativeActiveEnergy',
      'connectionStatus',
      'instantaneousPower',
      'voltage',
      'signalStrength',
    ];

    const optionalFields = [
      'lastTamperEvent',
      'currentCredit',
      'powerOutage',
      'tidCounter',
      'loadProfile',
      'cumulativeReactiveEnergy',
      'touEnergy',
      'maximumDemand',
      'stsKeys',
    ];

    const totalFields = requiredFields.length + optionalFields.length;
    let presentFields = 0;
    const missingParameters: string[] = [];

    // Check required fields
    for (const field of requiredFields) {
      if (data[field as keyof IPriorityMetrics]) {
        presentFields++;
      } else {
        missingParameters.push(field);
      }
    }

    // Check optional fields
    for (const field of optionalFields) {
      if (data[field as keyof IPriorityMetrics]) {
        presentFields++;
      }
    }

    const completeness = Math.round((presentFields / totalFields) * 100);

    // Determine validation status
    let validationStatus: 'valid' | 'suspicious' | 'invalid' = 'valid';
    if (missingParameters.length > 0) {
      validationStatus = 'suspicious';
    }
    if (missingParameters.length >= requiredFields.length) {
      validationStatus = 'invalid';
    }

    return {
      completeness,
      validationStatus,
      missingParameters,
    };
  }

  /**
   * Get meters with poor data quality
   */
  static async getMetersWithPoorDataQuality(
    customerNetworkId?: string,
    threshold: number = 50
  ): Promise<any[]> {
    try {
      const match: any = {
        'dataQuality.completeness': { $lt: threshold },
        timestamp: { $gte: moment().subtract(24, 'hours').toDate() },
      };

      if (customerNetworkId) {
        match.customerNetwork = new mongoose.Types.ObjectId(customerNetworkId);
      }

      const meters = await PriorityMetrics.aggregate([
        { $match: match },
        {
          $sort: { meter: 1, timestamp: -1 },
        },
        {
          $group: {
            _id: '$meter',
            latestMetrics: { $first: '$$ROOT' },
          },
        },
        {
          $replaceRoot: { newRoot: '$latestMetrics' },
        },
        {
          $lookup: {
            from: 'meters',
            localField: 'meter',
            foreignField: '_id',
            as: 'meterInfo',
          },
        },
        {
          $unwind: '$meterInfo',
        },
        {
          $project: {
            meterNumber: '$meterInfo.meterNumber',
            serialNumber: '$meterInfo.serialNumber',
            dataQuality: 1,
            timestamp: 1,
          },
        },
      ]);

      return meters;
    } catch (error: any) {
      throw new Error(`Failed to get meters with poor data quality: ${error.message}`);
    }
  }
}
