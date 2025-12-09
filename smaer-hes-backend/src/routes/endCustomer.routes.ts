import express from 'express';
import { authenticate, authorize, getNetworkFilter, hasAccessToNetwork } from '../middleware/auth.middleware';
import { EndCustomer } from '../models/EndCustomer.model';
import { CustomerNetwork } from '../models/CustomerNetwork.model';
import { Meter } from '../models/Meter.model';

const router = express.Router();

/**
 * POST /end-customers
 * Create a new end customer
 * Admin, operator, customer-operator
 */
router.post('/', authenticate, authorize('admin', 'operator', 'customer-operator'), async (req: any, res) => {
  try {
    const { customerName, accountNumber, customerNetwork, meter, contactInfo, prepaymentData } = req.body;

    // Validation
    if (!customerName) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required',
      });
    }

    if (!customerNetwork) {
      return res.status(400).json({
        success: false,
        message: 'Customer network is required',
      });
    }

    // Multi-tenant: Customer-operators can only create end customers in their own network
    if (req.user.role === 'customer-operator') {
      if (!hasAccessToNetwork(req.user, customerNetwork)) {
        return res.status(403).json({
          success: false,
          message: 'You can only add end customers to your own network',
        });
      }
    }

    // Verify customer network exists
    const network = await CustomerNetwork.findById(customerNetwork);
    if (!network) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer network',
      });
    }

    // Check if account number already exists in this network
    if (accountNumber) {
      const existingCustomer = await EndCustomer.findOne({
        accountNumber,
        customerNetwork,
      });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Account number already exists in this network',
        });
      }
    }

    // If meter is provided, verify it belongs to the same network
    if (meter) {
      const meterDoc = await Meter.findById(meter);
      if (!meterDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid meter ID',
        });
      }
      if (meterDoc.customerNetwork.toString() !== customerNetwork) {
        return res.status(400).json({
          success: false,
          message: 'Meter must belong to the same customer network',
        });
      }
    }

    // Create end customer
    const endCustomer = await EndCustomer.create({
      customerName,
      accountNumber,
      customerNetwork,
      meter,
      contactInfo,
      prepaymentData,
      isActive: true,
    });

    // Update meter with endCustomer reference if meter was provided
    if (meter) {
      await Meter.findByIdAndUpdate(meter, { endCustomer: endCustomer._id });
    }

    // Update network statistics
    await CustomerNetwork.findByIdAndUpdate(customerNetwork, {
      $inc: { endCustomerCount: 1 },
    });

    res.status(201).json({
      success: true,
      message: 'End customer created successfully',
      data: endCustomer,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create end customer',
      error: error.message,
    });
  }
});

/**
 * GET /end-customers
 * Get all end customers with filtering
 */
router.get('/', authenticate, async (req: any, res) => {
  try {
    const { customerNetworkId, search, page = 1, limit = 50 } = req.query;

    const filter: any = { isActive: true };

    // Multi-tenant: Apply network-based filtering
    const networkFilter = getNetworkFilter(req.user);
    if (networkFilter) {
      Object.assign(filter, networkFilter);
    }

    // Filter by customer network
    if (customerNetworkId && customerNetworkId !== 'all') {
      filter.customerNetwork = customerNetworkId;
    }

    // Search by customer name or account number
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { accountNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [endCustomers, total] = await Promise.all([
      EndCustomer.find(filter)
        .populate('customerNetwork', 'networkName networkCode')
        .populate('meter', 'meterNumber serialNumber status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      EndCustomer.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: endCustomers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch end customers',
      error: error.message,
    });
  }
});

/**
 * GET /end-customers/:id
 * Get end customer by ID
 */
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const endCustomer = await EndCustomer.findById(req.params.id)
      .populate('customerNetwork', 'networkName networkCode')
      .populate('meter', 'meterNumber serialNumber status');

    if (!endCustomer) {
      return res.status(404).json({
        success: false,
        message: 'End customer not found',
      });
    }

    // Multi-tenant: Check access
    const networkFilter = getNetworkFilter(req.user);
    if (networkFilter && req.user.role !== 'admin') {
      if (endCustomer.customerNetwork._id.toString() !== req.user.customerNetwork?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this end customer',
        });
      }
    }

    res.json({
      success: true,
      data: endCustomer,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch end customer',
      error: error.message,
    });
  }
});

