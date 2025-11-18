"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingCycle = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const tariffRateSchema = new mongoose_1.Schema({
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
const billingCycleSchema = new mongoose_1.Schema({
    meter: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Meter',
        required: true,
        index: true
    },
    customer: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    metadata: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Indexes
billingCycleSchema.index({ meter: 1, 'billingPeriod.startDate': -1 });
billingCycleSchema.index({ customer: 1, status: 1 });
billingCycleSchema.index({ status: 1, 'billingPeriod.endDate': -1 });
// Calculate total cost before saving
billingCycleSchema.pre('save', function (next) {
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
    this.billingPeriod.daysInPeriod = Math.ceil((this.billingPeriod.endDate.getTime() - this.billingPeriod.startDate.getTime()) / (1000 * 60 * 60 * 24));
    next();
});
// Virtual for payment status
billingCycleSchema.virtual('isFullyPaid').get(function () {
    return this.payment && this.payment.paidAmount >= this.costs.totalCost;
});
// Virtual for consumption from readings
billingCycleSchema.virtual('consumptionFromReadings').get(function () {
    return (this.readings.closingReading - this.readings.openingReading) * this.readings.meterConstant;
});
exports.BillingCycle = mongoose_1.default.model('BillingCycle', billingCycleSchema);
exports.default = exports.BillingCycle;
//# sourceMappingURL=Billing.model.js.map