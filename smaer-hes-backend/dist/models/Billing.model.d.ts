import mongoose, { Document } from 'mongoose';
export interface ITariffRate {
    name: string;
    type: 'flat' | 'tiered' | 'time_of_use' | 'demand';
    rate: number;
    startTime?: string;
    endTime?: string;
    minThreshold?: number;
    maxThreshold?: number;
    season?: 'summer' | 'winter' | 'all';
}
export interface IBillingCycle extends Document {
    meter: mongoose.Types.ObjectId;
    customer: mongoose.Types.ObjectId;
    billingPeriod: {
        startDate: Date;
        endDate: Date;
        daysInPeriod: number;
    };
    energyConsumption: {
        activeImport: number;
        activeExport: number;
        reactiveImport: number;
        reactiveExport: number;
        netConsumption: number;
    };
    demand: {
        maxDemand: number;
        maxDemandTimestamp: Date;
        averageDemand: number;
    };
    tariff: {
        name: string;
        type: 'residential' | 'commercial' | 'industrial' | 'agricultural';
        rates: ITariffRate[];
        fixedCharge: number;
        demandCharge?: number;
    };
    costs: {
        energyCharge: number;
        demandCharge: number;
        fixedCharge: number;
        taxes: number;
        otherCharges: number;
        adjustments: number;
        totalCost: number;
    };
    readings: {
        openingReading: number;
        closingReading: number;
        meterConstant: number;
    };
    status: 'draft' | 'calculated' | 'verified' | 'billed' | 'paid' | 'overdue' | 'disputed';
    payment?: {
        method: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'prepaid';
        transactionId?: string;
        paidAmount: number;
        paidDate?: Date;
        balance: number;
    };
    powerFactor: {
        average: number;
        penalty?: number;
    };
    notes?: string;
    generatedBy?: mongoose.Types.ObjectId;
    metadata?: Map<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const BillingCycle: any;
export default BillingCycle;
//# sourceMappingURL=Billing.model.d.ts.map