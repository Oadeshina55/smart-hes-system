import mongoose, { Document, Schema } from 'mongoose';

export interface ISimCard extends Document {
  simNumber: string;
  iccid: string;
  imsi?: string;
  provider: string;
  ipAddress?: string;
  port?: number;
  apn?: string;
  status: 'active' | 'inactive' | 'suspended' | 'available';
  meter?: mongoose.Types.ObjectId;
  dataUsage?: {
    current: number;
    limit: number;
    resetDate: Date;
  };
  activationDate?: Date;
  expirationDate?: Date;
  lastCommunication?: Date;
  signalStrength?: number;
  metadata?: Map<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const simCardSchema = new Schema<ISimCard>(
  {
    simNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    iccid: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    imsi: {
      type: String,
      trim: true
    },
    provider: {
      type: String,
      required: true,
      trim: true
    },
    ipAddress: {
      type: String,
      trim: true
    },
    port: {
      type: Number
    },
    apn: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'available'],
      default: 'available'
    },
    meter: {
      type: Schema.Types.ObjectId,
      ref: 'Meter',
      default: null
    },
    dataUsage: {
      current: {
        type: Number,
        default: 0
      },
      limit: {
        type: Number,
        default: 1024 // MB
      },
      resetDate: {
        type: Date
      }
    },
    activationDate: {
      type: Date
    },
    expirationDate: {
      type: Date
    },
    lastCommunication: {
      type: Date
    },
    signalStrength: {
      type: Number,
      min: 0,
      max: 100
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
simCardSchema.index({ simNumber: 1 });
simCardSchema.index({ iccid: 1 });
simCardSchema.index({ meter: 1 });
simCardSchema.index({ status: 1 });

export const SimCard = mongoose.model<ISimCard>('SimCard', simCardSchema);
