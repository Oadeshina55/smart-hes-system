"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpService = exports.OTPService = void 0;
const OTP_model_1 = require("../models/OTP.model");
const User_model_1 = require("../models/User.model");
const email_service_1 = require("./email.service");
const crypto_1 = __importDefault(require("crypto"));
class OTPService {
    /**
     * Generate a 6-digit OTP code
     */
    generateOTP() {
        return crypto_1.default.randomInt(100000, 999999).toString();
    }
    /**
     * Send OTP to user's email for login
     */
    async sendLoginOTP(email) {
        try {
            // Find user by email
            const user = await User_model_1.User.findOne({ email: email.toLowerCase() });
            if (!user) {
                return { success: false, message: 'User not found' };
            }
            if (!user.isActive) {
                return { success: false, message: 'Account is inactive' };
            }
            // Delete any existing OTPs for this email and purpose
            await OTP_model_1.OTP.deleteMany({ email: email.toLowerCase(), purpose: 'login' });
            // Generate new OTP
            const otpCode = this.generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            // Save OTP to database
            await OTP_model_1.OTP.create({
                email: email.toLowerCase(),
                otp: otpCode,
                purpose: 'login',
                expiresAt,
            });
            // Send OTP via email
            const emailSent = await email_service_1.emailService.sendOTP(email, otpCode, user.username);
            if (!emailSent) {
                return { success: false, message: 'Failed to send OTP email' };
            }
            return {
                success: true,
                message: 'OTP sent to your email',
                expiresIn: 600, // 10 minutes in seconds
            };
        }
        catch (error) {
            console.error('Send OTP error:', error);
            return { success: false, message: 'Failed to send OTP' };
        }
    }
    /**
     * Verify OTP code
     */
    async verifyOTP(email, otpCode, purpose = 'login') {
        try {
            // Find OTP record
            const otpRecord = await OTP_model_1.OTP.findOne({
                email: email.toLowerCase(),
                purpose,
                verified: false,
            }).sort({ createdAt: -1 }); // Get most recent
            if (!otpRecord) {
                return { success: false, message: 'Invalid or expired OTP' };
            }
            // Check if OTP has expired
            if (new Date() > otpRecord.expiresAt) {
                await OTP_model_1.OTP.deleteOne({ _id: otpRecord._id });
                return { success: false, message: 'OTP has expired' };
            }
            // Check attempts limit (max 3 attempts)
            if (otpRecord.attempts >= 3) {
                await OTP_model_1.OTP.deleteOne({ _id: otpRecord._id });
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
        }
        catch (error) {
            console.error('Verify OTP error:', error);
            return { success: false, message: 'Failed to verify OTP' };
        }
    }
    /**
     * Resend OTP
     */
    async resendOTP(email, purpose = 'login') {
        try {
            // Check rate limiting (don't allow resend within 60 seconds)
            const recentOTP = await OTP_model_1.OTP.findOne({
                email: email.toLowerCase(),
                purpose,
                createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
            });
            if (recentOTP) {
                return { success: false, message: 'Please wait 60 seconds before requesting a new OTP' };
            }
            // Send new OTP
            return this.sendLoginOTP(email);
        }
        catch (error) {
            console.error('Resend OTP error:', error);
            return { success: false, message: 'Failed to resend OTP' };
        }
    }
    /**
     * Clean up expired OTPs (called periodically)
     */
    async cleanupExpiredOTPs() {
        try {
            const result = await OTP_model_1.OTP.deleteMany({
                expiresAt: { $lt: new Date() },
            });
            console.log(`Cleaned up ${result.deletedCount} expired OTPs`);
        }
        catch (error) {
            console.error('Cleanup OTP error:', error);
        }
    }
}
exports.OTPService = OTPService;
exports.otpService = new OTPService();
exports.default = exports.otpService;
//# sourceMappingURL=otp.service.js.map