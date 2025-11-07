import { Request, Response } from 'express';
import { FoodItem, IFoodItem, FoodCategory } from '../models/FoodItem';
import { AuthenticatedRequest } from './authController';
import { getWebSocketService } from '../services/websocketService';

export class InventoryController {
  /**
   * Get all food items with optional category filtering
   * GET /api/inventory/items?category=Fruit&page=1&limit=20
   */
  static async getItems(req: Request, res: Response): Promise<void> {
    try {
      const { category, page = '1', limit = '20', minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc', q } = req.query;
      
      // Parse pagination parameters
      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      // Build query filter
      const filter: any = { isActive: true };
      
      if (category && category !== 'All') {
        // Validate category
        if (!Object.values(FoodCategory).includes(category as FoodCategory)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_CATEGORY',
              message: `Invalid category. Must be one of: ${Object.values(FoodCategory).join(', ')}`
            }
          });
          return;
        }
        filter.category = category;
      }

      // Add search filtering
      if (q && typeof q === 'string' && q.trim().length >= 2) {
        const searchRegex = new RegExp(q.trim(), 'i'); // Case-insensitive search
        filter.$or = [
          { name: { $regex: searchRegex } },
          { description: { $regex: searchRegex } }
        ];
      }

      // Add price range filtering
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) {
          const minPriceNum = parseFloat(minPrice as string);
          if (!isNaN(minPriceNum) && minPriceNum >= 0) {
            filter.price.$gte = minPriceNum;
          }
        }
        if (maxPrice) {
          const maxPriceNum = parseFloat(maxPrice as string);
          if (!isNaN(maxPriceNum) && maxPriceNum >= 0) {
            filter.price.$lte = maxPriceNum;
          }
        }
      }

      // Build sort object
      const validSortFields = ['name', 'price', 'stock', 'createdAt', 'category'];
      const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
      const sortDirection = sortOrder === 'asc' ? 1 : -1;
      const sortObj: any = { [sortField]: sortDirection };
      
      // Add secondary sort by createdAt if not already sorting by it
      if (sortField !== 'createdAt') {
        sortObj.createdAt = -1;
      }

      // Execute query with pagination
      const [items, totalCount] = await Promise.all([
        FoodItem.find(filter)
          .sort(sortObj)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        FoodItem.countDocuments(filter)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      res.status(200).json({
        success: true,
        data: {
          items,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalItems: totalCount,
            itemsPerPage: limitNum,
            hasNextPage,
            hasPrevPage
          }
        }
      });
    } catch (error) {
      console.error('Get items error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve food items'
        }
      });
    }
  }

  /**
   * Get individual food item details
   * GET /api/inventory/items/:id
   */
  static async getItemById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate ObjectId format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid item ID format'
          }
        });
        return;
      }

      const item = await FoodItem.findOne({ _id: id, isActive: true }).lean();

      if (!item) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Food item not found'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          item
        }
      });
    } catch (error) {
      console.error('Get item by ID error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve food item'
        }
      });
    }
  }

  /**
   * Get all available categories
   * GET /api/inventory/categories
   */
  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      // Get categories with item counts
      const categoryCounts = await FoodItem.aggregate([
        { $match: { isActive: true } },
        { 
          $group: { 
            _id: '$category', 
            count: { $sum: 1 },
            availableItems: {
              $sum: {
                $cond: [{ $gt: ['$stock', 0] }, 1, 0]
              }
            }
          } 
        },
        { $sort: { _id: 1 } }
      ]);

      // Calculate total counts for "All" category
      const totalItems = categoryCounts.reduce((sum, cat) => sum + cat.count, 0);
      const totalAvailable = categoryCounts.reduce((sum, cat) => sum + cat.availableItems, 0);

      // Format response with All category first
      const categories = [
        {
          name: 'All',
          value: 'All',
          count: totalItems,
          availableItems: totalAvailable
        },
        ...categoryCounts.map(cat => ({
          name: cat._id,
          value: cat._id,
          count: cat.count,
          availableItems: cat.availableItems
        }))
      ];

      res.status(200).json({
        success: true,
        data: {
          categories
        }
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve categories'
        }
      });
    }
  }

  /**
   * Update item stock (admin endpoint)
   * PUT /api/inventory/items/:id/stock
   */
  static async updateStock(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { stock } = req.body;

      // Validate ObjectId format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid item ID format'
          }
        });
        return;
      }

      // Validate stock value
      if (typeof stock !== 'number' || stock < 0 || !Number.isInteger(stock)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STOCK',
            message: 'Stock must be a non-negative integer'
          }
        });
        return;
      }

      if (stock > 99999) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STOCK',
            message: 'Stock cannot exceed 99999'
          }
        });
        return;
      }

      const item = await FoodItem.findOneAndUpdate(
        { _id: id, isActive: true },
        { stock },
        { new: true, runValidators: true }
      ).lean();

      if (!item) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Food item not found'
          }
        });
        return;
      }

      // Broadcast stock update via WebSocket
      const websocketService = getWebSocketService();
      if (websocketService) {
        websocketService.broadcastStockUpdate(item._id.toString(), item.stock, item.name);
      }

      res.status(200).json({
        success: true,
        data: {
          item
        },
        message: 'Stock updated successfully'
      });
    } catch (error: any) {
      console.error('Update stock error:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: validationErrors
          }
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update stock'
        }
      });
    }
  }

  /**
   * Search food items by name or description
   * GET /api/inventory/search?q=apple&category=Fruit&page=1&limit=20
   */
  static async searchItems(req: Request, res: Response): Promise<void> {
    try {
      const { q, category, page = '1', limit = '20' } = req.query;
      
      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_QUERY',
            message: 'Search query must be at least 2 characters long'
          }
        });
        return;
      }

      // Parse pagination parameters
      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      // Build query filter
      const filter: any = { 
        isActive: true,
        $text: { $search: q.trim() }
      };
      
      if (category && category !== 'All') {
        // Validate category
        if (!Object.values(FoodCategory).includes(category as FoodCategory)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_CATEGORY',
              message: `Invalid category. Must be one of: ${Object.values(FoodCategory).join(', ')}`
            }
          });
          return;
        }
        filter.category = category;
      }

      // Execute search query with text score sorting
      const [items, totalCount] = await Promise.all([
        FoodItem.find(filter, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        FoodItem.countDocuments(filter)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      res.status(200).json({
        success: true,
        data: {
          items,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalItems: totalCount,
            itemsPerPage: limitNum,
            hasNextPage,
            hasPrevPage
          },
          searchQuery: q
        }
      });
    } catch (error) {
      console.error('Search items error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to search food items'
        }
      });
    }
  }
}