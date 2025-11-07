import React, { useState } from 'react';
import { CartItem as CartItemType } from '../../types/cart';
import { useCart } from '../../context/CartContext';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateCartItem, removeFromCart } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      setIsUpdating(true);
      await updateCartItem(item.itemId._id, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    try {
      setIsUpdating(true);
      await removeFromCart(item.itemId._id);
      setShowRemoveConfirm(false);
    } catch (error) {
      console.error('Failed to remove item:', error);
      setIsUpdating(false);
    }
  };

  const itemTotal = item.priceAtAdd * item.quantity;

  return (
    <div className="relative bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-all duration-200 hover:shadow-md">
      {/* Item Image */}
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <img
            src={item.itemId.imageUrl || '/api/placeholder/80/80'}
            alt={item.itemId.name}
            className="w-20 h-20 object-cover rounded-lg shadow-sm"
          />
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-gray-900 truncate mb-1">
            {item.itemId.name}
          </h4>
          <p className="text-sm text-blue-600 font-medium mb-1">
            ₹{item.priceAtAdd.toFixed(2)} each
          </p>
          <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
            {item.itemId.category}
          </p>
        </div>

        {/* Remove Button */}
        <div className="flex-shrink-0">
          {showRemoveConfirm ? (
            <div className="flex space-x-2">
              <button
                onClick={handleRemove}
                disabled={isUpdating}
                className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                Remove
              </button>
              <button
                onClick={() => setShowRemoveConfirm(false)}
                disabled={isUpdating}
                className="text-xs px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowRemoveConfirm(true)}
              disabled={isUpdating}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Quantity Controls and Total */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-1">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={isUpdating || item.quantity <= 1}
            className="w-8 h-8 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <span className="w-10 text-center text-sm font-semibold text-gray-900">
            {item.quantity}
          </span>
          
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={isUpdating || item.quantity >= item.itemId.stock}
            className="w-8 h-8 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>

        {/* Item Total */}
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            ₹{itemTotal.toFixed(2)}
          </p>
          {item.quantity > 1 && (
            <p className="text-xs text-gray-500">
              {item.quantity} × ₹{item.priceAtAdd.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isUpdating && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default CartItem;