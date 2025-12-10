import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { meterScheduler } from '../services/meterScheduler.service';
import { meterCommService } from '../services/meterComm.service';
import { Meter } from '../models/Meter.model';

const router = express.Router();

/**
 * @route   POST /api/meter-control/read/:meterId
 * @desc    Manually trigger meter reading
 * @access  Admin, Operator, Customer-Operator
 */
router.post(
  '/read/:meterId',
  authenticate,
  authorize('admin', 'operator', 'customer-operator'),
  async (req: express.Request, res: express.Response) => {
    try {
      const { meterId } = req.params;

      // Check if meter exists and user has access
      const meter = await Meter.findOne({ meterNumber: meterId });
      if (!meter) {
        return res.status(404).json({
          success: false,
          message: 'Meter not found',
        });
      }

      // Check access rights
      const user = (req as any).user;
      if (user.role === 'customer-operator') {
        if (meter.customerNetwork?.toString() !== user.customerNetwork?.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this meter',
          });
        }
      }

      // Trigger reading
      await meterScheduler.readSingleMeter(meterId);

      res.json({
        success: true,
        message: `Read command sent to meter ${meterId}`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to read meter',
        error: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/meter-control/connect/:meterId
 * @desc    Connect meter (enable power supply)
 * @access  Admin, Operator, Customer-Operator
 */
router.post(
  '/connect/:meterId',
  authenticate,
  authorize('admin', 'operator', 'customer-operator'),
  async (req: express.Request, res: express.Response) => {
    try {
      const { meterId } = req.params;

      // Check meter and access rights
      const meter = await Meter.findOne({ meterNumber: meterId });
      if (!meter) {
        return res.status(404).json({
          success: false,
          message: 'Meter not found',
        });
      }

      const user = (req as any).user;
      if (user.role === 'customer-operator') {
        if (meter.customerNetwork?.toString() !== user.customerNetwork?.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this meter',
          });
        }
      }

      // Send connect command
      await meterScheduler.controlMeter(meterId, 'connect');

      res.json({
        success: true,
        message: `Connect command sent to meter ${meterId}`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to connect meter',
        error: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/meter-control/disconnect/:meterId
 * @desc    Disconnect meter (disable power supply)
 * @access  Admin, Operator, Customer-Operator
 */
router.post(
  '/disconnect/:meterId',
  authenticate,
  authorize('admin', 'operator', 'customer-operator'),
  async (req: express.Request, res: express.Response) => {
    try {
      const { meterId } = req.params;

      // Check meter and access rights
      const meter = await Meter.findOne({ meterNumber: meterId });
      if (!meter) {
        return res.status(404).json({
          success: false,
          message: 'Meter not found',
        });
      }

      const user = (req as any).user;
      if (user.role === 'customer-operator') {
        if (meter.customerNetwork?.toString() !== user.customerNetwork?.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this meter',
          });
        }
      }

      // Send disconnect command
      await meterScheduler.controlMeter(meterId, 'disconnect');

      res.json({
        success: true,
        message: `Disconnect command sent to meter ${meterId}`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to disconnect meter',
        error: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/meter-control/read-network/:networkId
 * @desc    Read all meters in a customer network
 * @access  Admin, Operator, Customer-Operator
 */
router.post(
  '/read-network/:networkId',
  authenticate,
  authorize('admin', 'operator', 'customer-operator'),
  async (req: express.Request, res: express.Response) => {
    try {
      const { networkId } = req.params;
      const user = (req as any).user;

      // Check access rights
      if (user.role === 'customer-operator') {
        if (networkId !== user.customerNetwork?.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this network',
          });
        }
      }

      // Read all network meters
      await meterScheduler.readNetworkMeters(networkId);

      res.json({
        success: true,
        message: 'Read commands sent to all meters in the network',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to read network meters',
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/meter-control/status
 * @desc    Get meter communication system status
 * @access  Admin, Operator
 */
router.get(
  '/status',
  authenticate,
  authorize('admin', 'operator'),
  async (req: express.Request, res: express.Response) => {
    try {
      const status = meterScheduler.getStatus();

      // Get meter statistics
      const totalMeters = await Meter.countDocuments({ isActive: true });
      const activeMeters = await Meter.countDocuments({ status: 'active', isActive: true });
      const onlineMeters = await Meter.countDocuments({
        connectionStatus: 'connected',
        isActive: true,
      });

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentlyActiveMeters = await Meter.countDocuments({
        lastCommunication: { $gte: fiveMinutesAgo },
        isActive: true,
      });

      res.json({
        success: true,
        data: {
          schedulerRunning: status.isRunning,
          mqttConnected: status.mqttConnected,
          statistics: {
            totalMeters,
            activeMeters,
            onlineMeters,
            recentlyActiveMeters,
            offlineMeters: totalMeters - recentlyActiveMeters,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to get system status',
        error: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/meter-control/trigger-reading
 * @desc    Manually trigger reading of all meters
 * @access  Admin, Operator
 */
router.post(
  '/trigger-reading',
  authenticate,
  authorize('admin', 'operator'),
  async (req: express.Request, res: express.Response) => {
    try {
      // Trigger immediate reading of all meters
      meterScheduler.readAllMeters().catch((error) => {
        console.error('Error in manual meter reading:', error);
      });

      res.json({
        success: true,
        message: 'Manual meter reading initiated',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to trigger reading',
        error: error.message,
      });
    }
  }
);

export default router;
