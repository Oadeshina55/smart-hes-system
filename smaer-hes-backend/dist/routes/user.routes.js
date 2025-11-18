"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const User_model_1 = require("../models/User.model");
const router = express_1.default.Router();
// List users (admin only)
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const users = await User_model_1.User.find({}).select('-password').limit(Number(limit)).skip((Number(page) - 1) * Number(limit)).sort('-createdAt');
        const total = await User_model_1.User.countDocuments({});
        res.json({ success: true, data: users, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
    }
});
// Get user by id (admin or self)
router.get('/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const user = await User_model_1.User.findById(req.params.id).select('-password');
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get user', error: error.message });
    }
});
// Update user (admin or self)
router.put('/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        // Prevent non-admins from changing role or isActive
        if (req.user.role !== 'admin') {
            delete req.body.role;
            delete req.body.isActive;
        }
        const user = await User_model_1.User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, message: 'User updated', data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
    }
});
// Delete (soft) user (admin only)
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), async (req, res) => {
    try {
        const user = await User_model_1.User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, message: 'User deactivated' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to deactivate user', error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=user.routes.js.map