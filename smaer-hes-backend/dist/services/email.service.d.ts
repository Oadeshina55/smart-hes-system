interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
declare class EmailService {
    private transporter;
    constructor();
    sendEmail(options: EmailOptions): Promise<boolean>;
    sendOTP(email: string, otp: string, username: string): Promise<boolean>;
    sendPasswordResetEmail(email: string, resetToken: string, username: string): Promise<boolean>;
}
export declare const emailService: EmailService;
export default emailService;
//# sourceMappingURL=email.service.d.ts.map