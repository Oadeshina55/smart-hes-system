import mongoose, { Document, Schema } from 'mongoose';

/**
 * EndCustomer Model
 * Represents actual electricity consumers (the people with meters)
 * Previously just called "Customer" - now renamed to differentiate from CustomerNetwork
 */
export interface IEndCustomer extends Document {
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
  // Belongs to a customer network (utility company)
  customerNetwork: mongoose.Types.ObjectId;
  // Meter assignment
  meterNumber?: string;
  meter?: mongoose.Types.ObjectId;
  simNumber?: string;
  tariffPlan?: string;
  connectionType: 'residential' | 'commercial' | 'industrial';
  connectionDate?: Date;
  status: 'active' | 'inactive' | 'suspended';
  // Billing information
  billingInfo?: {
    lastBillDate?: Date;
    lastBillAmount?: number;
    outstandingBalance?: number;
    paymentMethod?: string;
    creditBalance?: number;  // For prepaid meters
  };
  // Prepayment/STS data
  prepaymentData?: {
    currentCredit: number;
    lastTokenDate?: Date;
    lastTokenAmount?: number;
    keyRevisionNumber?: string;
    supplierGroupCode?: string;
    tidCounter?: number;
  };
  metadata?: Map<string, any>;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const endCustomerSchema = new Schema<IEndCustomer>(
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
    customerNetwork: {
      type: Schema.Types.ObjectId,
      ref: 'CustomerNetwork',
      required: true,
      index: true
    },
    meterNumber: {
      type: String,
      trim: true,
      index: true
    },
    meter: {
      type: Schema.Types.ObjectId,
      ref: 'Meter',
      index: true
    },
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
      paymentMethod: String,
      creditBalance: {
        type: Number,
        default: 0
      }
    },
    prepaymentData: {
      currentCredit: {
        type: Number,
        default: 0
      },
      lastTokenDate: Date,
      lastTokenAmount: Number,
      keyRevisionNumber: String,
      supplierGroupCode: String,
      tidCounter: {
        type: Number,
        default: 0
      }
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
endCustomerSchema.index({ accountNumber: 1 });
endCustomerSchema.index({ email: 1 });
endCustomerSchema.index({ phoneNumber: 1 });
endCustomerSchema.index({ meter: 1 });
endCustomerSchema.index({ status: 1 });
endCustomerSchema.index({ customerNetwork: 1, status: 1 });

export const EndCustomer = mongoose.model<IEndCustomer>('EndCustomer', endCustomerSchema);
