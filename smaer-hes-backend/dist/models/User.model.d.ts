import { Document } from 'mongoose';
export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'operator' | 'customer';
    firstName: string;
    lastName: string;
    phoneNumber: string;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export declare const User: any;
//# sourceMappingURL=User.model.d.ts.map