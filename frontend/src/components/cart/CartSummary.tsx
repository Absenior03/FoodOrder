import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const CartSummary: React.FC = () => {
  const navigate = useNavigate();
  const { state, getCartTotal, getCartItemCount, toggleCart } = useCart();
  const { state: authState } = useAuth();

  const subtotal = getCartTotal();
  const itemCount = getCartItemCount();
  const deliveryFee = subtotal > 500 ? 0 : 50; // Free delivery over ₹500
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + deliveryFee + tax;

  if (state.items.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6M20 13v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" />
        </svg>
        <p>Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-200 bg-gray-50">
      <div className="space-y-3">
        {/* Item Count */}
        <div className="flex justify-between text-sm text-gray-600">
          <span>Items ({itemCount})</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>

        {/* Delivery Fee */}
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            Delivery Fee
            {subtotal > 500 && (
              <span className="text-green-600 ml-1">(Free over ₹500)</span>
            )}
          </span>
          <span>
            {deliveryFee === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              `₹${deliveryFee.toFixed(2)}`
            )}
          </span>
        </div>

        {/* Tax */}
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tax (8%)</span>
          <span>₹{tax.toFixed(2)}</span>
        </div>

        {/* Total */}
        <div className="flex justify-between text-lg font-semibold text-gray-900 pt-3 border-t border-gray-300">
          <span>Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>

        {/* Free Delivery Progress */}
        {subtotal < 500 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Add ₹{(500 - subtotal).toFixed(2)} more for free delivery</span>
              <span>{Math.round((subtotal / 500) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((subtotal / 500) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Checkout Button */}
        <button
          className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!authState.isAuthenticated}
          onClick={() => {
            if (authState.isAuthenticated) {
              toggleCart(); // Close cart sidebar
              navigate('/checkout');
            }
          }}
        >
          {authState.isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
        </button>
        
        {!authState.isAuthenticated && (
          <p className="text-xs text-gray-500 text-center mt-2">
            Please log in to proceed with checkout
          </p>
        )}
      </div>
    </div>
  );
};

export default CartSummary;