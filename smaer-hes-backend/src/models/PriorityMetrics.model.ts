import mongoose, { Document, Schema } from 'mongoose';

/**
 * Priority OBIS Metrics Model
 *
 * Stores the 14 most critical OBIS parameters for billing, security, and diagnostics.
 * These metrics are essential for revenue calculation, tamper detection, and system monitoring.
 */

export interface IPriorityMetrics extends Document {
  meter: mongoose.Types.ObjectId;
  customerNetwork: mongoose.Types.ObjectId;
  timestamp: Date;

  // Priority 1: Cumulative Active Energy (kWh) - Primary billing index
  cumulativeActiveEnergy: {
    value: number; // kWh
    obisCode: string; // 1-0:1.8.0.255
    timestamp: Date;
  };

  // Priority 2: Last Tamper Event - Security
  lastTamperEvent?: {
    type: 'cover_open' | 'magnetic_field' | 'reverse_flow' | 'current_bypass' | 'voltage_imbalance';
    timestamp: Date;
    duration?: number; // seconds
    cleared: boolean;
  };

  // Priority 3: Current Credit/Unit Balance - Prepaid meters
  currentCredit?: {
    balance: number; // Currency or kWh units
    lowCreditThreshold: number;
    emergencyCredit: number;
    timestamp: Date;
  };

  // Priority 4: Connection Status
  connectionStatus: {
    status: 'connected' | 'disconnected' | 'tripped' | 'armed';
    reason?: string;
    lastChanged: Date;
  };

  // Priority 5: Last Power Outage/Restoration
  powerOutage?: {
    lastOutageTimestamp?: Date;
    lastRestorationTimestamp?: Date;
    outageDuration?: number; // seconds
    outageCount24h: number;
  };

  // Priority 6: Instantaneous Active Power (kW)
  instantaneousPower: {
    value: number; // kW
    obisCode: string; // 1-0:1.7.0.255
    timestamp: Date;
  };

  // Priority 7: Instantaneous Voltage - Per phase
  voltage: {
    phaseA: number; // Volts
    phaseB?: number;
    phaseC?: number;
    obisCode: string; // 1-0:32.7.0.255, 1-0:52.7.0.255, 1-0:72.7.0.255
    timestamp: Date;
    underVoltageAlarm?: boolean;
    overVoltageAlarm?: boolean;
  };

  // Priority 8: Transaction Identifier Counter - Token replay protection
  tidCounter?: {
    value: number;
    lastTokenTimestamp?: Date;
  };

  // Priority 9: Load Profile Data - 15/30/60 minute intervals
  loadProfile?: {
    interval: number; // minutes (15, 30, or 60)
    lastProfileTimestamp: Date;
    profilePointsCount: number;
  };

  // Priority 10: Communication Signal Strength
  signalStrength: {
    rssi: number; // dBm
    signalQuality: number; // 0-100%
    technology: 'GSM' | 'GPRS' | '3G' | '4G' | 'LTE' | 'NB-IoT' | 'LoRa' | 'PLC';
    timestamp: Date;
  };

  // Priority 11: Cumulative Reactive Energy (kVARh)
  cumulativeReactiveEnergy?: {
    value: number; // kVARh
    obisCode: string; // 1-0:3.8.0.255
    timestamp: Date;
  };

  // Priority 12: Time-of-Use (TOU) Energy
  touEnergy?: {
    peak: {
      value: number; // kWh
      obisCode: string; // 1-0:1.8.1.255
      rate?: number; // $/kWh
    };
    offPeak: {
      value: number; // kWh
      obisCode: string; // 1-0:1.8.2.255
      rate?: number; // $/kWh
    };
    timestamp: Date;
  };

  // Priority 13: Maximum Demand - With timestamp
  maximumDemand?: {
    value: number; // kW
    timestamp: Date;
    obisCode: string; // 1-0:1.6.0.255
    billingPeriod?: string;
  };

  // Priority 14: STS Keys - Security tokens for prepaid meters
  stsKeys?: {
    keyRevisionNumber: string; // KRN
    supplierGroupCode: string; // SGC
    tariffIndex: string;
    keyExpiryDate?: Date;
  };

  // Metadata
  dataQuality: {
    completeness: number; // 0-100%
    validationStatus: 'valid' | 'suspicious' | 'invalid';
    missingParameters: string[];
  };

  createdAt: Date;
  updatedAt: Date;
}

