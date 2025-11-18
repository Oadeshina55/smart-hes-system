import mongoose, { Document } from 'mongoose';
export interface IArea extends Document {
    name: string;
    code: string;
    description?: string;
    parentArea?: mongoose.Types.ObjectId;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    meterCount: number;
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Area: any;
//# sourceMappingURL=Area.model.d.ts.map