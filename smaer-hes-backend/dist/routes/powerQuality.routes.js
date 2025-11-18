"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const powerQuality_service_1 = __importDefault(require("../services/powerQuality.service"));
const router = express_1.default.Router();
// Record power quality measurement
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const { meterId, ...data } = req.body;
        if (!meterId) {
            return res.status(400).json({
                success: false,
                message: 'meterId is required'
            });
        }
        const measurement = await powerQuality_service_1.default.recordMeasurement(meterId, data);
        res.status(201).json({
            success: true,
            message: 'Power quality measurement recorded',
            data: measurement
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to record measurement',
            error: error.message
        });
    }
});
// Get power quality measurements for a meter
router.get('/meter/:meterId', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { meterId } = req.params;
        const { startDate, endDate, minQualityScore, eventType, limit, skip } = req.query;
        const options = {};
        if (startDate)
            options.startDate = new Date(startDate);
        if (endDate)
            options.endDate = new Date(endDate);
        if (minQualityScore)
            options.minQualityScore = parseFloat(minQualityScore);
        if (eventType)
            options.eventType = eventType;
        if (limit)
            options.limit = parseInt(limit);
        if (skip)
            options.skip = parseInt(skip);
        const result = await powerQuality_service_1.default.getMeasurements(meterId, options);
        res.json({
            success: true,
            data: result.measurements,
            total: result.total
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get measurements',
            error: error.message
        });
    }
});
// Get power quality statistics
router.get('/meter/:meterId/statistics', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { meterId } = req.params;
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required'
            });
        }
        const stats = await powerQuality_service_1.default.getStatistics(meterId, new Date(startDate), new Date(endDate));
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
            error: error.message
        });
    }
});
// Get real-time power quality
router.get('/meter/:meterId/realtime', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const measurement = await powerQuality_service_1.default.getRealTimePowerQuality(req.params.meterId);
        res.json({
            success: true,
            data: measurement
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get real-time power quality',
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=powerQuality.routes.js.map