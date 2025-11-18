import mongoose, { Document, Schema } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string;
  purpose: 'login' | 'password_reset' | 'registration';
  attempts: number;
  verified: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['login', 'password_reset', 'registration'],
      default: 'login',
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index - MongoDB will auto-delete expired documents
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
otpSchema.index({ email: 1, purpose: 1, verified: 1 });
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 }); // Auto-delete after 10 minutes

export const OTP = mongoose.model<IOTP>('OTP', otpSchema);
