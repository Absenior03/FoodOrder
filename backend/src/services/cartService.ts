import { Cart, ICart, ICartItem } from '../models/Cart';
import { FoodItem } from '../models/FoodItem';
import { Types } from 'mongoose';
import { DatabaseConfig } from '../config/database';
import { getWebSocketService } from './websocketService';

export class CartService {
  /**
   * Restore user's cart on login
   * This method is called when a user logs in to restore their saved cart
   */
  static async restoreCartOnLogin(userId: string): Promise<ICart | null> {
    try {
      // Find user's existing cart
      let cart = await Cart.findOne({ userId }).populate({
        path: 'items.itemId',
        model: 'FoodItem',
        select: 'name description category price stock imageUrl isActive'
      });

      if (!cart) {
        // Create empty cart if none exists
        cart = new Cart({
          userId,
          items: []
        });
        await cart.save();
        return cart;
      }

      // Clean up invalid items (deleted or inactive food items)
      const validItems: ICartItem[] = [];
      let cartModified = false;

      for (const item of cart.items) {
        const foodItem = await FoodItem.findById(item.itemId);
        
        if (foodItem && foodItem.isActive) {
          // Update price if it has changed
          if (item.priceAtAdd !== foodItem.price) {
            item.priceAtAdd = foodItem.price;
            cartModified = true;
          }
          
          // Adjust quantity if stock is insufficient
          if (item.quantity > foodItem.stock) {
            if (foodItem.stock > 0) {
              item.quantity = foodItem.stock;
              cartModified = true;
            } else {
              // Skip item if out of stock
              cartModified = true;
              continue;
            }
          }
          
          validItems.push(item);
        } else {
          // Item was deleted or deactivated
          cartModified = true;
        }
      }

      if (cartModified) {
        cart.items = validItems;
        await cart.save();
        
        // Broadcast cart update via WebSocket
        const websocketService = getWebSocketService();
        if (websocketService) {
          websocketService.broadcastCartUpdate(userId, cart);
        }
      }

      return cart;
    } catch (error) {
      console.error('Error restoring cart on login:', error);
      return null;
    }
  }

  /**
   * Merge cart data from multiple devices/sessions
   * This handles scenarios where a user has items in cart from different devices
   */
  static async mergeCartData(userId: string, newCartItems: ICartItem[]): Promise<ICart> {
    try {
      // Find existing cart
      let existingCart = await Cart.findOne({ userId });
      
      if (!existingCart) {
        // Create new cart with the new items
        existingCart = new Cart({
          userId,
          items: []
        });
      }

      // Merge items from new cart data
      for (const newItem of newCartItems) {
        // Verify the food item still exists and is active
        const foodItem = await FoodItem.findById(newItem.itemId);
        if (!foodItem || !foodItem.isActive) {
          continue; // Skip invalid items
        }

        const existingItemIndex = existingCart.items.findIndex(
          (item: ICartItem) => item.itemId.toString() === newItem.itemId.toString()
        );

        if (existingItemIndex >= 0) {
          // Item exists in both carts - use the higher quantity (user preference)
          const existingItem = existingCart.items[existingItemIndex];
          const maxQuantity = Math.max(existingItem.quantity, newItem.quantity);
          
          // Ensure we don't exceed stock
          const finalQuantity = Math.min(maxQuantity, foodItem.stock);
          
          if (finalQuantity > 0) {
            existingCart.items[existingItemIndex].quantity = finalQuantity;
            existingCart.items[existingItemIndex].priceAtAdd = foodItem.price; // Update to current price
          } else {
            // Remove item if no stock available
            existingCart.items.splice(existingItemIndex, 1);
          }
        } else {
          // New item - add it if stock is available
          const finalQuantity = Math.min(newItem.quantity, foodItem.stock);
          if (finalQuantity > 0) {
            existingCart.items.push({
              itemId: newItem.itemId,
              quantity: finalQuantity,
              priceAtAdd: foodItem.price // Use current price
            });
          }
        }
      }

      await existingCart.save();
      
      // Broadcast cart update via WebSocket
      const websocketService = getWebSocketService();
      if (websocketService) {
        websocketService.broadcastCartUpdate(userId, existingCart);
      }
      
      return existingCart;
    } catch (error) {
      console.error('Error merging cart data:', error);
      throw error;
    }
  }

  /**
   * Synchronize cart across multiple sessions
   * This method ensures cart consistency when user is logged in from multiple devices
   */
  static async synchronizeCart(userId: string): Promise<ICart | null> {
    try {
      const cart = await Cart.findOne({ userId }).populate({
        path: 'items.itemId',
        model: 'FoodItem',
        select: 'name description category price stock imageUrl isActive'
      });

      if (!cart) {
        return null;
      }

      // Store cart sync timestamp in Redis for real-time sync
      const redisClient = DatabaseConfig.getRedisClient();
      if (redisClient) {
        const cartSyncKey = `cart_sync:${userId}`;
        const cartData = {
          cartId: String(cart._id),
          lastSync: new Date().toISOString(),
          itemCount: cart.getTotalItems(),
          totalAmount: cart.calculateTotal()
        };
        
        // Store with 24 hour expiration
        await redisClient.setEx(cartSyncKey, 24 * 60 * 60, JSON.stringify(cartData));
      }

      return cart;
    } catch (error) {
      console.error('Error synchronizing cart:', error);
      return null;
    }
  }

