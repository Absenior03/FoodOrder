import { Request, Response } from 'express';
import { InventoryController } from '../controllers/inventoryController';
import { FoodItem, FoodCategory } from '../models/FoodItem';
import { AuthenticatedRequest } from '../controllers/authController';

// Mock the FoodItem model
jest.mock('../models/FoodItem');
jest.mock('../config/database');

describe('Inventory Management System', () => {
  let mockRequest: Partial<Request>;
  let mockAuthRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockFoodItems: any[];

  beforeEach(() => {
    mockRequest = {
      query: {},
      params: {},
      body: {}
    };

    mockAuthRequest = {
      query: {},
      params: {},
      body: {},
      user: undefined
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Sample food items for testing
    mockFoodItems = [
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'Red Apple',
        description: 'Fresh red apples from local farms',
        category: FoodCategory.FRUIT,
        price: 2.99,
        stock: 50,
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      },
      {
        _id: '507f1f77bcf86cd799439012',
        name: 'Organic Carrots',
        description: 'Fresh organic carrots, perfect for cooking',
        category: FoodCategory.VEGETABLE,
        price: 1.49,
        stock: 0, // Out of stock
        isActive: true,
        createdAt: new Date('2023-01-02'),
        updatedAt: new Date('2023-01-02')
      },
      {
        _id: '507f1f77bcf86cd799439013',
        name: 'Chicken Breast',
        description: 'Premium chicken breast, hormone-free',
        category: FoodCategory.NON_VEG,
        price: 8.99,
        stock: 25,
        isActive: true,
        createdAt: new Date('2023-01-03'),
        updatedAt: new Date('2023-01-03')
      },
      {
        _id: '507f1f77bcf86cd799439014',
        name: 'Whole Wheat Bread',
        description: 'Freshly baked whole wheat bread',
        category: FoodCategory.BREADS,
        price: 3.49,
        stock: 15,
        isActive: true,
        createdAt: new Date('2023-01-04'),
        updatedAt: new Date('2023-01-04')
      }
    ];

    jest.clearAllMocks();
  });

  describe('Item Retrieval with Category Filtering', () => {
    it('should retrieve all items when no category filter is applied', async () => {
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      
      MockedFoodItem.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockFoodItems)
            })
          })
        })
      });
      MockedFoodItem.countDocuments = jest.fn().mockResolvedValue(mockFoodItems.length);

      await InventoryController.getItems(mockRequest as Request, mockResponse as Response);

      expect(MockedFoodItem.find).toHaveBeenCalledWith({ isActive: true });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          items: mockFoodItems,
          pagination: expect.objectContaining({
            currentPage: 1,
            totalItems: mockFoodItems.length,
            itemsPerPage: 20
          })
        }
      });
    });

    it('should filter items by Fruit category', async () => {
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      const fruitItems = mockFoodItems.filter(item => item.category === FoodCategory.FRUIT);
      
      mockRequest.query = { category: 'Fruit' };

      MockedFoodItem.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(fruitItems)
            })
          })
        })
      });
      MockedFoodItem.countDocuments = jest.fn().mockResolvedValue(fruitItems.length);

      await InventoryController.getItems(mockRequest as Request, mockResponse as Response);

      expect(MockedFoodItem.find).toHaveBeenCalledWith({ 
        isActive: true, 
        category: 'Fruit' 
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          items: fruitItems,
          pagination: expect.objectContaining({
            totalItems: fruitItems.length
          })
        }
      });
    });

    it('should filter items by Vegetable category', async () => {
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      const vegetableItems = mockFoodItems.filter(item => item.category === FoodCategory.VEGETABLE);
      
      mockRequest.query = { category: 'Vegetable' };

      MockedFoodItem.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(vegetableItems)
            })
          })
        })
      });
      MockedFoodItem.countDocuments = jest.fn().mockResolvedValue(vegetableItems.length);

      await InventoryController.getItems(mockRequest as Request, mockResponse as Response);

      expect(MockedFoodItem.find).toHaveBeenCalledWith({ 
        isActive: true, 
        category: 'Vegetable' 
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          items: vegetableItems,
          pagination: expect.objectContaining({
            totalItems: vegetableItems.length
          })
        }
      });
    });

    it('should filter items by Non-veg category', async () => {
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      const nonVegItems = mockFoodItems.filter(item => item.category === FoodCategory.NON_VEG);
      
      mockRequest.query = { category: 'Non-veg' };

      MockedFoodItem.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(nonVegItems)
            })
          })
        })
      });
      MockedFoodItem.countDocuments = jest.fn().mockResolvedValue(nonVegItems.length);

      await InventoryController.getItems(mockRequest as Request, mockResponse as Response);

      expect(MockedFoodItem.find).toHaveBeenCalledWith({ 
        isActive: true, 
        category: 'Non-veg' 
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          items: nonVegItems,
          pagination: expect.objectContaining({
            totalItems: nonVegItems.length
          })
        }
      });
    });

    it('should filter items by Breads category', async () => {
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      const breadItems = mockFoodItems.filter(item => item.category === FoodCategory.BREADS);
      
      mockRequest.query = { category: 'Breads' };

      MockedFoodItem.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(breadItems)
            })
          })
        })
      });
      MockedFoodItem.countDocuments = jest.fn().mockResolvedValue(breadItems.length);

      await InventoryController.getItems(mockRequest as Request, mockResponse as Response);

      expect(MockedFoodItem.find).toHaveBeenCalledWith({ 
        isActive: true, 
        category: 'Breads' 
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          items: breadItems,
          pagination: expect.objectContaining({
            totalItems: breadItems.length
          })
        }
      });
    });

    it('should return all items when category is "All"', async () => {
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      
      mockRequest.query = { category: 'All' };

      MockedFoodItem.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockFoodItems)
            })
          })
        })
      });
      MockedFoodItem.countDocuments = jest.fn().mockResolvedValue(mockFoodItems.length);

      await InventoryController.getItems(mockRequest as Request, mockResponse as Response);

      expect(MockedFoodItem.find).toHaveBeenCalledWith({ isActive: true });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          items: mockFoodItems,
          pagination: expect.objectContaining({
            totalItems: mockFoodItems.length
          })
        }
      });
    });

    it('should reject invalid category filter', async () => {
      mockRequest.query = { category: 'InvalidCategory' };

      await InventoryController.getItems(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CATEGORY',
          message: expect.stringContaining('Invalid category')
        }
      });
    });

    it('should handle pagination correctly', async () => {
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      
      mockRequest.query = { page: '2', limit: '2' };

      MockedFoodItem.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockFoodItems.slice(2, 4))
            })
          })
        })
      });
      MockedFoodItem.countDocuments = jest.fn().mockResolvedValue(mockFoodItems.length);

      await InventoryController.getItems(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          items: mockFoodItems.slice(2, 4),
          pagination: expect.objectContaining({
            currentPage: 2,
            itemsPerPage: 2,
            totalItems: mockFoodItems.length,
            totalPages: 2,
            hasNextPage: false,
            hasPrevPage: true
          })
        }
      });
    });
  });

  describe('Stock Availability Checking', () => {
    it('should retrieve item with available stock', async () => {
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      const availableItem = mockFoodItems[0]; // Red Apple with stock: 50
      
      mockRequest.params = { id: '507f1f77bcf86cd799439011' };

      MockedFoodItem.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(availableItem)
      });

      await InventoryController.getItemById(mockRequest as Request, mockResponse as Response);

      expect(MockedFoodItem.findOne).toHaveBeenCalledWith({ 
        _id: '507f1f77bcf86cd799439011', 
        isActive: true 
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          item: availableItem
        }
      });
      expect(availableItem.stock).toBeGreaterThan(0);
    });

    it('should retrieve item with zero stock (out of stock)', async () => {
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      const outOfStockItem = mockFoodItems[1]; // Organic Carrots with stock: 0
      
      mockRequest.params = { id: '507f1f77bcf86cd799439012' };

      MockedFoodItem.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(outOfStockItem)
      });

      await InventoryController.getItemById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          item: outOfStockItem
        }
      });
      expect(outOfStockItem.stock).toBe(0);
    });

    it('should return 404 for non-existent item', async () => {
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      
      mockRequest.params = { id: '507f1f77bcf86cd799439999' };

      MockedFoodItem.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      await InventoryController.getItemById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: 'Food item not found'
        }
      });
    });

    it('should reject invalid item ID format', async () => {
      mockRequest.params = { id: 'invalid-id' };

      await InventoryController.getItemById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid item ID format'
        }
      });
    });

    it('should retrieve categories with stock counts', async () => {
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      
      const mockCategoryCounts = [
        { _id: 'Fruit', count: 1, availableItems: 1 },
        { _id: 'Vegetable', count: 1, availableItems: 0 },
        { _id: 'Non-veg', count: 1, availableItems: 1 },
        { _id: 'Breads', count: 1, availableItems: 1 }
      ];

      MockedFoodItem.aggregate = jest.fn().mockResolvedValue(mockCategoryCounts);

      await InventoryController.getCategories(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          categories: expect.arrayContaining([
            expect.objectContaining({
              name: 'All',
              value: 'All',
              count: 4,
              availableItems: 3
            }),
            expect.objectContaining({
              name: 'Fruit',
              availableItems: 1
            }),
            expect.objectContaining({
              name: 'Vegetable',
              availableItems: 0
            })
          ])
        }
      });
    });
  });

  describe('Inventory Update Operations', () => {
    beforeEach(() => {
      mockAuthRequest.user = {
        _id: '507f1f77bcf86cd799439020',
        email: 'admin@example.com',
        password: 'hashedpassword',
        firstName: 'Admin',
        lastName: 'User',
        createdAt: new Date(),
        updatedAt: new Date(),
        comparePassword: jest.fn()
      } as any;
    });

    it('should update item stock successfully', async () => {
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      const updatedItem = { ...mockFoodItems[0], stock: 75 };
      
      mockAuthRequest.params = { id: '507f1f77bcf86cd799439011' };
      mockAuthRequest.body = { stock: 75 };

      MockedFoodItem.findOneAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedItem)
      });

      await InventoryController.updateStock(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(MockedFoodItem.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439011', isActive: true },
        { stock: 75 },
        { new: true, runValidators: true }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          item: updatedItem
        },
        message: 'Stock updated successfully'
      });
    });

    it('should update stock to zero (mark as out of stock)', async () => {
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      const updatedItem = { ...mockFoodItems[0], stock: 0 };
      
      mockAuthRequest.params = { id: '507f1f77bcf86cd799439011' };
      mockAuthRequest.body = { stock: 0 };

      MockedFoodItem.findOneAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedItem)
      });

      await InventoryController.updateStock(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(MockedFoodItem.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439011', isActive: true },
        { stock: 0 },
        { new: true, runValidators: true }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(updatedItem.stock).toBe(0);
    });

    it('should reject negative stock values', async () => {
      mockAuthRequest.params = { id: '507f1f77bcf86cd799439011' };
      mockAuthRequest.body = { stock: -5 };

      await InventoryController.updateStock(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_STOCK',
          message: 'Stock must be a non-negative integer'
        }
      });
    });

    it('should reject non-integer stock values', async () => {
      mockAuthRequest.params = { id: '507f1f77bcf86cd799439011' };
      mockAuthRequest.body = { stock: 10.5 };

      await InventoryController.updateStock(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_STOCK',
          message: 'Stock must be a non-negative integer'
        }
      });
    });

    it('should reject stock values exceeding maximum limit', async () => {
      mockAuthRequest.params = { id: '507f1f77bcf86cd799439011' };
      mockAuthRequest.body = { stock: 100000 };

      await InventoryController.updateStock(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_STOCK',
          message: 'Stock cannot exceed 99999'
        }
      });
    });

    it('should return 404 when updating non-existent item', async () => {
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      
      mockAuthRequest.params = { id: '507f1f77bcf86cd799439999' };
      mockAuthRequest.body = { stock: 50 };

      MockedFoodItem.findOneAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      await InventoryController.updateStock(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: 'Food item not found'
        }
      });
    });

    it('should reject invalid item ID format for stock update', async () => {
      mockAuthRequest.params = { id: 'invalid-id' };
      mockAuthRequest.body = { stock: 50 };

      await InventoryController.updateStock(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid item ID format'
        }
      });
    });

    it('should handle database validation errors during stock update', async () => {
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      (validationError as any).errors = {
        stock: { message: 'Stock must be a positive number' }
      };
      
      mockAuthRequest.params = { id: '507f1f77bcf86cd799439011' };
      mockAuthRequest.body = { stock: 50 };

      MockedFoodItem.findOneAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockRejectedValue(validationError)
      });

      await InventoryController.updateStock(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: ['Stock must be a positive number']
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors during item retrieval', async () => {
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      
      MockedFoodItem.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockRejectedValue(new Error('Database connection failed'))
            })
          })
        })
      });

      await InventoryController.getItems(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve food items'
        }
      });
    });

    it('should handle database errors during category retrieval', async () => {
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      
      MockedFoodItem.aggregate = jest.fn().mockRejectedValue(new Error('Database error'));

      await InventoryController.getCategories(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve categories'
        }
      });
    });

    it('should handle database errors during stock update', async () => {
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      
      mockAuthRequest.params = { id: '507f1f77bcf86cd799439011' };
      mockAuthRequest.body = { stock: 50 };
      mockAuthRequest.user = {
        _id: '507f1f77bcf86cd799439020',
        email: 'admin@example.com',
        password: 'hashedpassword',
        firstName: 'Admin',
        lastName: 'User',
        createdAt: new Date(),
        updatedAt: new Date(),
        comparePassword: jest.fn()
      } as any;

      MockedFoodItem.findOneAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await InventoryController.updateStock(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update stock'
        }
      });
    });
  });
});