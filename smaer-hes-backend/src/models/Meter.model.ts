import mongoose, { Document, Schema } from 'mongoose';

export interface IMeter {
  meterNumber: string;
  concentratorId?: string;
  meterType: 'single-phase' | 'three-phase' | 'prepaid' | 'postpaid';
  brand: string;
  model: string;
  firmware: string;
  area: mongoose.Types.ObjectId;
  customer?: mongoose.Types.ObjectId;
  simCard?: mongoose.Types.ObjectId;
  ipAddress?: string;
  port?: number;
  status: 'online' | 'offline' | 'active' | 'warehouse' | 'faulty';
  lastSeen?: Date;
  installationDate?: Date;
  commissionDate?: Date;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  currentReading: {
    totalEnergy: number;
    voltage: number;
    current: number;
    power: number;
    frequency: number;
    powerFactor: number;
    timestamp: Date;
  };
  relayStatus: 'connected' | 'disconnected';
  tamperStatus: {
    coverOpen: boolean;
    magneticTamper: boolean;
    reverseFlow: boolean;
    neutralDisturbance: boolean;
  };
  obisConfiguration?: Map<string, any>;
  metadata?: Map<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // method added by schema.methods
  isOnline?: () => boolean;
}

const meterSchema = new Schema<IMeter>(
  {
    meterNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    concentratorId: {
      type: String,
      trim: true
    },
    meterType: {
      type: String,
      enum: ['single-phase', 'three-phase', 'prepaid', 'postpaid'],
      required: true
    },
    brand: {
      type: String,
      required: true,
      trim: true
    },
    model: {
      type: String,
      required: true,
      trim: true
    },
    firmware: {
      type: String,
      trim: true
    },
    area: {
      type: Schema.Types.ObjectId,
      ref: 'Area',
      required: true
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      default: null
    },
    simCard: {
      type: Schema.Types.ObjectId,
      ref: 'SimCard',
      default: null
    },
    ipAddress: {
      type: String,
      trim: true
    },
    port: {
      type: Number
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'active', 'warehouse', 'faulty'],
      default: 'offline'
    },
    lastSeen: {
      type: Date
    },
    installationDate: {
      type: Date
    },
    commissionDate: {
      type: Date
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    },
    currentReading: {
      totalEnergy: {
        type: Number,
        default: 0
      },
      voltage: {
        type: Number,
        default: 0
      },
      current: {
        type: Number,
        default: 0
      },
      power: {
        type: Number,
        default: 0
      },
      frequency: {
        type: Number,
        default: 0
      },
      powerFactor: {
        type: Number,
        default: 0
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    },
    relayStatus: {
      type: String,
      enum: ['connected', 'disconnected'],
      default: 'connected'
    },
    tamperStatus: {
      coverOpen: {
        type: Boolean,
        default: false
      },
      magneticTamper: {
        type: Boolean,
        default: false
      },
      reverseFlow: {
        type: Boolean,
        default: false
      },
      neutralDisturbance: {
        type: Boolean,
        default: false
      }
    },
    obisConfiguration: {
      type: Map,
      of: Schema.Types.Mixed
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Create indexes
meterSchema.index({ meterNumber: 1 });
meterSchema.index({ area: 1 });
meterSchema.index({ customer: 1 });
meterSchema.index({ status: 1 });
meterSchema.index({ 'tamperStatus.coverOpen': 1 });
meterSchema.index({ 'tamperStatus.magneticTamper': 1 });
meterSchema.index({ lastSeen: -1 });

// Virtual for events
meterSchema.virtual('events', {
  ref: 'Event',
  localField: '_id',
  foreignField: 'meter'
});

// Virtual for consumption data
meterSchema.virtual('consumptions', {
  ref: 'Consumption',
  localField: '_id',
  foreignField: 'meter'
});

// Method to check if meter is online (seen in last 5 minutes)
meterSchema.methods.isOnline = function() {
  if (!this.lastSeen) return false;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastSeen >= fiveMinutesAgo;
};

// Export as untyped model to avoid complex mongoose generic incompatibilities in this codebase
export const Meter = mongoose.model('Meter', meterSchema) as any;
