import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { SimCard } from '../models/SimCard.model';

const router = express.Router();

// List sims
router.get('/', authenticate, async (req, res) => {
	try {
		const { status, page = 1, limit = 50 } = req.query;
		const filter: any = { isActive: true };
		if (status && status !== 'all') filter.status = status;

		const sims = await SimCard.find(filter)
			.limit(Number(limit))
			.skip((Number(page) - 1) * Number(limit))
			.sort('-createdAt');

		const total = await SimCard.countDocuments(filter);

		res.json({ success: true, data: sims, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to fetch SIM cards', error: error.message });
	}
});

// Create SIM
router.post('/', authenticate, authorize('admin', 'operator'), async (req: any, res) => {
	try {
		const sim = await SimCard.create({ ...req.body });
		res.status(201).json({ success: true, message: 'SIM card created', data: sim });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to create SIM', error: error.message });
	}
});

// Update SIM
router.put('/:id', authenticate, authorize('admin', 'operator'), async (req, res) => {
	try {
		const sim = await SimCard.findByIdAndUpdate(req.params.id, req.body, { new: true });
		if (!sim) return res.status(404).json({ success: false, message: 'SIM not found' });
		res.json({ success: true, message: 'SIM updated', data: sim });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to update SIM', error: error.message });
	}
});

// Delete (soft) SIM
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
	try {
		const sim = await SimCard.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
		if (!sim) return res.status(404).json({ success: false, message: 'SIM not found' });
		res.json({ success: true, message: 'SIM deleted' });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to delete SIM', error: error.message });
	}
});

export default router;
