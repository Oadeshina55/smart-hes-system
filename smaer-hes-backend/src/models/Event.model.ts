import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  meter: mongoose.Types.ObjectId;
  eventType: string;
  eventCode: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'communication' | 'tamper' | 'power' | 'billing' | 'technical' | 'other';
  description: string;
  details?: Map<string, any>;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  resolution?: string;
  metadata?: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    meter: {
      type: Schema.Types.ObjectId,
      ref: 'Meter',
      required: true
    },
    eventType: {
      type: String,
      required: true,
      trim: true
    },
    eventCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info'
    },
    category: {
      type: String,
      enum: ['communication', 'tamper', 'power', 'billing', 'technical', 'other'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    details: {
      type: Map,
      of: Schema.Types.Mixed
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: {
      type: Date
    },
    resolution: {
      type: String
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
eventSchema.index({ meter: 1, timestamp: -1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ severity: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ acknowledged: 1 });
eventSchema.index({ timestamp: -1 });

// Common event types
export const EVENT_TYPES = {
  // Communication Events
  METER_ONLINE: 'METER_ONLINE',
  METER_OFFLINE: 'METER_OFFLINE',
  COMMUNICATION_LOST: 'COMMUNICATION_LOST',
  COMMUNICATION_RESTORED: 'COMMUNICATION_RESTORED',
  
  // Tamper Events
  COVER_OPEN: 'COVER_OPEN',
  COVER_CLOSED: 'COVER_CLOSED',
  MAGNETIC_TAMPER: 'MAGNETIC_TAMPER',
  REVERSE_FLOW: 'REVERSE_FLOW',
  NEUTRAL_DISTURBANCE: 'NEUTRAL_DISTURBANCE',
  
  // Power Events
  POWER_OUTAGE: 'POWER_OUTAGE',
  POWER_RESTORED: 'POWER_RESTORED',
  VOLTAGE_IMBALANCE: 'VOLTAGE_IMBALANCE',
  OVER_VOLTAGE: 'OVER_VOLTAGE',
  UNDER_VOLTAGE: 'UNDER_VOLTAGE',
  
  // Billing Events
  TOKEN_LOADED: 'TOKEN_LOADED',
  CREDIT_EXHAUSTED: 'CREDIT_EXHAUSTED',
  LOW_CREDIT: 'LOW_CREDIT',
  
  // Technical Events
  RELAY_DISCONNECTED: 'RELAY_DISCONNECTED',
  RELAY_CONNECTED: 'RELAY_CONNECTED',
  FIRMWARE_UPDATE: 'FIRMWARE_UPDATE',
  CONFIGURATION_CHANGE: 'CONFIGURATION_CHANGE'
};

export const Event = mongoose.model<IEvent>('Event', eventSchema);
