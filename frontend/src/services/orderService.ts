import axios from 'axios';
import {
  CheckoutRequest,
  CheckoutResponse,
  OrderHistoryResponse,
  OrderDetailsResponse,
  CheckoutValidationResponse,
  OrderTrackingResponse,
  PaymentRequest,
  PaymentResponse
} from '../types/order';
import { tokenStorage } from '../utils/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      error.code = 'NETWORK_ERROR';
      error.message = 'Network connection failed. Please check your internet connection.';
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please try again.';
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear invalid token
      tokenStorage.remove();
      // Don't automatically redirect - let components handle this
    }
    
    return Promise.reject(error);
  }
);

export const orderService = {
  /**
   * Validate cart items before checkout
   */
  validateCheckout: async (): Promise<CheckoutValidationResponse> => {
    const response = await api.post('/orders/validate-checkout');
    return response.data;
  },

  /**
   * Process cart checkout and create order
   */
  checkout: async (checkoutData: CheckoutRequest): Promise<CheckoutResponse> => {
    const response = await api.post('/orders/checkout', checkoutData);
    return response.data;
  },

  /**
   * Get user's order history with pagination
   */
  getOrderHistory: async (page: number = 1, limit: number = 10, status?: string): Promise<OrderHistoryResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) {
      params.append('status', status);
    }

    const response = await api.get(`/orders/history?${params.toString()}`);
    return response.data;
  },

  /**
   * Get specific order details by tracking ID
   */
  getOrderById: async (orderId: string): Promise<OrderDetailsResponse> => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  /**
   * Get order tracking information
   */
  getOrderTracking: async (orderId: string): Promise<OrderTrackingResponse> => {
    const response = await api.get(`/orders/${orderId}/tracking`);
    return response.data;
  },

  /**
   * Process payment for an order (simulation)
   */
  processPayment: async (orderId: string, paymentData: PaymentRequest): Promise<PaymentResponse> => {
    const response = await api.post(`/orders/${orderId}/payment`, paymentData);
    return response.data;
  },
};