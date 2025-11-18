export declare class OTPService {
    /**
     * Generate a 6-digit OTP code
     */
    private generateOTP;
    /**
     * Send OTP to user's email for login
     */
    sendLoginOTP(email: string): Promise<{
        success: boolean;
        message: string;
        expiresIn?: number;
    }>;
    /**
     * Verify OTP code
     */
    verifyOTP(email: string, otpCode: string, purpose?: 'login' | 'password_reset' | 'registration'): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Resend OTP
     */
    resendOTP(email: string, purpose?: 'login' | 'password_reset' | 'registration'): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Clean up expired OTPs (called periodically)
     */
    cleanupExpiredOTPs(): Promise<void>;
}
export declare const otpService: OTPService;
export default otpService;
//# sourceMappingURL=otp.service.d.ts.map