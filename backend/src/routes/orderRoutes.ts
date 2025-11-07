import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authMiddleware, validateInput, rateLimitConfigs } from '../middleware';

const router = Router();

// Order validation rules
const orderValidationRules = {
  checkout: [
    {
      field: 'deliveryAddress',
      required: true,
      custom: (value: any) => {
        if (!value || typeof value !== 'object') {
          return 'Delivery address is required';
        }
        
        const { street, city, state, zipCode } = value;
        
        if (!street || typeof street !== 'string' || street.trim().length === 0) {
          return 'Street address is required';
        }
        
        if (!city || typeof city !== 'string' || city.trim().length === 0) {
          return 'City is required';
        }
        
        if (!state || typeof state !== 'string' || state.trim().length === 0) {
          return 'State is required';
        }
        
        if (!zipCode || typeof zipCode !== 'string') {
          return 'PIN code is required';
        }
        
        const zipCodeRegex = /^\d{6}$/;
        if (!zipCodeRegex.test(zipCode.trim())) {
          return 'Please provide a valid PIN code (6 digits)';
        }
        
        return true;
      }
    }
  ],
  processPayment: [
    {
      field: 'paymentMethod',
      required: true,
      type: 'string' as const,
      custom: (value: string) => {
        const validMethods = ['credit_card', 'debit_card', 'paypal', 'cash_on_delivery'];
        return validMethods.includes(value) || 'Invalid payment method';
      }
    }
  ]
};

// All order routes require authentication
router.use(authMiddleware);

// Process cart checkout and create order
// POST /api/orders/checkout
router.post('/checkout',
  rateLimitConfigs.checkout, // Use checkout-specific rate limiting
  validateInput(orderValidationRules.checkout),
  OrderController.checkout
);

// Validate cart items before checkout
// POST /api/orders/validate-checkout
router.post('/validate-checkout',
  rateLimitConfigs.general,
  OrderController.validateCheckout
);

// Get user's order history
// GET /api/orders/history
router.get('/history',
  rateLimitConfigs.general,
  OrderController.getOrderHistory
);

// Get order by tracking ID
// GET /api/orders/:orderId
router.get('/:orderId',
  rateLimitConfigs.general,
  OrderController.getOrderById
);

// Get order tracking information
// GET /api/orders/:orderId/tracking
router.get('/:orderId/tracking',
  rateLimitConfigs.general,
  OrderController.getOrderTracking
);

// Update order status (admin functionality)
// PUT /api/orders/:orderId/status
router.put('/:orderId/status',
  rateLimitConfigs.auth,
  OrderController.updateOrderStatus
);

// Simulate payment processing
// POST /api/orders/:orderId/payment
router.post('/:orderId/payment',
  rateLimitConfigs.auth, // Use auth rate limiting for payment processing (strict)
  validateInput(orderValidationRules.processPayment),
  OrderController.processPayment
);

export { router as orderRoutes };