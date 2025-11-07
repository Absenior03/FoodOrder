import { Router, Request, Response } from 'express';
import { FoodItem } from '../models/FoodItem';

const router = Router();

/**
 * Clear and reseed inventory
 * GET /api/admin/reseed-inventory?secret=YOUR_SECRET
 */
router.get('/reseed-inventory', async (req: Request, res: Response) => {
  try {
    // Simple secret check (you can set this in Render env vars)
    const secret = req.query.secret;
    const expectedSecret = process.env.ADMIN_SECRET || 'change-me-in-production';
    
    if (secret !== expectedSecret) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Invalid secret'
        }
      });
      return;
    }

    // Clear existing items
    const deleteResult = await FoodItem.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} items`);

    res.status(200).json({
      success: true,
      data: {
        deletedCount: deleteResult.deletedCount,
        message: 'Database cleared. Items will be reseeded on next seed script run or you can manually insert.'
      }
    });
  } catch (error) {
    console.error('Reseed error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to reseed inventory'
      }
    });
  }
});

export { router as adminRoutes };
