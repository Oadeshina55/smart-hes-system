import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { User } from '../models/User.model';
import { CustomerNetwork } from '../models/CustomerNetwork.model';

const router = express.Router();

// List users (admin only)
router.get('/', authenticate, authorize('admin'), async (req: any, res) => {
	try {
		const { page = 1, limit = 50, customerNetworkId, role } = req.query;
		const filter: any = {};

		// Multi-tenant: Filter by customer network if provided
		if (customerNetworkId) {
			filter.customerNetwork = customerNetworkId;
		}

		// Filter by role if provided
		if (role) {
			filter.role = role;
		}

		const users = await User.find(filter)
			.select('-password')
			.populate('customerNetwork', 'networkName networkCode')
			.populate('assignedAreas', 'name code')
			.limit(Number(limit))
			.skip((Number(page) - 1) * Number(limit))
			.sort('-createdAt');

		const total = await User.countDocuments(filter);
		res.json({ success: true, data: users, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
	}
});

// Get user by id (admin or self)
router.get('/:id', authenticate, async (req: any, res) => {
	try {
		if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
			return res.status(403).json({ success: false, message: 'Forbidden' });
		}
		const user = await User.findById(req.params.id)
			.select('-password')
			.populate('customerNetwork', 'networkName networkCode contactInfo')
			.populate('assignedAreas', 'name code');
		if (!user) return res.status(404).json({ success: false, message: 'User not found' });
		res.json({ success: true, data: user });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to get user', error: error.message });
	}
});

// Update user (admin or self)
router.put('/:id', authenticate, async (req: any, res) => {
	try {
		if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
			return res.status(403).json({ success: false, message: 'Forbidden' });
		}
		// Prevent non-admins from changing role, isActive, permissions, assignedAreas, or customerNetwork
		if (req.user.role !== 'admin') {
			delete req.body.role;
			delete req.body.isActive;
			delete req.body.permissions;
			delete req.body.assignedAreas;
			delete req.body.customerNetwork;
		}
		const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
			.select('-password')
			.populate('customerNetwork', 'networkName networkCode')
			.populate('assignedAreas', 'name code');
		if (!user) return res.status(404).json({ success: false, message: 'User not found' });
		res.json({ success: true, message: 'User updated', data: user });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
	}
});

// Patch user (partial update) - admin or self
router.patch('/:id', authenticate, async (req: any, res) => {
	try {
		if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
			return res.status(403).json({ success: false, message: 'Forbidden' });
		}
		// Prevent non-admins from changing role, isActive, permissions, or customerNetwork
		if (req.user.role !== 'admin') {
			delete req.body.role;
			delete req.body.isActive;
			delete req.body.permissions;
			delete req.body.customerNetwork;
		}
		const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
			.select('-password')
			.populate('customerNetwork', 'networkName networkCode')
			.populate('assignedAreas', 'name code');
		if (!user) return res.status(404).json({ success: false, message: 'User not found' });
		res.json({ success: true, message: 'User updated successfully', data: user });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
	}
});

// Delete (soft) user (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
	try {
		const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
		if (!user) return res.status(404).json({ success: false, message: 'User not found' });
		res.json({ success: true, message: 'User deactivated' });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to deactivate user', error: error.message });
	}
});

// Multi-tenant: Create customer-operator user (admin only)
router.post('/create-customer-operator', authenticate, authorize('admin'), async (req: any, res) => {
	try {
		const { username, email, password, firstName, lastName, phoneNumber, customerNetwork } = req.body;

		// Validate required fields
		if (!username || !email || !password || !customerNetwork) {
			return res.status(400).json({
				success: false,
				message: 'Missing required fields',
				error: 'username, email, password, and customerNetwork are required'
			});
		}

		// Validate customer network exists
		const network = await CustomerNetwork.findById(customerNetwork);
		if (!network) {
			return res.status(400).json({
				success: false,
				message: 'Invalid customer network',
				error: 'The specified customer network does not exist'
			});
		}

		// Check if username or email already exists
		const existingUser = await User.findOne({
			$or: [{ username }, { email }]
		});

		if (existingUser) {
			return res.status(409).json({
				success: false,
				message: 'User already exists',
				error: 'Username or email already exists in the system'
			});
		}

		// Create customer-operator user
		const user = await User.create({
			username,
			email,
			password,
			firstName,
			lastName,
			phoneNumber,
			role: 'customer-operator',
			customerNetwork,
			isActive: true
		});

		// Return user without password
		const userResponse = await User.findById(user._id)
			.select('-password')
			.populate('customerNetwork', 'networkName networkCode');

		res.status(201).json({
			success: true,
			message: 'Customer-operator created successfully',
			data: userResponse
		});
	} catch (error: any) {
		res.status(500).json({
			success: false,
			message: 'Failed to create customer-operator',
			error: error.message
		});
	}
});

export default router;
