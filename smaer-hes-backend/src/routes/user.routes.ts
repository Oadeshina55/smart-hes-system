import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { User } from '../models/User.model';

const router = express.Router();

// List users (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
	try {
		const { page = 1, limit = 50 } = req.query;
		const users = await User.find({}).select('-password').limit(Number(limit)).skip((Number(page) - 1) * Number(limit)).sort('-createdAt');
		const total = await User.countDocuments({});
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
		const user = await User.findById(req.params.id).select('-password');
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
		// Prevent non-admins from changing role, isActive, or permissions
		if (req.user.role !== 'admin') {
			delete req.body.role;
			delete req.body.isActive;
			delete req.body.permissions;
		}
		const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-password');
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
		// Prevent non-admins from changing role or isActive
		if (req.user.role !== 'admin') {
			delete req.body.role;
			delete req.body.isActive;
			delete req.body.permissions;
		}
		const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-password');
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

export default router;
