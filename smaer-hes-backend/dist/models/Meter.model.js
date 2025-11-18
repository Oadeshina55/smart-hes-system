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
exports.Meter = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const meterSchema = new mongoose_1.Schema({
    meterNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    concentratorId: {
        type: String,
        trim: true
    },
    meterType: {
        type: String,
        enum: ['single-phase', 'three-phase', 'prepaid', 'postpaid'],
        required: true
    },
    brand: {
        type: String,
        required: true,
        trim: true
    },
    model: {
        type: String,
        required: true,
        trim: true
    },
    firmware: {
        type: String,
        trim: true
    },
    area: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Area',
        required: true
    },
    customer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
    },
    simCard: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'SimCard',
        default: null
    },
    ipAddress: {
        type: String,
        trim: true
    },
    port: {
        type: Number
    },
    status: {
        type: String,
        enum: ['online', 'offline', 'active', 'warehouse', 'faulty'],
        default: 'offline'
    },
    lastSeen: {
        type: Date
    },
    installationDate: {
        type: Date
    },
    commissionDate: {
        type: Date
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
    currentReading: {
        totalEnergy: {
            type: Number,
            default: 0
        },
        voltage: {
            type: Number,
            default: 0
        },
        current: {
            type: Number,
            default: 0
        },
        power: {
            type: Number,
            default: 0
        },
        frequency: {
            type: Number,
            default: 0
        },
        powerFactor: {
            type: Number,
            default: 0
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    relayStatus: {
        type: String,
        enum: ['connected', 'disconnected'],
        default: 'connected'
    },
    tamperStatus: {
        coverOpen: {
            type: Boolean,
            default: false
        },
        magneticTamper: {
            type: Boolean,
            default: false
        },
        reverseFlow: {
            type: Boolean,
            default: false
        },
        neutralDisturbance: {
            type: Boolean,
            default: false
        }
    },
    obisConfiguration: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed
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
meterSchema.index({ meterNumber: 1 });
meterSchema.index({ area: 1 });
meterSchema.index({ customer: 1 });
meterSchema.index({ status: 1 });
meterSchema.index({ 'tamperStatus.coverOpen': 1 });
meterSchema.index({ 'tamperStatus.magneticTamper': 1 });
meterSchema.index({ lastSeen: -1 });
// Virtual for events
meterSchema.virtual('events', {
    ref: 'Event',
    localField: '_id',
    foreignField: 'meter'
});
// Virtual for consumption data
meterSchema.virtual('consumptions', {
    ref: 'Consumption',
    localField: '_id',
    foreignField: 'meter'
});
// Method to check if meter is online (seen in last 5 minutes)
meterSchema.methods.isOnline = function () {
    if (!this.lastSeen)
        return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.lastSeen >= fiveMinutesAgo;
};
// Export as untyped model to avoid complex mongoose generic incompatibilities in this codebase
exports.Meter = mongoose_1.default.model('Meter', meterSchema);
//# sourceMappingURL=Meter.model.js.map