  /**
   * Get cart sync status from Redis
   * Used to check if cart needs to be refreshed on other devices
   */
  static async getCartSyncStatus(userId: string): Promise<any | null> {
    try {
      const redisClient = DatabaseConfig.getRedisClient();
      if (!redisClient) {
        return null;
      }

      const cartSyncKey = `cart_sync:${userId}`;
      const syncData = await redisClient.get(cartSyncKey);
      
      return syncData ? JSON.parse(syncData) : null;
    } catch (error) {
      console.error('Error getting cart sync status:', error);
      return null;
    }
  }

  /**
   * Clean up expired carts
   * This method removes old cart data to prevent database bloat
   */
  static async cleanupExpiredCarts(): Promise<number> {
    try {
      // Define expiration period (30 days of inactivity)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() - 30);

      // Find and remove carts that haven't been updated in 30 days
      const result = await Cart.deleteMany({
        updatedAt: { $lt: expirationDate },
        $or: [
          { items: { $size: 0 } }, // Empty carts
          { items: { $exists: false } } // Carts without items array
        ]
      });

      console.log(`Cleaned up ${result.deletedCount} expired carts`);
      return result.deletedCount || 0;
    } catch (error) {
      console.error('Error cleaning up expired carts:', error);
      return 0;
    }
  }

  /**
   * Clean up carts with invalid items
   * Removes items that reference deleted or inactive food items
   */
  static async cleanupInvalidCartItems(): Promise<number> {
    try {
      let cleanedCarts = 0;
      
      // Find all carts with items
      const carts = await Cart.find({ 'items.0': { $exists: true } });
      
      for (const cart of carts) {
        const validItems: ICartItem[] = [];
        let cartModified = false;

        for (const item of cart.items) {
          const foodItem = await FoodItem.findById(item.itemId);
          
          if (foodItem && foodItem.isActive) {
            validItems.push(item);
          } else {
            cartModified = true;
          }
        }

        if (cartModified) {
          cart.items = validItems;
          await cart.save();
          cleanedCarts++;
        }
      }

      console.log(`Cleaned up invalid items from ${cleanedCarts} carts`);
      return cleanedCarts;
    } catch (error) {
      console.error('Error cleaning up invalid cart items:', error);
      return 0;
    }
  }

  /**
   * Schedule periodic cart cleanup
   * This method should be called periodically (e.g., daily) to maintain cart data integrity
   */
  static async performScheduledCleanup(): Promise<void> {
    try {
      console.log('Starting scheduled cart cleanup...');
      
      const expiredCarts = await this.cleanupExpiredCarts();
      const invalidItems = await this.cleanupInvalidCartItems();
      
      console.log(`Cart cleanup completed: ${expiredCarts} expired carts, ${invalidItems} carts with invalid items cleaned`);
    } catch (error) {
      console.error('Error during scheduled cart cleanup:', error);
    }
  }

  /**
   * Validate cart items against current inventory
   * Ensures all cart items are still available and quantities are valid
   */
  static async validateCartItems(cart: ICart): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    let allValid = true;

    for (const item of cart.items) {
      const foodItem = await FoodItem.findById(item.itemId);
      
      if (!foodItem) {
        issues.push(`Item ${item.itemId} no longer exists`);
        allValid = false;
        continue;
      }

      if (!foodItem.isActive) {
        issues.push(`Item "${foodItem.name}" is no longer available`);
        allValid = false;
        continue;
      }

      if (item.quantity > foodItem.stock) {
        issues.push(`Only ${foodItem.stock} units of "${foodItem.name}" available (requested ${item.quantity})`);
        allValid = false;
      }

      if (item.priceAtAdd !== foodItem.price) {
        issues.push(`Price of "${foodItem.name}" has changed from $${item.priceAtAdd} to $${foodItem.price}`);
        // Price changes don't make cart invalid, just notify user
      }
    }

    return { valid: allValid, issues };
  }

  /**
   * Get user's cart for WebSocket synchronization
   */
  static async getCart(userId: string): Promise<ICart | null> {
    try {
      const cart = await Cart.findOne({ userId }).populate({
        path: 'items.itemId',
        model: 'FoodItem',
        select: 'name description category price stock imageUrl isActive'
      });

      return cart;
    } catch (error) {
      console.error('Error getting cart for sync:', error);
      return null;
    }
  }
}