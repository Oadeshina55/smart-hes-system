"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const Alert_model_1 = require("../models/Alert.model");
const alert_service_1 = require("../services/alert.service");
const router = express_1.default.Router();
// List alerts with filters
router.get('/', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { status, category, page = 1, limit = 50 } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (category)
            filter.category = category;
        const alerts = await Alert_model_1.Alert.find(filter)
            .populate('meter', 'meterNumber')
            .sort('-triggeredAt')
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
        const total = await Alert_model_1.Alert.countDocuments(filter);
        res.json({ success: true, data: alerts, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch alerts', error: error.message });
    }
});
// Create alert
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const alert = await alert_service_1.AlertService.createAlert({ ...req.body });
        res.status(201).json({ success: true, message: 'Alert created', data: alert });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create alert', error: error.message });
    }
});
// Get single alert by ID
router.get('/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const alert = await Alert_model_1.Alert.findById(req.params.id).populate('meter', 'meterNumber brand model area');
        if (!alert)
            return res.status(404).json({ success: false, message: 'Alert not found' });
        res.json({ success: true, data: alert });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch alert', error: error.message });
    }
});
// Update alert
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const { priority, category, description, status, metadata } = req.body;
        const updateData = {};
        if (priority !== undefined)
            updateData.priority = priority;
        if (category !== undefined)
            updateData.category = category;
        if (description !== undefined)
            updateData.description = description;
        if (status !== undefined)
            updateData.status = status;
        if (metadata !== undefined)
            updateData.metadata = metadata;
        const alert = await Alert_model_1.Alert.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        if (!alert)
            return res.status(404).json({ success: false, message: 'Alert not found' });
        res.json({ success: true, message: 'Alert updated successfully', data: alert });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update alert', error: error.message });
    }
});
// Delete alert
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), async (req, res) => {
    try {
        const alert = await Alert_model_1.Alert.findByIdAndDelete(req.params.id);
        if (!alert)
            return res.status(404).json({ success: false, message: 'Alert not found' });
        res.json({ success: true, message: 'Alert deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete alert', error: error.message });
    }
});
// Acknowledge alert
router.post('/:id/acknowledge', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const alert = await alert_service_1.AlertService.acknowledgeAlert(req.params.id, req.user._id.toString());
        if (!alert)
            return res.status(404).json({ success: false, message: 'Alert not found' });
        res.json({ success: true, message: 'Alert acknowledged', data: alert });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to acknowledge alert', error: error.message });
    }
});
// Resolve alert
router.post('/:id/resolve', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const { resolutionNotes } = req.body;
        const alert = await alert_service_1.AlertService.resolveAlert(req.params.id, req.user._id.toString(), resolutionNotes || '');
        if (!alert)
            return res.status(404).json({ success: false, message: 'Alert not found' });
        res.json({ success: true, message: 'Alert resolved', data: alert });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to resolve alert', error: error.message });
    }
});
// Get active alerts count (utility)
router.get('/active-count', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const counts = await alert_service_1.AlertService.getActiveAlertsCount();
        res.json({ success: true, data: counts });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get active alerts count', error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=alert.routes.js.map