import mongoose, { Document, Schema } from 'mongoose';

/**
 * CustomerNetwork Model
 * Represents utility companies/networks (e.g., Urabus, Cooperative 1)
 * Previously called "Area" - now represents customer utilities instead of geographical areas
 */
export interface ICustomerNetwork extends Document {
  networkName: string;  // e.g., "Urabus", "Cooperative 1"
  networkCode: string;  // Unique identifier
  description?: string;
  parentCompany: string;  // e.g., "New Hampshire"
  contactInfo: {
    email: string;
    phoneNumber: string;
    address: string;
  };
  billingInfo?: {
    accountType: 'prepaid' | 'postpaid';
    billingCycle: string;
    paymentTerms?: string;
  };
  // Service area (optional - for geographical reference)
  serviceArea?: {
    region: string;
    state: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  // Statistics
  meterCount: number;
  endCustomerCount: number;
  activeMeters: number;
  // Settings
  settings?: {
    canAddMeters: boolean;
    canAddCustomers: boolean;
    canManageOperators: boolean;
    features: string[];
  };
  // Status
  subscriptionStatus: 'active' | 'suspended' | 'trial' | 'expired';
  subscriptionExpiry?: Date;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const customerNetworkSchema = new Schema<ICustomerNetwork>(
  {
    networkName: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    networkCode: {
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
    parentCompany: {
      type: String,
      required: true,
      default: 'New Hampshire',
      trim: true
    },
    contactInfo: {
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
      },
      phoneNumber: {
        type: String,
        required: true,
        trim: true
      },
      address: {
        type: String,
        required: true,
        trim: true
      }
    },
    billingInfo: {
      accountType: {
        type: String,
        enum: ['prepaid', 'postpaid'],
        default: 'prepaid'
      },
      billingCycle: {
        type: String,
        default: 'monthly'
      },
      paymentTerms: String
    },
    serviceArea: {
      region: String,
      state: String,
      country: {
        type: String,
        default: 'Nigeria'
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
      }
    },
    meterCount: {
      type: Number,
      default: 0
    },
    endCustomerCount: {
      type: Number,
      default: 0
    },
    activeMeters: {
      type: Number,
      default: 0
    },
    settings: {
      canAddMeters: {
        type: Boolean,
        default: true
      },
      canAddCustomers: {
        type: Boolean,
        default: true
      },
      canManageOperators: {
        type: Boolean,
        default: true
      },
      features: {
        type: [String],
        default: []
      }
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'suspended', 'trial', 'expired'],
      default: 'active'
    },
    subscriptionExpiry: {
      type: Date
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
customerNetworkSchema.index({ networkName: 1 });
customerNetworkSchema.index({ networkCode: 1 });
customerNetworkSchema.index({ parentCompany: 1 });
customerNetworkSchema.index({ subscriptionStatus: 1 });

// Virtual for meters in network
customerNetworkSchema.virtual('meters', {
  ref: 'Meter',
  localField: '_id',
  foreignField: 'customerNetwork'
});

// Virtual for end customers
customerNetworkSchema.virtual('endCustomers', {
  ref: 'EndCustomer',
  localField: '_id',
  foreignField: 'customerNetwork'
});

// Virtual for operators
customerNetworkSchema.virtual('operators', {
  ref: 'User',
  localField: '_id',
  foreignField: 'customerNetwork'
});

export const CustomerNetwork = mongoose.model<ICustomerNetwork>('CustomerNetwork', customerNetworkSchema);
