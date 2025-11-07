import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import OrderConfirmation from '../OrderConfirmation';
import { AuthProvider } from '../../../context/AuthContext';
import { orderService } from '../../../services/orderService';
import { Order, OrderStatus, PaymentStatus } from '../../../types/order';

// Mock services
jest.mock('../../../services/orderService');
const mockOrderService = orderService as jest.Mocked<typeof orderService>;

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockOrder: Order = {
  _id: 'order1',
  orderId: 'ORD-123456',
  userId: 'user1',
  items: [
    {
      itemId: '1',
      name: 'Apple',
      quantity: 2,
      price: 1.50,
      totalPrice: 3.00
    },
    {
      itemId: '2',
      name: 'Banana',
      quantity: 1,
      price: 0.75,
      totalPrice: 0.75
    }
  ],
  totalAmount: 3.75,
  status: OrderStatus.CONFIRMED,
  paymentStatus: PaymentStatus.COMPLETED,
  deliveryAddress: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '12345'
  },
  createdAt: '2023-01-01T12:00:00Z',
  updatedAt: '2023-01-01T12:00:00Z'
};

// Mock auth context
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user1', email: 'test@example.com' },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn()
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

const TestWrapper: React.FC<{ children: React.ReactNode; initialEntries?: string[] }> = ({ 
  children, 
  initialEntries = ['/order-confirmation/ORD-123456'] 
}) => (
  <div>{children}</div>
);

describe('OrderConfirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks for useParams and useLocation
    jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({
      orderId: 'ORD-123456'
    });
    
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
      state: { order: mockOrder },
      pathname: '/order-confirmation/ORD-123456',
      search: '',
      hash: '',
      key: 'test'
    });
  });

  describe('Order Display', () => {
    it('should display order confirmation when order is passed via location state', () => {
      render(
        <TestWrapper>
          <OrderConfirmation />
        </TestWrapper>
      );

      expect(screen.getByText('Order Confirmed!')).toBeInTheDocument();
      expect(screen.getByText('Order #ORD-123456')).toBeInTheDocument();
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('Banana')).toBeInTheDocument();
      expect(screen.getByText('$3.75')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
    });

    it('should fetch order details when not provided in location state', async () => {
      // Mock location without state
      jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
        state: null,
        pathname: '/order-confirmation/ORD-123456',
        search: '',
        hash: '',
        key: 'test'
      });

      jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({
        orderId: 'ORD-123456'
      });

      mockOrderService.getOrderById.mockResolvedValue({
        success: true,
        data: { order: mockOrder }
      });

      render(
        <TestWrapper>
          <OrderConfirmation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockOrderService.getOrderById).toHaveBeenCalledWith('ORD-123456');
      });

      await waitFor(() => {
        expect(screen.getByText('Order Confirmed!')).toBeInTheDocument();
        expect(screen.getByText('Order #ORD-123456')).toBeInTheDocument();
      });
    });

    it('should display order items with correct quantities and prices', () => {
      render(
        <TestWrapper>
          <OrderConfirmation />
        </TestWrapper>
      );

      expect(screen.getByText('Qty: 2')).toBeInTheDocument();
      expect(screen.getByText('Qty: 1')).toBeInTheDocument();
      expect(screen.getByText('$1.50')).toBeInTheDocument();
      expect(screen.getByText('$0.75')).toBeInTheDocument();
      expect(screen.getByText('$3.00')).toBeInTheDocument();
      expect(screen.getByText('$0.75')).toBeInTheDocument();
    });

    it('should display order totals with tax calculation', () => {
      render(
        <TestWrapper>
          <OrderConfirmation />
        </TestWrapper>
      );

      expect(screen.getByText('$3.75')).toBeInTheDocument(); // Subtotal
      expect(screen.getByText('$0.30')).toBeInTheDocument(); // Tax (8%)
      expect(screen.getByText('$4.05')).toBeInTheDocument(); // Total with tax
      expect(screen.getByText('Free')).toBeInTheDocument(); // Delivery fee
    });

    it('should display delivery address correctly', () => {
      render(
        <TestWrapper>
          <OrderConfirmation />
        </TestWrapper>
      );

      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('New York, NY 12345')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle order not found error', async () => {
      // Mock location without state to trigger fetch
      jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
        state: null,
        pathname: '/order-confirmation/ORD-123456',
        search: '',
        hash: '',
        key: 'test'
      });

      const notFoundError = {
        response: {
          status: 404,
          data: {
            error: {
              message: 'Order not found'
            }
          }
        }
      };

      mockOrderService.getOrderById.mockRejectedValue(notFoundError);

      render(
        <TestWrapper>
          <OrderConfirmation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Order Not Found')).toBeInTheDocument();
        expect(screen.getByText('Order not found. Please check your order ID and try again.')).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      // Mock location without state to trigger fetch
      jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
        state: null,
        pathname: '/order-confirmation/ORD-123456',
        search: '',
        hash: '',
        key: 'test'
      });

      const networkError = {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed'
      };

      mockOrderService.getOrderById.mockRejectedValue(networkError);

      render(
        <TestWrapper>
          <OrderConfirmation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Network connection failed. Please check your internet connection and try again.')).toBeInTheDocument();
      });
    });

    it('should handle authentication errors', async () => {
      // Mock location without state to trigger fetch
      jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
        state: null,
        pathname: '/order-confirmation/ORD-123456',
        search: '',
        hash: '',
        key: 'test'
      });

      const authError = {
        response: {
          status: 401,
          data: {
            error: {
              message: 'Unauthorized'
            }
          }
        }
      };

      mockOrderService.getOrderById.mockRejectedValue(authError);

      render(
        <TestWrapper>
          <OrderConfirmation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Your session has expired. Please log in again to view your order.')).toBeInTheDocument();
      });
    });

    it('should provide navigation options when order not found', async () => {
      // Mock location without state to trigger fetch
      jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
        state: null,
        pathname: '/order-confirmation/ORD-123456',
        search: '',
        hash: '',
        key: 'test'
      });

      const notFoundError = {
        response: {
          status: 404,
          data: {
            error: {
              message: 'Order not found'
            }
          }
        }
      };

      mockOrderService.getOrderById.mockRejectedValue(notFoundError);

      render(
        <TestWrapper>
          <OrderConfirmation />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('View Order History')).toBeInTheDocument();
        expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching order', async () => {
      // Mock location without state to trigger fetch
      jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
        state: null,
        pathname: '/order-confirmation/ORD-123456',
        search: '',
        hash: '',
        key: 'test'
      });

      mockOrderService.getOrderById.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <TestWrapper>
          <OrderConfirmation />
        </TestWrapper>
      );

      expect(screen.getByText('Loading order details...')).toBeInTheDocument();
    });
  });

  describe('Navigation Actions', () => {
    it('should provide navigation buttons', () => {
      render(
        <TestWrapper>
          <OrderConfirmation />
        </TestWrapper>
      );

      expect(screen.getByText('Track Your Order')).toBeInTheDocument();
      expect(screen.getByText('View Order History')).toBeInTheDocument();
      expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
    });

    it('should display estimated delivery information', () => {
      render(
        <TestWrapper>
          <OrderConfirmation />
        </TestWrapper>
      );

      expect(screen.getByText('Estimated Delivery')).toBeInTheDocument();
      expect(screen.getByText(/Your order will be delivered within 30-45 minutes/)).toBeInTheDocument();
    });
  });
});