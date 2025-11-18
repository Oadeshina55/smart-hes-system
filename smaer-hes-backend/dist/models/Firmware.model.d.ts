import mongoose, { Document } from 'mongoose';
export interface IFirmwareUpgrade extends Document {
    meter: mongoose.Types.ObjectId;
    firmware: {
        currentVersion: string;
        targetVersion: string;
        fileName: string;
        fileSize: number;
        checksum: string;
        filePath?: string;
        manufacturer: string;
        model: string;
        releaseDate: Date;
        releaseNotes?: string;
    };
    status: 'pending' | 'preparing' | 'transferring' | 'verifying' | 'installing' | 'activating' | 'completed' | 'failed' | 'rolled_back';
    progress: {
        stage: string;
        percentage: number;
        bytesTransferred: number;
        totalBytes: number;
        estimatedTimeRemaining?: number;
        currentStep: string;
        totalSteps: number;
    };
    schedule: {
        scheduledTime?: Date;
        autoStart: boolean;
        retryOnFailure: boolean;
        maxRetries: number;
        currentRetry: number;
    };
    result?: {
        success: boolean;
        completedAt: Date;
        duration: number;
        errorMessage?: string;
        errorCode?: string;
        verifiedVersion?: string;
        rollbackPerformed?: boolean;
    };
    initiatedBy: mongoose.Types.ObjectId;
    logs: Array<{
        timestamp: Date;
        level: 'info' | 'warning' | 'error';
        message: string;
    }>;
    metadata?: Map<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const FirmwareUpgrade: any;
export default FirmwareUpgrade;
//# sourceMappingURL=Firmware.model.d.ts.map