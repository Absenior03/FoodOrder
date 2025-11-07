import axios from 'axios';
import { CartResponse, AddToCartRequest, UpdateCartRequest } from '../types/cart';
import { tokenStorage } from '../utils/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const cartService = {
  // Get user's cart
  getCart: async (): Promise<CartResponse> => {
    const response = await api.get('/cart');
    return response.data;
  },

  // Add item to cart
  addToCart: async (data: AddToCartRequest): Promise<CartResponse> => {
    const response = await api.post('/cart/add', data);
    return response.data;
  },

  // Update cart item quantity
  updateCartItem: async (data: UpdateCartRequest): Promise<CartResponse> => {
    const response = await api.put('/cart/update', data);
    return response.data;
  },

  // Remove item from cart
  removeFromCart: async (itemId: string): Promise<CartResponse> => {
    const response = await api.delete(`/cart/remove/${itemId}`);
    return response.data;
  },

  // Clear entire cart
  clearCart: async (): Promise<CartResponse> => {
    const response = await api.delete('/cart/clear');
    return response.data;
  },
};