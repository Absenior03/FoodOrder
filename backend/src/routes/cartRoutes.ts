import { Router } from 'express';
import { CartController } from '../controllers/cartController';
import { authMiddleware, validateInput, rateLimitConfigs } from '../middleware';
import { Types } from 'mongoose';

const router = Router();

// Cart validation rules
const cartValidationRules = {
  addToCart: [
    { 
      field: 'itemId', 
      required: true, 
      type: 'string' as const,
      custom: (value: string) => Types.ObjectId.isValid(value) || 'Invalid item ID format'
    },
    { 
      field: 'quantity', 
      required: true, 
      type: 'number' as const,
      custom: (value: number) => {
        const num = Number(value);
        return (Number.isInteger(num) && num >= 1 && num <= 99) || 'Quantity must be a whole number between 1 and 99';
      }
    }
  ],
  updateCartItem: [
    { 
      field: 'itemId', 
      required: true, 
      type: 'string' as const,
      custom: (value: string) => Types.ObjectId.isValid(value) || 'Invalid item ID format'
    },
    { 
      field: 'quantity', 
      required: true, 
      type: 'number' as const,
      custom: (value: number) => {
        const num = Number(value);
        return (Number.isInteger(num) && num >= 1 && num <= 99) || 'Quantity must be a whole number between 1 and 99';
      }
    }
  ]
};

// All cart routes require authentication
router.use(authMiddleware);

// Get user's cart contents
// GET /api/cart
router.get('/', 
  rateLimitConfigs.general,
  CartController.getCart
);

// Add item to cart
// POST /api/cart/add
router.post('/add', 
  rateLimitConfigs.cart,
  validateInput(cartValidationRules.addToCart),
  CartController.addToCart
);

// Update cart item quantity
// PUT /api/cart/update
router.put('/update', 
  rateLimitConfigs.cart,
  validateInput(cartValidationRules.updateCartItem),
  CartController.updateCartItem
);

// Remove item from cart
// DELETE /api/cart/remove/:itemId
router.delete('/remove/:itemId', 
  rateLimitConfigs.cart,
  CartController.removeFromCart
);

// Clear entire cart
// DELETE /api/cart/clear
router.delete('/clear', 
  rateLimitConfigs.cart,
  CartController.clearCart
);

// Synchronize cart across devices
// GET /api/cart/sync
router.get('/sync', 
  rateLimitConfigs.general,
  CartController.syncCart
);

// Get cart sync status
// GET /api/cart/sync-status
router.get('/sync-status', 
  rateLimitConfigs.general,
  CartController.getCartSyncStatus
);

// Merge cart data from multiple devices
// POST /api/cart/merge
router.post('/merge', 
  rateLimitConfigs.general,
  CartController.mergeCart
);

// Validate cart items against current inventory
// GET /api/cart/validate
router.get('/validate', 
  rateLimitConfigs.general,
  CartController.validateCart
);

export { router as cartRoutes };