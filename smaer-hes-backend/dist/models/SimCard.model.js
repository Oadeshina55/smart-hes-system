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
exports.SimCard = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const simCardSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
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
        of: mongoose_1.Schema.Types.Mixed
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
// Create indexes
simCardSchema.index({ simNumber: 1 });
simCardSchema.index({ iccid: 1 });
simCardSchema.index({ meter: 1 });
simCardSchema.index({ status: 1 });
exports.SimCard = mongoose_1.default.model('SimCard', simCardSchema);
//# sourceMappingURL=SimCard.model.js.map