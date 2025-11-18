import mongoose, { Document } from 'mongoose';
export interface IEvent extends Document {
    meter: mongoose.Types.ObjectId;
    eventType: string;
    eventCode: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    category: 'communication' | 'tamper' | 'power' | 'billing' | 'technical' | 'other';
    description: string;
    details?: Map<string, any>;
    timestamp: Date;
    acknowledged: boolean;
    acknowledgedBy?: mongoose.Types.ObjectId;
    acknowledgedAt?: Date;
    resolution?: string;
    metadata?: Map<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const EVENT_TYPES: {
    METER_ONLINE: string;
    METER_OFFLINE: string;
    COMMUNICATION_LOST: string;
    COMMUNICATION_RESTORED: string;
    COVER_OPEN: string;
    COVER_CLOSED: string;
    MAGNETIC_TAMPER: string;
    REVERSE_FLOW: string;
    NEUTRAL_DISTURBANCE: string;
    POWER_OUTAGE: string;
    POWER_RESTORED: string;
    VOLTAGE_IMBALANCE: string;
    OVER_VOLTAGE: string;
    UNDER_VOLTAGE: string;
    TOKEN_LOADED: string;
    CREDIT_EXHAUSTED: string;
    LOW_CREDIT: string;
    RELAY_DISCONNECTED: string;
    RELAY_CONNECTED: string;
    FIRMWARE_UPDATE: string;
    CONFIGURATION_CHANGE: string;
};
export declare const Event: any;
//# sourceMappingURL=Event.model.d.ts.map