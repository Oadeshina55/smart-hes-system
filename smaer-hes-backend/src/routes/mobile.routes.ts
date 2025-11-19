import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.model';
import { Customer } from '../models/Customer.model';
import { Meter } from '../models/Meter.model';
import { Consumption } from '../models/Consumption.model';
import { authenticate } from '../middleware/auth.middleware';
import { auditChange } from '../middleware/audit.middleware';
import { Notification } from '../models/Notification.model';
import { NotificationService } from '../services/notification.service';

const router = express.Router();

// Generate JWT token
const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d', // Mobile apps need longer sessions
  });
};

/**
 * CUSTOMER REGISTRATION
 * POST /mobile/register
 */
router.post('/register', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create username from email
    const username = email.split('@')[0].toLowerCase();

    // Check if username exists
    let finalUsername = username;
    let counter = 1;
    while (await User.findOne({ username: finalUsername })) {
      finalUsername = `${username}${counter}`;
      counter++;
    }

    // Create user account
    const user = await User.create({
      username: finalUsername,
      email,
      password,
      role: 'customer',
      firstName,
      lastName,
      phoneNumber,
      isActive: true,
    });

    // Create customer profile
    const customer = await Customer.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      accountNumber: `CUST${Date.now()}`,
      user: user._id,
    });

    // Update user with customer reference
    user.customerId = customer._id;
    await user.save();

    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          role: user.role,
        },
        customer: {
          id: customer._id,
          accountNumber: customer.accountNumber,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
});

/**
 * CUSTOMER LOGIN
 * POST /mobile/login
 */
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email, role: 'customer' }).select('+password');
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
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Get customer profile
    const customer = await Customer.findOne({ email });

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          role: user.role,
        },
        customer: customer ? {
          id: customer._id,
          accountNumber: customer.accountNumber,
        } : null,
        token,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
});

/**
 * LINK METER TO CUSTOMER
 * POST /mobile/link-meter
 */
router.post('/link-meter', authenticate, async (req: any, res) => {
  try {
    const { meterNumber } = req.body;

    if (!meterNumber) {
      return res.status(400).json({
        success: false,
        message: 'Meter number is required'
      });
    }

    // Get customer profile
    const customer = await Customer.findOne({ email: req.user.email });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    // Find meter
    const meter = await Meter.findOne({ meterNumber: meterNumber.toUpperCase() });
    if (!meter) {
      return res.status(404).json({
        success: false,
        message: 'Meter not found. Please check the meter number.'
      });
    }

    // Check if meter is already linked to another customer
    if (meter.customer && meter.customer.toString() !== customer._id.toString()) {
      return res.status(409).json({
        success: false,
        message: 'This meter is already linked to another customer'
      });
    }

    // Link meter to customer
    meter.customer = customer._id;
    await meter.save();

    res.json({
      success: true,
      message: 'Meter linked successfully',
      data: {
        meter: {
          id: meter._id,
          meterNumber: meter.meterNumber,
          brand: meter.brand,
          model: meter.model,
          status: meter.status,
          area: meter.area,
        },
      },
    });
  } catch (error: any) {
    console.error('Link meter error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link meter',
      error: error.message,
    });
  }
});

/**
 * GET CUSTOMER'S METERS
 * GET /mobile/my-meters
 */
router.get('/my-meters', authenticate, async (req: any, res) => {
  try {
    // Get customer profile
    const customer = await Customer.findOne({ email: req.user.email });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    // Get all meters linked to customer
    const meters = await Meter.find({ customer: customer._id })
      .populate('area', 'name code')
      .select('meterNumber brand model status currentReading relayStatus lastSeen area');

    res.json({
      success: true,
      data: meters,
    });
  } catch (error: any) {
    console.error('Get meters error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meters',
      error: error.message,
    });
  }
});

/**
 * GET METER DETAILS
 * GET /mobile/meter/:id
 */
router.get('/meter/:id', authenticate, async (req: any, res) => {
  try {
    const customer = await Customer.findOne({ email: req.user.email });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    const meter = await Meter.findById(req.params.id)
      .populate('area', 'name code');

    if (!meter) {
      return res.status(404).json({
        success: false,
        message: 'Meter not found'
      });
    }

    // Verify meter belongs to customer
    if (!meter.customer || meter.customer.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This meter does not belong to you.'
      });
    }

    res.json({
      success: true,
      data: meter,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter details',
      error: error.message,
    });
  }
});

/**
 * GET CONSUMPTION TREND
 * GET /mobile/consumption-trend/:meterId
 */
