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
exports.FirmwareUpgrade = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const firmwareUpgradeSchema = new mongoose_1.Schema({
    meter: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Meter',
        required: true,
        index: true
    },
    firmware: {
        currentVersion: { type: String, required: true },
        targetVersion: { type: String, required: true },
        fileName: { type: String, required: true },
        fileSize: { type: Number, required: true },
        checksum: { type: String, required: true },
        filePath: String,
        manufacturer: { type: String, required: true },
        model: { type: String, required: true },
        releaseDate: { type: Date, required: true },
        releaseNotes: String
    },
    status: {
        type: String,
        enum: ['pending', 'preparing', 'transferring', 'verifying', 'installing', 'activating', 'completed', 'failed', 'rolled_back'],
        default: 'pending',
        required: true,
        index: true
    },
    progress: {
        stage: { type: String, default: 'Initialized' },
        percentage: { type: Number, default: 0, min: 0, max: 100 },
        bytesTransferred: { type: Number, default: 0 },
        totalBytes: { type: Number, required: true },
        estimatedTimeRemaining: Number,
        currentStep: { type: String, default: 'Waiting to start' },
        totalSteps: { type: Number, default: 7 } // prepare, connect, transfer, verify, install, activate, confirm
    },
    schedule: {
        scheduledTime: Date,
        autoStart: { type: Boolean, default: false },
        retryOnFailure: { type: Boolean, default: true },
        maxRetries: { type: Number, default: 3 },
        currentRetry: { type: Number, default: 0 }
    },
    result: {
        success: Boolean,
        completedAt: Date,
        duration: Number,
        errorMessage: String,
        errorCode: String,
        verifiedVersion: String,
        rollbackPerformed: Boolean
    },
    initiatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    logs: [{
            timestamp: { type: Date, default: Date.now },
            level: {
                type: String,
                enum: ['info', 'warning', 'error'],
                default: 'info'
            },
            message: { type: String, required: true }
        }],
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
firmwareUpgradeSchema.index({ meter: 1, status: 1 });
firmwareUpgradeSchema.index({ status: 1, createdAt: -1 });
firmwareUpgradeSchema.index({ 'firmware.targetVersion': 1 });
// Initialize progress.totalBytes from firmware.fileSize
firmwareUpgradeSchema.pre('save', function (next) {
    if (this.isNew && !this.progress.totalBytes) {
        this.progress.totalBytes = this.firmware.fileSize;
    }
    next();
});
// Method to add log entry
firmwareUpgradeSchema.methods.addLog = function (level, message) {
    this.logs.push({
        timestamp: new Date(),
        level,
        message
    });
};
// Method to update progress
firmwareUpgradeSchema.methods.updateProgress = function (percentage, bytesTransferred, currentStep, stage) {
    this.progress.percentage = Math.min(100, Math.max(0, percentage));
    this.progress.bytesTransferred = bytesTransferred;
    this.progress.currentStep = currentStep;
    this.progress.stage = stage;
    // Estimate time remaining
    if (bytesTransferred > 0 && this.createdAt) {
        const elapsed = (Date.now() - this.createdAt.getTime()) / 1000; // seconds
        const bytesPerSecond = bytesTransferred / elapsed;
        const bytesRemaining = this.progress.totalBytes - bytesTransferred;
        this.progress.estimatedTimeRemaining = Math.ceil(bytesRemaining / bytesPerSecond);
    }
};
exports.FirmwareUpgrade = mongoose_1.default.model('FirmwareUpgrade', firmwareUpgradeSchema);
exports.default = exports.FirmwareUpgrade;
//# sourceMappingURL=Firmware.model.js.map