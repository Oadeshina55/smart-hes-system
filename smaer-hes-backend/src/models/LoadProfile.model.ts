import mongoose, { Document, Schema } from 'mongoose';

export interface ILoadProfileEntry {
  timestamp: Date;
  voltage?: {
    L1?: number;
    L2?: number;
    L3?: number;
    average?: number;
  };
  current?: {
    L1?: number;
    L2?: number;
    L3?: number;
    total?: number;
  };
  power?: {
    active?: number;
    reactive?: number;
    apparent?: number;
  };
  energy?: {
    activeImport?: number;
    activeExport?: number;
    reactiveImport?: number;
    reactiveExport?: number;
  };
  powerFactor?: number;
  frequency?: number;
  metadata?: Map<string, any>;
}

export interface ILoadProfile extends Document {
  meter: mongoose.Types.ObjectId;
  profileType: 'hourly' | 'daily' | 'instantaneous' | 'billing' | 'custom';
  captureInterval: number; // in minutes
  startTime: Date;
  endTime: Date;
  entries: ILoadProfileEntry[];
  obisCode: string; // Load profile OBIS code
  totalEntries: number;
  status: 'pending' | 'reading' | 'completed' | 'failed' | 'partial';
  errorMessage?: string;
  metadata?: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
  // Virtual property
  duration?: number; // Duration in minutes
}

const loadProfileEntrySchema = new Schema<ILoadProfileEntry>({
  timestamp: { type: Date, required: true },
  voltage: {
    L1: Number,
    L2: Number,
    L3: Number,
    average: Number
  },
  current: {
    L1: Number,
    L2: Number,
    L3: Number,
    total: Number
  },
  power: {
    active: Number,
    reactive: Number,
    apparent: Number
  },
  energy: {
    activeImport: Number,
    activeExport: Number,
    reactiveImport: Number,
    reactiveExport: Number
  },
  powerFactor: Number,
  frequency: Number,
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  }
}, { _id: false });

const loadProfileSchema = new Schema<ILoadProfile>(
  {
    meter: {
      type: Schema.Types.ObjectId,
      ref: 'Meter',
      required: true,
      index: true
    },
    profileType: {
      type: String,
      enum: ['hourly', 'daily', 'instantaneous', 'billing', 'custom'],
      required: true,
      default: 'hourly'
    },
    captureInterval: {
      type: Number,
      required: true,
      default: 60 // 60 minutes
    },
    startTime: {
      type: Date,
      required: true,
      index: true
    },
    endTime: {
      type: Date,
      required: true,
      index: true
    },
    entries: [loadProfileEntrySchema],
    obisCode: {
      type: String,
      default: '1-0:99.1.0.255' // Generic load profile OBIS
    },
    totalEntries: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'reading', 'completed', 'failed', 'partial'],
      default: 'pending',
      index: true
    },
    errorMessage: String,
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

// Indexes for efficient querying
loadProfileSchema.index({ meter: 1, startTime: -1 });
loadProfileSchema.index({ meter: 1, profileType: 1, startTime: -1 });
loadProfileSchema.index({ createdAt: -1 });

// Virtual for duration
loadProfileSchema.virtual('duration').get(function() {
  if (this.endTime && this.startTime) {
    return Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000 / 60); // minutes
  }
  return 0;
});

// Update totalEntries before saving
loadProfileSchema.pre('save', function(next) {
  this.totalEntries = this.entries.length;
  next();
});

export const LoadProfile = mongoose.model<ILoadProfile>('LoadProfile', loadProfileSchema);
export default LoadProfile;
