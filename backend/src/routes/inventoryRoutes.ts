import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController';
import { 
  authMiddleware, 
  validateInput, 
  rateLimitConfigs,
  inventoryValidationRules
} from '../middleware';

const router = Router();

// Public routes (no authentication required)
router.get('/items', 
  rateLimitConfigs.general,
  validateInput(inventoryValidationRules.getItems),
  InventoryController.getItems
);

router.get('/items/:id', 
  rateLimitConfigs.general,
  validateInput(inventoryValidationRules.getItemById),
  InventoryController.getItemById
);

router.get('/categories', 
  rateLimitConfigs.general,
  InventoryController.getCategories
);

router.get('/search', 
  rateLimitConfigs.general,
  validateInput(inventoryValidationRules.searchItems),
  InventoryController.searchItems
);

// Protected routes (require authentication)
// Note: In a real application, you might want to add admin role checking
router.put('/items/:id/stock', 
  authMiddleware,
  rateLimitConfigs.general,
  validateInput(inventoryValidationRules.updateStock),
  InventoryController.updateStock
);

export { router as inventoryRoutes };