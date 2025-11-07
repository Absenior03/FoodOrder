import axios from 'axios';
import { LoginCredentials, RegisterCredentials, User } from '../types/auth';
import { tokenStorage, userStorage } from '../utils/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Create axios instance with default config
const authAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
authAPI.interceptors.request.use(
  (config) => {
    const token = tokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
authAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage
      tokenStorage.remove();
      userStorage.remove();
      // Don't automatically redirect - let components handle this
    }
    return Promise.reject(error);
  }
);

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await authAPI.post<AuthResponse>('/login', credentials);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Login failed');
    }
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await authAPI.post<AuthResponse>('/register', credentials);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Registration failed');
    }
  },

  async logout(): Promise<void> {
    try {
      await authAPI.post('/logout');
    } catch (error) {
      // Even if logout fails on server, we should clear local storage
      console.error('Logout error:', error);
    }
  },

  async getProfile(): Promise<User> {
    try {
      const response = await authAPI.get<{ success: boolean; data: User }>('/profile');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to get profile');
    }
  },

  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await authAPI.put<{ success: boolean; data: User }>('/profile', userData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to update profile');
    }
  }
};