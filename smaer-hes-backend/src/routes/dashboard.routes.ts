import express from 'express';
import { authenticate, authorize, getAreaFilter } from '../middleware/auth.middleware';
import { Meter } from '../models/Meter.model';
import { Alert } from '../models/Alert.model';
import { Event } from '../models/Event.model';
import { Consumption } from '../models/Consumption.model';
import { Customer } from '../models/Customer.model';
import { Area } from '../models/Area.model';
import { AlertService } from '../services/alert.service';
import moment from 'moment';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticate, async (req: any, res) => {
  try {
    const { areaId } = req.query;
    const filter: any = { isActive: true };

    // Apply area-based filtering for customer users
    const areaFilter = getAreaFilter(req.user);
    if (areaFilter) {
      Object.assign(filter, areaFilter);
    }

    if (areaId) {
      filter.area = areaId;
    }

    // Get meter statistics
    const [
      totalMeters,
      onlineMeters,
      offlineMeters,
      activeMeters,
      warehouseMeters
    ] = await Promise.all([
      Meter.countDocuments(filter),
      Meter.countDocuments({ ...filter, status: 'online' }),
      Meter.countDocuments({ ...filter, status: 'offline' }),
      Meter.countDocuments({ ...filter, status: 'active' }),
      Meter.countDocuments({ ...filter, status: 'warehouse' })
    ]);

    // Get alert statistics
    const activeAlerts = await AlertService.getActiveAlertsCount();

    // Get customer and area counts
    const [totalCustomers, totalAreas] = await Promise.all([
      Customer.countDocuments({ isActive: true }),
      Area.countDocuments({ isActive: true })
    ]);

    // Get recent events count (last 24 hours)
    const last24Hours = moment().subtract(24, 'hours').toDate();
    const recentEventsCount = await Event.countDocuments({
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
      error: error.message
    });
  }
});

// Get energy consumption chart data (last 24 hours)
router.get('/consumption-chart', authenticate, async (req: any, res) => {
  try {
    const { areaId, interval = 'hourly' } = req.query;
    const now = moment();
    let startDate: Date;
    let groupInterval: string;

    switch (interval) {
      case 'daily':
        startDate = moment().subtract(30, 'days').toDate();
        groupInterval = 'daily';
        break;
      case 'weekly':
        startDate = moment().subtract(12, 'weeks').toDate();
        groupInterval = 'weekly';
        break;
      case 'monthly':
        startDate = moment().subtract(12, 'months').toDate();
        groupInterval = 'monthly';
        break;
      default: // hourly
        startDate = moment().subtract(24, 'hours').toDate();
        groupInterval = 'hourly';
    }

    const match: any = {
      timestamp: { $gte: startDate },
      interval: groupInterval
    };

    // Apply area-based filtering for customer users
    const areaFilter = getAreaFilter(req.user);
    if (areaFilter && areaFilter.area) {
      match.area = areaFilter.area;
    }

    if (areaId) {
      match.area = areaId;
    }

    const consumptionData = await Consumption.aggregate([
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get consumption chart data',
      error: error.message
    });
  }
});

// Get recent events
router.get('/recent-events', authenticate, async (req, res) => {
  try {
    const { limit = 10, severity, category } = req.query;
    const filter: any = {};

    if (severity) {
      filter.severity = severity;
    }

    if (category) {
      filter.category = category;
    }

    const events = await Event.find(filter)
      .populate('meter', 'meterNumber')
      .sort('-timestamp')
      .limit(Number(limit));

    res.json({
      success: true,
      data: events
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get recent events',
      error: error.message
    });
  }
});

// Get revenue loss summary
router.get('/revenue-loss', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : moment().subtract(30, 'days').toDate();
    const end = endDate ? new Date(endDate as string) : new Date();

    const summary = await AlertService.getRevenueLossSummary(start, end);

    res.json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get revenue loss summary',
      error: error.message
    });
  }
});

// Get area-wise statistics
router.get('/area-stats', authenticate, async (req, res) => {
  try {
    const areaStats = await Area.aggregate([
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get area statistics',
      error: error.message
    });
  }
});

// Get top consuming meters
router.get('/top-consumers', authenticate, async (req: any, res) => {
  try {
    const { limit = 10, areaId } = req.query;
    const yesterday = moment().subtract(1, 'day').startOf('day').toDate();
    const today = moment().startOf('day').toDate();

    const match: any = {
      timestamp: { $gte: yesterday, $lt: today },
      interval: 'daily'
    };

    // Apply area-based filtering for customer users
    const areaFilter = getAreaFilter(req.user);
    if (areaFilter && areaFilter.area) {
      match.area = areaFilter.area;
    }

    if (areaId) {
      match.area = areaId;
    }

    const topConsumers = await Consumption.aggregate([
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get top consumers',
      error: error.message
    });
  }
});

// Get system health metrics
router.get('/health-metrics', authenticate, authorize('admin'), async (req, res) => {
  try {
    const last24Hours = moment().subtract(24, 'hours').toDate();
    const last7Days = moment().subtract(7, 'days').toDate();

    const [
      totalEvents24h,
      criticalAlerts,
      tamperAlerts,
      communicationFailures,
      averageOnlineRate
    ] = await Promise.all([
      Event.countDocuments({ timestamp: { $gte: last24Hours } }),
      Alert.countDocuments({ priority: 'critical', status: 'active' }),
      Alert.countDocuments({ category: 'tamper', status: 'active' }),
      Alert.countDocuments({ category: 'communication', status: 'active' }),
      Meter.aggregate([
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get health metrics',
      error: error.message
    });
  }
});

export default router;
