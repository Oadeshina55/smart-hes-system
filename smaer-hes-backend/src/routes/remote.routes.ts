import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Event } from '../models/Event.model';
import { Meter } from '../models/Meter.model';
import { socketIO } from '../server';

const router = express.Router();

// Remote load/token endpoint
router.post('/load', authenticate, authorize('admin', 'operator'), async (req: any, res) => {
	try {
		const { meterId, meterNumber, token, amount } = req.body;
		const meter = meterId ? await Meter.findById(meterId) : await Meter.findOne({ meterNumber });
		if (!meter) return res.status(404).json({ success: false, message: 'Meter not found' });

		// Emit socket event to meter
		socketIO.to(meter._id.toString()).emit('remote-load', { token, amount, requestedBy: req.user._id });

		// Record event
		const event = await Event.create({
			meter: meter._id,
			eventType: 'TOKEN_LOADED',
			eventCode: 'TOKEN_LOADED',
			severity: 'info',
			category: 'billing',
			description: `Token loaded remotely. Amount: ${amount}`,
			timestamp: new Date()
		});

		res.json({ success: true, message: 'Load command sent', data: { eventId: event._id } });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to send load command', error: error.message });
	}
});

// Remote control (relay connect/disconnect)
router.post('/control', authenticate, authorize('admin', 'operator'), async (req: any, res) => {
	try {
		const { meterId, meterNumber, action } = req.body; // action: 'disconnect' | 'connect'
		const meter = meterId ? await Meter.findById(meterId) : await Meter.findOne({ meterNumber });
		if (!meter) return res.status(404).json({ success: false, message: 'Meter not found' });

		// Emit socket event to meter
		socketIO.to(meter._id.toString()).emit('remote-control', { action, requestedBy: req.user._id });

		// Record event
		const event = await Event.create({
			meter: meter._id,
			eventType: action === 'disconnect' ? 'RELAY_DISCONNECTED' : 'RELAY_CONNECTED',
			eventCode: action === 'disconnect' ? 'RELAY_DISCONNECTED' : 'RELAY_CONNECTED',
			severity: 'info',
			category: 'technical',
			description: `Remote relay ${action} command issued`,
			timestamp: new Date()
		});

		res.json({ success: true, message: 'Control command sent', data: { eventId: event._id } });
	} catch (error: any) {
		res.status(500).json({ success: false, message: 'Failed to send control command', error: error.message });
	}
});

export default router;
