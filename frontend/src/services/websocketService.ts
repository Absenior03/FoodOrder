import { io, Socket } from 'socket.io-client';
import { tokenStorage } from '../utils/auth';

export interface StockUpdateData {
  itemId: string;
  newStock: number;
  itemName?: string;
  timestamp: string;
}

export interface CartUpdateData {
  cart: any;
  timestamp: string;
}

export interface OrderUpdateData {
  orderId: string;
  status: string;
  orderData?: any;
  timestamp: string;
}

export type WebSocketEventCallback = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private eventListeners: Map<string, Set<WebSocketEventCallback>> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Connect to WebSocket server
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    });

    this.setupSocketEventHandlers();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Subscribe to stock updates for specific items
   */
  subscribeToStockUpdates(itemIds: string[]): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe-stock-updates', itemIds);
    }
  }

  /**
   * Subscribe to order status updates
   */
  subscribeToOrderUpdates(orderIds: string[]): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe-order-updates', orderIds);
    }
  }

  /**
   * Request cart synchronization
   */
  syncCart(): void {
    if (this.socket?.connected) {
      this.socket.emit('sync-cart');
    }
  }

  /**
   * Add event listener for WebSocket events
   */
  addEventListener(event: string, callback: WebSocketEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, callback: WebSocketEventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  /**
   * Remove all event listeners for a specific event
   */
  removeAllEventListeners(event?: string): void {
    if (event) {
      this.eventListeners.delete(event);
    } else {
      this.eventListeners.clear();
    }
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emitToListeners('connected', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emitToListeners('disconnected', { connected: false, reason });
      
      // Attempt to reconnect if disconnection was not intentional
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        return;
      }
      
      this.attemptReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
      this.emitToListeners('connection_error', { error: error.message });
      this.attemptReconnect();
    });

    // Stock update events
    this.socket.on('stock-updated', (data: StockUpdateData) => {
      console.log('Stock updated:', data);
      this.emitToListeners('stock-updated', data);
    });

    this.socket.on('stock-subscription-confirmed', (data) => {
      console.log('Stock subscription confirmed:', data);
      this.emitToListeners('stock-subscription-confirmed', data);
    });

    // Cart update events
    this.socket.on('cart-updated', (data: CartUpdateData) => {
      console.log('Cart updated:', data);
      this.emitToListeners('cart-updated', data);
    });

    this.socket.on('cart-synced', (data) => {
      console.log('Cart synced:', data);
      this.emitToListeners('cart-synced', data);
    });

    this.socket.on('cart-sync-error', (data) => {
      console.error('Cart sync error:', data);
      this.emitToListeners('cart-sync-error', data);
    });

    // Order update events
    this.socket.on('order-status-updated', (data: OrderUpdateData) => {
      console.log('Order status updated:', data);
      this.emitToListeners('order-status-updated', data);
    });

    this.socket.on('order-subscription-confirmed', (data) => {
      console.log('Order subscription confirmed:', data);
      this.emitToListeners('order-subscription-confirmed', data);
    });
  }

  /**
   * Setup general event listeners
   */
  private setupEventListeners(): void {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.isConnected) {
        // Page became visible and we're not connected, try to reconnect
        const token = tokenStorage.get();
        if (token) {
          this.connect(token);
        }
      }
    });

    // Handle online/offline events
    window.addEventListener('online', () => {
      console.log('Browser came online');
      if (!this.isConnected) {
        const token = tokenStorage.get();
        if (token) {
          this.connect(token);
        }
      }
    });

    window.addEventListener('offline', () => {
      console.log('Browser went offline');
      this.emitToListeners('offline', { online: false });
    });
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.emitToListeners('max_reconnect_attempts', { 
        attempts: this.reconnectAttempts 
      });
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      const token = tokenStorage.get();
      if (token && !this.isConnected) {
        this.connect(token);
      }
    }, delay);
  }

  /**
   * Emit events to registered listeners
   */
  private emitToListeners(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get connection status information
   */
  getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;