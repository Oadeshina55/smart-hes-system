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
exports.Alert = exports.ALERT_TYPES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const alertSchema = new mongoose_1.Schema({
    meter: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Meter',
        required: true
    },
    alertType: {
        type: String,
        required: true,
        trim: true
    },
    alertCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    category: {
        type: String,
        enum: ['tamper', 'anomaly', 'revenue', 'technical', 'communication'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    details: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed
    },
    status: {
        type: String,
        enum: ['active', 'acknowledged', 'resolved', 'escalated'],
        default: 'active'
    },
    triggeredAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    acknowledgedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    acknowledgedAt: {
        type: Date
    },
    resolvedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: {
        type: Date
    },
    escalatedTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    escalatedAt: {
        type: Date
    },
    resolutionNotes: {
        type: String
    },
    estimatedLoss: {
        type: Number,
        default: 0
    },
    isRevenueLoss: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed
    }
}, {
    timestamps: true
});
// Create indexes
alertSchema.index({ meter: 1, status: 1 });
alertSchema.index({ alertType: 1 });
alertSchema.index({ priority: 1 });
alertSchema.index({ category: 1 });
alertSchema.index({ status: 1 });
alertSchema.index({ triggeredAt: -1 });
alertSchema.index({ isRevenueLoss: 1 });
// Common alert types
exports.ALERT_TYPES = {
    // Tamper Alerts
    TAMPER_COVER_OPEN: 'TAMPER_COVER_OPEN',
    TAMPER_MAGNETIC: 'TAMPER_MAGNETIC',
    TAMPER_REVERSE_FLOW: 'TAMPER_REVERSE_FLOW',
    TAMPER_NEUTRAL_DISTURBANCE: 'TAMPER_NEUTRAL_DISTURBANCE',
    // Anomaly Alerts (AI-driven)
    ANOMALY_CONSUMPTION_DROP: 'ANOMALY_CONSUMPTION_DROP',
    ANOMALY_ZERO_CONSUMPTION: 'ANOMALY_ZERO_CONSUMPTION',
    ANOMALY_NEIGHBORHOOD_VARIANCE: 'ANOMALY_NEIGHBORHOOD_VARIANCE',
    ANOMALY_UNUSUAL_PATTERN: 'ANOMALY_UNUSUAL_PATTERN',
    // Revenue Loss Alerts
    REVENUE_THEFT_SUSPECTED: 'REVENUE_THEFT_SUSPECTED',
    REVENUE_METER_BYPASS: 'REVENUE_METER_BYPASS',
    REVENUE_ILLEGAL_CONNECTION: 'REVENUE_ILLEGAL_CONNECTION',
    // Technical Alerts
    TECHNICAL_COMMUNICATION_FAILURE: 'TECHNICAL_COMMUNICATION_FAILURE',
    TECHNICAL_METER_MALFUNCTION: 'TECHNICAL_METER_MALFUNCTION',
    TECHNICAL_VOLTAGE_ISSUE: 'TECHNICAL_VOLTAGE_ISSUE'
};
exports.Alert = mongoose_1.default.model('Alert', alertSchema);
//# sourceMappingURL=Alert.model.js.map