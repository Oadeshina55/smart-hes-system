import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Event } from '../models/Event.model';

const router = express.Router();

// List events with optional filters
router.get('/', authenticate, async (req, res) => {
	try {
		const { meterId, severity, category, limit = 50, page = 1 } = req.query;
		const filter: any = {};
		if (meterId) filter.meter = meterId;
		if (severity) filter.severity = severity;
		if (category) filter.category = category;

		const events = await Event.find(filter)
			.populate('meter', 'meterNumber')
			.sort('-timestamp')
			.limit(Number(limit))
			.skip((Number(page) - 1) * Number(limit));

		const total = await Event.countDocuments(filter);

		res.json({ success: true, data: events, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to fetch events', error: error.message });
	}
});

// Create event (meters or system can post events)
router.post('/', async (req, res) => {
	try {
		const event = await Event.create(req.body);
		res.status(201).json({ success: true, message: 'Event created', data: event });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to create event', error: error.message });
	}
});

// Get single event by ID
router.get('/:id', authenticate, async (req, res) => {
	try {
		const event = await Event.findById(req.params.id).populate('meter', 'meterNumber brand model');
		if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
		res.json({ success: true, data: event });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to fetch event', error: error.message });
	}
});

// Update event
router.put('/:id', authenticate, authorize('admin', 'operator'), async (req, res) => {
	try {
		const { description, severity, category, metadata } = req.body;
		const updateData: any = {};

		if (description !== undefined) updateData.description = description;
		if (severity !== undefined) updateData.severity = severity;
		if (category !== undefined) updateData.category = category;
		if (metadata !== undefined) updateData.metadata = metadata;

		const event = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
		if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
		res.json({ success: true, message: 'Event updated successfully', data: event });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to update event', error: error.message });
	}
});

// Delete event
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
	try {
		const event = await Event.findByIdAndDelete(req.params.id);
		if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
		res.json({ success: true, message: 'Event deleted successfully' });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to delete event', error: error.message });
	}
});

// Acknowledge event
router.post('/:id/acknowledge', authenticate, authorize('admin', 'operator'), async (req: any, res) => {
	try {
		const event = await Event.findByIdAndUpdate(req.params.id, { acknowledged: true, acknowledgedBy: req.user._id, acknowledgedAt: new Date() }, { new: true });
		if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
		res.json({ success: true, message: 'Event acknowledged', data: event });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to acknowledge event', error: error.message });
	}
});

// Resolve event
router.post('/:id/resolve', authenticate, authorize('admin', 'operator'), async (req: any, res) => {
	try {
		const { resolution } = req.body;

		if (!resolution) {
			return res.status(400).json({ success: false, message: 'Resolution notes are required' });
		}

		const event = await Event.findByIdAndUpdate(
			req.params.id,
			{
				acknowledged: true,
				acknowledgedBy: req.user._id,
				acknowledgedAt: new Date(),
				resolution
			},
			{ new: true }
		);

		if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
		res.json({ success: true, message: 'Event resolved successfully', data: event });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to resolve event', error: error.message });
	}
});

export default router;
