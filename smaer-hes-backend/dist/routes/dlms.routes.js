"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const dlms_service_1 = require("../services/dlms.service");
const router = express_1.default.Router();
/**
 * @route   POST /api/dlms/read
 * @desc    Read single OBIS code from meter
 * @access  Operator, Admin
 */
router.post('/read', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const { meterId, meterNumber, obisCode, classId, attributeId } = req.body;
        if (!obisCode) {
            return res.status(400).json({
                success: false,
                message: 'OBIS code is required',
            });
        }
        if (!meterId && !meterNumber) {
            return res.status(400).json({
                success: false,
                message: 'Either meterId or meterNumber is required',
            });
        }
        const result = await dlms_service_1.dlmsService.readObis({
            meterId,
            meterNumber,
            obisCode,
            classId,
            attributeId,
        });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to read from meter',
            error: error.message,
        });
    }
});
/**
 * @route   POST /api/dlms/read-multiple
 * @desc    Read multiple OBIS codes from meter
 * @access  Operator, Admin
 */
router.post('/read-multiple', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const { meterId, meterNumber, obisCodes } = req.body;
        if (!obisCodes || !Array.isArray(obisCodes) || obisCodes.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'obisCodes array is required',
            });
        }
        if (!meterId && !meterNumber) {
            return res.status(400).json({
                success: false,
                message: 'Either meterId or meterNumber is required',
            });
        }
        const result = await dlms_service_1.dlmsService.readMultipleObis(meterId ? { meterId } : { meterNumber }, obisCodes);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to read from meter',
            error: error.message,
        });
    }
});
/**
 * @route   POST /api/dlms/write
 * @desc    Write value to OBIS code on meter
 * @access  Admin
 */
router.post('/write', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), async (req, res) => {
    try {
        const { meterId, meterNumber, obisCode, value, classId, attributeId } = req.body;
        if (!obisCode || value === undefined) {
            return res.status(400).json({
                success: false,
                message: 'OBIS code and value are required',
            });
        }
        if (!meterId && !meterNumber) {
            return res.status(400).json({
                success: false,
                message: 'Either meterId or meterNumber is required',
            });
        }
        const result = await dlms_service_1.dlmsService.writeObis({
            meterId,
            meterNumber,
            obisCode,
            value,
            classId,
            attributeId,
        });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to write to meter',
            error: error.message,
        });
    }
});
/**
 * @route   POST /api/dlms/load-profile
 * @desc    Read load profile (interval data) from meter
 * @access  Operator, Admin
 */
router.post('/load-profile', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const { meterId, meterNumber, startDate, endDate } = req.body;
        if (!meterId && !meterNumber) {
            return res.status(400).json({
                success: false,
                message: 'Either meterId or meterNumber is required',
            });
        }
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: last 7 days
        const end = endDate ? new Date(endDate) : new Date();
        const result = await dlms_service_1.dlmsService.readLoadProfile(meterId ? { meterId } : { meterNumber }, start, end);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to read load profile',
            error: error.message,
        });
    }
});
/**
 * @route   GET /api/dlms/common-data/:meterNumber
 * @desc    Get common meter data (energy, voltage, current, power)
 * @access  Operator, Admin
 */
router.get('/common-data/:meterNumber', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const { meterNumber } = req.params;
        const result = await dlms_service_1.dlmsService.getCommonMeterData({ meterNumber });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to read meter data',
            error: error.message,
        });
    }
});
/**
 * @route   GET /api/dlms/time/:meterNumber
 * @desc    Read meter clock/time
 * @access  Operator, Admin
 */
router.get('/time/:meterNumber', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const { meterNumber } = req.params;
        const result = await dlms_service_1.dlmsService.readMeterTime({ meterNumber });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to read meter time',
            error: error.message,
        });
    }
});
/**
 * @route   POST /api/dlms/time
 * @desc    Set meter clock/time
 * @access  Admin
 */
router.post('/time', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), async (req, res) => {
    try {
        const { meterId, meterNumber, dateTime } = req.body;
        if (!meterId && !meterNumber) {
            return res.status(400).json({
                success: false,
                message: 'Either meterId or meterNumber is required',
            });
        }
        const time = dateTime ? new Date(dateTime) : new Date();
        const result = await dlms_service_1.dlmsService.setMeterTime(meterId ? { meterId } : { meterNumber }, time);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to set meter time',
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=dlms.routes.js.map