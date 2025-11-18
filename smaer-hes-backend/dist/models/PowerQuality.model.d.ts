import mongoose, { Document } from 'mongoose';
export interface IPowerQualityEvent {
    eventType: 'sag' | 'swell' | 'interruption' | 'harmonics' | 'flicker' | 'unbalance' | 'frequency_deviation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    phase?: 'L1' | 'L2' | 'L3' | 'all';
    startTime: Date;
    endTime?: Date;
    duration?: number;
    value: number;
    threshold: number;
    unit: string;
    description?: string;
}
export interface IPowerQuality extends Document {
    meter: mongoose.Types.ObjectId;
    timestamp: Date;
    voltage: {
        L1?: number;
        L2?: number;
        L3?: number;
        average?: number;
        unbalance?: number;
        thd?: number;
    };
    current: {
        L1?: number;
        L2?: number;
        L3?: number;
        neutral?: number;
        unbalance?: number;
        thd?: number;
    };
    powerFactor: {
        total?: number;
        L1?: number;
        L2?: number;
        L3?: number;
        displacement?: number;
    };
    frequency: {
        value: number;
        deviation: number;
    };
    harmonics?: {
        voltage?: {
            fundamental: number;
            thd: number;
            individual: number[];
        };
        current?: {
            fundamental: number;
            thd: number;
            individual: number[];
        };
    };
    flicker?: {
        pst: number;
        plt: number;
    };
    events: IPowerQualityEvent[];
    qualityScore: number;
    compliance: {
        standard: string;
        compliant: boolean;
        violations: string[];
    };
    metadata?: Map<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PowerQuality: any;
export default PowerQuality;
//# sourceMappingURL=PowerQuality.model.d.ts.map