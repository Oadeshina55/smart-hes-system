"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const Meter_model_1 = require("../models/Meter.model");
const Alert_model_1 = require("../models/Alert.model");
const Event_model_1 = require("../models/Event.model");
const Consumption_model_1 = require("../models/Consumption.model");
const Customer_model_1 = require("../models/Customer.model");
const Area_model_1 = require("../models/Area.model");
const alert_service_1 = require("../services/alert.service");
const moment_1 = __importDefault(require("moment"));
const router = express_1.default.Router();
// Get dashboard statistics
router.get('/stats', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { areaId } = req.query;
        const filter = { isActive: true };
        if (areaId) {
            filter.area = areaId;
        }
        // Get meter statistics
        const [totalMeters, onlineMeters, offlineMeters, activeMeters, warehouseMeters] = await Promise.all([
            Meter_model_1.Meter.countDocuments(filter),
            Meter_model_1.Meter.countDocuments({ ...filter, status: 'online' }),
            Meter_model_1.Meter.countDocuments({ ...filter, status: 'offline' }),
            Meter_model_1.Meter.countDocuments({ ...filter, status: 'active' }),
            Meter_model_1.Meter.countDocuments({ ...filter, status: 'warehouse' })
        ]);
        // Get alert statistics
        const activeAlerts = await alert_service_1.AlertService.getActiveAlertsCount();
        // Get customer and area counts
        const [totalCustomers, totalAreas] = await Promise.all([
            Customer_model_1.Customer.countDocuments({ isActive: true }),
            Area_model_1.Area.countDocuments({ isActive: true })
        ]);
        // Get recent events count (last 24 hours)
        const last24Hours = (0, moment_1.default)().subtract(24, 'hours').toDate();
        const recentEventsCount = await Event_model_1.Event.countDocuments({
            timestamp: { $gte: last24Hours }
        });
        res.json({
            success: true,
            data: {
                meters: {
                    total: totalMeters,
                    online: onlineMeters,
                    offline: offlineMeters,
                    active: activeMeters,
                    warehouse: warehouseMeters,
                    onlinePercentage: totalMeters > 0 ? ((onlineMeters / totalMeters) * 100).toFixed(2) : 0
                },
                alerts: activeAlerts,
                customers: {
                    total: totalCustomers
                },
                areas: {
                    total: totalAreas
                },
                events: {
                    recent: recentEventsCount
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboard statistics',
            error: error.message
        });
    }
});
// Get energy consumption chart data (last 24 hours)
router.get('/consumption-chart', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { areaId, interval = 'hourly' } = req.query;
        const now = (0, moment_1.default)();
        let startDate;
        let groupInterval;
        switch (interval) {
            case 'daily':
                startDate = (0, moment_1.default)().subtract(30, 'days').toDate();
                groupInterval = 'daily';
                break;
            case 'weekly':
                startDate = (0, moment_1.default)().subtract(12, 'weeks').toDate();
                groupInterval = 'weekly';
                break;
            case 'monthly':
                startDate = (0, moment_1.default)().subtract(12, 'months').toDate();
                groupInterval = 'monthly';
                break;
            default: // hourly
                startDate = (0, moment_1.default)().subtract(24, 'hours').toDate();
                groupInterval = 'hourly';
        }
        const match = {
            timestamp: { $gte: startDate },
            interval: groupInterval
        };
        if (areaId) {
            match.area = areaId;
        }
        const consumptionData = await Consumption_model_1.Consumption.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: interval === 'hourly' ? '%Y-%m-%d %H:00' :
                                interval === 'daily' ? '%Y-%m-%d' :
                                    interval === 'weekly' ? '%Y-%U' : '%Y-%m',
                            date: '$timestamp'
                        }
                    },
                    totalEnergy: { $sum: '$energy.activeEnergy' },
                    avgPower: { $avg: '$power.activePower' },
                    maxDemand: { $max: '$power.maxDemand' }
                }
            },
            { $sort: { '_id': 1 } },
            { $limit: 50 }
        ]);
        res.json({
            success: true,
            data: {
                labels: consumptionData.map(d => d._id),
                datasets: [
                    {
                        label: 'Total Energy (kWh)',
                        data: consumptionData.map(d => d.totalEnergy),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)'
                    },
                    {
                        label: 'Average Power (kW)',
                        data: consumptionData.map(d => d.avgPower),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)'
                    }
                ]
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get consumption chart data',
            error: error.message
        });
    }
});
// Get recent events
router.get('/recent-events', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { limit = 10, severity, category } = req.query;
        const filter = {};
        if (severity) {
            filter.severity = severity;
        }
        if (category) {
            filter.category = category;
        }
        const events = await Event_model_1.Event.find(filter)
            .populate('meter', 'meterNumber')
            .sort('-timestamp')
            .limit(Number(limit));
        res.json({
            success: true,
            data: events
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get recent events',
            error: error.message
        });
    }
});
// Get revenue loss summary
router.get('/revenue-loss', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'operator'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : (0, moment_1.default)().subtract(30, 'days').toDate();
        const end = endDate ? new Date(endDate) : new Date();
        const summary = await alert_service_1.AlertService.getRevenueLossSummary(start, end);
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get revenue loss summary',
            error: error.message
        });
    }
});
// Get area-wise statistics
router.get('/area-stats', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const areaStats = await Area_model_1.Area.aggregate([
            { $match: { isActive: true } },
            {
                $lookup: {
                    from: 'meters',
                    localField: '_id',
                    foreignField: 'area',
                    as: 'meters'
                }
            },
            {
                $project: {
                    name: 1,
                    code: 1,
                    meterCount: { $size: '$meters' },
                    onlineCount: {
                        $size: {
                            $filter: {
                                input: '$meters',
                                as: 'meter',
                                cond: { $eq: ['$$meter.status', 'online'] }
                            }
                        }
                    },
                    offlineCount: {
                        $size: {
                            $filter: {
                                input: '$meters',
                                as: 'meter',
                                cond: { $eq: ['$$meter.status', 'offline'] }
                            }
                        }
                    }
                }
            }
        ]);
        res.json({
            success: true,
            data: areaStats
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get area statistics',
            error: error.message
        });
    }
});
// Get top consuming meters
router.get('/top-consumers', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { limit = 10, areaId } = req.query;
        const yesterday = (0, moment_1.default)().subtract(1, 'day').startOf('day').toDate();
        const today = (0, moment_1.default)().startOf('day').toDate();
        const match = {
            timestamp: { $gte: yesterday, $lt: today },
            interval: 'daily'
        };
        if (areaId) {
            match.area = areaId;
        }
        const topConsumers = await Consumption_model_1.Consumption.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: 'meters',
                    localField: 'meter',
                    foreignField: '_id',
                    as: 'meterInfo'
                }
            },
            { $unwind: '$meterInfo' },
            {
                $group: {
                    _id: '$meter',
                    meterNumber: { $first: '$meterInfo.meterNumber' },
                    totalConsumption: { $sum: '$energy.activeEnergy' }
                }
            },
            { $sort: { totalConsumption: -1 } },
            { $limit: Number(limit) }
        ]);
        res.json({
            success: true,
            data: topConsumers
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get top consumers',
            error: error.message
        });
    }
});
// Get system health metrics
router.get('/health-metrics', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin'), async (req, res) => {
    try {
        const last24Hours = (0, moment_1.default)().subtract(24, 'hours').toDate();
        const last7Days = (0, moment_1.default)().subtract(7, 'days').toDate();
        const [totalEvents24h, criticalAlerts, tamperAlerts, communicationFailures, averageOnlineRate] = await Promise.all([
            Event_model_1.Event.countDocuments({ timestamp: { $gte: last24Hours } }),
            Alert_model_1.Alert.countDocuments({ priority: 'critical', status: 'active' }),
            Alert_model_1.Alert.countDocuments({ category: 'tamper', status: 'active' }),
            Alert_model_1.Alert.countDocuments({ category: 'communication', status: 'active' }),
            Meter_model_1.Meter.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        online: {
                            $sum: { $cond: [{ $eq: ['$status', 'online'] }, 1, 0] }
                        }
                    }
                },
                {
                    $project: {
                        onlineRate: {
                            $multiply: [{ $divide: ['$online', '$total'] }, 100]
                        }
                    }
                }
            ])
        ]);
        res.json({
            success: true,
            data: {
                events24h: totalEvents24h,
                criticalAlerts,
                tamperAlerts,
                communicationFailures,
                averageOnlineRate: averageOnlineRate[0]?.onlineRate || 0,
                status: criticalAlerts === 0 ? 'healthy' :
                    criticalAlerts < 5 ? 'warning' : 'critical'
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get health metrics',
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map