import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User';
import { JWTUtils } from '../utils/jwt';

// Extend Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

/**
 * Authentication middleware to verify JWT tokens
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access token is required'
        }
      });
      return;
    }

    // Verify token
    const decoded = JWTUtils.verifyToken(token);

    // Find user by ID
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);

    if (error.message === 'Token has expired') {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired'
        }
      });
      return;
    }

    if (error.message === 'Invalid token') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid access token'
        }
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed'
      }
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      // No token provided, continue without user
      next();
      return;
    }

    // Verify token
    const decoded = JWTUtils.verifyToken(token);

    // Find user by ID
    const user = await User.findById(decoded.userId);
    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Token verification failed, continue without user
    console.error('Optional auth middleware error:', error);
    next();
  }
};