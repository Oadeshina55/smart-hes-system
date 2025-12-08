import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.model';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

// Generate JWT token
export const generateToken = (userId: string): string => {
  // Cast secret to jwt.Secret to satisfy types across jwt versions
  const secret = process.env.JWT_SECRET as jwt.Secret;
  return jwt.sign(
    { id: userId },
    secret,
    { expiresIn: process.env.JWT_EXPIRE || '30d' } as jwt.SignOptions
  );
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      const user = await User.findById(decoded.id).select('-password');

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Get customer network filter for multi-tenant access control
 * Returns null for admin (no filtering - sees all networks)
 * Returns network filter for customer-operators (sees only their network)
 */
export const getNetworkFilter = (user?: IUser): any => {
  if (!user) {
    return { customerNetwork: { $in: [] } }; // No access without auth
  }

  // Admin: No filtering - sees all networks
  if (user.role === 'admin') {
    return null;
  }

  // System operator: No filtering - sees all networks
  if (user.role === 'operator') {
    return null;
  }

  // Customer-operator: Filter by their assigned network
  if (user.role === 'customer-operator' && user.customerNetwork) {
    return { customerNetwork: user.customerNetwork };
  }

  // Customer (end-user): Filter by their network if assigned
  if (user.role === 'customer' && user.customerNetwork) {
    return { customerNetwork: user.customerNetwork };
  }

  // No network assigned: return filter that matches nothing
  return { customerNetwork: { $in: [] } };
};

/**
 * Check if user has access to a specific customer network
 */
export const hasAccessToNetwork = (user: IUser, networkId: string): boolean => {
  // Admin has access to all networks
  if (user.role === 'admin') {
    return true;
  }

  // System operator has access to all networks
  if (user.role === 'operator') {
    return true;
  }

  // Customer-operator or customer: check if network matches their assigned network
  if (user.role === 'customer-operator' || user.role === 'customer') {
    if (!user.customerNetwork) {
      return false;
    }
    return user.customerNetwork.toString() === networkId.toString();
  }

  return false;
};

/**
 * DEPRECATED: Get area filter for customer users
 * Kept for backward compatibility during migration
 * Use getNetworkFilter for new code
 */
export const getAreaFilter = (user?: IUser): any => {
  if (!user || user.role === 'admin' || user.role === 'operator') {
    return null; // No area filtering for admin/operator
  }

  // Customer users: filter by assigned areas
  if (user.role === 'customer' && user.assignedAreas && user.assignedAreas.length > 0) {
    return { area: { $in: user.assignedAreas } };
  }

  // Customer with no assigned areas: return filter that matches nothing
  return { area: { $in: [] } };
};

/**
 * DEPRECATED: Check if user has access to a specific area
 * Kept for backward compatibility during migration
 * Use hasAccessToNetwork for new code
 */
export const hasAccessToArea = (user: IUser, areaId: string): boolean => {
  // Admin and operator have access to all areas
  if (user.role === 'admin' || user.role === 'operator') {
    return true;
  }

  // Customer: check if area is in assignedAreas
  if (user.role === 'customer') {
    if (!user.assignedAreas || user.assignedAreas.length === 0) {
      return false;
    }
    return user.assignedAreas.some(area => area.toString() === areaId.toString());
  }

  return false;
};
