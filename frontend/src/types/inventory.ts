export enum FoodCategory {
  ALL = 'All',
  FRUIT = 'Fruit',
  VEGETABLE = 'Vegetable',
  NON_VEG = 'Non-veg',
  BREADS = 'Breads',
  OTHER = 'Other'
}

export interface FoodItem {
  _id: string;
  name: string;
  description: string;
  category: FoodCategory;
  price: number;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  name: string;
  value: string;
  count: number;
  availableItems: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface InventoryResponse {
  success: boolean;
  data: {
    items: FoodItem[];
    pagination: PaginationInfo;
  };
}

export interface CategoriesResponse {
  success: boolean;
  data: {
    categories: Category[];
  };
}

export interface ItemResponse {
  success: boolean;
  data: {
    item: FoodItem;
  };
}

export interface InventoryState {
  items: FoodItem[];
  categories: Category[];
  selectedCategory: string;
  isLoading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
}