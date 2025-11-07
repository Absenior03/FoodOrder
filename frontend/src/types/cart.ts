import { FoodItem } from './inventory';

export interface CartItem {
  itemId: FoodItem;  // Backend returns the full item object here
  quantity: number;
  priceAtAdd: number;
}

export interface Cart {
  _id?: string;
  userId?: string;
  items: CartItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface CartResponse {
  success: boolean;
  data: {
    cart: Cart;
  };
}

export interface AddToCartRequest {
  itemId: string;
  quantity: number;
}

export interface UpdateCartRequest {
  itemId: string;
  quantity: number;
}