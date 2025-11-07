import React, { useState } from 'react';
import { FoodItem } from '../../types/inventory';
import StockIndicator from './StockIndicator';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

interface ItemCardProps {
  item: FoodItem;
  showStockAnimation?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ 
  item, 
  showStockAnimation = false
}) => {
  const { addToCart } = useCart();
  const { state: authState } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddToCart = async () => {
    if (!authState.isAuthenticated) {
      alert('Please log in to add items to your cart');
      return;
    }

    if (item.stock === 0) {
      return;
    }

    try {
      setIsAddingToCart(true);
      await addToCart({
        itemId: item._id,
        quantity: quantity
      });
      
      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
      // Reset quantity to 1
      setQuantity(1);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= item.stock) {
      setQuantity(newQuantity);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Image Container */}
      <div className="relative h-48 bg-gray-200">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        
        {/* Fallback placeholder */}
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 ${item.imageUrl ? 'hidden' : ''}`}>
          <div className="text-center">
            <div className="text-4xl mb-2">🍽️</div>
            <p className="text-gray-500 text-sm">No Image</p>
          </div>
        </div>

        {/* Stock indicator overlay */}
        <div className="absolute top-2 right-2">
          <StockIndicator 
            stock={item.stock}
            itemId={item._id}
            showAnimation={showStockAnimation}
          />
        </div>

        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <span className="bg-white bg-opacity-90 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
            {item.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
          {item.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {item.description}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div className="text-xl font-bold text-gray-900">
            {formatPrice(item.price)}
          </div>
          
          {item.stock > 0 && (
            <div className="text-sm text-gray-500">
              {item.stock} available
            </div>
          )}
        </div>

        {/* Quantity Selector and Add to Cart */}
        {authState.isAuthenticated && item.stock > 0 && (
          <div className="flex items-center space-x-2 mb-3">
            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= item.stock}
                className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={item.stock === 0 || isAddingToCart || !authState.isAuthenticated}
          className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            item.stock === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : !authState.isAuthenticated
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isAddingToCart
              ? 'bg-blue-400 text-white cursor-not-allowed'
              : showSuccess
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {isAddingToCart ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Adding...
            </div>
          ) : showSuccess ? (
            <div className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Added to Cart!
            </div>
          ) : item.stock === 0 ? (
            'Out of Stock'
          ) : !authState.isAuthenticated ? (
            'Login to Add to Cart'
          ) : (
            `Add ${quantity} to Cart`
          )}
        </button>
      </div>
    </div>
  );
};

export default ItemCard;