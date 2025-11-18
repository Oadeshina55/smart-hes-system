import mongoose, { Document } from 'mongoose';
export interface ICustomer extends Document {
    customerName: string;
    accountNumber: string;
    email?: string;
    phoneNumber: string;
    address: {
        street: string;
        city: string;
        state: string;
        postalCode?: string;
        country: string;
    };
    meterNumber?: string;
    meter?: mongoose.Types.ObjectId;
    simNumber?: string;
    tariffPlan?: string;
    connectionType: 'residential' | 'commercial' | 'industrial';
    connectionDate?: Date;
    status: 'active' | 'inactive' | 'suspended';
    billingInfo?: {
        lastBillDate?: Date;
        lastBillAmount?: number;
        outstandingBalance?: number;
        paymentMethod?: string;
    };
    metadata?: Map<string, any>;
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Customer: any;
//# sourceMappingURL=Customer.model.d.ts.map