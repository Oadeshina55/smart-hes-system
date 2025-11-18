import express from 'express';
import * as expressValidator from 'express-validator';
const { body, validationResult } = expressValidator;
import { User } from '../models/User.model';
import { generateToken, authenticate } from '../middleware/auth.middleware';
import { otpService } from '../services/otp.service';
import axios from 'axios';

const router = express.Router();

// In-memory store for login passcodes (session-based)
interface LoginPasscode {
  sessionId: string;
  passcode: string;
  createdAt: number;
  expiresAt: number;
}

const loginPasscodes = new Map<string, LoginPasscode>();

// Cleanup expired passcodes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, data] of loginPasscodes.entries()) {
    if (now > data.expiresAt) {
      loginPasscodes.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);

// Generate a unique 6-character alphanumeric passcode
const generatePasscode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar-looking chars
  let passcode = '';
  for (let i = 0; i < 6; i++) {
    passcode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return passcode;
};

// Validation rules
const registerValidation = [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').optional().trim().isLength({ min: 1 }).withMessage('First name must not be empty if provided'),
  body('lastName').optional().trim().isLength({ min: 1 }).withMessage('Last name must not be empty if provided'),
];

const loginValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('passcode').notEmpty().withMessage('Passcode is required'),
  body('sessionId').notEmpty().withMessage('Session ID is required'),
];

// Generate login passcode
router.post('/generate-passcode', (req: express.Request, res: express.Response) => {
  try {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const passcode = generatePasscode();
    const now = Date.now();

    const passcodeData: LoginPasscode = {
      sessionId,
      passcode,
      createdAt: now,
      expiresAt: now + (10 * 60 * 1000), // Expires in 10 minutes
    };

    loginPasscodes.set(sessionId, passcodeData);

    res.json({
      success: true,
      data: {
        sessionId,
        passcode,
        expiresIn: 600, // 10 minutes in seconds
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate passcode',
      error: error.message,
    });
  }
});

// Register a new user
router.post('/register', registerValidation, async (req: express.Request, res: express.Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, email, password, firstName, lastName, phoneNumber, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role: role || 'customer'
    });

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        },
        token
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Login
router.post('/login', loginValidation, async (req: express.Request, res: express.Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, password, passcode, sessionId } = req.body;

    // Validate passcode
    const passcodeData = loginPasscodes.get(sessionId);

    if (!passcodeData) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired login session. Please refresh the page.',
      });
    }

    if (passcodeData.passcode.toUpperCase() !== passcode.toUpperCase()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid passcode. Please check and try again.',
      });
    }

    if (Date.now() > passcodeData.expiresAt) {
      loginPasscodes.delete(sessionId);
      return res.status(401).json({
        success: false,
        message: 'Passcode has expired. Please refresh the page.',
      });
    }

    // Delete used passcode
    loginPasscodes.delete(sessionId);

    // Find user and include password for verification
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        },
        token
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Quick re-login (for session unlock - no passcode required)
router.post('/quick-relogin', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req: express.Request, res: express.Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find user and include password for verification
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: 'Session unlocked successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        },
        token
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
});

// Get current user
router.get('/me', authenticate, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user info',
      error: error.message
    });
  }
});

// Change password
router.post('/change-password', authenticate, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
});

// Logout (client-side token removal, but we can track it server-side if needed)
router.post('/logout', authenticate, async (req: any, res) => {
  try {
    // You could implement token blacklisting here if needed
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

// ==================== OTP-BASED AUTHENTICATION ====================

// Step 1: Request OTP for login
router.post('/request-otp', async (req: express.Request, res: express.Response) => {
  try {
    const { email, username } = req.body;

    if (!email && !username) {
      return res.status(400).json({
        success: false,
        message: 'Email or username is required',
      });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: email?.toLowerCase() },
        { username: username },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Send OTP to user's email
    const result = await otpService.sendLoginOTP(user.email);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      message: 'OTP sent to your email',
      data: {
        email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Partially hide email
        expiresIn: result.expiresIn,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to request OTP',
      error: error.message,
    });
  }
});

// Step 2: Verify OTP and complete login
router.post('/verify-otp', async (req: express.Request, res: express.Response) => {
  try {
    const { email, username, otp, password } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required',
      });
    }

    if (!email && !username) {
      return res.status(400).json({
        success: false,
        message: 'Email or username is required',
      });
    }

    // Find user
    const user = await User.findOne({
      $or: [
        { email: email?.toLowerCase() },
        { username: username },
      ],
    }).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify password if provided (optional - you can make OTP-only login)
    if (password) {
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }
    }

    // Verify OTP
    const otpResult = await otpService.verifyOTP(user.email, otp, 'login');

    if (!otpResult.success) {
      return res.status(401).json(otpResult);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message,
    });
  }
});

// Resend OTP
router.post('/resend-otp', async (req: express.Request, res: express.Response) => {
  try {
    const { email, username } = req.body;

    if (!email && !username) {
      return res.status(400).json({
        success: false,
        message: 'Email or username is required',
      });
    }

    // Find user
    const user = await User.findOne({
      $or: [
        { email: email?.toLowerCase() },
        { username: username },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const result = await otpService.resendOTP(user.email, 'login');

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'OTP resent successfully',
      data: {
        email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
      error: error.message,
    });
  }
});

// ==================== CAPTCHA VERIFICATION ====================

// Verify Google reCAPTCHA
router.post('/verify-captcha', async (req: express.Request, res: express.Response) => {
  try {
    const { captchaToken } = req.body;

    if (!captchaToken) {
      return res.status(400).json({
        success: false,
        message: 'CAPTCHA token is required',
      });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY not configured');
      // Allow login if CAPTCHA is not configured
      return res.json({
        success: true,
        message: 'CAPTCHA verification bypassed (not configured)',
      });
    }

    // Verify with Google reCAPTCHA API
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`
    );

    if (response.data.success) {
      res.json({
        success: true,
        message: 'CAPTCHA verified successfully',
        score: response.data.score, // For reCAPTCHA v3
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'CAPTCHA verification failed',
        errors: response.data['error-codes'],
      });
    }
  } catch (error: any) {
    console.error('CAPTCHA verification error:', error);
    // Allow login if CAPTCHA verification fails due to network issues
    res.json({
      success: true,
      message: 'CAPTCHA verification bypassed (error occurred)',
    });
  }
});

// Initialize admin user (run once on setup)
router.post('/init-admin', async (req, res) => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Admin user already exists'
      });
    }

    // Create default admin
    const admin = await User.create({
      username: 'admin',
      email: 'admin@smarthes.com',
      password: 'Admin@123456',
      firstName: 'System',
      lastName: 'Administrator',
      phoneNumber: '+234000000000',
      role: 'admin'
    });

    res.json({
      success: true,
      message: 'Admin user created successfully',
      credentials: {
        username: 'admin',
        password: 'Admin@123456',
        note: 'Please change the password immediately after first login'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create admin user',
      error: error.message
    });
  }
});

export default router;
