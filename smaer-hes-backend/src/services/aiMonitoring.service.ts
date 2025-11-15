/**
 * AI Monitoring Service
 * Provides intelligent monitoring and analysis of meter data, consumption patterns, and alerts
 */

import { Meter } from '../models/Meter.model';
import { Consumption } from '../models/Consumption.model';
import { Alert, ALERT_TYPES } from '../models/Alert.model';
import { Event } from '../models/Event.model';
import logger from '../utils/logger';

interface ConsumptionPattern {
  meterId: string;
  meterNumber: string;
  averageDaily: number;
  peakUsage: number;
  offPeakUsage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  anomalyScore: number;
  prediction: {
    nextDay: number;
    nextWeek: number;
    nextMonth: number;
  };
}

interface AnomalyDetection {
  meterId: string;
  type: 'consumption_spike' | 'consumption_drop' | 'unusual_pattern' | 'tamper_suspected' | 'communication_loss';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  recommendation: string;
  detectedAt: Date;
}

interface AIInsight {
  category: 'efficiency' | 'cost_saving' | 'maintenance' | 'security' | 'performance';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  actions?: string[];
}

class AIMonitoringService {
  /**
   * Analyze consumption patterns for a specific meter
   */
  async analyzeConsumptionPattern(meterId: string): Promise<ConsumptionPattern | null> {
    try {
      const meter = await Meter.findById(meterId);
      if (!meter) return null;

      // Get last 30 days of consumption data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const consumptionData = await Consumption.find({
        meter: meterId,
        timestamp: { $gte: thirtyDaysAgo },
      }).sort({ timestamp: 1 });

      if (consumptionData.length === 0) return null;

      // Calculate statistics
      const dailyConsumption = this.calculateDailyAverages(consumptionData);
      const trend = this.detectTrend(dailyConsumption);
      const anomalyScore = this.calculateAnomalyScore(dailyConsumption);
      const prediction = this.predictFutureConsumption(dailyConsumption);

