import { OTP, IOTP } from '../models/OTP.model';
import { User } from '../models/User.model';
import { emailService } from './email.service';
import crypto from 'crypto';

export class OTPService {
  /**
   * Generate a 6-digit OTP code
   */
  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Send OTP to user's email for login
   */
  async sendLoginOTP(email: string): Promise<{ success: boolean; message: string; expiresIn?: number }> {
    try {
      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (!user.isActive) {
        return { success: false, message: 'Account is inactive' };
      }

      // Delete any existing OTPs for this email and purpose
      await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'login' });

      // Generate new OTP
      const otpCode = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save OTP to database
      await OTP.create({
        email: email.toLowerCase(),
        otp: otpCode,
        purpose: 'login',
        expiresAt,
      });

      // Send OTP via email
      const emailSent = await emailService.sendOTP(email, otpCode, user.username);

      if (!emailSent) {
        return { success: false, message: 'Failed to send OTP email' };
      }

      return {
        success: true,
        message: 'OTP sent to your email',
        expiresIn: 600, // 10 minutes in seconds
      };
    } catch (error: any) {
      console.error('Send OTP error:', error);
      return { success: false, message: 'Failed to send OTP' };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(
    email: string,
    otpCode: string,
    purpose: 'login' | 'password_reset' | 'registration' = 'login'
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Find OTP record
      const otpRecord = await OTP.findOne({
        email: email.toLowerCase(),
        purpose,
        verified: false,
      }).sort({ createdAt: -1 }); // Get most recent

      if (!otpRecord) {
        return { success: false, message: 'Invalid or expired OTP' };
      }

      // Check if OTP has expired
      if (new Date() > otpRecord.expiresAt) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return { success: false, message: 'OTP has expired' };
      }

      // Check attempts limit (max 3 attempts)
      if (otpRecord.attempts >= 3) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return { success: false, message: 'Too many failed attempts. Please request a new OTP' };
      }

      // Verify OTP code
      if (otpRecord.otp !== otpCode) {
        // Increment attempts
        otpRecord.attempts += 1;
        await otpRecord.save();

        const remainingAttempts = 3 - otpRecord.attempts;
        return {
          success: false,
          message: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining`,
        };
      }

      // Mark OTP as verified
      otpRecord.verified = true;
      await otpRecord.save();

      return { success: true, message: 'OTP verified successfully' };
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      return { success: false, message: 'Failed to verify OTP' };
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(email: string, purpose: 'login' | 'password_reset' | 'registration' = 'login'): Promise<{ success: boolean; message: string }> {
    try {
      // Check rate limiting (don't allow resend within 60 seconds)
      const recentOTP = await OTP.findOne({
        email: email.toLowerCase(),
        purpose,
        createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
      });

      if (recentOTP) {
        return { success: false, message: 'Please wait 60 seconds before requesting a new OTP' };
      }

      // Send new OTP
      return this.sendLoginOTP(email);
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      return { success: false, message: 'Failed to resend OTP' };
    }
  }

  /**
   * Clean up expired OTPs (called periodically)
   */
  async cleanupExpiredOTPs(): Promise<void> {
    try {
      const result = await OTP.deleteMany({
        expiresAt: { $lt: new Date() },
      });
      console.log(`Cleaned up ${result.deletedCount} expired OTPs`);
    } catch (error) {
      console.error('Cleanup OTP error:', error);
    }
  }
}

export const otpService = new OTPService();
export default otpService;
