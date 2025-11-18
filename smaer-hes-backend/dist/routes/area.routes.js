"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const Area_model_1 = require("../models/Area.model");
const Meter_model_1 = require("../models/Meter.model");
const router = express_1.default.Router();
// Get all areas
router.get('/', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const areas = await Area_model_1.Area.find({ isActive: true })
            .populate('createdBy', 'firstName lastName')
            .sort('name');
        res.json({
            success: true,
            data: areas,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch areas',
            error: error.message,
        });
    }
});
// Create new area
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const { name, code, description, parentArea, coordinates } = req.body;
        // Check if area code already exists
        const existingArea = await Area_model_1.Area.findOne({ code });
        if (existingArea) {
            return res.status(400).json({
                success: false,
                message: 'Area code already exists',
            });
        }
        const area = await Area_model_1.Area.create({
            name,
            code,
            description,
            parentArea,
            coordinates,
            createdBy: req.user._id,
        });
        res.status(201).json({
            success: true,
            message: 'Area created successfully',
            data: area,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create area',
            error: error.message,
        });
    }
});
// Update area
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const area = await Area_model_1.Area.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!area) {
            return res.status(404).json({
                success: false,
                message: 'Area not found',
            });
        }
        res.json({
            success: true,
            message: 'Area updated successfully',
            data: area,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update area',
            error: error.message,
        });
    }
});
// Delete area
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), async (req, res) => {
    try {
        // Check if area has meters
        const meterCount = await Meter_model_1.Meter.countDocuments({ area: req.params.id });
        if (meterCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete area with ${meterCount} meters. Please reassign meters first.`,
            });
        }
        const area = await Area_model_1.Area.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!area) {
            return res.status(404).json({
                success: false,
                message: 'Area not found',
            });
        }
        res.json({
            success: true,
            message: 'Area deleted successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete area',
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=area.routes.js.map