import mongoose, { Document, Schema } from 'mongoose';

export interface IFirmwareUpgrade extends Document {
  meter: mongoose.Types.ObjectId;

  // Firmware details
  firmware: {
    currentVersion: string;
    targetVersion: string;
    fileName: string;
    fileSize: number; // bytes
    checksum: string; // MD5 or SHA256
    filePath?: string;
    manufacturer: string;
    model: string;
    releaseDate: Date;
    releaseNotes?: string;
  };

  // Upgrade process
  status: 'pending' | 'preparing' | 'transferring' | 'verifying' | 'installing' | 'activating' | 'completed' | 'failed' | 'rolled_back';

  progress: {
    stage: string;
    percentage: number; // 0-100
    bytesTransferred: number;
    totalBytes: number;
    estimatedTimeRemaining?: number; // seconds
    currentStep: string;
    totalSteps: number;
  };

  // Scheduling
  schedule: {
    scheduledTime?: Date;
    autoStart: boolean;
    retryOnFailure: boolean;
    maxRetries: number;
    currentRetry: number;
  };

  // Result
  result?: {
    success: boolean;
    completedAt: Date;
    duration: number; // seconds
    errorMessage?: string;
    errorCode?: string;
    verifiedVersion?: string;
    rollbackPerformed?: boolean;
  };

  // Metadata
  initiatedBy: mongoose.Types.ObjectId; // User who initiated
  logs: Array<{
    timestamp: Date;
    level: 'info' | 'warning' | 'error';
    message: string;
  }>;

  metadata?: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const firmwareUpgradeSchema = new Schema<IFirmwareUpgrade>(
  {
    meter: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
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
firmwareUpgradeSchema.index({ meter: 1, status: 1 });
firmwareUpgradeSchema.index({ status: 1, createdAt: -1 });
firmwareUpgradeSchema.index({ 'firmware.targetVersion': 1 });

// Initialize progress.totalBytes from firmware.fileSize
firmwareUpgradeSchema.pre('save', function(next) {
  if (this.isNew && !this.progress.totalBytes) {
    this.progress.totalBytes = this.firmware.fileSize;
  }
  next();
});

// Method to add log entry
firmwareUpgradeSchema.methods.addLog = function(level: 'info' | 'warning' | 'error', message: string) {
  this.logs.push({
    timestamp: new Date(),
    level,
    message
  });
};

// Method to update progress
firmwareUpgradeSchema.methods.updateProgress = function(
  percentage: number,
  bytesTransferred: number,
  currentStep: string,
  stage: string
) {
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

export const FirmwareUpgrade = mongoose.model<IFirmwareUpgrade>('FirmwareUpgrade', firmwareUpgradeSchema);
export default FirmwareUpgrade;
