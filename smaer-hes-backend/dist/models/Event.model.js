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
exports.Event = exports.EVENT_TYPES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const eventSchema = new mongoose_1.Schema({
    meter: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Meter',
        required: true
    },
    eventType: {
        type: String,
        required: true,
        trim: true
    },
    eventCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    severity: {
        type: String,
        enum: ['info', 'warning', 'error', 'critical'],
        default: 'info'
    },
    category: {
        type: String,
        enum: ['communication', 'tamper', 'power', 'billing', 'technical', 'other'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    details: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    },
    acknowledged: {
        type: Boolean,
        default: false
    },
    acknowledgedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    acknowledgedAt: {
        type: Date
    },
    resolution: {
        type: String
    },
    metadata: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed
    }
}, {
    timestamps: true
});
// Create indexes
eventSchema.index({ meter: 1, timestamp: -1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ severity: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ acknowledged: 1 });
eventSchema.index({ timestamp: -1 });
// Common event types
exports.EVENT_TYPES = {
    // Communication Events
    METER_ONLINE: 'METER_ONLINE',
    METER_OFFLINE: 'METER_OFFLINE',
    COMMUNICATION_LOST: 'COMMUNICATION_LOST',
    COMMUNICATION_RESTORED: 'COMMUNICATION_RESTORED',
    // Tamper Events
    COVER_OPEN: 'COVER_OPEN',
    COVER_CLOSED: 'COVER_CLOSED',
    MAGNETIC_TAMPER: 'MAGNETIC_TAMPER',
    REVERSE_FLOW: 'REVERSE_FLOW',
    NEUTRAL_DISTURBANCE: 'NEUTRAL_DISTURBANCE',
    // Power Events
    POWER_OUTAGE: 'POWER_OUTAGE',
    POWER_RESTORED: 'POWER_RESTORED',
    VOLTAGE_IMBALANCE: 'VOLTAGE_IMBALANCE',
    OVER_VOLTAGE: 'OVER_VOLTAGE',
    UNDER_VOLTAGE: 'UNDER_VOLTAGE',
    // Billing Events
    TOKEN_LOADED: 'TOKEN_LOADED',
    CREDIT_EXHAUSTED: 'CREDIT_EXHAUSTED',
    LOW_CREDIT: 'LOW_CREDIT',
    // Technical Events
    RELAY_DISCONNECTED: 'RELAY_DISCONNECTED',
    RELAY_CONNECTED: 'RELAY_CONNECTED',
    FIRMWARE_UPDATE: 'FIRMWARE_UPDATE',
    CONFIGURATION_CHANGE: 'CONFIGURATION_CHANGE'
};
exports.Event = mongoose_1.default.model('Event', eventSchema);
//# sourceMappingURL=Event.model.js.map