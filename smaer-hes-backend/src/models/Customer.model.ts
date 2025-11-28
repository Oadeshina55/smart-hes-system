import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  customerName: string;
  accountNumber: string;
  email?: string;
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
  };
  meterNumber?: string;
  meter?: mongoose.Types.ObjectId;
  assignedAreas?: mongoose.Types.ObjectId[]; // Areas this customer can access
  simNumber?: string;
  tariffPlan?: string;
  connectionType: 'residential' | 'commercial' | 'industrial';
  connectionDate?: Date;
  status: 'active' | 'inactive' | 'suspended';
  billingInfo?: {
    lastBillDate?: Date;
    lastBillAmount?: number;
    outstandingBalance?: number;
    paymentMethod?: string;
  };
  metadata?: Map<string, any>;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      street: {
        type: String,
        required: true,
        trim: true
      },
      city: {
        type: String,
        required: true,
        trim: true
      },
      state: {
        type: String,
        required: true,
        trim: true
      },
      postalCode: {
        type: String,
        trim: true
      },
      country: {
        type: String,
        required: true,
        trim: true,
        default: 'Nigeria'
      }
    },
    meterNumber: {
      type: String,
      trim: true
    },
    meter: {
      type: Schema.Types.ObjectId,
      ref: 'Meter'
    },
    assignedAreas: [{
      type: Schema.Types.ObjectId,
      ref: 'Area'
    }],
    simNumber: {
      type: String,
      trim: true
    },
    tariffPlan: {
      type: String,
      trim: true
    },
    connectionType: {
      type: String,
      enum: ['residential', 'commercial', 'industrial'],
      default: 'residential'
    },
    connectionDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },
    billingInfo: {
      lastBillDate: Date,
      lastBillAmount: Number,
      outstandingBalance: {
        type: Number,
        default: 0
      },
      paymentMethod: String
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed
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
customerSchema.index({ accountNumber: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ phoneNumber: 1 });
customerSchema.index({ meter: 1 });
customerSchema.index({ status: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
