import mongoose, { Document } from 'mongoose';
export interface IAlert extends Document {
    meter: mongoose.Types.ObjectId;
    alertType: string;
    alertCode: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: 'tamper' | 'anomaly' | 'revenue' | 'technical' | 'communication';
    title: string;
    description: string;
    details?: Map<string, any>;
    status: 'active' | 'acknowledged' | 'resolved' | 'escalated';
    triggeredAt: Date;
    acknowledgedBy?: mongoose.Types.ObjectId;
    acknowledgedAt?: Date;
    resolvedBy?: mongoose.Types.ObjectId;
    resolvedAt?: Date;
    escalatedTo?: mongoose.Types.ObjectId;
    escalatedAt?: Date;
    resolutionNotes?: string;
    estimatedLoss?: number;
    isRevenueLoss: boolean;
    metadata?: Map<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ALERT_TYPES: {
    TAMPER_COVER_OPEN: string;
    TAMPER_MAGNETIC: string;
    TAMPER_REVERSE_FLOW: string;
    TAMPER_NEUTRAL_DISTURBANCE: string;
    ANOMALY_CONSUMPTION_DROP: string;
    ANOMALY_ZERO_CONSUMPTION: string;
    ANOMALY_NEIGHBORHOOD_VARIANCE: string;
    ANOMALY_UNUSUAL_PATTERN: string;
    REVENUE_THEFT_SUSPECTED: string;
    REVENUE_METER_BYPASS: string;
    REVENUE_ILLEGAL_CONNECTION: string;
    TECHNICAL_COMMUNICATION_FAILURE: string;
    TECHNICAL_METER_MALFUNCTION: string;
    TECHNICAL_VOLTAGE_ISSUE: string;
};
export declare const Alert: any;
//# sourceMappingURL=Alert.model.d.ts.map