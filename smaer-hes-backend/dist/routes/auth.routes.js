"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const expressValidator = __importStar(require("express-validator"));
const { body, validationResult } = expressValidator;
const User_model_1 = require("../models/User.model");
const auth_middleware_1 = require("../middleware/auth.middleware");
const otp_service_1 = require("../services/otp.service");
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
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
];
// Register a new user
router.post('/register', registerValidation, async (req, res) => {
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
        const existingUser = await User_model_1.User.findOne({
            $or: [{ username }, { email }]
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }
        // Create user
        const user = await User_model_1.User.create({
            username,
            email,
            password,
            firstName,
            lastName,
            phoneNumber,
            role: role || 'customer'
        });
        // Generate token
        const token = (0, auth_middleware_1.generateToken)(user._id.toString());
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});
// Login
router.post('/login', loginValidation, async (req, res) => {
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
        const user = await User_model_1.User.findOne({ username }).select('+password');
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
        const token = (0, auth_middleware_1.generateToken)(user._id.toString());
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});
// Get current user
router.get('/me', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const user = await User_model_1.User.findById(req.user._id).select('-password');
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get user info',
            error: error.message
        });
    }
});
// Change password
router.post('/change-password', auth_middleware_1.authenticate, async (req, res) => {
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
        const user = await User_model_1.User.findById(req.user._id).select('+password');
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
});
// Logout (client-side token removal, but we can track it server-side if needed)
router.post('/logout', auth_middleware_1.authenticate, async (req, res) => {
    try {
        // You could implement token blacklisting here if needed
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
});
// ==================== OTP-BASED AUTHENTICATION ====================
// Step 1: Request OTP for login
router.post('/request-otp', async (req, res) => {
    try {
        const { email, username } = req.body;
        if (!email && !username) {
            return res.status(400).json({
                success: false,
                message: 'Email or username is required',
            });
        }
        // Find user by email or username
        const user = await User_model_1.User.findOne({
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
        const result = await otp_service_1.otpService.sendLoginOTP(user.email);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to request OTP',
            error: error.message,
        });
    }
});
// Step 2: Verify OTP and complete login
router.post('/verify-otp', async (req, res) => {
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
        const user = await User_model_1.User.findOne({
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
        const otpResult = await otp_service_1.otpService.verifyOTP(user.email, otp, 'login');
        if (!otpResult.success) {
            return res.status(401).json(otpResult);
        }
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        // Generate token
        const token = (0, auth_middleware_1.generateToken)(user._id.toString());
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to verify OTP',
            error: error.message,
        });
    }
});
// Resend OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { email, username } = req.body;
        if (!email && !username) {
            return res.status(400).json({
                success: false,
                message: 'Email or username is required',
            });
        }
        // Find user
        const user = await User_model_1.User.findOne({
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
        const result = await otp_service_1.otpService.resendOTP(user.email, 'login');
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to resend OTP',
            error: error.message,
        });
    }
});
// ==================== CAPTCHA VERIFICATION ====================
// Verify Google reCAPTCHA
router.post('/verify-captcha', async (req, res) => {
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
        const response = await axios_1.default.post(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`);
        if (response.data.success) {
            res.json({
                success: true,
                message: 'CAPTCHA verified successfully',
                score: response.data.score, // For reCAPTCHA v3
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'CAPTCHA verification failed',
                errors: response.data['error-codes'],
            });
        }
    }
    catch (error) {
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
        const adminExists = await User_model_1.User.findOne({ role: 'admin' });
        if (adminExists) {
            return res.status(400).json({
                success: false,
                message: 'Admin user already exists'
            });
        }
        // Create default admin
        const admin = await User_model_1.User.create({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create admin user',
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map