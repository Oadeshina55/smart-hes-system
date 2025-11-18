"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const obisFunction_service_1 = __importDefault(require("../services/obisFunction.service"));
const router = (0, express_1.Router)();
/**
 * GET /api/obis/functions
 * Get all OBIS functions (optionally filtered by brand)
 * Query params: brand=hexing|hexcell (optional)
 */
router.get('/functions', (req, res) => {
    try {
        const { brand } = req.query;
        const functions = obisFunction_service_1.default.getAllFunctions(brand);
        res.json({
            success: true,
            data: {
                total: functions.length,
                brand: brand || 'unified',
                functions,
            },
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});
/**
 * GET /api/obis/functions/:code
 * Get a specific OBIS function by code
 */
router.get('/functions/:code', (req, res) => {
    try {
        const { code } = req.params;
        const func = obisFunction_service_1.default.getFunction(code);
        if (!func) {
            return res.status(404).json({
                success: false,
                error: `OBIS code ${code} not found`,
            });
        }
        res.json({
            success: true,
            data: func,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});
/**
 * GET /api/obis/groups
 * Get all unique group names
 * Query params: brand=hexing|hexcell (optional)
 */
router.get('/groups', (req, res) => {
    try {
        const { brand } = req.query;
        const groups = obisFunction_service_1.default.getGroups(brand);
        res.json({
            success: true,
            data: {
                brand: brand || 'unified',
                total: groups.length,
                groups,
            },
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});
/**
 * GET /api/obis/groups/:name
 * Get all functions in a specific group
 * Query params: brand=hexing|hexcell (optional)
 */
router.get('/groups/:name', (req, res) => {
    try {
        const { name } = req.params;
        const { brand } = req.query;
        const functions = obisFunction_service_1.default.getFunctionsByGroup(name, brand);
        res.json({
            success: true,
            data: {
                group: name,
                brand: brand || 'unified',
                total: functions.length,
                functions,
            },
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});
/**
 * POST /api/obis/format-reading
 * Format raw meter reading as DLMS response with units
 * Body: { meterId: string, meterType: 'hexing'|'hexcell', readings: Record<string, any> }
 */
router.post('/format-reading', (req, res) => {
    try {
        const { meterId, meterType, readings } = req.body;
        if (!meterId || !meterType || !readings) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: meterId, meterType, readings',
            });
        }
        const dlmsResponse = obisFunction_service_1.default.formatReadingsAsDlms(meterId, meterType, readings);
        res.json({
            success: true,
            data: dlmsResponse,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});
/**
 * GET /api/obis/unit/:code
 * Get the unit for a specific OBIS code
 */
router.get('/unit/:code', (req, res) => {
    try {
        const { code } = req.params;
        const unit = obisFunction_service_1.default.getUnit(code);
        res.json({
            success: true,
            data: {
                code,
                unit: unit || null,
            },
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});
/**
 * GET /api/obis/statistics
 * Get statistics about loaded OBIS functions
 */
router.get('/statistics', (req, res) => {
    try {
        const stats = obisFunction_service_1.default.getStatistics();
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=obis.routes.js.map