import React from 'react';
import { useCart } from '../../context/CartContext';
import { ValidationItem } from '../../types/order';

interface OrderSummaryProps {
  validationItems?: ValidationItem[];
  showValidation?: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  validationItems, 
  showValidation = false 
}) => {
  const { state, getCartTotal, getCartItemCount } = useCart();

  // Use validation items if provided, otherwise use cart items
  const displayItems = showValidation && validationItems ? validationItems : state.items;
  const total = showValidation && validationItems 
    ? validationItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
    : getCartTotal();

  if (displayItems.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
        <p className="text-gray-500 text-center py-8">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
      
      <div className="space-y-4 mb-6">
        {displayItems.map((item) => {
          // Handle both cart items and validation items
          const itemData = 'valid' in item ? item : {
            itemId: item.itemId,
            name: typeof item.itemId === 'object' ? item.itemId.name : 'Unknown Item',
            quantity: item.quantity,
            price: typeof item.itemId === 'object' ? item.itemId.price : item.priceAtAdd,
            totalPrice: item.quantity * item.priceAtAdd
          };

          const isValidationItem = 'valid' in item;
          const hasIssue = isValidationItem && !item.valid;

          return (
            <div 
              key={typeof itemData.itemId === 'object' ? (itemData.itemId as any)._id : itemData.itemId as string} 
              className={`flex justify-between items-start p-3 rounded-lg ${
                hasIssue ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex-1">
                <h3 className={`font-medium ${hasIssue ? 'text-red-900' : 'text-gray-900'}`}>
                  {itemData.name}
                </h3>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <span>Qty: {itemData.quantity}</span>
                  <span className="mx-2">×</span>
                  <span>₹{('price' in itemData ? itemData.price : (itemData as any).priceAtAdd)?.toFixed(2) || '0.00'}</span>
                </div>
                {hasIssue && (
                  <p className="text-sm text-red-600 mt-1">
                    {(item as ValidationItem).issue}
                  </p>
                )}
                {isValidationItem && item.availableStock !== undefined && (
                  <p className="text-sm text-gray-500 mt-1">
                    Available: {item.availableStock} items
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className={`font-semibold ${hasIssue ? 'text-red-900' : 'text-gray-900'}`}>
                  ₹{('totalPrice' in itemData ? itemData.totalPrice : (itemData.quantity * (itemData as any).priceAtAdd))?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order totals */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Items ({showValidation ? displayItems.length : getCartItemCount()})</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Delivery Fee</span>
          <span>Free</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tax</span>
          <span>₹{(total * 0.08).toFixed(2)}</span>
        </div>
        <div className="border-t pt-2 flex justify-between text-lg font-semibold text-gray-900">
          <span>Total</span>
          <span>₹{(total * 1.08).toFixed(2)}</span>
        </div>
      </div>

      {/* Validation summary */}
      {showValidation && validationItems && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center text-sm text-blue-800">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>
              {validationItems.filter(item => item.valid).length} of {validationItems.length} items available
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSummary;