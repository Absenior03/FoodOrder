import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../../context/WebSocketContext';

interface StockIndicatorProps {
  stock: number;
  itemId: string;
  className?: string;
  showAnimation?: boolean;
}

const StockIndicator: React.FC<StockIndicatorProps> = ({ 
  stock: initialStock, 
  itemId,
  className = '', 
  showAnimation = false 
}) => {
  const [stock, setStock] = useState(initialStock);
  const [isUpdating, setIsUpdating] = useState(false);
  const { addEventListener, removeEventListener, subscribeToStockUpdates } = useWebSocket();

  useEffect(() => {
    // Subscribe to stock updates for this item
    subscribeToStockUpdates([itemId]);

    // Handle stock updates
    const handleStockUpdate = (data: any) => {
      if (data.itemId === itemId) {
        setIsUpdating(true);
        setStock(data.newStock);
        
        // Remove animation after a short delay
        setTimeout(() => {
          setIsUpdating(false);
        }, 2000);
      }
    };

    addEventListener('stock-updated', handleStockUpdate);

    return () => {
      removeEventListener('stock-updated', handleStockUpdate);
    };
  }, [itemId, addEventListener, removeEventListener, subscribeToStockUpdates]);

  // Update stock when prop changes
  useEffect(() => {
    setStock(initialStock);
  }, [initialStock]);
  const getStockStatus = () => {
    if (stock === 0) {
      return {
        text: 'Not Available',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: '❌',
        priority: 'high'
      };
    } else if (stock <= 5) {
      return {
        text: `Only ${stock} left`,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '⚠️',
        priority: 'medium'
      };
    } else if (stock <= 20) {
      return {
        text: `${stock} available`,
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '📦',
        priority: 'low'
      };
    } else {
      return {
        text: 'In Stock',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: '✅',
        priority: 'low'
      };
    }
  };

  const status = getStockStatus();

  return (
    <div 
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border transition-all duration-300 ${status.className} ${className} ${
        showAnimation || isUpdating ? 'animate-pulse' : ''
      }`}
    >
      <span className="mr-1">{status.icon}</span>
      {status.text}
      {status.priority === 'high' && (
        <span className="ml-1 inline-block w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
      )}
      {status.priority === 'medium' && stock <= 3 && (
        <span className="ml-1 inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
      )}
    </div>
  );
};

export default StockIndicator;