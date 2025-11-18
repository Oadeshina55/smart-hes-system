import { Document } from 'mongoose';
export interface IOTP extends Document {
    email: string;
    otp: string;
    purpose: 'login' | 'password_reset' | 'registration';
    attempts: number;
    verified: boolean;
    expiresAt: Date;
    createdAt: Date;
}
export declare const OTP: any;
//# sourceMappingURL=OTP.model.d.ts.map