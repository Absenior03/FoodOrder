import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { DatabaseConfig } from './config/database';
import { 
  corsMiddleware, 
  securityHeaders, 
  sanitizeRequest, 
  securityLogger,
  rateLimitConfigs 
} from './middleware';
import { authRoutes, inventoryRoutes, cartRoutes, orderRoutes } from './routes';
import { adminRoutes } from './routes/adminRoutes';
import { initializeWebSocketService } from './services/websocketService';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5001;

// Security middleware (applied first)
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(securityLogger);
app.use(sanitizeRequest);

// General API rate limiting
app.use('/api', rateLimitConfigs.api);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Food Ordering Platform API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  // Handle CORS errors
  if (error.message === 'Not allowed by CORS') {
    res.status(403).json({
      success: false,
      error: {
        code: 'CORS_ERROR',
        message: 'Cross-origin request not allowed'
      }
    });
    return;
  }
  
  // Handle JSON parsing errors
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body'
      }
    });
    return;
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Initialize server
const startServer = async () => {
  try {
    // Initialize WebSocket service
    const websocketService = initializeWebSocketService(httpServer);
    console.log('🔌 WebSocket service initialized');

    // Start server first
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 WebSocket server ready for connections`);
    });

    // Connect to databases in background (non-blocking)
    DatabaseConfig.connectMongoDB().catch(err => {
      console.log('ℹ️  MongoDB connection failed, continuing without database');
    });
    
    const redisClient = await DatabaseConfig.connectRedis();
    
    // Make Redis client available globally if connected
    if (redisClient) {
      app.locals.redisClient = redisClient;
    }

    // Make WebSocket service available globally
    app.locals.websocketService = websocketService;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  
  try {
    await DatabaseConfig.closeConnections();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
startServer();