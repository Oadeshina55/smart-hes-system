import mongoose, { Document } from 'mongoose';
export interface IConsumption extends Document {
    meter: mongoose.Types.ObjectId;
    area: mongoose.Types.ObjectId;
    timestamp: Date;
    interval: 'hourly' | 'daily' | 'weekly' | 'monthly';
    energy: {
        activeEnergy: number;
        reactiveEnergy: number;
        apparentEnergy: number;
        exportedEnergy: number;
    };
    power: {
        activePower: number;
        reactivePower: number;
        apparentPower: number;
        maxDemand: number;
    };
    voltage: {
        phaseA: number;
        phaseB: number;
        phaseC: number;
        average: number;
    };
    current: {
        phaseA: number;
        phaseB: number;
        phaseC: number;
        neutral: number;
        average: number;
    };
    powerFactor: {
        phaseA: number;
        phaseB: number;
        phaseC: number;
        average: number;
    };
    frequency: number;
    thd: {
        voltageThd: number;
        currentThd: number;
    };
    readingType: 'automatic' | 'manual' | 'estimated';
    cost?: number;
    tariffRate?: number;
    metadata?: Map<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Consumption: any;
//# sourceMappingURL=Consumption.model.d.ts.map