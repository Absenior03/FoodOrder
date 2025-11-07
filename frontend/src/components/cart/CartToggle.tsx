import React from 'react';
import { useCart } from '../../context/CartContext';

const CartToggle: React.FC = () => {
  const { toggleCart, getCartItemCount } = useCart();
  const itemCount = getCartItemCount();

  return (
    <button
      onClick={toggleCart}
      className="relative p-2.5 text-gray-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-all duration-200 hover:bg-blue-50 group"
      aria-label="Toggle shopping cart"
    >
      <svg
        className={`w-6 h-6 transition-transform duration-200 ${itemCount > 0 ? 'group-hover:scale-110' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6M20 13v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6"
        />
      </svg>
      
      {/* Item Count Badge */}
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
};

export default CartToggle;