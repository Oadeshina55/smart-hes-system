"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const SimCard_model_1 = require("../models/SimCard.model");
const router = express_1.default.Router();
// List sims
router.get('/', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;
        const filter = { isActive: true };
        if (status && status !== 'all')
            filter.status = status;
        const sims = await SimCard_model_1.SimCard.find(filter)
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .sort('-createdAt');
        const total = await SimCard_model_1.SimCard.countDocuments(filter);
        res.json({ success: true, data: sims, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch SIM cards', error: error.message });
    }
});
// Create SIM
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const sim = await SimCard_model_1.SimCard.create({ ...req.body });
        res.status(201).json({ success: true, message: 'SIM card created', data: sim });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create SIM', error: error.message });
    }
});
// Update SIM
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const sim = await SimCard_model_1.SimCard.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!sim)
            return res.status(404).json({ success: false, message: 'SIM not found' });
        res.json({ success: true, message: 'SIM updated', data: sim });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update SIM', error: error.message });
    }
});
// Delete (soft) SIM
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), async (req, res) => {
    try {
        const sim = await SimCard_model_1.SimCard.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!sim)
            return res.status(404).json({ success: false, message: 'SIM not found' });
        res.json({ success: true, message: 'SIM deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete SIM', error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=sim.routes.js.map