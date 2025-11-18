import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import powerQualityService from '../services/powerQuality.service';

const router = express.Router();

// Record power quality measurement
router.post('/', authenticate, authorize('admin', 'operator'), async (req: any, res) => {
  try {
    const { meterId, ...data } = req.body;

    if (!meterId) {
      return res.status(400).json({
        success: false,
        message: 'meterId is required'
      });
    }

    const measurement = await powerQualityService.recordMeasurement(meterId, data);

    res.status(201).json({
      success: true,
      message: 'Power quality measurement recorded',
      data: measurement
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to record measurement',
      error: error.message
    });
  }
});

// Get power quality measurements for a meter
router.get('/meter/:meterId', authenticate, async (req, res) => {
  try {
    const { meterId } = req.params;
    const { startDate, endDate, minQualityScore, eventType, limit, skip } = req.query;

    const options: any = {};
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);
    if (minQualityScore) options.minQualityScore = parseFloat(minQualityScore as string);
    if (eventType) options.eventType = eventType;
    if (limit) options.limit = parseInt(limit as string);
    if (skip) options.skip = parseInt(skip as string);

    const result = await powerQualityService.getMeasurements(meterId, options);

    res.json({
      success: true,
      data: result.measurements,
      total: result.total
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get measurements',
      error: error.message
    });
  }
});

// Get power quality statistics
router.get('/meter/:meterId/statistics', authenticate, async (req, res) => {
  try {
    const { meterId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    const stats = await powerQualityService.getStatistics(
      meterId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

// Get real-time power quality
router.get('/meter/:meterId/realtime', authenticate, async (req, res) => {
  try {
    const measurement = await powerQualityService.getRealTimePowerQuality(req.params.meterId);

    res.json({
      success: true,
      data: measurement
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get real-time power quality',
      error: error.message
    });
  }
});

export default router;
