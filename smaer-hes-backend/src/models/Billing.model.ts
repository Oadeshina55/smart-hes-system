import mongoose, { Document, Schema } from 'mongoose';

export interface ITariffRate {
  name: string;
  type: 'flat' | 'tiered' | 'time_of_use' | 'demand';
  rate: number; // per kWh or per kW
  startTime?: string; // HH:mm format for TOU
  endTime?: string;
  minThreshold?: number; // for tiered
  maxThreshold?: number;
  season?: 'summer' | 'winter' | 'all';
}

export interface IBillingCycle extends Document {
  meter: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;

  // Billing period
  billingPeriod: {
    startDate: Date;
    endDate: Date;
    daysInPeriod: number;
  };

  // Energy consumption
  energyConsumption: {
    activeImport: number; // kWh
    activeExport: number; // kWh
    reactiveImport: number; // kVArh
    reactiveExport: number; // kVArh
    netConsumption: number; // activeImport - activeExport
  };

  // Demand (maximum power)
  demand: {
    maxDemand: number; // kW
    maxDemandTimestamp: Date;
    averageDemand: number; // kW
  };

  // Tariff information
  tariff: {
    name: string;
    type: 'residential' | 'commercial' | 'industrial' | 'agricultural';
    rates: ITariffRate[];
    fixedCharge: number; // monthly/daily fixed charge
    demandCharge?: number; // per kW
  };

  // Cost breakdown
  costs: {
    energyCharge: number;
    demandCharge: number;
    fixedCharge: number;
    taxes: number;
    otherCharges: number;
    adjustments: number; // credits or penalties
    totalCost: number;
  };

  // Meter readings
  readings: {
    openingReading: number; // kWh at start
    closingReading: number; // kWh at end
    meterConstant: number;
  };

  // Billing status
  status: 'draft' | 'calculated' | 'verified' | 'billed' | 'paid' | 'overdue' | 'disputed';

  // Payment information
  payment?: {
    method: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'prepaid';
    transactionId?: string;
    paidAmount: number;
    paidDate?: Date;
    balance: number;
  };

  // Additional information
  powerFactor: {
    average: number;
    penalty?: number; // if PF < threshold
  };

  notes?: string;
  generatedBy?: mongoose.Types.ObjectId; // User who generated the bill
  metadata?: Map<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

const tariffRateSchema = new Schema<ITariffRate>({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['flat', 'tiered', 'time_of_use', 'demand'],
    required: true
  },
  rate: { type: Number, required: true },
  startTime: String,
  endTime: String,
  minThreshold: Number,
  maxThreshold: Number,
  season: {
    type: String,
    enum: ['summer', 'winter', 'all']
  }
}, { _id: false });

const billingCycleSchema = new Schema<IBillingCycle>(
  {
    meter: {
      type: Schema.Types.ObjectId,
      ref: 'Meter',
      required: true,
      index: true
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },
    billingPeriod: {
      startDate: { type: Date, required: true, index: true },
      endDate: { type: Date, required: true, index: true },
      daysInPeriod: { type: Number, required: true }
    },
    energyConsumption: {
      activeImport: { type: Number, required: true, default: 0 },
      activeExport: { type: Number, default: 0 },
      reactiveImport: { type: Number, default: 0 },
      reactiveExport: { type: Number, default: 0 },
      netConsumption: { type: Number, required: true, default: 0 }
    },
    demand: {
      maxDemand: { type: Number, default: 0 },
      maxDemandTimestamp: Date,
      averageDemand: { type: Number, default: 0 }
    },
    tariff: {
      name: { type: String, required: true },
      type: {
        type: String,
        enum: ['residential', 'commercial', 'industrial', 'agricultural'],
        required: true
      },
      rates: [tariffRateSchema],
      fixedCharge: { type: Number, default: 0 },
      demandCharge: Number
    },
    costs: {
      energyCharge: { type: Number, default: 0 },
      demandCharge: { type: Number, default: 0 },
      fixedCharge: { type: Number, default: 0 },
      taxes: { type: Number, default: 0 },
      otherCharges: { type: Number, default: 0 },
      adjustments: { type: Number, default: 0 },
      totalCost: { type: Number, required: true, default: 0 }
    },
    readings: {
      openingReading: { type: Number, required: true },
      closingReading: { type: Number, required: true },
      meterConstant: { type: Number, default: 1 }
    },
    status: {
      type: String,
      enum: ['draft', 'calculated', 'verified', 'billed', 'paid', 'overdue', 'disputed'],
      default: 'draft',
      index: true
    },
    payment: {
      method: {
        type: String,
        enum: ['cash', 'card', 'bank_transfer', 'mobile_money', 'prepaid']
      },
      transactionId: String,
      paidAmount: { type: Number, default: 0 },
      paidDate: Date,
      balance: { type: Number, default: 0 }
    },
    powerFactor: {
      average: Number,
      penalty: Number
    },
    notes: String,
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
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
billingCycleSchema.index({ meter: 1, 'billingPeriod.startDate': -1 });
billingCycleSchema.index({ customer: 1, status: 1 });
billingCycleSchema.index({ status: 1, 'billingPeriod.endDate': -1 });

// Calculate total cost before saving
billingCycleSchema.pre('save', function(next) {
  // Calculate total cost
  this.costs.totalCost =
    this.costs.energyCharge +
    this.costs.demandCharge +
    this.costs.fixedCharge +
    this.costs.taxes +
    this.costs.otherCharges +
    this.costs.adjustments;

  // Calculate payment balance
  if (this.payment) {
    this.payment.balance = this.costs.totalCost - this.payment.paidAmount;
  }

  // Calculate net consumption
  this.energyConsumption.netConsumption =
    this.energyConsumption.activeImport - this.energyConsumption.activeExport;

  // Calculate days in period
  this.billingPeriod.daysInPeriod = Math.ceil(
    (this.billingPeriod.endDate.getTime() - this.billingPeriod.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  next();
});

// Virtual for payment status
billingCycleSchema.virtual('isFullyPaid').get(function() {
  return this.payment && this.payment.paidAmount >= this.costs.totalCost;
});

// Virtual for consumption from readings
billingCycleSchema.virtual('consumptionFromReadings').get(function() {
  return (this.readings.closingReading - this.readings.openingReading) * this.readings.meterConstant;
});

export const BillingCycle = mongoose.model<IBillingCycle>('BillingCycle', billingCycleSchema);
export default BillingCycle;
