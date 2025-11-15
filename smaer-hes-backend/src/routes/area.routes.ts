import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Area } from '../models/Area.model';
import { Meter } from '../models/Meter.model';

const router = express.Router();

// Get all areas
router.get('/', authenticate, async (req, res) => {
  try {
    const areas = await Area.find({ isActive: true })
      .populate('createdBy', 'firstName lastName')
      .sort('name');
    
    res.json({
      success: true,
      data: areas,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch areas',
      error: error.message,
    });
  }
});

// Create new area
router.post('/', authenticate, authorize('admin', 'operator'), async (req: any, res) => {
  try {
    const { name, code, description, parentArea, coordinates } = req.body;
    
    // Check if area code already exists
    const existingArea = await Area.findOne({ code });
    if (existingArea) {
      return res.status(400).json({
        success: false,
        message: 'Area code already exists',
      });
    }
    
    const area = await Area.create({
      name,
      code,
      description,
      parentArea,
      coordinates,
      createdBy: req.user._id,
    });
    
    res.status(201).json({
      success: true,
      message: 'Area created successfully',
      data: area,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create area',
      error: error.message,
    });
  }
});

// Update area
router.put('/:id', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    const area = await Area.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Area updated successfully',
      data: area,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update area',
      error: error.message,
    });
  }
});

// Delete area
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Check if area has meters
    const meterCount = await Meter.countDocuments({ area: req.params.id });
    
    if (meterCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete area with ${meterCount} meters. Please reassign meters first.`,
      });
    }
    
    const area = await Area.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Area deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete area',
      error: error.message,
    });
  }
});

export default router;
