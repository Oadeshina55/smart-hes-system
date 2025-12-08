import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'operator' | 'customer' | 'customer-operator';
  firstName: string;
  lastName: string;
  phoneNumber: string;
  // Multi-tenant support
  customerNetwork?: mongoose.Types.ObjectId; // For customer-operator: which network they manage
  assignedAreas?: mongoose.Types.ObjectId[]; // DEPRECATED - kept for backward compatibility
  isActive: boolean;
  lastLogin?: Date;
  permissions?: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ['admin', 'operator', 'customer', 'customer-operator'],
      default: 'customer'
    },
    firstName: {
      type: String,
      trim: true,
      default: ''
    },
    lastName: {
      type: String,
      trim: true,
      default: ''
    },
    phoneNumber: {
      type: String,
      trim: true
    },
    customerNetwork: {
      type: Schema.Types.ObjectId,
      ref: 'CustomerNetwork',
      default: null,
      index: true
    },
    assignedAreas: [{
      type: Schema.Types.ObjectId,
      ref: 'Area'
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    },
    permissions: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Create indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ customerNetwork: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
