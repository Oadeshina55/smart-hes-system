"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const Event_model_1 = require("../models/Event.model");
const router = express_1.default.Router();
// List events with optional filters
router.get('/', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { meterId, severity, category, limit = 50, page = 1 } = req.query;
        const filter = {};
        if (meterId)
            filter.meter = meterId;
        if (severity)
            filter.severity = severity;
        if (category)
            filter.category = category;
        const events = await Event_model_1.Event.find(filter)
            .populate('meter', 'meterNumber')
            .sort('-timestamp')
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
        const total = await Event_model_1.Event.countDocuments(filter);
        res.json({ success: true, data: events, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch events', error: error.message });
    }
});
// Create event (meters or system can post events)
router.post('/', async (req, res) => {
    try {
        const event = await Event_model_1.Event.create(req.body);
        res.status(201).json({ success: true, message: 'Event created', data: event });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create event', error: error.message });
    }
});
// Get single event by ID
router.get('/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const event = await Event_model_1.Event.findById(req.params.id).populate('meter', 'meterNumber brand model');
        if (!event)
            return res.status(404).json({ success: false, message: 'Event not found' });
        res.json({ success: true, data: event });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch event', error: error.message });
    }
});
// Update event
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const { description, severity, category, metadata } = req.body;
        const updateData = {};
        if (description !== undefined)
            updateData.description = description;
        if (severity !== undefined)
            updateData.severity = severity;
        if (category !== undefined)
            updateData.category = category;
        if (metadata !== undefined)
            updateData.metadata = metadata;
        const event = await Event_model_1.Event.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        if (!event)
            return res.status(404).json({ success: false, message: 'Event not found' });
        res.json({ success: true, message: 'Event updated successfully', data: event });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update event', error: error.message });
    }
});
// Delete event
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), async (req, res) => {
    try {
        const event = await Event_model_1.Event.findByIdAndDelete(req.params.id);
        if (!event)
            return res.status(404).json({ success: false, message: 'Event not found' });
        res.json({ success: true, message: 'Event deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete event', error: error.message });
    }
});
// Acknowledge event
router.post('/:id/acknowledge', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const event = await Event_model_1.Event.findByIdAndUpdate(req.params.id, { acknowledged: true, acknowledgedBy: req.user._id, acknowledgedAt: new Date() }, { new: true });
        if (!event)
            return res.status(404).json({ success: false, message: 'Event not found' });
        res.json({ success: true, message: 'Event acknowledged', data: event });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to acknowledge event', error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=event.routes.js.map