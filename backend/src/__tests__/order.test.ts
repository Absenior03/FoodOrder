import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { OrderController } from '../controllers/orderController';
import { Order, OrderStatus, PaymentStatus } from '../models/Order';
import { Cart } from '../models/Cart';
import { FoodItem } from '../models/FoodItem';
import { AuthenticatedRequest } from '../controllers/authController';
import { Types } from 'mongoose';

// Mock the models and database operations
jest.mock('../models/Order');
jest.mock('../models/Cart');
jest.mock('../models/FoodItem');
jest.mock('../config/database');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234-5678-9012')
}));

// Mock mongoose session
jest.mock('mongoose', () => ({
  ...jest.requireActual('mongoose'),
  startSession: jest.fn()
}));

describe('Checkout and Order Tests - Requirements 4.1, 4.2, 4.5', () => {
  let mockAuthRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockUser: any;
  let mockSession: any;

  beforeEach(() => {
    // Initialize mock session
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn()
    };

    // Setup mongoose mock
    (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);

    mockUser = {
      _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe'
    };

    mockAuthRequest = {
      user: mockUser,
      body: {
        deliveryAddress: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345'
        }
      },
      params: {},
      query: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  describe('Stock Validation During Checkout Process (Requirement 4.1)', () => {
    it('should validate stock availability and reject checkout when insufficient stock', async () => {
      const MockedCart = Cart as jest.Mocked<typeof Cart>;
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;

      // Mock cart with items
      const mockCart = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439031'),
        userId: mockUser._id,
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439021'),
            quantity: 10, // Requesting more than available
            priceAtAdd: 2.99
          }
        ],
        clearCart: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock food item with limited stock
      const mockFoodItem = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439021'),
        name: 'Red Apple',
        price: 2.99,
        stock: 5, // Only 5 available but requesting 10
        isActive: true
      };

      // Setup mocks
      MockedCart.findOne = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCart)
      });
      MockedFoodItem.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(mockFoodItem)
      });

      await OrderController.checkout(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      // Verify stock validation failed
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'STOCK_VALIDATION_FAILED',
          message: 'Some items in your cart are no longer available or have insufficient stock',
          details: expect.arrayContaining([
            expect.objectContaining({
              itemId: mockFoodItem._id,
              name: mockFoodItem.name,
              requestedQuantity: 10,
              availableStock: 5,
              issue: 'Insufficient stock. Only 5 items available'
            })
          ])
        }
      });
    });

    it('should validate stock availability and proceed when stock is sufficient', async () => {
      const MockedCart = Cart as jest.Mocked<typeof Cart>;
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      const MockedOrder = Order as jest.Mocked<typeof Order>;

      // Mock cart with items
      const mockCart = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439031'),
        userId: mockUser._id,
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439021'),
            quantity: 2, // Within available stock
            priceAtAdd: 2.99
          }
        ],
        clearCart: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock food item with sufficient stock
      const mockFoodItem = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439021'),
        name: 'Red Apple',
        price: 2.99,
        stock: 50, // Plenty available
        isActive: true
      };

      // Mock order creation
      const mockOrder = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439041'),
        orderId: 'ORD-TEST-001',
        userId: mockUser._id,
        totalAmount: 5.98,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        updatePaymentStatus: jest.fn(),
        updateStatus: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
        createdAt: new Date()
      };

      // Setup mocks
      MockedCart.findOne = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCart)
      });
      MockedFoodItem.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(mockFoodItem)
      });
      MockedFoodItem.findByIdAndUpdate = jest.fn().mockResolvedValue(true);
      (MockedOrder as any).mockImplementation(() => mockOrder);

      await OrderController.checkout(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      // Verify successful checkout
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          order: expect.objectContaining({
            orderId: mockOrder.orderId,
            totalAmount: 5.98,
            status: OrderStatus.PENDING
          })
        },
        message: 'Order placed successfully'
      });
    });
  });

  describe('Order Creation and Inventory Deduction (Requirement 4.2)', () => {
    it('should create order and deduct inventory stock successfully', async () => {
      const MockedCart = Cart as jest.Mocked<typeof Cart>;
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      const MockedOrder = Order as jest.Mocked<typeof Order>;

      // Mock cart with multiple items
      const mockCart = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439031'),
        userId: mockUser._id,
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439021'),
            quantity: 3,
            priceAtAdd: 2.99
          },
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439022'),
            quantity: 2,
            priceAtAdd: 1.49
          }
        ],
        clearCart: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock food items
      const mockFoodItems = [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439021'),
          name: 'Red Apple',
          price: 2.99,
          stock: 50,
          isActive: true
        },
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439022'),
          name: 'Organic Carrots',
          price: 1.49,
          stock: 25,
          isActive: true
        }
      ];

      // Mock order
      const mockOrder = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439041'),
        orderId: 'ORD-TEST-001',
        save: jest.fn().mockResolvedValue(true),
        updatePaymentStatus: jest.fn(),
        updateStatus: jest.fn(),
        createdAt: new Date()
      };

      // Setup mocks
      MockedCart.findOne = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCart)
      });
      MockedFoodItem.findById = jest.fn()
        .mockReturnValueOnce({ session: jest.fn().mockResolvedValue(mockFoodItems[0]) })
        .mockReturnValueOnce({ session: jest.fn().mockResolvedValue(mockFoodItems[1]) });
      MockedFoodItem.findByIdAndUpdate = jest.fn().mockResolvedValue(true);
      (MockedOrder as any).mockImplementation(() => mockOrder);

      await OrderController.checkout(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      // Verify inventory deduction
      expect(MockedFoodItem.findByIdAndUpdate).toHaveBeenCalledWith(
        mockFoodItems[0]._id,
        { $inc: { stock: -3 } },
        { session: mockSession }
      );
      expect(MockedFoodItem.findByIdAndUpdate).toHaveBeenCalledWith(
        mockFoodItems[1]._id,
        { $inc: { stock: -2 } },
        { session: mockSession }
      );

      // Verify order creation with correct total
      expect(MockedOrder).toHaveBeenCalledWith(expect.objectContaining({
        userId: mockUser._id,
        totalAmount: 11.95, // (3 * 2.99) + (2 * 1.49) = 8.97 + 2.98 = 11.95
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING
      }));

      // Verify cart is cleared
      expect(mockCart.clearCart).toHaveBeenCalled();
      expect(mockCart.save).toHaveBeenCalled();

      // Verify transaction commit
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it('should rollback transaction when inventory deduction fails', async () => {
      const MockedCart = Cart as jest.Mocked<typeof Cart>;
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;

      // Mock cart
      const mockCart = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439031'),
        userId: mockUser._id,
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439021'),
            quantity: 2,
            priceAtAdd: 2.99
          }
        ],
        clearCart: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock food item
      const mockFoodItem = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439021'),
        name: 'Red Apple',
        price: 2.99,
        stock: 50,
        isActive: true
      };

      // Setup mocks
      MockedCart.findOne = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCart)
      });
      MockedFoodItem.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(mockFoodItem)
      });
      // Mock inventory update failure
      MockedFoodItem.findByIdAndUpdate = jest.fn().mockRejectedValue(
        new Error('Database error during inventory update')
      );

      await OrderController.checkout(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      // Verify transaction rollback
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CHECKOUT_FAILED',
          message: 'Failed to process checkout. Please try again.'
        }
      });
    });
  });

  describe('Concurrent Checkout Scenarios (Requirement 4.5)', () => {
    it('should handle concurrent checkout attempts with first-come-first-served basis', async () => {
      const MockedCart = Cart as jest.Mocked<typeof Cart>;
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      const MockedOrder = Order as jest.Mocked<typeof Order>;

      // Mock limited stock item
      const limitedStockItem = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439021'),
        name: 'Limited Item',
        price: 9.99,
        stock: 1, // Only 1 item available
        isActive: true
      };

      // First user's cart
      const user1Cart = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439031'),
        userId: mockUser._id,
        items: [
          {
            itemId: limitedStockItem._id,
            quantity: 1,
            priceAtAdd: 9.99
          }
        ],
        clearCart: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock successful first checkout
      MockedCart.findOne = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(user1Cart)
      });
      MockedFoodItem.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(limitedStockItem)
      });
      MockedFoodItem.findByIdAndUpdate = jest.fn().mockResolvedValue(true);

      const mockOrder = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439041'),
        orderId: 'ORD-TEST-001',
        save: jest.fn().mockResolvedValue(true),
        updatePaymentStatus: jest.fn(),
        updateStatus: jest.fn(),
        createdAt: new Date()
      };
      (MockedOrder as any).mockImplementation(() => mockOrder);

      // First user checkout should succeed
      await OrderController.checkout(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(MockedFoodItem.findByIdAndUpdate).toHaveBeenCalledWith(
        limitedStockItem._id,
        { $inc: { stock: -1 } },
        { session: mockSession }
      );

      // Reset mocks for second user
      jest.clearAllMocks();
      (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);

      // Second user's cart (same item)
      const user2Cart = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439032'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        items: [
          {
            itemId: limitedStockItem._id,
            quantity: 1,
            priceAtAdd: 9.99
          }
        ],
        clearCart: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock out of stock item for second user
      const outOfStockItem = { ...limitedStockItem, stock: 0 };

      MockedCart.findOne = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(user2Cart)
      });
      MockedFoodItem.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(outOfStockItem)
      });

      const mockAuthRequest2 = {
        ...mockAuthRequest,
        user: { _id: new Types.ObjectId('507f1f77bcf86cd799439012') }
      };

      // Second user checkout should fail
      await OrderController.checkout(mockAuthRequest2 as AuthenticatedRequest, mockResponse as Response);

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'STOCK_VALIDATION_FAILED',
          message: 'Some items in your cart are no longer available or have insufficient stock',
          details: expect.arrayContaining([
            expect.objectContaining({
              issue: 'Insufficient stock. Only 0 items available'
            })
          ])
        }
      });
    });

    it('should handle race conditions using database transactions', async () => {
      const MockedCart = Cart as jest.Mocked<typeof Cart>;
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;

      // Mock cart
      const mockCart = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439031'),
        userId: mockUser._id,
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439021'),
            quantity: 1,
            priceAtAdd: 2.99
          }
        ],
        clearCart: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock food item
      const mockFoodItem = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439021'),
        name: 'Red Apple',
        price: 2.99,
        stock: 50,
        isActive: true
      };

      // Setup mocks
      MockedCart.findOne = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(mockCart)
      });
      MockedFoodItem.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(mockFoodItem)
      });

      // Simulate race condition/write conflict
      MockedFoodItem.findByIdAndUpdate = jest.fn().mockRejectedValue(
        new Error('WriteConflict: Operation failed due to concurrent modification')
      );

      await OrderController.checkout(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      // Verify transaction rollback on race condition
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CHECKOUT_FAILED',
          message: 'Failed to process checkout. Please try again.'
        }
      });
    });

    it('should process multiple concurrent checkouts with different items successfully', async () => {
      const MockedCart = Cart as jest.Mocked<typeof Cart>;
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;
      const MockedOrder = Order as jest.Mocked<typeof Order>;

      // User 1 cart with apples
      const user1Cart = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439031'),
        userId: mockUser._id,
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439021'),
            quantity: 2,
            priceAtAdd: 2.99
          }
        ],
        clearCart: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };

      const appleItem = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439021'),
        name: 'Red Apple',
        price: 2.99,
        stock: 50,
        isActive: true
      };

      // Setup mocks for first user
      MockedCart.findOne = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(user1Cart)
      });
      MockedFoodItem.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(appleItem)
      });
      MockedFoodItem.findByIdAndUpdate = jest.fn().mockResolvedValue(true);

      const mockOrder1 = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439041'),
        orderId: 'ORD-TEST-001',
        save: jest.fn().mockResolvedValue(true),
        updatePaymentStatus: jest.fn(),
        updateStatus: jest.fn(),
        createdAt: new Date()
      };
      (MockedOrder as any).mockImplementation(() => mockOrder1);

      // First user checkout
      await OrderController.checkout(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockSession.commitTransaction).toHaveBeenCalled();

      // Reset mocks for second user
      jest.clearAllMocks();
      (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);

      // User 2 cart with carrots (different item)
      const user2Cart = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439032'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439022'),
            quantity: 3,
            priceAtAdd: 1.49
          }
        ],
        clearCart: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };

      const carrotItem = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439022'),
        name: 'Organic Carrots',
        price: 1.49,
        stock: 25,
        isActive: true
      };

      // Setup mocks for second user
      MockedCart.findOne = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(user2Cart)
      });
      MockedFoodItem.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(carrotItem)
      });
      MockedFoodItem.findByIdAndUpdate = jest.fn().mockResolvedValue(true);

      const mockOrder2 = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439042'),
        orderId: 'ORD-TEST-002',
        save: jest.fn().mockResolvedValue(true),
        updatePaymentStatus: jest.fn(),
        updateStatus: jest.fn(),
        createdAt: new Date()
      };
      (MockedOrder as any).mockImplementation(() => mockOrder2);

      const mockAuthRequest2 = {
        ...mockAuthRequest,
        user: { _id: new Types.ObjectId('507f1f77bcf86cd799439012') }
      };

      // Second user checkout should also succeed (different item)
      await OrderController.checkout(mockAuthRequest2 as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('Checkout Validation', () => {
    it('should validate checkout items before processing', async () => {
      const MockedCart = Cart as jest.Mocked<typeof Cart>;
      const MockedFoodItem = FoodItem as jest.Mocked<typeof FoodItem>;

      // Mock cart with items
      const mockCart = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439031'),
        userId: mockUser._id,
        items: [
          {
            itemId: new Types.ObjectId('507f1f77bcf86cd799439021'),
            quantity: 2,
            priceAtAdd: 2.99
          }
        ],
        getTotalItems: jest.fn().mockReturnValue(2)
      };

      // Mock food item
      const mockFoodItem = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439021'),
        name: 'Red Apple',
        price: 2.99,
        stock: 50,
        isActive: true
      };

      // Setup mocks
      MockedCart.findOne = jest.fn().mockResolvedValue(mockCart);
      MockedFoodItem.findById = jest.fn().mockResolvedValue(mockFoodItem);

      await OrderController.validateCheckout(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          validation: expect.objectContaining({
            valid: true,
            items: expect.arrayContaining([
              expect.objectContaining({
                itemId: mockFoodItem._id,
                name: mockFoodItem.name,
                quantity: 2,
                valid: true,
                issue: null
              })
            ]),
            totalAmount: 5.98,
            itemCount: 2
          })
        }
      });
    });
  });
});