import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { 
  authMiddleware, 
  validateInput, 
  authValidationRules, 
  rateLimitConfigs 
} from '../middleware';

const router = Router();

// Public routes with validation and rate limiting
router.post('/register', 
  rateLimitConfigs.register,
  validateInput(authValidationRules.register),
  AuthController.register
);

router.post('/login', 
  rateLimitConfigs.auth,
  validateInput(authValidationRules.login),
  AuthController.login
);

// Protected routes (require authentication)
router.post('/logout', 
  authMiddleware, 
  AuthController.logout
);

router.get('/profile', 
  authMiddleware, 
  AuthController.getProfile
);

router.put('/profile', 
  authMiddleware,
  validateInput(authValidationRules.updateProfile),
  AuthController.updateProfile
);

export { router as authRoutes };