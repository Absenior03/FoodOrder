import axios from 'axios';
import { InventoryResponse, CategoriesResponse, ItemResponse, FoodItem, Category } from '../types/inventory';
import { tokenStorage } from '../utils/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Create axios instance with default config
const inventoryAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/inventory`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token if available
inventoryAPI.interceptors.request.use(
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

export interface GetItemsParams {
  category?: string;
  page?: number;
  limit?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: string;
}

export const inventoryService = {
  async getItems(params: GetItemsParams = {}): Promise<{ items: FoodItem[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.category && params.category !== 'All') {
        queryParams.append('category', params.category);
      }
      if (params.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params.search) {
        queryParams.append('q', params.search);
      }
      if (params.minPrice !== undefined) {
        queryParams.append('minPrice', params.minPrice.toString());
      }
      if (params.maxPrice !== undefined) {
        queryParams.append('maxPrice', params.maxPrice.toString());
      }
      if (params.sortBy) {
        queryParams.append('sortBy', params.sortBy);
      }
      if (params.sortOrder) {
        queryParams.append('sortOrder', params.sortOrder);
      }

      // For now, use the items endpoint for all queries
      // TODO: Use search endpoint when backend validation is fixed
      const response = await inventoryAPI.get<InventoryResponse>(`/items?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch items');
    }
  },

  async getItemById(id: string): Promise<FoodItem> {
    try {
      const response = await inventoryAPI.get<ItemResponse>(`/items/${id}`);
      return response.data.data.item;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch item');
    }
  },

  async getCategories(): Promise<Category[]> {
    try {
      const response = await inventoryAPI.get<CategoriesResponse>('/categories');
      return response.data.data.categories;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch categories');
    }
  }
};