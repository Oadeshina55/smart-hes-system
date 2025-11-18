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
exports.PowerQuality = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const powerQualityEventSchema = new mongoose_1.Schema({
    eventType: {
        type: String,
        enum: ['sag', 'swell', 'interruption', 'harmonics', 'flicker', 'unbalance', 'frequency_deviation'],
        required: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
    },
    phase: {
        type: String,
        enum: ['L1', 'L2', 'L3', 'all']
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: Date,
    duration: Number,
    value: {
        type: Number,
        required: true
    },
    threshold: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        required: true
    },
    description: String
}, { _id: false });
const powerQualitySchema = new mongoose_1.Schema({
    meter: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Meter',
        required: true,
        index: true
    },
    timestamp: {
        type: Date,
        required: true,
        index: true
    },
    voltage: {
        L1: Number,
        L2: Number,
        L3: Number,
        average: Number,
        unbalance: Number,
        thd: Number
    },
    current: {
        L1: Number,
        L2: Number,
        L3: Number,
        neutral: Number,
        unbalance: Number,
        thd: Number
    },
    powerFactor: {
        total: Number,
        L1: Number,
        L2: Number,
        L3: Number,
        displacement: Number
    },
    frequency: {
        value: {
            type: Number,
            required: true
        },
        deviation: {
            type: Number,
            required: true
        }
    },
    harmonics: {
        voltage: {
            fundamental: Number,
            thd: Number,
            individual: [Number]
        },
        current: {
            fundamental: Number,
            thd: Number,
            individual: [Number]
        }
    },
    flicker: {
        pst: Number,
        plt: Number
    },
    events: [powerQualityEventSchema],
    qualityScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 100
    },
    compliance: {
        standard: {
            type: String,
            default: 'IEEE 519'
        },
        compliant: {
            type: Boolean,
            default: true
        },
        violations: [String]
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
powerQualitySchema.index({ meter: 1, timestamp: -1 });
powerQualitySchema.index({ qualityScore: 1 });
powerQualitySchema.index({ 'compliance.compliant': 1 });
// Calculate quality score before saving
powerQualitySchema.pre('save', function (next) {
    let score = 100;
    // Deduct points for voltage issues
    if (this.voltage.thd && this.voltage.thd > 5)
        score -= 10;
    if (this.voltage.unbalance && this.voltage.unbalance > 2)
        score -= 10;
    // Deduct points for current issues
    if (this.current.thd && this.current.thd > 5)
        score -= 10;
    if (this.current.unbalance && this.current.unbalance > 10)
        score -= 10;
    // Deduct points for power factor
    if (this.powerFactor.total && this.powerFactor.total < 0.9)
        score -= 15;
    // Deduct points for frequency deviation
    if (Math.abs(this.frequency.deviation) > 0.5)
        score -= 15;
    // Deduct points based on events
    this.events.forEach(event => {
        if (event.severity === 'critical')
            score -= 20;
        else if (event.severity === 'high')
            score -= 10;
        else if (event.severity === 'medium')
            score -= 5;
        else
            score -= 2;
    });
    this.qualityScore = Math.max(0, score);
    next();
});
exports.PowerQuality = mongoose_1.default.model('PowerQuality', powerQualitySchema);
exports.default = exports.PowerQuality;
//# sourceMappingURL=PowerQuality.model.js.map