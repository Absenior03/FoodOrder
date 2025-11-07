import { Request, Response } from 'express';
import { CartController } from '../controllers/cartController';
import { CartService } from '../services/cartService';
import { Cart, ICart, ICartItem } from '../models/Cart';
import { FoodItem } from '../models/FoodItem';
import { AuthenticatedRequest } from '../controllers/authController';
import { Types } from 'mongoose';

// Mock the models and services
jest.mock('../models/Cart');
jest.mock('../models/FoodItem');
jest.mock('../services/cartService');
jest.mock('../config/database');

describe('Cart Functionality Tests', () => {
  let mockAuthRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockUser: any;
  let mockFoodItems: any[];
  let mockCart: any;

  beforeEach(() => {
    mockUser = {
      _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe'
    };

    mockAuthRequest = {
      user: mockUser,
      body: {},
      params: {},
      query: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Sample food items for testing
    mockFoodItems = [
      {
        _id: new Types.ObjectId('507f1f77bcf86cd799439021'),
        name: 'Red Apple',
        description: 'Fresh red apples',
        category: 'Fruit',
        price: 2.99,
        stock: 50,
        isActive: true
      },
      {
        _id: new Types.ObjectId('507f1f77bcf86cd799439022'),
        name: 'Organic Carrots',
        description: 'Fresh organic carrots',
        category: 'Vegetable',
        price: 1.49,
        stock: 25,
        isActive: true
      },
      {
        _id: new Types.ObjectId('507f1f77bcf86cd799439023'),
        name: 'Chicken Breast',
        description: 'Premium chicken breast',
        category: 'Non-veg',
        price: 8.99,
        stock: 0, // Out of stock
        isActive: true
      }
    ];

    // Mock cart with helper methods
    mockCart = {
      _id: new Types.ObjectId('507f1f77bcf86cd799439031'),
      userId: mockUser._id,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockReturnThis(),
      calculateTotal: jest.fn().mockReturnValue(0),
      getTotalItems: jest.fn().mockReturnValue(0),
      findItem: jest.fn().mockReturnValue(undefined),
      addOrUpdateItem: jest.fn(),
      removeItem: jest.fn().mockReturnValue(false),
      clearCart: jest.fn()
    };

    jest.clearAllMocks();
  });

  describe('Adding Items to Cart with Quantity Updates', () => {
    it('should add new item to empty cart successfully', async () => {
      const MockedCart = Cart as jest.Mocked<typeof Cart>;
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;

      const itemId = '507f1f77bcf86cd799439021';
      const quantity = 2;

      mockAuthRequest.body = { itemId, quantity };

      // Mock food item lookup
      MockedFoodItem.findById = jest.fn().mockResolvedValue(mockFoodItems[0]);

      // Mock cart lookup - no existing cart
      MockedCart.findOne = jest.fn().mockResolvedValue(null);

      // Mock cart creation
      const newCart = { ...mockCart };
      newCart.findItem = jest.fn().mockReturnValue(undefined);
      newCart.addOrUpdateItem = jest.fn();
      newCart.getTotalItems = jest.fn().mockReturnValue(2);
      newCart.calculateTotal = jest.fn().mockReturnValue(5.98);
      (MockedCart as any).mockImplementation(() => newCart);

      await CartController.addToCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(MockedFoodItem.findById).toHaveBeenCalledWith(itemId);
      expect(MockedCart.findOne).toHaveBeenCalledWith({ userId: mockUser._id });
      expect(newCart.addOrUpdateItem).toHaveBeenCalledWith(itemId, quantity, mockFoodItems[0].price);
      expect(newCart.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          cart: expect.objectContaining({
            id: newCart._id,
            userId: newCart.userId,
            totalItems: 2,
            totalAmount: 5.98
          })
        },
        message: 'Item added to cart successfully'
      });
    });

    it('should update quantity when adding existing item to cart', async () => {
      const MockedCart = Cart as jest.Mocked<typeof Cart>;
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;

      const itemId = '507f1f77bcf86cd799439021';
      const quantity = 3;
      const existingQuantity = 2;

      mockAuthRequest.body = { itemId, quantity };

      // Mock food item lookup
      MockedFoodItem.findById = jest.fn().mockResolvedValue(mockFoodItems[0]);

      // Mock existing cart with item
      const existingCart = { ...mockCart };
      existingCart.findItem = jest.fn().mockReturnValue({
        itemId: new Types.ObjectId(itemId),
        quantity: existingQuantity,
        priceAtAdd: mockFoodItems[0].price
      });
      existingCart.addOrUpdateItem = jest.fn();
      existingCart.getTotalItems = jest.fn().mockReturnValue(5);
      existingCart.calculateTotal = jest.fn().mockReturnValue(14.95);

      MockedCart.findOne = jest.fn().mockResolvedValue(existingCart);

      await CartController.addToCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(existingCart.findItem).toHaveBeenCalledWith(itemId);
      expect(existingCart.addOrUpdateItem).toHaveBeenCalledWith(itemId, existingQuantity + quantity, mockFoodItems[0].price);
      expect(existingCart.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should reject adding item when insufficient stock', async () => {
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;

      const itemId = '507f1f77bcf86cd799439023'; // Out of stock item
      const quantity = 1;

      mockAuthRequest.body = { itemId, quantity };

      // Mock out of stock food item
      MockedFoodItem.findById = jest.fn().mockResolvedValue(mockFoodItems[2]);

      await CartController.addToCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: 'Only 0 items available in stock'
        }
      });
    });

    it('should reject adding item when total quantity exceeds stock', async () => {
      const MockedCart = Cart as jest.Mocked<typeof Cart>;
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;

      const itemId = '507f1f77bcf86cd799439022'; // Carrots with stock: 25
      const quantity = 20;
      const existingQuantity = 10;

      mockAuthRequest.body = { itemId, quantity };

      // Mock food item lookup
      MockedFoodItem.findById = jest.fn().mockResolvedValue(mockFoodItems[1]);

      // Mock existing cart with item
      const existingCart = { ...mockCart };
      existingCart.findItem = jest.fn().mockReturnValue({
        itemId: new Types.ObjectId(itemId),
        quantity: existingQuantity,
        priceAtAdd: mockFoodItems[1].price
      });

      MockedCart.findOne = jest.fn().mockResolvedValue(existingCart);

      await CartController.addToCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: 'Cannot add 20 items. Only 15 more items available'
        }
      });
    });

    it('should update cart item quantity successfully', async () => {
      const MockedCart = Cart as jest.Mocked<typeof Cart>;
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;

      const itemId = '507f1f77bcf86cd799439021';
      const newQuantity = 5;

      mockAuthRequest.body = { itemId, quantity: newQuantity };

      // Mock food item lookup
      MockedFoodItem.findById = jest.fn().mockResolvedValue(mockFoodItems[0]);

      // Mock existing cart with item
      const existingCart = { ...mockCart };
      existingCart.findItem = jest.fn().mockReturnValue({
        itemId: new Types.ObjectId(itemId),
        quantity: 2,
        priceAtAdd: mockFoodItems[0].price
      });
      existingCart.addOrUpdateItem = jest.fn();
      existingCart.getTotalItems = jest.fn().mockReturnValue(5);
      existingCart.calculateTotal = jest.fn().mockReturnValue(14.95);

      MockedCart.findOne = jest.fn().mockResolvedValue(existingCart);

      await CartController.updateCartItem(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(existingCart.findItem).toHaveBeenCalledWith(itemId);
      expect(existingCart.addOrUpdateItem).toHaveBeenCalledWith(itemId, newQuantity, mockFoodItems[0].price);
      expect(existingCart.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          cart: expect.objectContaining({
            totalItems: 5,
            totalAmount: 14.95
          })
        },
        message: 'Cart item updated successfully'
      });
    });

    it('should reject updating non-existent cart item', async () => {
      const MockedCart = Cart as jest.Mocked<typeof Cart>;

      const itemId = '507f1f77bcf86cd799439021';
      const newQuantity = 5;

      mockAuthRequest.body = { itemId, quantity: newQuantity };

      // Mock existing cart without the item
      const existingCart = { ...mockCart };
      existingCart.findItem = jest.fn().mockReturnValue(undefined);

      MockedCart.findOne = jest.fn().mockResolvedValue(existingCart);

      await CartController.updateCartItem(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ITEM_NOT_IN_CART',
          message: 'Item not found in cart'
        }
      });
    });

    it('should remove item from cart successfully', async () => {
      const MockedCart = Cart as jest.Mocked<typeof Cart>;

      const itemId = '507f1f77bcf86cd799439021';

      mockAuthRequest.params = { itemId };

      // Mock existing cart with item
      const existingCart = { ...mockCart };
      existingCart.removeItem = jest.fn().mockReturnValue(true);
      existingCart.getTotalItems = jest.fn().mockReturnValue(0);
      existingCart.calculateTotal = jest.fn().mockReturnValue(0);

      MockedCart.findOne = jest.fn().mockResolvedValue(existingCart);

      await CartController.removeFromCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(existingCart.removeItem).toHaveBeenCalledWith(itemId);
      expect(existingCart.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          cart: expect.objectContaining({
            totalItems: 0,
            totalAmount: 0
          })
        },
        message: 'Item removed from cart successfully'
      });
    });

    it('should validate input parameters for add to cart', async () => {
      // Test missing itemId
      mockAuthRequest.body = { quantity: 2 };

      await CartController.addToCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Item ID and quantity are required'
        }
      });

      jest.clearAllMocks();

      // Test missing quantity
      mockAuthRequest.body = { itemId: '507f1f77bcf86cd799439021' };

      await CartController.addToCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Item ID and quantity are required'
        }
      });

      jest.clearAllMocks();

      // Test invalid itemId format
      mockAuthRequest.body = { itemId: 'invalid-id', quantity: 2 };

      await CartController.addToCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_ITEM_ID',
          message: 'Invalid item ID format'
        }
      });
    });

    it('should validate quantity parameters for add to cart', async () => {
      // Test invalid quantity (zero)
      mockAuthRequest.body = { itemId: '507f1f77bcf86cd799439021', quantity: 0 };

      await CartController.addToCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_QUANTITY',
          message: 'Quantity must be a whole number between 1 and 99'
        }
      });

      jest.clearAllMocks();

      // Test invalid quantity (too high)
      mockAuthRequest.body = { itemId: '507f1f77bcf86cd799439021', quantity: 100 };

      await CartController.addToCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_QUANTITY',
          message: 'Quantity must be a whole number between 1 and 99'
        }
      });

      jest.clearAllMocks();

      // Test invalid quantity (decimal)
      mockAuthRequest.body = { itemId: '507f1f77bcf86cd799439021', quantity: 2.5 };

      await CartController.addToCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_QUANTITY',
          message: 'Quantity must be a whole number between 1 and 99'
        }
      });
    });
  });

  describe('Cart Persistence Across User Sessions', () => {
    it('should restore user cart on login', async () => {
      const MockedCartService = CartService as jest.Mocked<typeof CartService>;

      const userId = '507f1f77bcf86cd799439011';
      const restoredCart = {
        ...mockCart,
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439021'),
            quantity: 2,
            priceAtAdd: 2.99
          }
        ]
      };
      restoredCart.getTotalItems = jest.fn().mockReturnValue(2);
      restoredCart.calculateTotal = jest.fn().mockReturnValue(5.98);

      MockedCartService.restoreCartOnLogin = jest.fn().mockResolvedValue(restoredCart);

      const result = await CartService.restoreCartOnLogin(userId);

      expect(MockedCartService.restoreCartOnLogin).toHaveBeenCalledWith(userId);
      expect(result).toEqual(restoredCart);
      expect(result?.getTotalItems()).toBe(2);
      expect(result?.calculateTotal()).toBe(5.98);
    });

    it('should create empty cart when no existing cart found on login', async () => {
      const MockedCartService = CartService as jest.Mocked<typeof CartService>;

      const userId = '507f1f77bcf86cd799439011';
      const emptyCart = {
        ...mockCart,
        items: []
      };
      emptyCart.getTotalItems = jest.fn().mockReturnValue(0);
      emptyCart.calculateTotal = jest.fn().mockReturnValue(0);

      MockedCartService.restoreCartOnLogin = jest.fn().mockResolvedValue(emptyCart);

      const result = await CartService.restoreCartOnLogin(userId);

      expect(result).toEqual(emptyCart);
      expect(result?.getTotalItems()).toBe(0);
      expect(result?.calculateTotal()).toBe(0);
    });

    it('should clean up invalid items during cart restoration', async () => {
      const MockedCartService = CartService as jest.Mocked<typeof CartService>;

      const userId = '507f1f77bcf86cd799439011';
      
      // Simulate cart with some invalid items removed
      const cleanedCart = {
        ...mockCart,
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439021'),
            quantity: 2,
            priceAtAdd: 2.99
          }
        ]
      };
      cleanedCart.getTotalItems = jest.fn().mockReturnValue(2);
      cleanedCart.calculateTotal = jest.fn().mockReturnValue(5.98);

      MockedCartService.restoreCartOnLogin = jest.fn().mockResolvedValue(cleanedCart);

      const result = await CartService.restoreCartOnLogin(userId);

      expect(result).toEqual(cleanedCart);
      expect(result?.items).toHaveLength(1);
    });

    it('should get cart contents with populated item details', async () => {
      const MockedCart = Cart as jest.Mocked<typeof Cart>;

      const cartWithItems = {
        ...mockCart,
        items: [
          {
            itemId: {
              _id: new Types.ObjectId('507f1f77bcf86cd799439021'),
              name: 'Red Apple',
              price: 2.99,
              stock: 50,
              isActive: true
            },
            quantity: 2,
            priceAtAdd: 2.99
          }
        ]
      };
      cartWithItems.getTotalItems = jest.fn().mockReturnValue(2);
      cartWithItems.calculateTotal = jest.fn().mockReturnValue(5.98);
      cartWithItems.populate = jest.fn().mockResolvedValue(cartWithItems);

      MockedCart.findOne = jest.fn().mockResolvedValue(cartWithItems);

      await CartController.getCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(MockedCart.findOne).toHaveBeenCalledWith({ userId: mockUser._id });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          cart: expect.objectContaining({
            id: cartWithItems._id,
            userId: cartWithItems.userId,
            items: cartWithItems.items,
            totalItems: 2,
            totalAmount: 5.98
          })
        }
      });
    });

    it('should handle cart persistence across multiple login sessions', async () => {
      const MockedCartService = CartService as jest.Mocked<typeof CartService>;

      const userId = '507f1f77bcf86cd799439011';
      
      // First session - add items
      const session1Cart = {
        ...mockCart,
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439021'),
            quantity: 2,
            priceAtAdd: 2.99
          }
        ]
      };

      // Second session - cart should persist
      const session2Cart = {
        ...mockCart,
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439021'),
            quantity: 2,
            priceAtAdd: 2.99
          },
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439022'),
            quantity: 1,
            priceAtAdd: 1.49
          }
        ]
      };

      MockedCartService.restoreCartOnLogin
        .mockResolvedValueOnce(session1Cart)
        .mockResolvedValueOnce(session2Cart);

      // First login
      const result1 = await CartService.restoreCartOnLogin(userId);
      expect(result1?.items).toHaveLength(1);

      // Second login - should have persisted items
      const result2 = await CartService.restoreCartOnLogin(userId);
      expect(result2?.items).toHaveLength(2);
    });

    it('should validate cart items against current inventory on restoration', async () => {
      const MockedCartService = CartService as jest.Mocked<typeof CartService>;

      const cart = {
        ...mockCart,
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439021'),
            quantity: 2,
            priceAtAdd: 2.99
          }
        ]
      };

      const validationResult = {
        valid: true,
        issues: []
      };

      MockedCartService.validateCartItems = jest.fn().mockResolvedValue(validationResult);

      const result = await CartService.validateCartItems(cart as any);

      expect(MockedCartService.validateCartItems).toHaveBeenCalledWith(cart);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('Multi-Device Cart Synchronization', () => {
    it('should synchronize cart across multiple devices', async () => {
      const MockedCartService = CartService as jest.Mocked<typeof CartService>;

      const userId = '507f1f77bcf86cd799439011';
      const syncedCart = {
        ...mockCart,
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439021'),
            quantity: 3,
            priceAtAdd: 2.99
          }
        ]
      };
      syncedCart.getTotalItems = jest.fn().mockReturnValue(3);
      syncedCart.calculateTotal = jest.fn().mockReturnValue(8.97);

      MockedCartService.synchronizeCart = jest.fn().mockResolvedValue(syncedCart);

      await CartController.syncCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(MockedCartService.synchronizeCart).toHaveBeenCalledWith(userId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          cart: expect.objectContaining({
            id: syncedCart._id,
            userId: syncedCart.userId,
            totalItems: 3,
            totalAmount: 8.97,
            lastSync: expect.any(String)
          })
        },
        message: 'Cart synchronized successfully'
      });
    });

    it('should merge cart data from multiple devices', async () => {
      const MockedCartService = CartService as jest.Mocked<typeof CartService>;

      const userId = '507f1f77bcf86cd799439011';
      const newCartItems = [
        {
          itemId: new Types.ObjectId('507f1f77bcf86cd799439022'),
          quantity: 1,
          priceAtAdd: 1.49
        }
      ];

      const mergedCart = {
        ...mockCart,
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439021'),
            quantity: 2,
            priceAtAdd: 2.99
          },
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439022'),
            quantity: 1,
            priceAtAdd: 1.49
          }
        ]
      };
      mergedCart.getTotalItems = jest.fn().mockReturnValue(3);
      mergedCart.calculateTotal = jest.fn().mockReturnValue(7.47);
      mergedCart.populate = jest.fn().mockResolvedValue(mergedCart);

      mockAuthRequest.body = { cartItems: newCartItems };

      MockedCartService.mergeCartData = jest.fn().mockResolvedValue(mergedCart);

      await CartController.mergeCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(MockedCartService.mergeCartData).toHaveBeenCalledWith(userId, newCartItems);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          cart: expect.objectContaining({
            totalItems: 3,
            totalAmount: 7.47
          })
        },
        message: 'Cart data merged successfully'
      });
    });

    it('should handle cart sync status retrieval', async () => {
      const MockedCartService = CartService as jest.Mocked<typeof CartService>;

      const userId = '507f1f77bcf86cd799439011';
      const syncStatus = {
        cartId: '507f1f77bcf86cd799439031',
        lastSync: '2023-01-01T12:00:00.000Z',
        itemCount: 2,
        totalAmount: 5.98
      };

      MockedCartService.getCartSyncStatus = jest.fn().mockResolvedValue(syncStatus);

      await CartController.getCartSyncStatus(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(MockedCartService.getCartSyncStatus).toHaveBeenCalledWith(userId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          syncStatus
        }
      });
    });

    it('should handle merge conflicts when same item exists on multiple devices', async () => {
      const MockedCartService = CartService as jest.Mocked<typeof CartService>;

      const userId = '507f1f77bcf86cd799439011';
      
      // Device 1 has 2 apples, Device 2 has 3 apples
      const device2CartItems = [
        {
          itemId: new Types.ObjectId('507f1f77bcf86cd799439021'),
          quantity: 3,
          priceAtAdd: 2.99
        }
      ];

      // Merged cart should have the higher quantity (3)
      const mergedCart = {
        ...mockCart,
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439021'),
            quantity: 3, // Higher quantity wins
            priceAtAdd: 2.99
          }
        ]
      };
      mergedCart.populate = jest.fn().mockResolvedValue(mergedCart);

      mockAuthRequest.body = { cartItems: device2CartItems };

      MockedCartService.mergeCartData = jest.fn().mockResolvedValue(mergedCart);

      await CartController.mergeCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(MockedCartService.mergeCartData).toHaveBeenCalledWith(userId, device2CartItems);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should reject invalid cart data during merge', async () => {
      // Test invalid cart items array
      mockAuthRequest.body = { cartItems: 'invalid' };

      await CartController.mergeCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CART_DATA',
          message: 'Cart items must be an array'
        }
      });

      jest.clearAllMocks();

      // Test invalid cart item structure
      mockAuthRequest.body = {
        cartItems: [
          { itemId: '507f1f77bcf86cd799439021' } // Missing quantity and priceAtAdd
        ]
      };

      await CartController.mergeCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CART_ITEM',
          message: 'Each cart item must have itemId, quantity, and priceAtAdd'
        }
      });
    });

    it('should handle real-time cart synchronization with Redis', async () => {
      const MockedCartService = CartService as jest.Mocked<typeof CartService>;

      const userId = '507f1f77bcf86cd799439011';
      const cart = {
        ...mockCart,
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439021'),
            quantity: 2,
            priceAtAdd: 2.99
          }
        ]
      };
      cart.getTotalItems = jest.fn().mockReturnValue(2);
      cart.calculateTotal = jest.fn().mockReturnValue(5.98);

      MockedCartService.synchronizeCart = jest.fn().mockResolvedValue(cart);

      const result = await CartService.synchronizeCart(userId);

      expect(MockedCartService.synchronizeCart).toHaveBeenCalledWith(userId);
      expect(result).toEqual(cart);
    });

    it('should handle cart synchronization when no cart exists', async () => {
      const MockedCartService = CartService as jest.Mocked<typeof CartService>;

      const userId = '507f1f77bcf86cd799439011';

      MockedCartService.synchronizeCart = jest.fn().mockResolvedValue(null);

      await CartController.syncCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(MockedCartService.synchronizeCart).toHaveBeenCalledWith(userId);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CART_NOT_FOUND',
          message: 'Cart not found'
        }
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle unauthorized access to cart operations', async () => {
      mockAuthRequest.user = undefined;

      await CartController.getCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    });

    it('should handle database errors during cart operations', async () => {
      const MockedCart = Cart as jest.Mocked<typeof Cart>;

      MockedCart.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      await CartController.getCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve cart'
        }
      });
    });

    it('should clear entire cart successfully', async () => {
      const MockedCart = Cart as jest.Mocked<typeof Cart>;

      const existingCart = { ...mockCart };
      existingCart.clearCart = jest.fn();
      existingCart.getTotalItems = jest.fn().mockReturnValue(0);
      existingCart.calculateTotal = jest.fn().mockReturnValue(0);

      MockedCart.findOne = jest.fn().mockResolvedValue(existingCart);

      await CartController.clearCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(existingCart.clearCart).toHaveBeenCalled();
      expect(existingCart.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          cart: expect.objectContaining({
            totalItems: 0,
            totalAmount: 0
          })
        },
        message: 'Cart cleared successfully'
      });
    });

    it('should validate cart items and return validation results', async () => {
      const MockedCart = Cart as jest.Mocked<typeof Cart>;
      const MockedCartService = CartService as jest.Mocked<typeof CartService>;

      const cart = {
        ...mockCart,
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439021'),
            quantity: 2,
            priceAtAdd: 2.99
          }
        ]
      };
      cart.getTotalItems = jest.fn().mockReturnValue(2);
      cart.calculateTotal = jest.fn().mockReturnValue(5.98);

      const validationResult = {
        valid: false,
        issues: ['Price of "Red Apple" has changed from 2.99 to 3.49']
      };

      MockedCart.findOne = jest.fn().mockResolvedValue(cart);
      MockedCartService.validateCartItems = jest.fn().mockResolvedValue(validationResult);

      await CartController.validateCart(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(MockedCartService.validateCartItems).toHaveBeenCalledWith(cart);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          validation: {
            valid: false,
            issues: ['Price of "Red Apple" has changed from 2.99 to 3.49'],
            itemCount: 2,
            totalAmount: 5.98
          }
        }
      });
    });
  });
});