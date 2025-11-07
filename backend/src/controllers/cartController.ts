import { Response } from 'express';
import { Cart, ICart } from '../models/Cart';
import { FoodItem } from '../models/FoodItem';
import { AuthenticatedRequest } from './authController';
import { CartService } from '../services/cartService';
import { Types } from 'mongoose';
import { getWebSocketService } from '../services/websocketService';

export class CartController {
  /**
   * Helper method to broadcast cart updates via WebSocket
   */
  private static broadcastCartUpdate(userId: string, cart: ICart): void {
    const websocketService = getWebSocketService();
    if (websocketService) {
      websocketService.broadcastCartUpdate(userId, {
        id: cart._id,
        userId: cart.userId,
        items: cart.items,
        totalItems: cart.getTotalItems(),
        totalAmount: cart.calculateTotal(),
        updatedAt: cart.updatedAt
      });
    }
  }
  /**
   * Get user's cart contents
   * GET /api/cart
   */
  static async getCart(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      // Find user's cart and populate item details
      let cart = await Cart.findOne({ userId: user._id });
      if (cart) {
        await cart.populate({
          path: 'items.itemId',
          model: 'FoodItem',
          select: 'name description category price stock imageUrl isActive'
        });
      }

      // Create empty cart if none exists
      if (!cart) {
        cart = new Cart({
          userId: user._id,
          items: []
        });
        await cart.save();
      }

      // Filter out inactive, deleted, or null items (when populate fails)
      const validItems = cart.items.filter((item: any) => {
        return item.itemId && item.itemId.isActive && item.itemId._id;
      });

      // Update cart if items were filtered out
      if (validItems.length !== cart.items.length) {
        cart.items = validItems;
        await cart.save();
      }

      res.status(200).json({
        success: true,
        data: {
          cart: {
            id: cart._id,
            userId: cart.userId,
            items: cart.items,
            totalItems: cart.getTotalItems(),
            totalAmount: cart.calculateTotal(),
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt
          }
        }
      });
    } catch (error) {
      console.error('Get cart error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve cart'
        }
      });
    }
  }

  /**
   * Add item to cart
   * POST /api/cart/add
   */
  static async addToCart(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { itemId, quantity } = req.body;

      // Validate input
      if (!itemId || quantity === undefined || quantity === null) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'Item ID and quantity are required'
          }
        });
        return;
      }

      if (!Types.ObjectId.isValid(itemId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ITEM_ID',
            message: 'Invalid item ID format'
          }
        });
        return;
      }

      if (quantity < 1 || quantity > 99 || !Number.isInteger(quantity)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_QUANTITY',
            message: 'Quantity must be a whole number between 1 and 99'
          }
        });
        return;
      }

      // Check if item exists and is active
      const foodItem = await FoodItem.findById(itemId);
      if (!foodItem || !foodItem.isActive) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Food item not found or not available'
          }
        });
        return;
      }

      // Check stock availability
      if (foodItem.stock < quantity) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: `Only ${foodItem.stock} items available in stock`
          }
        });
        return;
      }

      // Find or create user's cart
      let cart = await Cart.findOne({ userId: user._id });
      if (!cart) {
        cart = new Cart({
          userId: user._id,
          items: []
        });
      }

      // Check if adding this quantity would exceed stock
      const existingItem = cart.findItem(itemId);
      const totalQuantity = existingItem ? existingItem.quantity + quantity : quantity;
      
      if (totalQuantity > foodItem.stock) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: `Cannot add ${quantity} items. Only ${foodItem.stock - (existingItem?.quantity || 0)} more items available`
          }
        });
        return;
      }

      // Add or update item in cart
      cart.addOrUpdateItem(itemId, totalQuantity, foodItem.price);
      await cart.save();

      // Populate the cart for response
      await cart.populate({
        path: 'items.itemId',
        model: 'FoodItem',
        select: 'name description category price stock imageUrl isActive'
      });

      // Broadcast cart update via WebSocket
      CartController.broadcastCartUpdate(String(user._id), cart);

      res.status(200).json({
        success: true,
        data: {
          cart: {
            id: cart._id,
            userId: cart.userId,
            items: cart.items,
            totalItems: cart.getTotalItems(),
            totalAmount: cart.calculateTotal(),
            updatedAt: cart.updatedAt
          }
        },
        message: 'Item added to cart successfully'
      });
    } catch (error) {
      console.error('Add to cart error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to add item to cart'
        }
      });
    }
  }

  /**
   * Update cart item quantity
   * PUT /api/cart/update
   */
  static async updateCartItem(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { itemId, quantity } = req.body;

      // Validate input
      if (!itemId || quantity === undefined || quantity === null) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'Item ID and quantity are required'
          }
        });
        return;
      }

      if (!Types.ObjectId.isValid(itemId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ITEM_ID',
            message: 'Invalid item ID format'
          }
        });
        return;
      }

      if (quantity < 1 || quantity > 99 || !Number.isInteger(quantity)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_QUANTITY',
            message: 'Quantity must be a whole number between 1 and 99'
          }
        });
        return;
      }

      // Find user's cart
      const cart = await Cart.findOne({ userId: user._id });
      if (!cart) {
        res.status(404).json({
          success: false,
          error: {
            code: 'CART_NOT_FOUND',
            message: 'Cart not found'
          }
        });
        return;
      }

      // Check if item exists in cart
      const existingItem = cart.findItem(itemId);
      if (!existingItem) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ITEM_NOT_IN_CART',
            message: 'Item not found in cart'
          }
        });
        return;
      }

      // Check if food item still exists and is active
      const foodItem = await FoodItem.findById(itemId);
      if (!foodItem || !foodItem.isActive) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Food item not found or not available'
          }
        });
        return;
      }

      // Check stock availability
      if (foodItem.stock < quantity) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: `Only ${foodItem.stock} items available in stock`
          }
        });
        return;
      }

      // Update item quantity and price
      cart.addOrUpdateItem(itemId, quantity, foodItem.price);
      await cart.save();

      // Populate the cart for response
      await cart.populate({
        path: 'items.itemId',
        model: 'FoodItem',
        select: 'name description category price stock imageUrl isActive'
      });

      // Broadcast cart update via WebSocket
      CartController.broadcastCartUpdate(String(user._id), cart);

      res.status(200).json({
        success: true,
        data: {
          cart: {
            id: cart._id,
            userId: cart.userId,
            items: cart.items,
            totalItems: cart.getTotalItems(),
            totalAmount: cart.calculateTotal(),
            updatedAt: cart.updatedAt
          }
        },
        message: 'Cart item updated successfully'
      });
    } catch (error) {
      console.error('Update cart item error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update cart item'
        }
      });
    }
  }

  /**
   * Remove item from cart
   * DELETE /api/cart/remove/:itemId
   */
  static async removeFromCart(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { itemId } = req.params;

      if (!Types.ObjectId.isValid(itemId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ITEM_ID',
            message: 'Invalid item ID format'
          }
        });
        return;
      }

      // Find user's cart
      const cart = await Cart.findOne({ userId: user._id });
      if (!cart) {
        res.status(404).json({
          success: false,
          error: {
            code: 'CART_NOT_FOUND',
            message: 'Cart not found'
          }
        });
        return;
      }

      // Remove item from cart
      const itemRemoved = cart.removeItem(itemId);
      if (!itemRemoved) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ITEM_NOT_IN_CART',
            message: 'Item not found in cart'
          }
        });
        return;
      }

      await cart.save();

      // Populate the cart for response
      await cart.populate({
        path: 'items.itemId',
        model: 'FoodItem',
        select: 'name description category price stock imageUrl isActive'
      });

      // Broadcast cart update via WebSocket
      CartController.broadcastCartUpdate(String(user._id), cart);

      res.status(200).json({
        success: true,
        data: {
          cart: {
            id: cart._id,
            userId: cart.userId,
            items: cart.items,
            totalItems: cart.getTotalItems(),
            totalAmount: cart.calculateTotal(),
            updatedAt: cart.updatedAt
          }
        },
        message: 'Item removed from cart successfully'
      });
    } catch (error) {
      console.error('Remove from cart error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to remove item from cart'
        }
      });
    }
  }

  /**
   * Clear entire cart
   * DELETE /api/cart/clear
   */
  static async clearCart(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      if (!cart) {
        res.status(404).json({
          success: false,
          error: {
            code: 'CART_NOT_FOUND',
            message: 'Cart not found'
          }
        });
        return;
      }

      // Clear all items from cart
      cart.clearCart();
      await cart.save();

      // Broadcast cart update via WebSocket
      CartController.broadcastCartUpdate(String(user._id), cart);

      res.status(200).json({
        success: true,
        data: {
          cart: {
            id: cart._id,
            userId: cart.userId,
            items: cart.items,
            totalItems: cart.getTotalItems(),
            totalAmount: cart.calculateTotal(),
            updatedAt: cart.updatedAt
          }
        },
        message: 'Cart cleared successfully'
      });
    } catch (error) {
      console.error('Clear cart error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to clear cart'
        }
      });
    }
  }

  /**
   * Synchronize cart across devices
   * GET /api/cart/sync
   */
  static async syncCart(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      // Synchronize cart and get latest data
      const cart = await CartService.synchronizeCart(String(user._id));
      
      if (!cart) {
        res.status(404).json({
          success: false,
          error: {
            code: 'CART_NOT_FOUND',
            message: 'Cart not found'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          cart: {
            id: cart._id,
            userId: cart.userId,
            items: cart.items,
            totalItems: cart.getTotalItems(),
            totalAmount: cart.calculateTotal(),
            lastSync: new Date().toISOString(),
            updatedAt: cart.updatedAt
          }
        },
        message: 'Cart synchronized successfully'
      });
    } catch (error) {
      console.error('Sync cart error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to synchronize cart'
        }
      });
    }
  }

  /**
   * Get cart sync status
   * GET /api/cart/sync-status
   */
  static async getCartSyncStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const syncStatus = await CartService.getCartSyncStatus(String(user._id));

      res.status(200).json({
        success: true,
        data: {
          syncStatus: syncStatus || {
            lastSync: null,
            itemCount: 0,
            totalAmount: 0
          }
        }
      });
    } catch (error) {
      console.error('Get cart sync status error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get cart sync status'
        }
      });
    }
  }

  /**
   * Merge cart data from multiple devices
   * POST /api/cart/merge
   */
  static async mergeCart(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { cartItems } = req.body;

      if (!Array.isArray(cartItems)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CART_DATA',
            message: 'Cart items must be an array'
          }
        });
        return;
      }

      // Validate cart items structure
      for (const item of cartItems) {
        if (!item.itemId || !item.quantity || !item.priceAtAdd) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_CART_ITEM',
              message: 'Each cart item must have itemId, quantity, and priceAtAdd'
            }
          });
          return;
        }

        if (!Types.ObjectId.isValid(item.itemId)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_ITEM_ID',
              message: 'Invalid item ID format in cart data'
            }
          });
          return;
        }
      }

      // Merge cart data
      const mergedCart = await CartService.mergeCartData(String(user._id), cartItems);

      // Populate the merged cart for response
      await mergedCart.populate({
        path: 'items.itemId',
        model: 'FoodItem',
        select: 'name description category price stock imageUrl isActive'
      });

      res.status(200).json({
        success: true,
        data: {
          cart: {
            id: mergedCart._id,
            userId: mergedCart.userId,
            items: mergedCart.items,
            totalItems: mergedCart.getTotalItems(),
            totalAmount: mergedCart.calculateTotal(),
            updatedAt: mergedCart.updatedAt
          }
        },
        message: 'Cart data merged successfully'
      });
    } catch (error) {
      console.error('Merge cart error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to merge cart data'
        }
      });
    }
  }

  /**
   * Validate cart items against current inventory
   * GET /api/cart/validate
   */
  static async validateCart(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      if (!cart) {
        res.status(404).json({
          success: false,
          error: {
            code: 'CART_NOT_FOUND',
            message: 'Cart not found'
          }
        });
        return;
      }

      // Validate cart items
      const validation = await CartService.validateCartItems(cart);

      res.status(200).json({
        success: true,
        data: {
          validation: {
            valid: validation.valid,
            issues: validation.issues,
            itemCount: cart.getTotalItems(),
            totalAmount: cart.calculateTotal()
          }
        }
      });
    } catch (error) {
      console.error('Validate cart error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to validate cart'
        }
      });
    }
  }
}