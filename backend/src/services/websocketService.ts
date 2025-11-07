import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware for WebSocket connections
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = (user._id as any).toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: any) => {
      console.log(`User ${socket.userId} connected via WebSocket`);

      // Track connected user
      this.addUserConnection(socket.userId, socket.id);

      // Join user to their personal room for targeted updates
      socket.join(`user:${socket.userId}`);

      // Handle cart synchronization requests
      socket.on('sync-cart', () => {
        this.handleCartSync(socket);
      });

      // Handle real-time stock updates subscription
      socket.on('subscribe-stock-updates', (itemIds: string[]) => {
        this.handleStockSubscription(socket, itemIds);
      });

      // Handle order status subscription
      socket.on('subscribe-order-updates', (orderIds: string[]) => {
        this.handleOrderSubscription(socket, orderIds);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected from WebSocket`);
        this.removeUserConnection(socket.userId, socket.id);
      });

      // Handle connection errors
      socket.on('error', (error: Error) => {
        console.error(`WebSocket error for user ${socket.userId}:`, error);
      });
    });
  }

  private addUserConnection(userId: string, socketId: string) {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socketId);
  }

  private removeUserConnection(userId: string, socketId: string) {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
  }

  private async handleCartSync(socket: any) {
    try {
      // Import cart service dynamically to avoid circular dependencies
      const { CartService } = await import('./cartService');
      const cart = await CartService.getCart(socket.userId);
      
      socket.emit('cart-synced', {
        success: true,
        cart: cart
      });
    } catch (error) {
      socket.emit('cart-sync-error', {
        success: false,
        error: 'Failed to sync cart'
      });
    }
  }

  private handleStockSubscription(socket: any, itemIds: string[]) {
    // Subscribe to stock updates for specific items
    itemIds.forEach(itemId => {
      socket.join(`stock:${itemId}`);
    });
    
    socket.emit('stock-subscription-confirmed', {
      success: true,
      subscribedItems: itemIds
    });
  }

  private handleOrderSubscription(socket: any, orderIds: string[]) {
    // Subscribe to order status updates
    orderIds.forEach(orderId => {
      socket.join(`order:${orderId}`);
    });
    
    socket.emit('order-subscription-confirmed', {
      success: true,
      subscribedOrders: orderIds
    });
  }

  // Public methods for broadcasting updates

  /**
   * Broadcast stock update to all subscribed clients
   */
  public broadcastStockUpdate(itemId: string, newStock: number, itemName?: string) {
    this.io.to(`stock:${itemId}`).emit('stock-updated', {
      itemId,
      newStock,
      itemName,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast cart update to specific user across all their devices
   */
  public broadcastCartUpdate(userId: string, cartData: any) {
    this.io.to(`user:${userId}`).emit('cart-updated', {
      cart: cartData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast order status update to specific user
   */
  public broadcastOrderUpdate(userId: string, orderId: string, status: string, orderData?: any) {
    // Send to user's personal room
    this.io.to(`user:${userId}`).emit('order-status-updated', {
      orderId,
      status,
      orderData,
      timestamp: new Date().toISOString()
    });

    // Also send to order-specific room for targeted updates
    this.io.to(`order:${orderId}`).emit('order-status-updated', {
      orderId,
      status,
      orderData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is connected
   */
  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get WebSocket server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}

// Export singleton instance
let websocketService: WebSocketService | null = null;

export const initializeWebSocketService = (httpServer: HTTPServer): WebSocketService => {
  if (!websocketService) {
    websocketService = new WebSocketService(httpServer);
  }
  return websocketService;
};

export const getWebSocketService = (): WebSocketService | null => {
  return websocketService;
};