"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const Event_model_1 = require("../models/Event.model");
const Meter_model_1 = require("../models/Meter.model");
const server_1 = require("../server");
const router = express_1.default.Router();
// Remote load/token endpoint
router.post('/load', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const { meterId, meterNumber, token, amount } = req.body;
        const meter = meterId ? await Meter_model_1.Meter.findById(meterId) : await Meter_model_1.Meter.findOne({ meterNumber });
        if (!meter)
            return res.status(404).json({ success: false, message: 'Meter not found' });
        // Emit socket event to meter
        server_1.socketIO.to(meter._id.toString()).emit('remote-load', { token, amount, requestedBy: req.user._id });
        // Record event
        const event = await Event_model_1.Event.create({
            meter: meter._id,
            eventType: 'TOKEN_LOADED',
            eventCode: 'TOKEN_LOADED',
            severity: 'info',
            category: 'billing',
            description: `Token loaded remotely. Amount: ${amount}`,
            timestamp: new Date()
        });
        res.json({ success: true, message: 'Load command sent', data: { eventId: event._id } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send load command', error: error.message });
    }
});
// Remote control (relay connect/disconnect)
router.post('/control', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const { meterId, meterNumber, action } = req.body; // action: 'disconnect' | 'connect'
        const meter = meterId ? await Meter_model_1.Meter.findById(meterId) : await Meter_model_1.Meter.findOne({ meterNumber });
        if (!meter)
            return res.status(404).json({ success: false, message: 'Meter not found' });
        // Emit socket event to meter
        server_1.socketIO.to(meter._id.toString()).emit('remote-control', { action, requestedBy: req.user._id });
        // Record event
        const event = await Event_model_1.Event.create({
            meter: meter._id,
            eventType: action === 'disconnect' ? 'RELAY_DISCONNECTED' : 'RELAY_CONNECTED',
            eventCode: action === 'disconnect' ? 'RELAY_DISCONNECTED' : 'RELAY_CONNECTED',
            severity: 'info',
            category: 'technical',
            description: `Remote relay ${action} command issued`,
            timestamp: new Date()
        });
        res.json({ success: true, message: 'Control command sent', data: { eventId: event._id } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send control command', error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=remote.routes.js.map