router.get('/consumption-trend/:meterId', authenticate, async (req: any, res) => {
  try {
    const customer = await Customer.findOne({ email: req.user.email });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    const meter = await Meter.findById(req.params.meterId);
    if (!meter || meter.customer?.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { period = '7d' } = req.query;

    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get consumption data
    const consumptionData = await Consumption.find({
      meter: meter._id,
      timestamp: { $gte: startDate },
    }).sort({ timestamp: 1 });

    // Calculate statistics
    const totalConsumption = consumptionData.reduce((sum, c) => sum + (c.consumption || 0), 0);
    const avgConsumption = consumptionData.length > 0 ? totalConsumption / consumptionData.length : 0;

    // Get current balance (from currentReading.totalEnergy)
    const currentBalance = meter.currentReading?.totalEnergy || 0;

    res.json({
      success: true,
      data: {
        period,
        totalConsumption,
        avgConsumption,
        currentBalance,
        dataPoints: consumptionData.map(c => ({
          timestamp: c.timestamp,
          consumption: c.consumption,
          voltage: c.voltage,
          current: c.current,
          power: c.power,
        })),
        meter: {
          meterNumber: meter.meterNumber,
          status: meter.status,
          relayStatus: meter.relayStatus,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consumption trend',
      error: error.message,
    });
  }
});

/**
 * LOAD TOKEN
 * POST /mobile/load-token
 */
router.post('/load-token', authenticate, async (req: any, res) => {
  try {
    const { meterId, token: tokenValue, amount } = req.body;

    if (!meterId) {
      return res.status(400).json({
        success: false,
        message: 'Meter ID is required'
      });
    }

    if (!tokenValue && !amount) {
      return res.status(400).json({
        success: false,
        message: 'Token value or amount is required'
      });
    }

    const customer = await Customer.findOne({ email: req.user.email });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    const meter = await Meter.findById(meterId);
    if (!meter || meter.customer?.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Send token load command to meter
    const axios = require('axios');
    try {
      const response = await axios.post('/remote/load', {
        meterNumber: meter.meterNumber,
        token: tokenValue,
        amount: amount,
      });

      res.json({
        success: true,
        message: 'Token loaded successfully',
        data: response.data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to load token',
        error: error.response?.data?.message || error.message,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to process token loading',
      error: error.message,
    });
  }
});

/**
 * CHECK BALANCE & GET NOTIFICATIONS
 * GET /mobile/balance/:meterId
 */
router.get('/balance/:meterId', authenticate, async (req: any, res) => {
  try {
    const customer = await Customer.findOne({ email: req.user.email });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    const meter = await Meter.findById(req.params.meterId);
    if (!meter || meter.customer?.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const currentBalance = meter.currentReading?.totalEnergy || 0;
    const isLowBalance = currentBalance < 100; // Below 100 kWh

    res.json({
      success: true,
      data: {
        balance: currentBalance,
        unit: 'kWh',
        isLowBalance,
        threshold: 100,
        meterNumber: meter.meterNumber,
        status: meter.status,
        relayStatus: meter.relayStatus,
        lastSeen: meter.lastSeen,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to check balance',
      error: error.message,
    });
  }
});

/**
 * GET CUSTOMER PROFILE
 * GET /mobile/profile
 */
router.get('/profile', authenticate, async (req: any, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const customer = await Customer.findOne({ email: req.user.email });

    res.json({
      success: true,
      data: {
        user,
        customer,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
});

/**
 * UPDATE CUSTOMER PROFILE
 * PUT /mobile/profile
 */
router.put('/profile', authenticate, async (req: any, res) => {
  try {
    const { firstName, lastName, phoneNumber, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        firstName,
        lastName,
        phoneNumber,
      },
      { new: true }
    ).select('-password');

    const customer = await Customer.findOneAndUpdate(
      { email: req.user.email },
      {
        firstName,
        lastName,
        phoneNumber,
        address,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user,
        customer,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
});

/**
 * GET NOTIFICATIONS
 * GET /mobile/notifications
 */
router.get('/notifications', authenticate, async (req: any, res) => {
  try {
    const { unreadOnly, limit, page = 1 } = req.query;
    const skip = (Number(page) - 1) * (Number(limit) || 50);

    const result = await NotificationService.getUserNotifications(req.user._id, {
      unreadOnly: unreadOnly === 'true',
      limit: Number(limit) || 50,
      skip,
    });

    res.json({
      success: true,
      data: result.notifications,
      pagination: {
        total: result.total,
        unreadCount: result.unreadCount,
        page: Number(page),
        pages: Math.ceil(result.total / (Number(limit) || 50)),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
});

/**
 * MARK NOTIFICATION AS READ
 * PATCH /mobile/notifications/:id/read
 */
router.patch('/notifications/:id/read', authenticate, async (req: any, res) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id, req.user._id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message,
    });
  }
});

/**
 * MARK ALL NOTIFICATIONS AS READ
 * PATCH /mobile/notifications/read-all
 */
router.patch('/notifications/read-all', authenticate, async (req: any, res) => {
  try {
    const count = await NotificationService.markAllAsRead(req.user._id);

    res.json({
      success: true,
      message: `${count} notifications marked as read`,
      data: { count },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message,
    });
  }
});

/**
 * DELETE NOTIFICATION
 * DELETE /mobile/notifications/:id
 */
router.delete('/notifications/:id', authenticate, async (req: any, res) => {
  try {
    const deleted = await NotificationService.delete(req.params.id, req.user._id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message,
    });
  }
});

export default router;
