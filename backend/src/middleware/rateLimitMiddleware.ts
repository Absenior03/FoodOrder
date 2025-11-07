import { Request, Response, NextFunction } from 'express';
import { DatabaseConfig } from '../config/database';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Rate limiting middleware using Redis or in-memory storage
 */
export const rateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  // In-memory store as fallback when Redis is not available
  const memoryStore = new Map<string, { count: number; resetTime: number }>();

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = req.ip || req.connection.remoteAddress || 'unknown';
      const key = `rate_limit:${clientId}:${req.route?.path || req.path}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      const redisClient = DatabaseConfig.getRedisClient();

      let currentCount = 0;
      let resetTime = now + windowMs;

      if (redisClient) {
        // Use Redis for distributed rate limiting
        const pipeline = redisClient.multi();
        
        // Remove expired entries
        pipeline.zRemRangeByScore(key, 0, windowStart);
        
        // Count current requests in window
        pipeline.zCard(key);
        
        // Add current request
        pipeline.zAdd(key, { score: now, value: `${now}-${Math.random()}` });
        
        // Set expiration
        pipeline.expire(key, Math.ceil(windowMs / 1000));
        
        const results = await pipeline.exec();
        currentCount = results?.[1]?.[1] as number || 0;
      } else {
        // Use in-memory store as fallback
        const record = memoryStore.get(key);
        
        if (!record || now > record.resetTime) {
          // Create new record or reset expired record
          memoryStore.set(key, { count: 1, resetTime });
          currentCount = 1;
        } else {
          // Increment existing record
          record.count++;
          currentCount = record.count;
          resetTime = record.resetTime;
        }
      }

      // Check if limit exceeded
      if (currentCount > maxRequests) {
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message,
            retryAfter: Math.ceil((resetTime - now) / 1000)
          }
        });
        return;
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - currentCount).toString(),
        'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString()
      });

      // Handle response to potentially skip counting
      const originalSend = res.send;
      res.send = function(body) {
        const statusCode = res.statusCode;
        const shouldSkip = 
          (skipSuccessfulRequests && statusCode < 400) ||
          (skipFailedRequests && statusCode >= 400);

        if (shouldSkip && redisClient) {
          // Remove the request from count if it should be skipped
          redisClient.zRem(key, `${now}-${Math.random()}`).catch(console.error);
        } else if (shouldSkip && !redisClient) {
          // Decrement in-memory count
          const record = memoryStore.get(key);
          if (record && record.count > 0) {
            record.count--;
          }
        }

        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Continue without rate limiting if there's an error
      next();
    }
  };
};

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // Strict rate limiting for authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again in 15 minutes',
    skipSuccessfulRequests: true
  }),

  // General API rate limiting
  api: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    message: 'Too many API requests, please try again later'
  }),

  // Strict rate limiting for registration
  register: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 registration attempts per hour
    message: 'Too many registration attempts, please try again in 1 hour'
  }),

  // General rate limiting for other endpoints
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200, // 200 requests per 15 minutes
    message: 'Too many requests, please try again later'
  }),

  // Strict rate limiting for checkout operations to prevent abuse
  checkout: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3, // 3 checkout attempts per 5 minutes
    message: 'Too many checkout attempts, please wait before trying again',
    skipSuccessfulRequests: true // Don't count successful checkouts against the limit
  }),

  // Rate limiting for cart operations
  cart: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 30, // 30 cart operations per minute
    message: 'Too many cart operations, please slow down'
  })
};