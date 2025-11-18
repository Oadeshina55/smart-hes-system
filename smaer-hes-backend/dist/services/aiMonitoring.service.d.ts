/**
 * AI Monitoring Service
 * Provides intelligent monitoring and analysis of meter data, consumption patterns, and alerts
 */
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
declare class AIMonitoringService {
    /**
     * Analyze consumption patterns for a specific meter
     */
    analyzeConsumptionPattern(meterId: string): Promise<ConsumptionPattern | null>;
    /**
     * Detect anomalies across all meters
     */
    detectAnomalies(): Promise<AnomalyDetection[]>;
    /**
     * Detect anomalies for a specific meter
     */
    private detectMeterAnomalies;
    /**
     * Generate AI insights and recommendations
     */
    generateInsights(): Promise<AIInsight[]>;
    /**
     * Smart alert prioritization using AI
     */
    prioritizeAlerts(): Promise<any[]>;
    private calculateDailyAverages;
    private detectTrend;
    private calculateAnomalyScore;
    private predictFutureConsumption;
    private calculateBaseline;
    private createAnomalyAlert;
    private estimateAlertImpact;
    private getRecommendedAction;
}
export declare const aiMonitoringService: AIMonitoringService;
export default aiMonitoringService;
//# sourceMappingURL=aiMonitoring.service.d.ts.map