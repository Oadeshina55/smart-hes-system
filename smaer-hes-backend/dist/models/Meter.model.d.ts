import mongoose from 'mongoose';
export interface IMeter {
    meterNumber: string;
    concentratorId?: string;
    meterType: 'single-phase' | 'three-phase' | 'prepaid' | 'postpaid';
    brand: string;
    model: string;
    firmware: string;
    area: mongoose.Types.ObjectId;
    customer?: mongoose.Types.ObjectId;
    simCard?: mongoose.Types.ObjectId;
    ipAddress?: string;
    port?: number;
    status: 'online' | 'offline' | 'active' | 'warehouse' | 'faulty';
    lastSeen?: Date;
    installationDate?: Date;
    commissionDate?: Date;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    currentReading: {
        totalEnergy: number;
        voltage: number;
        current: number;
        power: number;
        frequency: number;
        powerFactor: number;
        timestamp: Date;
    };
    relayStatus: 'connected' | 'disconnected';
    tamperStatus: {
        coverOpen: boolean;
        magneticTamper: boolean;
        reverseFlow: boolean;
        neutralDisturbance: boolean;
    };
    obisConfiguration?: Map<string, any>;
    metadata?: Map<string, any>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    isOnline?: () => boolean;
}
export declare const Meter: any;
//# sourceMappingURL=Meter.model.d.ts.map