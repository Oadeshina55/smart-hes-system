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
exports.Customer = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const customerSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Meter'
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
        paymentMethod: String
    },
    metadata: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});
// Create indexes
customerSchema.index({ accountNumber: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ phoneNumber: 1 });
customerSchema.index({ meter: 1 });
customerSchema.index({ status: 1 });
exports.Customer = mongoose_1.default.model('Customer', customerSchema);
//# sourceMappingURL=Customer.model.js.map