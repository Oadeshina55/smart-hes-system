import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog.model';

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: {
    _id: string;
    username: string;
    role: string;
  };
}

// Helper function to extract resource from endpoint
const extractResource = (path: string): string => {
  const parts = path.split('/').filter(Boolean);
  if (parts.length > 0) {
    // Remove 'api' prefix if exists
    if (parts[0] === 'api') parts.shift();
    return parts[0] || 'unknown';
  }
  return 'unknown';
};

// Helper function to determine action from method and path
const determineAction = (method: string, path: string): string => {
  const lowerPath = path.toLowerCase();

  if (method === 'POST') {
    if (lowerPath.includes('login')) return 'login';
    if (lowerPath.includes('logout')) return 'logout';
    if (lowerPath.includes('register')) return 'register';
    return 'create';
  }

  if (method === 'PUT' || method === 'PATCH') {
    if (lowerPath.includes('activate')) return 'activate';
    if (lowerPath.includes('deactivate')) return 'deactivate';
    if (lowerPath.includes('resolve')) return 'resolve';
    if (lowerPath.includes('acknowledge')) return 'acknowledge';
    return 'update';
  }

  if (method === 'DELETE') return 'delete';
  if (method === 'GET') {
    if (lowerPath.includes('export')) return 'export';
    if (lowerPath.includes('download')) return 'download';
    return 'view';
  }

  return method.toLowerCase();
};

// Middleware to log API requests
export const auditLogger = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  const startTime = Date.now();

  // Capture response
  res.send = function (data: any) {
    res.send = originalSend;

    // Log the request asynchronously (don't block response)
    setImmediate(async () => {
      try {
        const resource = extractResource(req.path);
        const action = determineAction(req.method, req.path);

        // Extract resource ID from params if available
        const resourceId = req.params.id || req.params.meterId || req.params.customerId || undefined;

        // Get IP address
        const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
                         req.socket.remoteAddress ||
                         'unknown';

        // Create audit log entry
        const auditEntry: any = {
          userId: req.user?._id,
          username: req.user?.username,
          action,
          resource,
          resourceId,
          method: req.method as any,
          endpoint: req.originalUrl || req.url,
          ipAddress,
          userAgent: req.headers['user-agent'],
          statusCode: res.statusCode,
          timestamp: new Date(),
        };

        // Add metadata for important operations
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          auditEntry.metadata = {
            body: req.body,
            query: req.query,
            duration: Date.now() - startTime,
          };
        }

        await AuditLog.create(auditEntry);
      } catch (error) {
        console.error('Audit logging error:', error);
        // Don't throw error - audit logging should not break the app
      }
    });

    return originalSend.call(this, data);
  };

  next();
};

// Middleware to log specific actions with before/after changes
export const auditChange = (resource: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Capture the original data before the change
      let beforeData;

      if (req.params.id) {
        // Dynamically import the model based on resource
        const modelMap: any = {
          meters: () => import('../models/Meter.model').then(m => m.Meter),
          customers: () => import('../models/Customer.model').then(m => m.Customer),
          users: () => import('../models/User.model').then(m => m.User),
          events: () => import('../models/Event.model').then(m => m.Event),
        };

        if (modelMap[resource]) {
          const Model = await modelMap[resource]();
          beforeData = await Model.findById(req.params.id).select('-password').lean();
        }
      }

      // Store beforeData for later use
      (req as any).beforeData = beforeData;

      // Capture response to get afterData
      const originalJson = res.json;
      res.json = function (data: any) {
        setImmediate(async () => {
          try {
            const action = determineAction(req.method, req.path);
            const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
                             req.socket.remoteAddress ||
                             'unknown';

            await AuditLog.create({
              userId: req.user?._id,
              username: req.user?.username,
              action,
              resource,
              resourceId: req.params.id,
              method: req.method as any,
              endpoint: req.originalUrl || req.url,
              ipAddress,
              userAgent: req.headers['user-agent'],
              statusCode: res.statusCode,
              changes: {
                before: beforeData,
                after: data.data || data,
              },
              timestamp: new Date(),
            });
          } catch (error) {
            console.error('Audit change logging error:', error);
          }
        });

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Audit change middleware error:', error);
      next(); // Continue even if audit fails
    }
  };
};
