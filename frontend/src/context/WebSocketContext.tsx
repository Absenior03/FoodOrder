import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import websocketService, { 
  StockUpdateData, 
  CartUpdateData, 
  OrderUpdateData,
  WebSocketEventCallback 
} from '../services/websocketService';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  isConnected: boolean;
  connectionStatus: {
    connected: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
  };
  subscribeToStockUpdates: (itemIds: string[]) => void;
  subscribeToOrderUpdates: (orderIds: string[]) => void;
  syncCart: () => void;
  addEventListener: (event: string, callback: WebSocketEventCallback) => void;
  removeEventListener: (event: string, callback: WebSocketEventCallback) => void;
  removeAllEventListeners: (event?: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { state: authState } = useAuth();
  const user = authState.user;
  const token = authState.token;
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5
  });

  useEffect(() => {
    // Setup connection status listeners
    const handleConnected = () => {
      setIsConnected(true);
      setConnectionStatus(websocketService.getConnectionStatus());
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setConnectionStatus(websocketService.getConnectionStatus());
    };

    const handleConnectionError = (data: any) => {
      console.error('WebSocket connection error:', data.error);
      setIsConnected(false);
      setConnectionStatus(websocketService.getConnectionStatus());
    };

    const handleMaxReconnectAttempts = () => {
      console.log('Max reconnection attempts reached');
      setConnectionStatus(websocketService.getConnectionStatus());
    };

    const handleOffline = () => {
      setIsConnected(false);
    };

    // Add event listeners
    websocketService.addEventListener('connected', handleConnected);
    websocketService.addEventListener('disconnected', handleDisconnected);
    websocketService.addEventListener('connection_error', handleConnectionError);
    websocketService.addEventListener('max_reconnect_attempts', handleMaxReconnectAttempts);
    websocketService.addEventListener('offline', handleOffline);

    // Connect if user is authenticated
    if (user && token) {
      websocketService.connect(token);
    }

    // Cleanup on unmount
    return () => {
      websocketService.removeEventListener('connected', handleConnected);
      websocketService.removeEventListener('disconnected', handleDisconnected);
      websocketService.removeEventListener('connection_error', handleConnectionError);
      websocketService.removeEventListener('max_reconnect_attempts', handleMaxReconnectAttempts);
      websocketService.removeEventListener('offline', handleOffline);
    };
  }, [user, token]);

  // Disconnect when user logs out
  useEffect(() => {
    if (!user || !token) {
      websocketService.disconnect();
      setIsConnected(false);
      setConnectionStatus({
        connected: false,
        reconnectAttempts: 0,
        maxReconnectAttempts: 5
      });
    }
  }, [user, token]);

  const subscribeToStockUpdates = (itemIds: string[]) => {
    websocketService.subscribeToStockUpdates(itemIds);
  };

  const subscribeToOrderUpdates = (orderIds: string[]) => {
    websocketService.subscribeToOrderUpdates(orderIds);
  };

  const syncCart = () => {
    websocketService.syncCart();
  };

  const addEventListener = (event: string, callback: WebSocketEventCallback) => {
    websocketService.addEventListener(event, callback);
  };

  const removeEventListener = (event: string, callback: WebSocketEventCallback) => {
    websocketService.removeEventListener(event, callback);
  };

  const removeAllEventListeners = (event?: string) => {
    websocketService.removeAllEventListeners(event);
  };

  const value: WebSocketContextType = {
    isConnected,
    connectionStatus,
    subscribeToStockUpdates,
    subscribeToOrderUpdates,
    syncCart,
    addEventListener,
    removeEventListener,
    removeAllEventListeners
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};