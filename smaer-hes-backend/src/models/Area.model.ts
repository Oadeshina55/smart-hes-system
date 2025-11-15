import mongoose, { Document, Schema } from 'mongoose';

export interface IArea extends Document {
  name: string;
  code: string;
  description?: string;
  parentArea?: mongoose.Types.ObjectId;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  meterCount: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const areaSchema = new Schema<IArea>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    parentArea: {
      type: Schema.Types.ObjectId,
      ref: 'Area',
      default: null
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
    meterCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Create indexes
areaSchema.index({ name: 1 });
areaSchema.index({ code: 1 });
areaSchema.index({ parentArea: 1 });

// Virtual for child areas
areaSchema.virtual('childAreas', {
  ref: 'Area',
  localField: '_id',
  foreignField: 'parentArea'
});

// Virtual for meters in area
areaSchema.virtual('meters', {
  ref: 'Meter',
  localField: '_id',
  foreignField: 'area'
});

export const Area = mongoose.model<IArea>('Area', areaSchema);
