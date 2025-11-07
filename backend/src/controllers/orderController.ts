import { Response } from 'express';
import mongoose from 'mongoose';
import { Order, IOrder, OrderStatus, PaymentStatus, IOrderItem } from '../models/Order';
import { Cart } from '../models/Cart';
import { FoodItem } from '../models/FoodItem';
import { AuthenticatedRequest } from './authController';
import { Types } from 'mongoose';
import { getWebSocketService } from '../services/websocketService';

export class OrderController {
  /**
   * Helper method to handle concurrent stock validation and deduction
   */
  private static async processStockDeduction(
    orderItems: IOrderItem[], 
    session: mongoose.ClientSession
  ): Promise<{ success: boolean; error?: any; updatedItems?: any[] }> {
    const updatedItems = [];
    
    try {
      for (const orderItem of orderItems) {
        // Use findOneAndUpdate with stock condition for atomic operation
        const result = await FoodItem.findOneAndUpdate(
          { 
            _id: orderItem.itemId, 
            stock: { $gte: orderItem.quantity },
            isActive: true
          },
          { $inc: { stock: -orderItem.quantity } },
          { session, new: true }
        );

        if (!result) {
          // Check if item exists and get current stock
          const currentItem = await FoodItem.findById(orderItem.itemId).session(session);
          
          if (!currentItem || !currentItem.isActive) {
            return {
              success: false,
              error: {
                code: 'ITEM_NOT_AVAILABLE',
                message: `Item "${orderItem.name}" is no longer available`,
                details: {
                  itemId: orderItem.itemId,
                  itemName: orderItem.name
                }
              }
            };
          }

          return {
            success: false,
            error: {
              code: 'INSUFFICIENT_STOCK',
              message: `Insufficient stock for "${orderItem.name}". Only ${currentItem.stock} items available.`,
              details: {
                itemId: orderItem.itemId,
                itemName: orderItem.name,
                requestedQuantity: orderItem.quantity,
                availableStock: currentItem.stock
              }
            }
          };
        }

        updatedItems.push(result);

        // Broadcast stock update via WebSocket
        const websocketService = getWebSocketService();
        if (websocketService) {
          websocketService.broadcastStockUpdate(
            (result._id as any).toString(), 
            result.stock, 
            result.name
          );
        }
      }

      return { success: true, updatedItems };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STOCK_DEDUCTION_FAILED',
          message: 'Failed to process stock deduction',
          details: error
        }
      };
    }
  }
  /**
   * Process cart checkout with retry logic for concurrent scenarios
   */
  private static async attemptCheckout(
    user: any,
    deliveryAddress: any,
    maxRetries: number = 3
  ): Promise<{ success: boolean; order?: any; error?: any }> {
    let attempt = 0;
    
    while (attempt < maxRetries) {
      const session = await mongoose.startSession();
      
      try {
        session.startTransaction();
        
        // Find user's cart
        const cart = await Cart.findOne({ userId: user._id }).session(session);
        if (!cart || cart.items.length === 0) {
          await session.abortTransaction();
          return {
            success: false,
            error: {
              code: 'EMPTY_CART',
              message: 'Cart is empty. Add items before checkout.'
            }
          };
        }

        // Validate stock availability for all items
        const stockValidationResults = [];
        const orderItems: IOrderItem[] = [];
        let totalAmount = 0;

        for (const cartItem of cart.items) {
          // Get current food item with stock info
          const foodItem = await FoodItem.findById(cartItem.itemId).session(session);
          
          if (!foodItem || !foodItem.isActive) {
            stockValidationResults.push({
              itemId: cartItem.itemId,
              name: foodItem?.name || 'Unknown Item',
              issue: 'Item no longer available'
            });
            continue;
          }

          // Check stock availability
          if (foodItem.stock < cartItem.quantity) {
            stockValidationResults.push({
              itemId: cartItem.itemId,
              name: foodItem.name,
              requestedQuantity: cartItem.quantity,
              availableStock: foodItem.stock,
              issue: `Insufficient stock. Only ${foodItem.stock} items available`
            });
            continue;
          }

          // Create order item
          const itemTotal = cartItem.quantity * foodItem.price;
          orderItems.push({
            itemId: cartItem.itemId,
            name: foodItem.name,
            quantity: cartItem.quantity,
            price: foodItem.price,
            totalPrice: itemTotal
          });

          totalAmount += itemTotal;
        }

        // If there are stock validation issues, abort transaction
        if (stockValidationResults.length > 0) {
          await session.abortTransaction();
          return {
            success: false,
            error: {
              code: 'STOCK_VALIDATION_FAILED',
              message: 'Some items in your cart are no longer available or have insufficient stock',
              details: stockValidationResults
            }
          };
        }

        // Process stock deduction with concurrent handling
        const stockResult = await this.processStockDeduction(orderItems, session);
        
        if (!stockResult.success) {
          await session.abortTransaction();
          
          // If it's a concurrent conflict, retry
          if (stockResult.error?.code === 'INSUFFICIENT_STOCK' && attempt < maxRetries - 1) {
            attempt++;
            await session.endSession();
            // Wait a short random time before retry to reduce collision probability
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
            continue;
          }
          
          return {
            success: false,
            error: stockResult.error
          };
        }

        // Create order
        const order = new Order({
          userId: user._id,
          items: orderItems,
          totalAmount: Math.round(totalAmount * 100) / 100,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          deliveryAddress: {
            street: deliveryAddress.street.trim(),
            city: deliveryAddress.city.trim(),
            state: deliveryAddress.state.trim(),
            zipCode: deliveryAddress.zipCode.trim()
          }
        });

        await order.save({ session });

        // Clear user's cart after successful order creation
        cart.clearCart();
        await cart.save({ session });

        // Commit transaction
        await session.commitTransaction();
        await session.endSession();

        // Simulate payment processing
        order.updatePaymentStatus(PaymentStatus.COMPLETED);
        order.updateStatus(OrderStatus.CONFIRMED);
        await order.save();

        return { success: true, order };
        
      } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        
        // If it's a write conflict or similar, retry
        if ((error as any).code === 11000 || (error as any).codeName === 'WriteConflict') {
          if (attempt < maxRetries - 1) {
            attempt++;
            // Wait a short random time before retry
            await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
            continue;
          }
        }
        
        return {
          success: false,
          error: {
            code: 'CHECKOUT_FAILED',
            message: 'Failed to process checkout. Please try again.',
            details: error
          }
        };
      }
    }
    
    return {
      success: false,
      error: {
        code: 'MAX_RETRIES_EXCEEDED',
        message: 'Unable to complete checkout due to high demand. Please try again.'
      }
    };
  }

  /**
   * Process cart checkout and create order
   * POST /api/orders/checkout
   */
  static async checkout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const { deliveryAddress } = req.body;

      // Validate delivery address
      if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city || 
          !deliveryAddress.state || !deliveryAddress.zipCode) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_DELIVERY_ADDRESS',
            message: 'Complete delivery address is required'
          }
        });
        return;
      }

      // Validate PIN code format (Indian format - 6 digits)
      const zipCodeRegex = /^\d{6}$/;
      if (!zipCodeRegex.test(deliveryAddress.zipCode)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ZIP_CODE',
            message: 'Please provide a valid PIN code (6 digits)'
          }
        });
        return;
      }

      // Attempt checkout with retry logic
      const result = await OrderController.attemptCheckout(user, deliveryAddress);
      
      if (!result.success) {
        const statusCode = result.error?.code === 'EMPTY_CART' ? 400 :
                          result.error?.code === 'STOCK_VALIDATION_FAILED' ? 400 :
                          result.error?.code === 'MAX_RETRIES_EXCEEDED' ? 409 : 500;
        
        res.status(statusCode).json({
          success: false,
          error: result.error
        });
        return;
      }

      const order = result.order;

      // Broadcast order status update via WebSocket
      const websocketService = getWebSocketService();
      if (websocketService) {
        websocketService.broadcastOrderUpdate(
          String(user._id), 
          order.orderId, 
          order.status,
          {
            orderId: order.orderId,
            id: order._id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt
          }
        );
      }

      res.status(201).json({
        success: true,
        data: {
          order: {
            orderId: order.orderId,
            id: order._id,
            userId: order.userId,
            items: order.items,
            totalAmount: order.totalAmount,
            status: order.status,
            paymentStatus: order.paymentStatus,
            deliveryAddress: order.deliveryAddress,
            createdAt: order.createdAt
          }
        },
        message: 'Order placed successfully'
      });

    } catch (error) {
      console.error('Checkout error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'CHECKOUT_FAILED',
          message: 'Failed to process checkout. Please try again.'
        }
      });
    }
  }

  /**
   * Get order by tracking ID
   * GET /api/orders/:orderId
   */
  static async getOrderById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const { orderId } = req.params;

      if (!orderId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_ORDER_ID',
            message: 'Order ID is required'
          }
        });
        return;
      }

      // Find order by orderId (tracking ID) and ensure it belongs to the user
      const order = await Order.findOne({ 
        orderId: orderId.toUpperCase(),
        userId: user._id 
      }).populate({
        path: 'items.itemId',
        model: 'FoodItem',
        select: 'name description category imageUrl'
      });

      if (!order) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Order not found'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          order: {
            orderId: order.orderId,
            id: order._id,
            userId: order.userId,
            items: order.items,
            totalAmount: order.totalAmount,
            status: order.status,
            paymentStatus: order.paymentStatus,
            deliveryAddress: order.deliveryAddress,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
          }
        }
      });

    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve order'
        }
      });
    }
  }

  /**
   * Validate cart items before checkout
   * POST /api/orders/validate-checkout
   */
  static async validateCheckout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      // Find user's cart
      const cart = await Cart.findOne({ userId: user._id });
      if (!cart || cart.items.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'EMPTY_CART',
            message: 'Cart is empty. Add items before checkout.'
          }
        });
        return;
      }

      // Validate stock availability for all items
      const validationResults = [];
      let totalAmount = 0;
      let allItemsValid = true;

      for (const cartItem of cart.items) {
        const foodItem = await FoodItem.findById(cartItem.itemId);
        
        if (!foodItem || !foodItem.isActive) {
          validationResults.push({
            itemId: cartItem.itemId,
            name: foodItem?.name || 'Unknown Item',
            quantity: cartItem.quantity,
            valid: false,
            issue: 'Item no longer available'
          });
          allItemsValid = false;
          continue;
        }

        const isStockSufficient = foodItem.stock >= cartItem.quantity;
        const itemTotal = cartItem.quantity * foodItem.price;

        validationResults.push({
          itemId: cartItem.itemId,
          name: foodItem.name,
          quantity: cartItem.quantity,
          price: foodItem.price,
          totalPrice: itemTotal,
          availableStock: foodItem.stock,
          valid: isStockSufficient,
          issue: isStockSufficient ? null : `Insufficient stock. Only ${foodItem.stock} items available`
        });

        if (isStockSufficient) {
          totalAmount += itemTotal;
        } else {
          allItemsValid = false;
        }
      }

      res.status(200).json({
        success: true,
        data: {
          validation: {
            valid: allItemsValid,
            items: validationResults,
            totalAmount: Math.round(totalAmount * 100) / 100,
            itemCount: cart.getTotalItems()
          }
        }
      });

    } catch (error) {
      console.error('Validate checkout error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to validate checkout'
        }
      });
    }
  }

  /**
   * Simulate payment processing
   * POST /api/orders/:orderId/payment
   */
  static async processPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const { orderId } = req.params;
      const { paymentMethod } = req.body;

      if (!orderId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_ORDER_ID',
            message: 'Order ID is required'
          }
        });
        return;
      }

      if (!paymentMethod) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PAYMENT_METHOD',
            message: 'Payment method is required'
          }
        });
        return;
      }

      // Find order and ensure it belongs to the user
      const order = await Order.findOne({ 
        orderId: orderId.toUpperCase(),
        userId: user._id 
      });

      if (!order) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Order not found'
          }
        });
        return;
      }

      // Check if payment is already completed
      if (order.paymentStatus === PaymentStatus.COMPLETED) {
        res.status(400).json({
          success: false,
          error: {
            code: 'PAYMENT_ALREADY_COMPLETED',
            message: 'Payment for this order has already been completed'
          }
        });
        return;
      }

      // Simulate payment processing
      // In a real application, this would integrate with a payment gateway
      const paymentSuccess = Math.random() > 0.1; // 90% success rate for simulation

      if (paymentSuccess) {
        order.updatePaymentStatus(PaymentStatus.COMPLETED);
        order.updateStatus(OrderStatus.CONFIRMED);
        await order.save();

        res.status(200).json({
          success: true,
          data: {
            order: {
              orderId: order.orderId,
              paymentStatus: order.paymentStatus,
              status: order.status,
              totalAmount: order.totalAmount
            }
          },
          message: 'Payment processed successfully'
        });
      } else {
        order.updatePaymentStatus(PaymentStatus.FAILED);
        await order.save();

        res.status(400).json({
          success: false,
          error: {
            code: 'PAYMENT_FAILED',
            message: 'Payment processing failed. Please try again.'
          }
        });
      }

    } catch (error) {
      console.error('Process payment error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process payment'
        }
      });
    }
  }

  /**
   * Get user's order history
   * GET /api/orders/history
   */
  static async getOrderHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      // Parse query parameters for pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Max 50 orders per page
      const skip = (page - 1) * limit;

      // Parse status filter
      const statusFilter = req.query.status as string;
      const query: any = { userId: user._id };
      
      if (statusFilter && Object.values(OrderStatus).includes(statusFilter as OrderStatus)) {
        query.status = statusFilter;
      }

      // Get orders with pagination
      const orders = await Order.find(query)
        .sort({ createdAt: -1 }) // Most recent first
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'items.itemId',
          model: 'FoodItem',
          select: 'name description category imageUrl'
        });

      // Get total count for pagination
      const totalOrders = await Order.countDocuments(query);
      const totalPages = Math.ceil(totalOrders / limit);

      res.status(200).json({
        success: true,
        data: {
          orders: orders.map(order => ({
            orderId: order.orderId,
            id: order._id,
            items: order.items,
            totalAmount: order.totalAmount,
            status: order.status,
            paymentStatus: order.paymentStatus,
            deliveryAddress: order.deliveryAddress,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
          })),
          pagination: {
            currentPage: page,
            totalPages,
            totalOrders,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Get order history error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve order history'
        }
      });
    }
  }

  /**
   * Update order status (admin functionality)
   * PUT /api/orders/:orderId/status
   */
  static async updateOrderStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const { orderId } = req.params;
      const { status } = req.body;

      if (!orderId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_ORDER_ID',
            message: 'Order ID is required'
          }
        });
        return;
      }

      if (!status || !Object.values(OrderStatus).includes(status)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Valid order status is required'
          }
        });
        return;
      }

      // Find order by orderId (tracking ID)
      // Note: In a real application, this would have admin role checking
      const order = await Order.findOne({ orderId: orderId.toUpperCase() });

      if (!order) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Order not found'
          }
        });
        return;
      }

      // Validate status transition
      const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
        [OrderStatus.PREPARING]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
        [OrderStatus.DELIVERED]: [], // Final state
        [OrderStatus.CANCELLED]: [] // Final state
      };

      const allowedStatuses = validTransitions[order.status];
      if (!allowedStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: `Cannot change status from ${order.status} to ${status}`
          }
        });
        return;
      }

      // Update order status
      order.updateStatus(status);
      await order.save();

      // Broadcast order status update via WebSocket
      const websocketService = getWebSocketService();
      if (websocketService) {
        websocketService.broadcastOrderUpdate(
          String(order.userId), 
          order.orderId, 
          order.status,
          {
            orderId: order.orderId,
            id: order._id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            updatedAt: order.updatedAt
          }
        );
      }

      res.status(200).json({
        success: true,
        data: {
          order: {
            orderId: order.orderId,
            id: order._id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            updatedAt: order.updatedAt
          }
        },
        message: 'Order status updated successfully'
      });

    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update order status'
        }
      });
    }
  }

  /**
   * Get order delivery status and tracking information
   * GET /api/orders/:orderId/tracking
   */
  static async getOrderTracking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const { orderId } = req.params;

      if (!orderId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_ORDER_ID',
            message: 'Order ID is required'
          }
        });
        return;
      }

      // Find order and ensure it belongs to the user
      const order = await Order.findOne({ 
        orderId: orderId.toUpperCase(),
        userId: user._id 
      });

      if (!order) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Order not found'
          }
        });
        return;
      }

      // Create tracking timeline based on order status
      const trackingSteps = [
        {
          status: OrderStatus.PENDING,
          title: 'Order Placed',
          description: 'Your order has been received and is being processed',
          completed: true,
          timestamp: order.createdAt
        },
        {
          status: OrderStatus.CONFIRMED,
          title: 'Order Confirmed',
          description: 'Payment confirmed and order is being prepared',
          completed: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.DELIVERED].includes(order.status),
          timestamp: order.status !== OrderStatus.PENDING ? order.updatedAt : null
        },
        {
          status: OrderStatus.PREPARING,
          title: 'Preparing Order',
          description: 'Your order is being prepared for delivery',
          completed: [OrderStatus.PREPARING, OrderStatus.DELIVERED].includes(order.status),
          timestamp: order.status === OrderStatus.PREPARING || order.status === OrderStatus.DELIVERED ? order.updatedAt : null
        },
        {
          status: OrderStatus.DELIVERED,
          title: 'Delivered',
          description: 'Your order has been delivered successfully',
          completed: order.status === OrderStatus.DELIVERED,
          timestamp: order.status === OrderStatus.DELIVERED ? order.updatedAt : null
        }
      ];

      // Calculate estimated delivery time (for demo purposes)
      const estimatedDeliveryMinutes = order.status === OrderStatus.DELIVERED ? 0 : 
        order.status === OrderStatus.PREPARING ? 15 :
        order.status === OrderStatus.CONFIRMED ? 30 : 45;

      const estimatedDelivery = order.status === OrderStatus.DELIVERED ? null :
        new Date(Date.now() + estimatedDeliveryMinutes * 60 * 1000);

      res.status(200).json({
        success: true,
        data: {
          tracking: {
            orderId: order.orderId,
            currentStatus: order.status,
            paymentStatus: order.paymentStatus,
            isDelivered: order.status === OrderStatus.DELIVERED,
            isCancelled: order.status === OrderStatus.CANCELLED,
            estimatedDelivery,
            deliveryAddress: order.deliveryAddress,
            timeline: trackingSteps,
            lastUpdated: order.updatedAt
          }
        }
      });

    } catch (error) {
      console.error('Get order tracking error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve order tracking information'
        }
      });
    }
  }
}