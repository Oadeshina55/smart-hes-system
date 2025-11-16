import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: ReturnType<typeof nodemailer.createTransport>;

  constructor() {
    // Create transporter with email configuration
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'New Hampshire Capital'}" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  async sendOTP(email: string, otp: string, username: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 3px solid #667eea;
          }
          .header h1 {
            color: #667eea;
            margin: 0;
          }
          .content {
            padding: 30px 0;
          }
          .otp-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .info {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 New Hampshire Capital HES</h1>
            <p>Smart Energy Management System</p>
          </div>
          <div class="content">
            <h2>Hello, ${username}!</h2>
            <p>You have requested to login to your account. Please use the verification code below to complete your login:</p>

            <div class="otp-box">
              ${otp}
            </div>

            <div class="info">
              <strong>⏱️ Important:</strong> This code will expire in <strong>10 minutes</strong>.
            </div>

            <p><strong>Security Tips:</strong></p>
            <ul>
              <li>Never share this code with anyone</li>
              <li>Our team will never ask for this code</li>
              <li>If you didn't request this code, please ignore this email</li>
            </ul>
          </div>
          <div class="footer">
            <p>This is an automated message from New Hampshire Capital HES System</p>
            <p>&copy; ${new Date().getFullYear()} New Hampshire Capital. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hello ${username},

Your login verification code is: ${otp}

This code will expire in 10 minutes.

Security Tips:
- Never share this code with anyone
- Our team will never ask for this code
- If you didn't request this code, please ignore this email

New Hampshire Capital HES System
    `;

    return this.sendEmail({
      to: email,
      subject: 'Your Login Verification Code - New Hampshire Capital HES',
      html,
      text,
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string, username: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 3px solid #667eea;
          }
          .header h1 {
            color: #667eea;
            margin: 0;
          }
          .content {
            padding: 30px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello, ${username}!</h2>
            <p>You have requested to reset your password. Click the button below to proceed:</p>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>

            <p>This link will expire in 1 hour.</p>

            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} New Hampshire Capital. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request - New Hampshire Capital HES',
      html,
    });
  }
}

export const emailService = new EmailService();
export default emailService;