      return {
        meterId,
        meterNumber: meter.meterNumber,
        averageDaily: dailyConsumption.reduce((a, b) => a + b, 0) / dailyConsumption.length,
        peakUsage: Math.max(...dailyConsumption),
        offPeakUsage: Math.min(...dailyConsumption),
        trend,
        anomalyScore,
        prediction,
      };
    } catch (error) {
      logger.error('Error analyzing consumption pattern', { meterId, error });
      return null;
    }
  }

  /**
   * Detect anomalies across all meters
   */
  async detectAnomalies(): Promise<AnomalyDetection[]> {
    try {
      const anomalies: AnomalyDetection[] = [];

      // Get all active meters
      const meters = await Meter.find({ isActive: true, status: 'online' });

      for (const meter of meters) {
        const meterAnomalies = await this.detectMeterAnomalies(meter);
        anomalies.push(...meterAnomalies);
      }

      // Store anomalies as alerts if they're significant
      for (const anomaly of anomalies) {
        if (anomaly.severity === 'high' || anomaly.severity === 'critical') {
          await this.createAnomalyAlert(anomaly);
        }
      }

      return anomalies;
    } catch (error) {
      logger.error('Error detecting anomalies', { error });
      return [];
    }
  }

  /**
   * Detect anomalies for a specific meter
   */
  private async detectMeterAnomalies(meter: any): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    // Get recent consumption data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentData = await Consumption.find({
      meter: meter._id,
      timestamp: { $gte: sevenDaysAgo },
    }).sort({ timestamp: -1 });

    if (recentData.length < 5) return anomalies;

    // Calculate baseline
    const baseline = this.calculateBaseline(recentData);
    const latest = recentData[0];

    // Check for consumption spike
    if (latest.energy.activeEnergy > baseline.mean + baseline.stdDev * 3) {
      anomalies.push({
        meterId: meter._id.toString(),
        type: 'consumption_spike',
        severity: latest.energy.activeEnergy > baseline.mean + baseline.stdDev * 5 ? 'critical' : 'high',
        confidence: 0.85,
        description: `Unusual consumption spike detected. Current: ${latest.energy.activeEnergy.toFixed(2)} kWh, Average: ${baseline.mean.toFixed(2)} kWh`,
        recommendation: 'Investigate potential meter malfunction or unauthorized usage',
        detectedAt: new Date(),
      });
    }

    // Check for consumption drop (potential bypass)
    if (latest.energy.activeEnergy < baseline.mean - baseline.stdDev * 3 && baseline.mean > 10) {
      anomalies.push({
        meterId: meter._id.toString(),
        type: 'consumption_drop',
        severity: 'high',
        confidence: 0.80,
        description: `Significant consumption drop detected. Current: ${latest.energy.activeEnergy.toFixed(2)} kWh, Average: ${baseline.mean.toFixed(2)} kWh`,
        recommendation: 'Check for meter tampering or technical issues',
        detectedAt: new Date(),
      });
    }

    // Check for unusual voltage/current patterns
    if (latest.voltage.average < 200 || latest.voltage.average > 250) {
      anomalies.push({
        meterId: meter._id.toString(),
        type: 'unusual_pattern',
        severity: 'medium',
        confidence: 0.90,
        description: `Abnormal voltage detected: ${latest.voltage.average.toFixed(2)} V`,
        recommendation: 'Check power supply quality and meter connections',
        detectedAt: new Date(),
      });
    }

    // Check for tamper indicators
    if (meter.tamperStatus?.coverOpen || meter.tamperStatus?.magneticInterference) {
      anomalies.push({
        meterId: meter._id.toString(),
        type: 'tamper_suspected',
        severity: 'critical',
        confidence: 0.95,
        description: 'Tamper event detected',
        recommendation: 'Immediate physical inspection required',
        detectedAt: new Date(),
      });
    }

    // Check for communication issues
    const lastSeen = new Date(meter.lastSeen);
    const hoursSinceLastSeen = (Date.now() - lastSeen.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastSeen > 24) {
      anomalies.push({
        meterId: meter._id.toString(),
        type: 'communication_loss',
        severity: hoursSinceLastSeen > 72 ? 'high' : 'medium',
        confidence: 1.0,
        description: `No communication for ${hoursSinceLastSeen.toFixed(1)} hours`,
        recommendation: 'Check meter connectivity and SIM card status',
        detectedAt: new Date(),
      });
    }

    return anomalies;
  }

  /**
   * Generate AI insights and recommendations
   */
  async generateInsights(): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    try {
      // Analyze overall system health
      const totalMeters = await Meter.countDocuments({ isActive: true });
      const onlineMeters = await Meter.countDocuments({ status: 'online', isActive: true });
      const onlineRate = (onlineMeters / totalMeters) * 100;

      if (onlineRate < 95) {
        insights.push({
          category: 'performance',
          title: 'Meter Communication Rate Below Optimal',
          description: `Current online rate is ${onlineRate.toFixed(1)}%. ${totalMeters - onlineMeters} meters are offline.`,
          impact: onlineRate < 85 ? 'high' : 'medium',
          actionable: true,
          actions: [
            'Check network coverage in affected areas',
            'Verify SIM card status for offline meters',
            'Schedule maintenance for persistently offline meters',
          ],
        });
      }

      // Analyze tamper alerts
      const recentTampers = await Alert.countDocuments({
        alertType: 'tamper',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        status: { $in: ['pending', 'acknowledged'] },
      });

      if (recentTampers > 5) {
        insights.push({
          category: 'security',
          title: 'Increased Tamper Events Detected',
          description: `${recentTampers} tamper events in the last 7 days. This is above the normal threshold.`,
          impact: 'high',
          actionable: true,
          actions: [
            'Deploy field teams to inspect affected meters',
            'Review security protocols in high-risk areas',
            'Consider upgrading to tamper-resistant meter models',
          ],
        });
      }

      // Analyze consumption trends
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentConsumption = await Consumption.aggregate([
        { $match: { timestamp: { $gte: weekAgo } } },
        {
          $group: {
            _id: null,
            totalEnergy: { $sum: '$energy.activeEnergy' },
            avgPowerFactor: { $avg: '$powerFactor.average' },
          },
        },
      ]);

      if (recentConsumption[0]?.avgPowerFactor < 0.85) {
        insights.push({
          category: 'efficiency',
          title: 'Low Power Factor Detected',
          description: `Average power factor is ${(recentConsumption[0].avgPowerFactor * 100).toFixed(1)}%. This indicates inefficient power usage.`,
          impact: 'medium',
          actionable: true,
          actions: [
            'Identify customers with low power factor',
            'Recommend power factor correction equipment',
            'Consider implementing power factor penalties/incentives',
          ],
        });
      }

      // Check for revenue protection opportunities
      const anomalyAlerts = await Alert.countDocuments({
        alertType: 'anomaly',
        status: 'pending',
      });

      if (anomalyAlerts > 10) {
        insights.push({
          category: 'cost_saving',
          title: 'Revenue Protection Opportunities',
          description: `${anomalyAlerts} anomaly alerts pending investigation. These may represent revenue leakage.`,
          impact: 'high',
          actionable: true,
          actions: [
            'Prioritize investigation of high-value anomalies',
            'Deploy field teams for physical verification',
            'Implement stricter monitoring for flagged meters',
          ],
        });
      }

      return insights;
    } catch (error) {
      logger.error('Error generating insights', { error });
      return insights;
    }
  }

  /**
   * Smart alert prioritization using AI
   */
  async prioritizeAlerts(): Promise<any[]> {
    try {
      const pendingAlerts = await Alert.find({ status: 'pending' })
        .populate('meter')
        .sort({ createdAt: -1 });

      const prioritized = pendingAlerts.map((alert) => {
        let priorityScore = 0;
        let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';

        // Base score on alert type
        switch (alert.alertType) {
          case 'tamper':
            priorityScore += 90;
            urgency = 'critical';
            break;
          case 'anomaly':
            priorityScore += 70;
            urgency = 'high';
            break;
          case 'revenue':
            priorityScore += 80;
            urgency = 'high';
            break;
          case 'technical':
            priorityScore += 50;
            urgency = 'medium';
            break;
          case 'communication':
            priorityScore += 40;
            urgency = 'medium';
            break;
          default:
            priorityScore += 30;
        }

        // Adjust for priority
        switch (alert.priority) {
          case 'critical':
            priorityScore += 30;
            break;
          case 'high':
            priorityScore += 20;
            break;
          case 'medium':
            priorityScore += 10;
            break;
        }

        // Adjust for age (older alerts get higher priority)
        const ageInHours = (Date.now() - alert.createdAt.getTime()) / (1000 * 60 * 60);
        priorityScore += Math.min(ageInHours * 2, 30);

        return {
          ...alert.toObject(),
          aiPriority: {
            score: Math.min(priorityScore, 100),
            urgency,
            estimatedImpact: this.estimateAlertImpact(alert),
            recommendedAction: this.getRecommendedAction(alert),
          },
        };
      });

      // Sort by priority score
      return prioritized.sort((a, b) => b.aiPriority.score - a.aiPriority.score);
    } catch (error) {
      logger.error('Error prioritizing alerts', { error });
      return [];
    }
  }

  // Helper methods
  private calculateDailyAverages(consumptionData: any[]): number[] {
    const dailyMap = new Map<string, number[]>();

    consumptionData.forEach((c) => {
      const date = new Date(c.timestamp).toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, []);
      }
      dailyMap.get(date)!.push(c.energy.activeEnergy);
    });

    return Array.from(dailyMap.values()).map((values) =>
      values.reduce((a, b) => a + b, 0) / values.length
    );
  }

  private detectTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 3) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (changePercent > 10) return 'increasing';
    if (changePercent < -10) return 'decreasing';
    return 'stable';
  }

  private calculateAnomalyScore(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / mean) * 100; // Coefficient of variation

    // Higher CV = more anomalous
    return Math.min(cv / 50, 1); // Normalize to 0-1
  }

  private predictFutureConsumption(dailyValues: number[]): { nextDay: number; nextWeek: number; nextMonth: number } {
    // Simple moving average prediction
    const recentAvg = dailyValues.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const trend = this.detectTrend(dailyValues);

    let trendMultiplier = 1.0;
    if (trend === 'increasing') trendMultiplier = 1.05;
    if (trend === 'decreasing') trendMultiplier = 0.95;

    return {
      nextDay: recentAvg * trendMultiplier,
      nextWeek: recentAvg * 7 * trendMultiplier,
      nextMonth: recentAvg * 30 * trendMultiplier,
    };
  }

  private calculateBaseline(data: any[]): { mean: number; stdDev: number } {
    const values = data.map((d) => d.energy.activeEnergy);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev };
  }

  private async createAnomalyAlert(anomaly: AnomalyDetection): Promise<void> {
    try {
      await Alert.create({
        meter: anomaly.meterId,
        alertType: 'anomaly',
        severity: anomaly.severity,
        title: `AI Detected: ${anomaly.type.replace(/_/g, ' ').toUpperCase()}`,
        description: `${anomaly.description}\n\nConfidence: ${(anomaly.confidence * 100).toFixed(0)}%\n\nRecommendation: ${anomaly.recommendation}`,
        status: 'pending',
        metadata: {
          aiGenerated: true,
          anomalyType: anomaly.type,
          confidence: anomaly.confidence,
        },
      });
    } catch (error) {
      logger.error('Error creating anomaly alert', { anomaly, error });
    }
  }

  private estimateAlertImpact(alert: any): string {
    switch (alert.alertType) {
      case 'tamper':
        return 'High - Potential revenue loss and safety concerns';
      case 'revenue':
        return 'High - Direct financial impact';
      case 'anomaly':
        return 'Medium - May indicate technical or revenue issues';
      case 'technical':
        return 'Medium - Service quality impact';
      case 'communication':
        return 'Low - Monitoring capability affected';
      default:
        return 'Low - Minor operational impact';
    }
  }

  private getRecommendedAction(alert: any): string {
    switch (alert.alertType) {
      case 'tamper':
        return 'Immediate field inspection required';
      case 'revenue':
        return 'Investigate consumption pattern and verify meter accuracy';
      case 'anomaly':
        return 'Remote reading and pattern analysis recommended';
      case 'technical':
        return 'Schedule maintenance visit';
      case 'communication':
        return 'Check SIM card and network connectivity';
      default:
        return 'Monitor situation and escalate if needed';
    }
  }
}

export const aiMonitoringService = new AIMonitoringService();
export default aiMonitoringService;