const priorityMetricsSchema = new Schema<IPriorityMetrics>(
  {
    meter: {
      type: Schema.Types.ObjectId,
      ref: 'Meter',
      required: true,
      index: true,
    },
    customerNetwork: {
      type: Schema.Types.ObjectId,
      ref: 'CustomerNetwork',
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },

    // Priority 1
    cumulativeActiveEnergy: {
      value: { type: Number, required: true },
      obisCode: { type: String, default: '1-0:1.8.0.255' },
      timestamp: { type: Date, required: true },
    },

    // Priority 2
    lastTamperEvent: {
      type: {
        type: String,
        enum: ['cover_open', 'magnetic_field', 'reverse_flow', 'current_bypass', 'voltage_imbalance'],
      },
      timestamp: Date,
      duration: Number,
      cleared: { type: Boolean, default: false },
    },

    // Priority 3
    currentCredit: {
      balance: Number,
      lowCreditThreshold: Number,
      emergencyCredit: Number,
      timestamp: Date,
    },

    // Priority 4
    connectionStatus: {
      status: {
        type: String,
        enum: ['connected', 'disconnected', 'tripped', 'armed'],
        required: true,
      },
      reason: String,
      lastChanged: { type: Date, required: true },
    },

    // Priority 5
    powerOutage: {
      lastOutageTimestamp: Date,
      lastRestorationTimestamp: Date,
      outageDuration: Number,
      outageCount24h: { type: Number, default: 0 },
    },

    // Priority 6
    instantaneousPower: {
      value: { type: Number, required: true },
      obisCode: { type: String, default: '1-0:1.7.0.255' },
      timestamp: { type: Date, required: true },
    },

    // Priority 7
    voltage: {
      phaseA: { type: Number, required: true },
      phaseB: Number,
      phaseC: Number,
      obisCode: { type: String, default: '1-0:32.7.0.255' },
      timestamp: { type: Date, required: true },
      underVoltageAlarm: { type: Boolean, default: false },
      overVoltageAlarm: { type: Boolean, default: false },
    },

    // Priority 8
    tidCounter: {
      value: Number,
      lastTokenTimestamp: Date,
    },

    // Priority 9
    loadProfile: {
      interval: { type: Number, enum: [15, 30, 60] },
      lastProfileTimestamp: Date,
      profilePointsCount: Number,
    },

    // Priority 10
    signalStrength: {
      rssi: { type: Number, required: true },
      signalQuality: { type: Number, required: true, min: 0, max: 100 },
      technology: {
        type: String,
        enum: ['GSM', 'GPRS', '3G', '4G', 'LTE', 'NB-IoT', 'LoRa', 'PLC'],
        required: true,
      },
      timestamp: { type: Date, required: true },
    },

    // Priority 11
    cumulativeReactiveEnergy: {
      value: Number,
      obisCode: { type: String, default: '1-0:3.8.0.255' },
      timestamp: Date,
    },

    // Priority 12
    touEnergy: {
      peak: {
        value: Number,
        obisCode: { type: String, default: '1-0:1.8.1.255' },
        rate: Number,
      },
      offPeak: {
        value: Number,
        obisCode: { type: String, default: '1-0:1.8.2.255' },
        rate: Number,
      },
      timestamp: Date,
    },

    // Priority 13
    maximumDemand: {
      value: Number,
      timestamp: Date,
      obisCode: { type: String, default: '1-0:1.6.0.255' },
      billingPeriod: String,
    },

    // Priority 14
    stsKeys: {
      keyRevisionNumber: String,
      supplierGroupCode: String,
      tariffIndex: String,
      keyExpiryDate: Date,
    },

    // Metadata
    dataQuality: {
      completeness: { type: Number, default: 0, min: 0, max: 100 },
      validationStatus: {
        type: String,
        enum: ['valid', 'suspicious', 'invalid'],
        default: 'valid',
      },
      missingParameters: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
priorityMetricsSchema.index({ meter: 1, timestamp: -1 });
priorityMetricsSchema.index({ customerNetwork: 1, timestamp: -1 });
priorityMetricsSchema.index({ 'connectionStatus.status': 1 });
priorityMetricsSchema.index({ 'lastTamperEvent.cleared': 1 });
priorityMetricsSchema.index({ timestamp: -1 });

// Compound index for network-based queries
priorityMetricsSchema.index({ customerNetwork: 1, meter: 1, timestamp: -1 });

// TTL index - Keep priority metrics for 90 days
priorityMetricsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

export const PriorityMetrics = mongoose.model<IPriorityMetrics>(
  'PriorityMetrics',
  priorityMetricsSchema
);
