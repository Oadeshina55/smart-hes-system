import mongoose, { Document, Schema } from 'mongoose';

export interface IPowerQualityEvent {
  eventType: 'sag' | 'swell' | 'interruption' | 'harmonics' | 'flicker' | 'unbalance' | 'frequency_deviation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  phase?: 'L1' | 'L2' | 'L3' | 'all';
  startTime: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  value: number;
  threshold: number;
  unit: string;
  description?: string;
}

export interface IPowerQuality extends Document {
  meter: mongoose.Types.ObjectId;
  timestamp: Date;

  // Voltage quality
  voltage: {
    L1?: number;
    L2?: number;
    L3?: number;
    average?: number;
    unbalance?: number; // percentage
    thd?: number; // Total Harmonic Distortion
  };

  // Current quality
  current: {
    L1?: number;
    L2?: number;
    L3?: number;
    neutral?: number;
    unbalance?: number; // percentage
    thd?: number; // Total Harmonic Distortion
  };

  // Power factor
  powerFactor: {
    total?: number;
    L1?: number;
    L2?: number;
    L3?: number;
    displacement?: number; // Displacement power factor
  };

  // Frequency
  frequency: {
    value: number;
    deviation: number; // from nominal (50Hz or 60Hz)
  };

  // Harmonics (up to 31st harmonic)
  harmonics?: {
    voltage?: {
      fundamental: number;
      thd: number;
      individual: number[]; // H1-H31
    };
    current?: {
      fundamental: number;
      thd: number;
      individual: number[]; // H1-H31
    };
  };

  // Flicker
  flicker?: {
    pst: number; // Short-term flicker severity
    plt: number; // Long-term flicker severity
  };

  // Events detected in this period
  events: IPowerQualityEvent[];

  // Quality score (0-100)
  qualityScore: number;

  // Compliance with standards
  compliance: {
    standard: string; // e.g., 'IEEE 519', 'IEC 61000'
    compliant: boolean;
    violations: string[];
  };

  metadata?: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const powerQualityEventSchema = new Schema<IPowerQualityEvent>({
  eventType: {
    type: String,
    enum: ['sag', 'swell', 'interruption', 'harmonics', 'flicker', 'unbalance', 'frequency_deviation'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  phase: {
    type: String,
    enum: ['L1', 'L2', 'L3', 'all']
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  duration: Number,
  value: {
    type: Number,
    required: true
  },
  threshold: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  description: String
}, { _id: false });

const powerQualitySchema = new Schema<IPowerQuality>(
  {
    meter: {
      type: Schema.Types.ObjectId,
      ref: 'Meter',
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      required: true,
      index: true
    },
    voltage: {
      L1: Number,
      L2: Number,
      L3: Number,
      average: Number,
      unbalance: Number,
      thd: Number
    },
    current: {
      L1: Number,
      L2: Number,
      L3: Number,
      neutral: Number,
      unbalance: Number,
      thd: Number
    },
    powerFactor: {
      total: Number,
      L1: Number,
      L2: Number,
      L3: Number,
      displacement: Number
    },
    frequency: {
      value: {
        type: Number,
        required: true
      },
      deviation: {
        type: Number,
        required: true
      }
    },
    harmonics: {
      voltage: {
        fundamental: Number,
        thd: Number,
        individual: [Number]
      },
      current: {
        fundamental: Number,
        thd: Number,
        individual: [Number]
      }
    },
    flicker: {
      pst: Number,
      plt: Number
    },
    events: [powerQualityEventSchema],
    qualityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    compliance: {
      standard: {
        type: String,
        default: 'IEEE 519'
      },
      compliant: {
        type: Boolean,
        default: true
      },
      violations: [String]
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
powerQualitySchema.index({ meter: 1, timestamp: -1 });
powerQualitySchema.index({ qualityScore: 1 });
powerQualitySchema.index({ 'compliance.compliant': 1 });

// Calculate quality score before saving
powerQualitySchema.pre('save', function(next) {
  let score = 100;

  // Deduct points for voltage issues
  if (this.voltage.thd && this.voltage.thd > 5) score -= 10;
  if (this.voltage.unbalance && this.voltage.unbalance > 2) score -= 10;

  // Deduct points for current issues
  if (this.current.thd && this.current.thd > 5) score -= 10;
  if (this.current.unbalance && this.current.unbalance > 10) score -= 10;

  // Deduct points for power factor
  if (this.powerFactor.total && this.powerFactor.total < 0.9) score -= 15;

  // Deduct points for frequency deviation
  if (Math.abs(this.frequency.deviation) > 0.5) score -= 15;

  // Deduct points based on events
  this.events.forEach(event => {
    if (event.severity === 'critical') score -= 20;
    else if (event.severity === 'high') score -= 10;
    else if (event.severity === 'medium') score -= 5;
    else score -= 2;
  });

  this.qualityScore = Math.max(0, score);
  next();
});

export const PowerQuality = mongoose.model<IPowerQuality>('PowerQuality', powerQualitySchema);
export default PowerQuality;
