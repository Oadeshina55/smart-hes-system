import mongoose, { Document } from 'mongoose';
export interface ISimCard extends Document {
    simNumber: string;
    iccid: string;
    imsi?: string;
    provider: string;
    ipAddress?: string;
    port?: number;
    apn?: string;
    status: 'active' | 'inactive' | 'suspended' | 'available';
    meter?: mongoose.Types.ObjectId;
    dataUsage?: {
        current: number;
        limit: number;
        resetDate: Date;
    };
    activationDate?: Date;
    expirationDate?: Date;
    lastCommunication?: Date;
    signalStrength?: number;
    metadata?: Map<string, any>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const SimCard: any;
//# sourceMappingURL=SimCard.model.d.ts.map