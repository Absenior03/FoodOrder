import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import OrderHistory from '../OrderHistory';
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

const mockOrders: Order[] = [
  {
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
      }
    ],
    totalAmount: 3.00,
    status: OrderStatus.DELIVERED,
    paymentStatus: PaymentStatus.COMPLETED,
    deliveryAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '12345'
    },
    createdAt: '2023-01-01T12:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z'
  },
  {
    _id: 'order2',
    orderId: 'ORD-789012',
    userId: 'user1',
    items: [
      {
        itemId: '2',
        name: 'Banana',
        quantity: 1,
        price: 0.75,
        totalPrice: 0.75
      },
      {
        itemId: '3',
        name: 'Orange',
        quantity: 3,
        price: 1.25,
        totalPrice: 3.75
      }
    ],
    totalAmount: 4.50,
    status: OrderStatus.PREPARING,
    paymentStatus: PaymentStatus.COMPLETED,
    deliveryAddress: {
      street: '456 Oak Ave',
      city: 'Boston',
      state: 'MA',
      zipCode: '02101'
    },
    createdAt: '2023-01-02T14:30:00Z',
    updatedAt: '2023-01-02T14:30:00Z'
  }
];

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

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

describe('OrderHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful order history response by default
    mockOrderService.getOrderHistory.mockResolvedValue({
      success: true,
      data: {
        orders: mockOrders,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalOrders: 2,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    });
  });

  describe('Order List Display', () => {
    it('should display list of orders', async () => {
      render(
        <TestWrapper>
          <OrderHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Order History')).toBeInTheDocument();
        expect(screen.getByText('Order #ORD-123456')).toBeInTheDocument();
        expect(screen.getByText('Order #ORD-789012')).toBeInTheDocument();
      });
    });

    it('should display order details correctly', async () => {
      render(
        <TestWrapper>
          <OrderHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        // Check first order
        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.getByText('$3.24')).toBeInTheDocument(); // Total with tax

        // Check second order
        expect(screen.getByText('Banana and 1 other item')).toBeInTheDocument();
        expect(screen.getByText('$4.86')).toBeInTheDocument(); // Total with tax
      });
    });

    it('should display order dates correctly', async () => {
      render(
        <TestWrapper>
          <OrderHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Jan 1, 2023, 12:00 PM')).toBeInTheDocument();
        expect(screen.getByText('Jan 2, 2023, 02:30 PM')).toBeInTheDocument();
      });
    });

    it('should show appropriate action buttons for different order statuses', async () => {
      render(
        <TestWrapper>
          <OrderHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        const viewDetailsButtons = screen.getAllByText('View Details');
        expect(viewDetailsButtons).toHaveLength(2);

        const reorderButtons = screen.getAllByText('Reorder');
        expect(reorderButtons).toHaveLength(2);

        // Only preparing order should have track button
        const trackButtons = screen.getAllByText('Track Order');
        expect(trackButtons).toHaveLength(1);
      });
    });
  });

  describe('Order Filtering', () => {
    it('should filter orders by status', async () => {
      render(
        <TestWrapper>
          <OrderHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('All Orders')).toBeInTheDocument();
      });

      // Change filter to "Delivered"
      const filterSelect = screen.getByDisplayValue('All Orders');
      fireEvent.change(filterSelect, { target: { value: OrderStatus.DELIVERED } });

      await waitFor(() => {
        expect(mockOrderService.getOrderHistory).toHaveBeenCalledWith(1, 10, OrderStatus.DELIVERED);
      });
    });

    it('should reset to first page when filter changes', async () => {
      render(
        <TestWrapper>
          <OrderHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('All Orders')).toBeInTheDocument();
      });

      // Change filter
      const filterSelect = screen.getByDisplayValue('All Orders');
      fireEvent.change(filterSelect, { target: { value: OrderStatus.PREPARING } });

      await waitFor(() => {
        expect(mockOrderService.getOrderHistory).toHaveBeenCalledWith(1, 10, OrderStatus.PREPARING);
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no orders exist', async () => {
      mockOrderService.getOrderHistory.mockResolvedValue({
        success: true,
        data: {
          orders: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalOrders: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });

      render(
        <TestWrapper>
          <OrderHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No Orders Found')).toBeInTheDocument();
        expect(screen.getByText("You haven't placed any orders yet.")).toBeInTheDocument();
        expect(screen.getByText('Start Shopping')).toBeInTheDocument();
      });
    });

    it('should show filtered empty state', async () => {
      mockOrderService.getOrderHistory.mockResolvedValue({
        success: true,
        data: {
          orders: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalOrders: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });

      render(
        <TestWrapper>
          <OrderHistory />
        </TestWrapper>
      );

      // Change filter first
      const filterSelect = screen.getByDisplayValue('All Orders');
      fireEvent.change(filterSelect, { target: { value: OrderStatus.CANCELLED } });

      await waitFor(() => {
        expect(screen.getByText('No orders found with status "cancelled".')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetching orders fails', async () => {
      const error = new Error('Failed to fetch orders');
      mockOrderService.getOrderHistory.mockRejectedValue(error);

      render(
        <TestWrapper>
          <OrderHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load order history. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching orders', async () => {
      mockOrderService.getOrderHistory.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <TestWrapper>
          <OrderHistory />
        </TestWrapper>
      );

      expect(screen.getByText('Loading your orders...')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should display pagination when multiple pages exist', async () => {
      mockOrderService.getOrderHistory.mockResolvedValue({
        success: true,
        data: {
          orders: mockOrders,
          pagination: {
            currentPage: 1,
            totalPages: 3,
            totalOrders: 25,
            hasNextPage: true,
            hasPrevPage: false
          }
        }
      });

      render(
        <TestWrapper>
          <OrderHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('should handle page navigation', async () => {
      mockOrderService.getOrderHistory.mockResolvedValue({
        success: true,
        data: {
          orders: mockOrders,
          pagination: {
            currentPage: 1,
            totalPages: 2,
            totalOrders: 15,
            hasNextPage: true,
            hasPrevPage: false
          }
        }
      });

      render(
        <TestWrapper>
          <OrderHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      // Click next page
      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(mockOrderService.getOrderHistory).toHaveBeenCalledWith(2, 10, undefined);
      });
    });
  });

  describe('Navigation Actions', () => {
    it('should navigate to order details when View Details is clicked', async () => {
      render(
        <TestWrapper>
          <OrderHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        const viewDetailsButtons = screen.getAllByText('View Details');
        fireEvent.click(viewDetailsButtons[0]);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/orders/ORD-123456');
    });

    it('should navigate to order tracking when Track Order is clicked', async () => {
      render(
        <TestWrapper>
          <OrderHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        const trackButton = screen.getByText('Track Order');
        fireEvent.click(trackButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/orders/ORD-789012/tracking');
    });

    it('should navigate to menu when Reorder is clicked', async () => {
      render(
        <TestWrapper>
          <OrderHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        const reorderButtons = screen.getAllByText('Reorder');
        fireEvent.click(reorderButtons[0]);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/menu');
    });
  });

  describe('Order Item Preview', () => {
    it('should show single item name for single item orders', async () => {
      const singleItemOrder: Order = {
        ...mockOrders[0],
        items: [
          {
            itemId: '1',
            name: 'Apple',
            quantity: 2,
            price: 1.50,
            totalPrice: 3.00
          }
        ]
      };

      mockOrderService.getOrderHistory.mockResolvedValue({
        success: true,
        data: {
          orders: [singleItemOrder],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalOrders: 1,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });

      render(
        <TestWrapper>
          <OrderHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
      });
    });

    it('should show "and X other items" for multiple item orders', async () => {
      render(
        <TestWrapper>
          <OrderHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Banana and 1 other item')).toBeInTheDocument();
      });
    });
  });
});