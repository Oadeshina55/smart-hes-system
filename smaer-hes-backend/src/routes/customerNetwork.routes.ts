import express from 'express';
import { CustomerNetwork } from '../models/CustomerNetwork.model';
import { Meter } from '../models/Meter.model';
import { EndCustomer } from '../models/EndCustomer.model';
import { User } from '../models/User.model';
import { authenticate, authorize, getNetworkFilter, hasAccessToNetwork } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @route   POST /api/customer-networks
 * @desc    Create a new customer network (utility company)
 * @access  Admin only
 */
router.post('/', authenticate, authorize('admin'), async (req: any, res) => {
  try {
    const {
      networkName,
      networkCode,
      description,
      contactInfo,
      billingInfo,
      serviceArea,
      settings
    } = req.body;

    // Check if network code already exists
    const existing = await CustomerNetwork.findOne({ networkCode: networkCode.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Network code already exists'
      });
    }

    const network = new CustomerNetwork({
      networkName,
      networkCode: networkCode.toUpperCase(),
      description,
      parentCompany: 'New Hampshire',
      contactInfo,
      billingInfo,
      serviceArea,
      settings,
      subscriptionStatus: 'active',
      isActive: true,
      createdBy: req.user._id
    });

    await network.save();

    res.status(201).json({
      success: true,
      message: 'Customer network created successfully',
      data: network
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create customer network',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/customer-networks
 * @desc    Get all customer networks
 * @access  Admin, Operator
 */
router.get('/', authenticate, authorize('admin', 'operator'), async (req: any, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const filter: any = { isActive: true };

    if (status && status !== 'all') {
      filter.subscriptionStatus = status;
    }

    if (search) {
      filter.$or = [
        { networkName: { $regex: search, $options: 'i' } },
        { networkCode: { $regex: search, $options: 'i' } }
      ];
    }

    const networks = await CustomerNetwork.find(filter)
      .populate('createdBy', 'username email')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await CustomerNetwork.countDocuments(filter);

    res.json({
      success: true,
      data: networks,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer networks',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/customer-networks/:id
 * @desc    Get single customer network
 * @access  Admin, Operator, Customer-Operator (own network only)
 */
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const network = await CustomerNetwork.findById(req.params.id)
      .populate('createdBy', 'username email');

    if (!network) {
      return res.status(404).json({
        success: false,
        message: 'Customer network not found'
      });
    }

    // Check access
    if (!hasAccessToNetwork(req.user, network._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this network'
      });
    }

    res.json({
      success: true,
      data: network
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer network',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/customer-networks/:id
 * @desc    Update customer network
 * @access  Admin only
 */
router.put('/:id', authenticate, authorize('admin'), async (req: any, res) => {
  try {
    const {
      networkName,
      description,
      contactInfo,
      billingInfo,
      serviceArea,
      settings,
      subscriptionStatus
    } = req.body;

    const network = await CustomerNetwork.findById(req.params.id);

    if (!network) {
      return res.status(404).json({
        success: false,
        message: 'Customer network not found'
      });
    }

    // Update fields
    if (networkName) network.networkName = networkName;
    if (description !== undefined) network.description = description;
    if (contactInfo) network.contactInfo = { ...network.contactInfo, ...contactInfo };
    if (billingInfo) network.billingInfo = { ...network.billingInfo, ...billingInfo };
    if (serviceArea) network.serviceArea = { ...network.serviceArea, ...serviceArea };
    if (settings) network.settings = { ...network.settings, ...settings };
    if (subscriptionStatus) network.subscriptionStatus = subscriptionStatus;

    await network.save();

    res.json({
      success: true,
      message: 'Customer network updated successfully',
      data: network
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update customer network',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/customer-networks/:id/stats
 * @desc    Get customer network statistics
 * @access  Admin, Operator, Customer-Operator (own network only)
 */
router.get('/:id/stats', authenticate, async (req: any, res) => {
  try {
    const network = await CustomerNetwork.findById(req.params.id);

    if (!network) {
      return res.status(404).json({
        success: false,
        message: 'Customer network not found'
      });
    }

    // Check access
    if (!hasAccessToNetwork(req.user, network._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this network'
      });
    }

    // Get real-time statistics
    const totalMeters = await Meter.countDocuments({
      customerNetwork: network._id,
      isActive: true
    });

    const onlineMeters = await Meter.countDocuments({
      customerNetwork: network._id,
      status: 'online'
    });

    const activeMeters = await Meter.countDocuments({
      customerNetwork: network._id,
      status: { $in: ['online', 'active'] }
    });

    const totalCustomers = await EndCustomer.countDocuments({
      customerNetwork: network._id,
      isActive: true
    });

    const customersWithMeters = await EndCustomer.countDocuments({
      customerNetwork: network._id,
      meter: { $exists: true, $ne: null }
    });

    const operators = await User.countDocuments({
      customerNetwork: network._id,
      role: 'customer-operator',
      isActive: true
    });

    res.json({
      success: true,
      data: {
        networkInfo: {
          networkName: network.networkName,
          networkCode: network.networkCode,
          subscriptionStatus: network.subscriptionStatus
        },
        meters: {
          total: totalMeters,
          online: onlineMeters,
          active: activeMeters,
          offline: totalMeters - onlineMeters,
          onlinePercentage: totalMeters > 0 ? ((onlineMeters / totalMeters) * 100).toFixed(2) : 0
        },
        customers: {
          total: totalCustomers,
          withMeters: customersWithMeters,
          withoutMeters: totalCustomers - customersWithMeters
        },
        operators: operators
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch network statistics',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/customer-networks/:id
 * @desc    Deactivate customer network (soft delete)
 * @access  Admin only
 */
router.delete('/:id', authenticate, authorize('admin'), async (req: any, res) => {
  try {
    const network = await CustomerNetwork.findById(req.params.id);

    if (!network) {
      return res.status(404).json({
        success: false,
        message: 'Customer network not found'
      });
    }

    network.isActive = false;
    network.subscriptionStatus = 'expired';
    await network.save();

    res.json({
      success: true,
      message: 'Customer network deactivated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate customer network',
      error: error.message
    });
  }
});

export default router;