/**
 * PUT /end-customers/:id
 * Update end customer
 */
router.put('/:id', authenticate, authorize('admin', 'operator', 'customer-operator'), async (req: any, res) => {
  try {
    const endCustomer = await EndCustomer.findById(req.params.id);

    if (!endCustomer) {
      return res.status(404).json({
        success: false,
        message: 'End customer not found',
      });
    }

    // Multi-tenant: Customer-operators can only update end customers in their own network
    if (req.user.role === 'customer-operator') {
      if (!hasAccessToNetwork(req.user, endCustomer.customerNetwork.toString())) {
        return res.status(403).json({
          success: false,
          message: 'You can only update end customers in your own network',
        });
      }
    }

    const { customerName, accountNumber, meter, contactInfo, prepaymentData } = req.body;

    // If meter is being updated, verify it belongs to the same network
    if (meter && meter !== endCustomer.meter?.toString()) {
      const meterDoc = await Meter.findById(meter);
      if (!meterDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid meter ID',
        });
      }
      if (meterDoc.customerNetwork.toString() !== endCustomer.customerNetwork.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Meter must belong to the same customer network',
        });
      }

      // Update meter references
      if (endCustomer.meter) {
        await Meter.findByIdAndUpdate(endCustomer.meter, { endCustomer: null });
      }
      await Meter.findByIdAndUpdate(meter, { endCustomer: endCustomer._id });
    }

    // Update end customer
    const updated = await EndCustomer.findByIdAndUpdate(
      req.params.id,
      {
        customerName,
        accountNumber,
        meter,
        contactInfo,
        prepaymentData,
      },
      { new: true, runValidators: true }
    )
      .populate('customerNetwork', 'networkName networkCode')
      .populate('meter', 'meterNumber serialNumber status');

    res.json({
      success: true,
      message: 'End customer updated successfully',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update end customer',
      error: error.message,
    });
  }
});

/**
 * DELETE /end-customers/:id
 * Delete (deactivate) end customer
 */
router.delete('/:id', authenticate, authorize('admin', 'operator', 'customer-operator'), async (req: any, res) => {
  try {
    const endCustomer = await EndCustomer.findById(req.params.id);

    if (!endCustomer) {
      return res.status(404).json({
        success: false,
        message: 'End customer not found',
      });
    }

    // Multi-tenant: Customer-operators can only delete end customers in their own network
    if (req.user.role === 'customer-operator') {
      if (!hasAccessToNetwork(req.user, endCustomer.customerNetwork.toString())) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete end customers in your own network',
        });
      }
    }

    // Deactivate instead of hard delete
    await EndCustomer.findByIdAndUpdate(req.params.id, { isActive: false });

    // Remove meter association
    if (endCustomer.meter) {
      await Meter.findByIdAndUpdate(endCustomer.meter, { endCustomer: null });
    }

    // Update network statistics
    await CustomerNetwork.findByIdAndUpdate(endCustomer.customerNetwork, {
      $inc: { endCustomerCount: -1 },
    });

    res.json({
      success: true,
      message: 'End customer deactivated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete end customer',
      error: error.message,
    });
  }
});

/**
 * GET /end-customers/network/:networkId/count
 * Get end customer count for a network
 */
router.get('/network/:networkId/count', authenticate, async (req: any, res) => {
  try {
    const { networkId } = req.params;

    // Multi-tenant: Check access
    if (req.user.role === 'customer-operator') {
      if (!hasAccessToNetwork(req.user, networkId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this network',
        });
      }
    }

    const count = await EndCustomer.countDocuments({
      customerNetwork: networkId,
      isActive: true,
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get end customer count',
      error: error.message,
    });
  }
});

export default router;
