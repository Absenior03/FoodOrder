import { FoodItem } from './inventory';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  totalPrice: number;
  item?: FoodItem; // Populated item details
}

export interface Order {
  _id: string;
  orderId: string; // Unique tracking ID
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryAddress: Address;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutRequest {
  deliveryAddress: Address;
}

export interface CheckoutResponse {
  success: boolean;
  data: {
    order: Order;
  };
  message: string;
}

export interface OrderHistoryResponse {
  success: boolean;
  data: {
    orders: Order[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalOrders: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface OrderDetailsResponse {
  success: boolean;
  data: {
    order: Order;
  };
}

export interface ValidationItem {
  itemId: string;
  name: string;
  quantity: number;
  price?: number;
  totalPrice?: number;
  availableStock?: number;
  valid: boolean;
  issue?: string;
}

export interface CheckoutValidationResponse {
  success: boolean;
  data: {
    validation: {
      valid: boolean;
      items: ValidationItem[];
      totalAmount: number;
      itemCount: number;
    };
  };
}

export interface TrackingStep {
  status: OrderStatus;
  title: string;
  description: string;
  completed: boolean;
  timestamp: string | null;
}

export interface OrderTracking {
  orderId: string;
  currentStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  isDelivered: boolean;
  isCancelled: boolean;
  estimatedDelivery: string | null;
  deliveryAddress: Address;
  timeline: TrackingStep[];
  lastUpdated: string;
}

export interface OrderTrackingResponse {
  success: boolean;
  data: {
    tracking: OrderTracking;
  };
}

export interface PaymentRequest {
  paymentMethod: string;
}

export interface PaymentResponse {
  success: boolean;
  data: {
    order: {
      orderId: string;
      paymentStatus: PaymentStatus;
      status: OrderStatus;
      totalAmount: number;
    };
  };
  message: string;
}