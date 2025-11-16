import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import loadProfileService from '../services/loadProfile.service';

const router = express.Router();

// Request load profile from meter
router.post('/', authenticate, authorize('admin', 'operator'), async (req: any, res) => {
  try {
    const { meterId, startTime, endTime, profileType, captureInterval } = req.body;

    if (!meterId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'meterId, startTime, and endTime are required'
      });
    }

    const loadProfile = await loadProfileService.requestLoadProfile(
      meterId,
      new Date(startTime),
      new Date(endTime),
      profileType || 'hourly',
      captureInterval || 60
    );

    res.status(201).json({
      success: true,
      message: 'Load profile requested successfully',
      data: loadProfile
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to request load profile',
      error: error.message
    });
  }
});

// Get load profiles for a meter
router.get('/meter/:meterId', authenticate, async (req, res) => {
  try {
    const { meterId } = req.params;
    const { startDate, endDate, profileType, status, limit, skip } = req.query;

    const options: any = {};
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);
    if (profileType) options.profileType = profileType;
    if (status) options.status = status;
    if (limit) options.limit = parseInt(limit as string);
    if (skip) options.skip = parseInt(skip as string);

    const result = await loadProfileService.getLoadProfiles(meterId, options);

    res.json({
      success: true,
      data: result.loadProfiles,
      total: result.total
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get load profiles',
      error: error.message
    });
  }
});

// Get specific load profile
router.get('/:id', authenticate, async (req, res) => {
  try {
    const loadProfile = await loadProfileService.getLoadProfile(req.params.id);

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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get load profile',
      error: error.message
    });
  }
});

// Get load profile statistics
router.get('/:id/statistics', authenticate, async (req, res) => {
  try {
    const stats = await loadProfileService.getLoadProfileStatistics(req.params.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get load profile statistics',
      error: error.message
    });
  }
});

// Delete load profile
router.delete('/:id', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    await loadProfileService.deleteLoadProfile(req.params.id);

    res.json({
      success: true,
      message: 'Load profile deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete load profile',
      error: error.message
    });
  }
});

export default router;
