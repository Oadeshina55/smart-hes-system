import mongoose, { Document } from 'mongoose';
export interface ILoadProfileEntry {
    timestamp: Date;
    voltage?: {
        L1?: number;
        L2?: number;
        L3?: number;
        average?: number;
    };
    current?: {
        L1?: number;
        L2?: number;
        L3?: number;
        total?: number;
    };
    power?: {
        active?: number;
        reactive?: number;
        apparent?: number;
    };
    energy?: {
        activeImport?: number;
        activeExport?: number;
        reactiveImport?: number;
        reactiveExport?: number;
    };
    powerFactor?: number;
    frequency?: number;
    metadata?: Map<string, any>;
}
export interface ILoadProfile extends Document {
    meter: mongoose.Types.ObjectId;
    profileType: 'hourly' | 'daily' | 'instantaneous' | 'billing' | 'custom';
    captureInterval: number;
    startTime: Date;
    endTime: Date;
    entries: ILoadProfileEntry[];
    obisCode: string;
    totalEntries: number;
    status: 'pending' | 'reading' | 'completed' | 'failed' | 'partial';
    errorMessage?: string;
    metadata?: Map<string, any>;
    createdAt: Date;
    updatedAt: Date;
    duration?: number;
}
export declare const LoadProfile: any;
export default LoadProfile;
//# sourceMappingURL=LoadProfile.model.d.ts.map