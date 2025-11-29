import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AuditLog } from '../models/AuditLog.model';
import { Parser } from 'json2csv';

const router = express.Router();

// Get audit logs (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      resource,
      action,
      userId,
      startDate,
      endDate,
      search,
    } = req.query;

    // Build filter query
    const filter: any = {};

    if (resource) filter.resource = resource;
    if (action) filter.action = action;
    if (userId) filter.userId = userId;

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate as string);
      if (endDate) filter.timestamp.$lte = new Date(endDate as string);
    }

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { resource: { $regex: search, $options: 'i' } },
        { endpoint: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'username email firstName lastName')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error: any) {
    console.error('Fetch audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message,
    });
  }
});

// Get audit log by ID (admin only)
router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('userId', 'username email firstName lastName')
      .lean();

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found',
      });
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error: any) {
    console.error('Fetch audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
      error: error.message,
    });
  }
});

// Get audit statistics (admin only)
router.get('/stats/summary', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter: any = {};
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate as string);
      if (endDate) filter.timestamp.$lte = new Date(endDate as string);
    }

    const [
      totalLogs,
      actionStats,
      resourceStats,
      userStats,
      recentActivity,
    ] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.aggregate([
        { $match: filter },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AuditLog.aggregate([
        { $match: filter },
        { $group: { _id: '$resource', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AuditLog.aggregate([
        { $match: filter },
        { $group: { _id: '$userId', username: { $first: '$username' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AuditLog.find(filter)
        .populate('userId', 'username email')
        .sort({ timestamp: -1 })
        .limit(10)
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        totalLogs,
        actionStats,
        resourceStats,
        userStats,
        recentActivity,
      },
    });
  } catch (error: any) {
    console.error('Fetch audit stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit statistics',
      error: error.message,
    });
  }
});

// Export audit logs to CSV (admin only)
router.get('/export/csv', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      resource,
      action,
      userId,
      startDate,
      endDate,
    } = req.query;

    // Build filter query
    const filter: any = {};
    if (resource) filter.resource = resource;
    if (action) filter.action = action;
    if (userId) filter.userId = userId;

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate as string);
      if (endDate) filter.timestamp.$lte = new Date(endDate as string);
    }

    const logs = await AuditLog.find(filter)
      .populate('userId', 'username email')
      .sort({ timestamp: -1 })
      .limit(10000) // Limit to prevent memory issues
      .lean();

    // Transform data for CSV
    const csvData = logs.map((log: any) => ({
      Timestamp: new Date(log.timestamp).toISOString(),
      Username: log.username || 'System',
      Action: log.action,
      Resource: log.resource,
      ResourceID: log.resourceId || '',
      Method: log.method,
      Endpoint: log.endpoint,
      StatusCode: log.statusCode,
      IPAddress: log.ipAddress || '',
    }));

    // Convert to CSV
    const parser = new Parser({
      fields: [
        'Timestamp',
        'Username',
        'Action',
        'Resource',
        'ResourceID',
        'Method',
        'Endpoint',
        'StatusCode',
        'IPAddress',
      ],
    });

    const csv = parser.parse(csvData);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    );

    res.send(csv);
  } catch (error: any) {
    console.error('Export audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export audit logs',
      error: error.message,
    });
  }
});

// Delete old audit logs (admin only) - for maintenance
router.delete('/cleanup/:days', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { days } = req.params;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(days));

    const result = await AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} audit logs older than ${days} days`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error('Cleanup audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup audit logs',
      error: error.message,
    });
  }
});

export default router;
