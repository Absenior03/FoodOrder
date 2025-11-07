import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CartState, CartItem, AddToCartRequest } from '../types/cart';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';

interface CartContextType {
  state: CartState;
  addToCart: (request: AddToCartRequest) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART_ITEMS'; payload: CartItem[] }
  | { type: 'TOGGLE_CART' }
  | { type: 'SET_CART_OPEN'; payload: boolean }
  | { type: 'CLEAR_CART' };

const initialState: CartState = {
  items: [],
  isOpen: false,
  isLoading: false,
  error: null,
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_CART_ITEMS':
      return { ...state, items: action.payload, isLoading: false, error: null };
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
    case 'SET_CART_OPEN':
      return { ...state, isOpen: action.payload };
    case 'CLEAR_CART':
      return { ...state, items: [], isOpen: false };
    default:
      return state;
  }
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { state: authState } = useAuth();
  // Temporarily disable WebSocket to debug
  // const { addEventListener, removeEventListener, syncCart } = useWebSocket();

  // Load cart when user is authenticated
  useEffect(() => {
    if (authState.isAuthenticated) {
      loadCart();
    } else {
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [authState.isAuthenticated]);

  // Temporarily disable WebSocket cart synchronization to debug
  /*
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const handleCartUpdate = (data: any) => {
      console.log('Cart updated via WebSocket:', data);
      if (data.cart && data.cart.items) {
        dispatch({ type: 'SET_CART_ITEMS', payload: data.cart.items });
      }
    };

    const handleCartSynced = (data: any) => {
      console.log('Cart synced via WebSocket:', data);
      if (data.success && data.cart && data.cart.items) {
        dispatch({ type: 'SET_CART_ITEMS', payload: data.cart.items });
      }
    };

    const handleCartSyncError = (data: any) => {
      console.error('Cart sync error:', data);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sync cart across devices' });
    };

    // Add WebSocket event listeners
    addEventListener('cart-updated', handleCartUpdate);
    addEventListener('cart-synced', handleCartSynced);
    addEventListener('cart-sync-error', handleCartSyncError);

    // Request cart sync when WebSocket connects
    const handleWebSocketConnected = () => {
      syncCart();
    };

    addEventListener('connected', handleWebSocketConnected);

    return () => {
      removeEventListener('cart-updated', handleCartUpdate);
      removeEventListener('cart-synced', handleCartSynced);
      removeEventListener('cart-sync-error', handleCartSyncError);
      removeEventListener('connected', handleWebSocketConnected);
    };
  }, [authState.isAuthenticated, addEventListener, removeEventListener, syncCart]);
  */

  const loadCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cartService.getCart();
      dispatch({ type: 'SET_CART_ITEMS', payload: response.data.cart.items });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error?.message || 'Failed to load cart' });
    }
  };

  const addToCart = async (request: AddToCartRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cartService.addToCart(request);
      dispatch({ type: 'SET_CART_ITEMS', payload: response.data.cart.items });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error?.message || 'Failed to add item to cart' });
      throw error;
    }
  };

  const updateCartItem = async (itemId: string, quantity: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cartService.updateCartItem({ itemId, quantity });
      dispatch({ type: 'SET_CART_ITEMS', payload: response.data.cart.items });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error?.message || 'Failed to update cart item' });
      throw error;
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await cartService.removeFromCart(itemId);
      dispatch({ type: 'SET_CART_ITEMS', payload: response.data.cart.items });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error?.message || 'Failed to remove item from cart' });
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await cartService.clearCart();
      dispatch({ type: 'CLEAR_CART' });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error?.message || 'Failed to clear cart' });
      throw error;
    }
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const getCartTotal = (): number => {
    return state.items.reduce((total, item) => total + (item.priceAtAdd * item.quantity), 0);
  };

  const getCartItemCount = (): number => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  const value: CartContextType = {
    state,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    toggleCart,
    getCartTotal,
    getCartItemCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};