import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import aiMonitoringService from '../services/aiMonitoring.service';
import logger from '../utils/logger';

const router = express.Router();

/**
 * GET /api/ai/insights
 * Get AI-generated insights and recommendations
 */
router.get('/insights', authenticate, async (req, res) => {
  try {
    const insights = await aiMonitoringService.generateInsights();
    res.json({
      success: true,
      data: insights,
    });
  } catch (error: any) {
    logger.error('Error getting AI insights', { error });
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
router.get('/anomalies', authenticate, async (req, res) => {
  try {
    const anomalies = await aiMonitoringService.detectAnomalies();
    res.json({
      success: true,
      data: anomalies,
    });
  } catch (error: any) {
    logger.error('Error detecting anomalies', { error });
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
router.get('/consumption-pattern/:meterId', authenticate, async (req, res) => {
  try {
    const { meterId } = req.params;
    const pattern = await aiMonitoringService.analyzeConsumptionPattern(meterId);

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
  } catch (error: any) {
    logger.error('Error analyzing consumption pattern', { error });
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
router.get('/alerts/prioritized', authenticate, async (req, res) => {
  try {
    const alerts = await aiMonitoringService.prioritizeAlerts();
    res.json({
      success: true,
      data: alerts,
    });
  } catch (error: any) {
    logger.error('Error prioritizing alerts', { error });
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
router.post('/analyze', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Run all AI analysis tasks
    const [insights, anomalies, prioritizedAlerts] = await Promise.all([
      aiMonitoringService.generateInsights(),
      aiMonitoringService.detectAnomalies(),
      aiMonitoringService.prioritizeAlerts(),
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
  } catch (error: any) {
    logger.error('Error running AI analysis', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to run AI analysis',
      error: error.message,
    });
  }
});

export default router;
