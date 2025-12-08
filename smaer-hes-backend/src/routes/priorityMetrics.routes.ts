import express from 'express';
import { authenticate, authorize, getNetworkFilter } from '../middleware/auth.middleware';
import { PriorityMetricsService } from '../services/priorityMetrics.service';
import { PriorityMetrics } from '../models/PriorityMetrics.model';
import { Meter } from '../models/Meter.model';
import moment from 'moment';

const router = express.Router();

/**
 * POST /priority-metrics
 * Store priority metrics for a meter
 * Admin, operator, customer-operator
 */
router.post('/', authenticate, authorize('admin', 'operator', 'customer-operator'), async (req: any, res) => {
  try {
    const metrics = await PriorityMetricsService.storePriorityMetrics(req.body);
    res.status(201).json({
      success: true,
      message: 'Priority metrics stored successfully',
      data: metrics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to store priority metrics',
      error: error.message,
    });
  }
});

/**
 * GET /priority-metrics/meter/:meterId
 * Get latest priority metrics for a specific meter
 */
router.get('/meter/:meterId', authenticate, async (req: any, res) => {
  try {
    const { meterId } = req.params;

    // Check access rights
    const meter = await Meter.findById(meterId);
    if (!meter) {
      return res.status(404).json({
        success: false,
        message: 'Meter not found',
      });
    }

    // Multi-tenant: Apply network filtering
    const networkFilter = getNetworkFilter(req.user);
    if (networkFilter && req.user.role !== 'admin') {
      if (meter.customerNetwork.toString() !== req.user.customerNetwork?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this meter',
        });
      }
    }

    const metrics = await PriorityMetricsService.getLatestMetrics(meterId);

    if (!metrics) {
      return res.status(404).json({
        success: false,
        message: 'No priority metrics found for this meter',
      });
    }

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get priority metrics',
      error: error.message,
    });
  }
});

/**
 * GET /priority-metrics/meter/:meterId/history
 * Get priority metrics history for a meter
 */
router.get('/meter/:meterId/history', authenticate, async (req: any, res) => {
  try {
    const { meterId } = req.params;
    const { startDate, endDate } = req.query;

    // Check access rights
    const meter = await Meter.findById(meterId);
    if (!meter) {
      return res.status(404).json({
        success: false,
        message: 'Meter not found',
      });
    }

    // Multi-tenant: Apply network filtering
    const networkFilter = getNetworkFilter(req.user);
    if (networkFilter && req.user.role !== 'admin') {
      if (meter.customerNetwork.toString() !== req.user.customerNetwork?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this meter',
        });
      }
    }

    const start = startDate
      ? new Date(startDate as string)
      : moment().subtract(7, 'days').toDate();
    const end = endDate ? new Date(endDate as string) : new Date();

    const history = await PriorityMetricsService.getMetricsHistory(meterId, start, end);

    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get metrics history',
      error: error.message,
    });
  }
});

/**
 * GET /priority-metrics/network/:networkId/summary
 * Get aggregated priority metrics for a customer network
 */
router.get('/network/:networkId/summary', authenticate, authorize('admin', 'operator', 'customer-operator'), async (req: any, res) => {
  try {
    const { networkId } = req.params;

    // Multi-tenant: Check access
    if (req.user.role === 'customer-operator' && req.user.customerNetwork?.toString() !== networkId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this network',
      });
    }

    const summary = await PriorityMetricsService.getNetworkMetricsSummary(networkId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get network metrics summary',
      error: error.message,
    });
  }
});

/**
 * GET /priority-metrics/alerts
 * Get critical alerts from priority metrics
 */
router.get('/alerts', authenticate, async (req: any, res) => {
  try {
    const { customerNetworkId } = req.query;

    // Multi-tenant: Filter by network if not admin
    let networkId = customerNetworkId as string | undefined;
    if (req.user.role === 'customer-operator') {
      networkId = req.user.customerNetwork?.toString();
    }

    const alerts = await PriorityMetricsService.getCriticalAlerts(networkId);

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get critical alerts',
      error: error.message,
    });
  }
});

/**
 * GET /priority-metrics/meter/:meterId/billing
 * Get billing metrics for a meter
 */
router.get('/meter/:meterId/billing', authenticate, async (req: any, res) => {
  try {
    const { meterId } = req.params;
    const { startDate, endDate } = req.query;

    // Check access rights
    const meter = await Meter.findById(meterId);
    if (!meter) {
      return res.status(404).json({
        success: false,
        message: 'Meter not found',
      });
    }

    // Multi-tenant: Apply network filtering
    const networkFilter = getNetworkFilter(req.user);
    if (networkFilter && req.user.role !== 'admin') {
      if (meter.customerNetwork.toString() !== req.user.customerNetwork?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this meter',
        });
      }
    }

    const start = startDate
      ? new Date(startDate as string)
      : moment().subtract(30, 'days').toDate();
    const end = endDate ? new Date(endDate as string) : new Date();

    const billingMetrics = await PriorityMetricsService.getBillingMetrics(meterId, start, end);

    res.json({
      success: true,
      data: billingMetrics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get billing metrics',
      error: error.message,
    });
  }
});

/**
 * GET /priority-metrics/data-quality
 * Get meters with poor data quality
 */
router.get('/data-quality', authenticate, authorize('admin', 'operator', 'customer-operator'), async (req: any, res) => {
  try {
    const { threshold = 50 } = req.query;

    // Multi-tenant: Filter by network if not admin
    let networkId: string | undefined;
    if (req.user.role === 'customer-operator') {
      networkId = req.user.customerNetwork?.toString();
    }

    const meters = await PriorityMetricsService.getMetersWithPoorDataQuality(
      networkId,
      Number(threshold)
    );

    res.json({
      success: true,
      data: meters,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get meters with poor data quality',
      error: error.message,
    });
  }
});

/**
 * GET /priority-metrics/network/:networkId/dashboard
 * Get comprehensive dashboard data for priority metrics
 */
router.get('/network/:networkId/dashboard', authenticate, authorize('admin', 'operator', 'customer-operator'), async (req: any, res) => {
  try {
    const { networkId } = req.params;

    // Multi-tenant: Check access
    if (req.user.role === 'customer-operator' && req.user.customerNetwork?.toString() !== networkId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this network',
      });
    }

    // Get all dashboard data in parallel
    const [summary, alerts, poorQuality] = await Promise.all([
      PriorityMetricsService.getNetworkMetricsSummary(networkId),
      PriorityMetricsService.getCriticalAlerts(networkId),
      PriorityMetricsService.getMetersWithPoorDataQuality(networkId, 60),
    ]);

    res.json({
      success: true,
      data: {
        summary,
        criticalAlerts: alerts,
        dataQualityIssues: poorQuality,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get priority metrics dashboard',
      error: error.message,
    });
  }
});

export default router;
