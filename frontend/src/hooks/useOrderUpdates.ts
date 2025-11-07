import { useEffect, useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';

export interface OrderUpdate {
  orderId: string;
  status: string;
  orderData?: any;
  timestamp: string;
}

export const useOrderUpdates = (orderIds: string[] = []) => {
  const [orderUpdates, setOrderUpdates] = useState<OrderUpdate[]>([]);
  const [latestUpdate, setLatestUpdate] = useState<OrderUpdate | null>(null);
  const { addEventListener, removeEventListener, subscribeToOrderUpdates } = useWebSocket();

  useEffect(() => {
    if (orderIds.length === 0) return;

    // Subscribe to order updates
    subscribeToOrderUpdates(orderIds);

    const handleOrderStatusUpdate = (data: OrderUpdate) => {
      console.log('Order status updated:', data);
      
      // Update the latest update
      setLatestUpdate(data);
      
      // Add to updates history
      setOrderUpdates(prev => {
        const newUpdates = [data, ...prev];
        // Keep only the last 50 updates
        return newUpdates.slice(0, 50);
      });
    };

    const handleOrderSubscriptionConfirmed = (data: any) => {
      console.log('Order subscription confirmed:', data);
    };

    // Add event listeners
    addEventListener('order-status-updated', handleOrderStatusUpdate);
    addEventListener('order-subscription-confirmed', handleOrderSubscriptionConfirmed);

    return () => {
      removeEventListener('order-status-updated', handleOrderStatusUpdate);
      removeEventListener('order-subscription-confirmed', handleOrderSubscriptionConfirmed);
    };
  }, [orderIds, addEventListener, removeEventListener, subscribeToOrderUpdates]);

  const getOrderUpdate = (orderId: string): OrderUpdate | undefined => {
    return orderUpdates.find(update => update.orderId === orderId);
  };

  const clearUpdates = () => {
    setOrderUpdates([]);
    setLatestUpdate(null);
  };

  return {
    orderUpdates,
    latestUpdate,
    getOrderUpdate,
    clearUpdates
  };
};