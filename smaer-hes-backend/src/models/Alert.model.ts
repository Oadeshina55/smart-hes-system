import mongoose, { Document, Schema } from 'mongoose';

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

const alertSchema = new Schema<IAlert>(
  {
    meter: {
      type: Schema.Types.ObjectId,
      ref: 'Meter',
      required: true
    },
    alertType: {
      type: String,
      required: true,
      trim: true
    },
    alertCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    category: {
      type: String,
      enum: ['tamper', 'anomaly', 'revenue', 'technical', 'communication'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    details: {
      type: Map,
      of: Schema.Types.Mixed
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved', 'escalated'],
      default: 'active'
    },
    triggeredAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    acknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: {
      type: Date
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: {
      type: Date
    },
    escalatedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    escalatedAt: {
      type: Date
    },
    resolutionNotes: {
      type: String
    },
    estimatedLoss: {
      type: Number,
      default: 0
    },
    isRevenueLoss: {
      type: Boolean,
      default: false
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Create indexes
alertSchema.index({ meter: 1, status: 1 });
alertSchema.index({ alertType: 1 });
alertSchema.index({ priority: 1 });
alertSchema.index({ category: 1 });
alertSchema.index({ status: 1 });
alertSchema.index({ triggeredAt: -1 });
alertSchema.index({ isRevenueLoss: 1 });

// Common alert types
export const ALERT_TYPES = {
  // Tamper Alerts
  TAMPER_COVER_OPEN: 'TAMPER_COVER_OPEN',
  TAMPER_MAGNETIC: 'TAMPER_MAGNETIC',
  TAMPER_REVERSE_FLOW: 'TAMPER_REVERSE_FLOW',
  TAMPER_NEUTRAL_DISTURBANCE: 'TAMPER_NEUTRAL_DISTURBANCE',
  
  // Anomaly Alerts (AI-driven)
  ANOMALY_CONSUMPTION_DROP: 'ANOMALY_CONSUMPTION_DROP',
  ANOMALY_ZERO_CONSUMPTION: 'ANOMALY_ZERO_CONSUMPTION',
  ANOMALY_NEIGHBORHOOD_VARIANCE: 'ANOMALY_NEIGHBORHOOD_VARIANCE',
  ANOMALY_UNUSUAL_PATTERN: 'ANOMALY_UNUSUAL_PATTERN',
  
  // Revenue Loss Alerts
  REVENUE_THEFT_SUSPECTED: 'REVENUE_THEFT_SUSPECTED',
  REVENUE_METER_BYPASS: 'REVENUE_METER_BYPASS',
  REVENUE_ILLEGAL_CONNECTION: 'REVENUE_ILLEGAL_CONNECTION',
  
  // Technical Alerts
  TECHNICAL_COMMUNICATION_FAILURE: 'TECHNICAL_COMMUNICATION_FAILURE',
  TECHNICAL_METER_MALFUNCTION: 'TECHNICAL_METER_MALFUNCTION',
  TECHNICAL_VOLTAGE_ISSUE: 'TECHNICAL_VOLTAGE_ISSUE'
};

export const Alert = mongoose.model<IAlert>('Alert', alertSchema);
