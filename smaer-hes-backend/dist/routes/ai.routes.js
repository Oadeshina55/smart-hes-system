"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const aiMonitoring_service_1 = __importDefault(require("../services/aiMonitoring.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
/**
 * GET /api/ai/insights
 * Get AI-generated insights and recommendations
 */
router.get('/insights', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const insights = await aiMonitoring_service_1.default.generateInsights();
        res.json({
            success: true,
            data: insights,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting AI insights', { error });
        res.status(500).json({
            success: false,
            message: 'Failed to generate insights',
            error: error.message,
        });
    }
});
/**
 * GET /api/ai/anomalies
 * Get detected anomalies
 */
router.get('/anomalies', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const anomalies = await aiMonitoring_service_1.default.detectAnomalies();
        res.json({
            success: true,
            data: anomalies,
        });
    }
    catch (error) {
        logger_1.default.error('Error detecting anomalies', { error });
        res.status(500).json({
            success: false,
            message: 'Failed to detect anomalies',
            error: error.message,
        });
    }
});
/**
 * GET /api/ai/consumption-pattern/:meterId
 * Analyze consumption pattern for a specific meter
 */
router.get('/consumption-pattern/:meterId', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { meterId } = req.params;
        const pattern = await aiMonitoring_service_1.default.analyzeConsumptionPattern(meterId);
        if (!pattern) {
            return res.status(404).json({
                success: false,
                message: 'Meter not found or insufficient data',
            });
        }
        res.json({
            success: true,
            data: pattern,
        });
    }
    catch (error) {
        logger_1.default.error('Error analyzing consumption pattern', { error });
        res.status(500).json({
            success: false,
            message: 'Failed to analyze consumption pattern',
            error: error.message,
        });
    }
});
/**
 * GET /api/ai/alerts/prioritized
 * Get AI-prioritized alerts
 */
router.get('/alerts/prioritized', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const alerts = await aiMonitoring_service_1.default.prioritizeAlerts();
        res.json({
            success: true,
            data: alerts,
        });
    }
    catch (error) {
        logger_1.default.error('Error prioritizing alerts', { error });
        res.status(500).json({
            success: false,
            message: 'Failed to prioritize alerts',
            error: error.message,
        });
    }
});
/**
 * POST /api/ai/analyze
 * Run comprehensive AI analysis (admin only)
 */
router.post('/analyze', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), async (req, res) => {
    try {
        // Run all AI analysis tasks
        const [insights, anomalies, prioritizedAlerts] = await Promise.all([
            aiMonitoring_service_1.default.generateInsights(),
            aiMonitoring_service_1.default.detectAnomalies(),
            aiMonitoring_service_1.default.prioritizeAlerts(),
        ]);
        res.json({
            success: true,
            data: {
                insights,
                anomalies: anomalies.slice(0, 10), // Top 10 anomalies
                prioritizedAlerts: prioritizedAlerts.slice(0, 20), // Top 20 alerts
                timestamp: new Date(),
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error running AI analysis', { error });
        res.status(500).json({
            success: false,
            message: 'Failed to run AI analysis',
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=ai.routes.js.map