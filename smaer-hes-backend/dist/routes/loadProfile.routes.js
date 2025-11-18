"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const loadProfile_service_1 = __importDefault(require("../services/loadProfile.service"));
const router = express_1.default.Router();
// Request load profile from meter
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const { meterId, startTime, endTime, profileType, captureInterval } = req.body;
        if (!meterId || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'meterId, startTime, and endTime are required'
            });
        }
        const loadProfile = await loadProfile_service_1.default.requestLoadProfile(meterId, new Date(startTime), new Date(endTime), profileType || 'hourly', captureInterval || 60);
        res.status(201).json({
            success: true,
            message: 'Load profile requested successfully',
            data: loadProfile
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to request load profile',
            error: error.message
        });
    }
});
// Get load profiles for a meter
router.get('/meter/:meterId', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { meterId } = req.params;
        const { startDate, endDate, profileType, status, limit, skip } = req.query;
        const options = {};
        if (startDate)
            options.startDate = new Date(startDate);
        if (endDate)
            options.endDate = new Date(endDate);
        if (profileType)
            options.profileType = profileType;
        if (status)
            options.status = status;
        if (limit)
            options.limit = parseInt(limit);
        if (skip)
            options.skip = parseInt(skip);
        const result = await loadProfile_service_1.default.getLoadProfiles(meterId, options);
        res.json({
            success: true,
            data: result.loadProfiles,
            total: result.total
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get load profiles',
            error: error.message
        });
    }
});
// Get specific load profile
router.get('/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const loadProfile = await loadProfile_service_1.default.getLoadProfile(req.params.id);
        if (!loadProfile) {
            return res.status(404).json({
                success: false,
                message: 'Load profile not found'
            });
        }
        res.json({
            success: true,
            data: loadProfile
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get load profile',
            error: error.message
        });
    }
});
// Get load profile statistics
router.get('/:id/statistics', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const stats = await loadProfile_service_1.default.getLoadProfileStatistics(req.params.id);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get load profile statistics',
            error: error.message
        });
    }
});
// Delete load profile
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        await loadProfile_service_1.default.deleteLoadProfile(req.params.id);
        res.json({
            success: true,
            message: 'Load profile deleted successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete load profile',
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=loadProfile.routes.js.map