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
exports.LoadProfile = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const loadProfileEntrySchema = new mongoose_1.Schema({
    timestamp: { type: Date, required: true },
    voltage: {
        L1: Number,
        L2: Number,
        L3: Number,
        average: Number
    },
    current: {
        L1: Number,
        L2: Number,
        L3: Number,
        total: Number
    },
    power: {
        active: Number,
        reactive: Number,
        apparent: Number
    },
    energy: {
        activeImport: Number,
        activeExport: Number,
        reactiveImport: Number,
        reactiveExport: Number
    },
    powerFactor: Number,
    frequency: Number,
    metadata: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed
    }
}, { _id: false });
const loadProfileSchema = new mongoose_1.Schema({
    meter: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Meter',
        required: true,
        index: true
    },
    profileType: {
        type: String,
        enum: ['hourly', 'daily', 'instantaneous', 'billing', 'custom'],
        required: true,
        default: 'hourly'
    },
    captureInterval: {
        type: Number,
        required: true,
        default: 60 // 60 minutes
    },
    startTime: {
        type: Date,
        required: true,
        index: true
    },
    endTime: {
        type: Date,
        required: true,
        index: true
    },
    entries: [loadProfileEntrySchema],
    obisCode: {
        type: String,
        default: '1-0:99.1.0.255' // Generic load profile OBIS
    },
    totalEntries: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'reading', 'completed', 'failed', 'partial'],
        default: 'pending',
        index: true
    },
    errorMessage: String,
    metadata: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Indexes for efficient querying
loadProfileSchema.index({ meter: 1, startTime: -1 });
loadProfileSchema.index({ meter: 1, profileType: 1, startTime: -1 });
loadProfileSchema.index({ createdAt: -1 });
// Virtual for duration
loadProfileSchema.virtual('duration').get(function () {
    if (this.endTime && this.startTime) {
        return Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000 / 60); // minutes
    }
    return 0;
});
// Update totalEntries before saving
loadProfileSchema.pre('save', function (next) {
    this.totalEntries = this.entries.length;
    next();
});
exports.LoadProfile = mongoose_1.default.model('LoadProfile', loadProfileSchema);
exports.default = exports.LoadProfile;
//# sourceMappingURL=LoadProfile.model.js.map