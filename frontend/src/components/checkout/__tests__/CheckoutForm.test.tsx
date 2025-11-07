import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CheckoutForm from '../CheckoutForm';
import { CartProvider } from '../../../context/CartContext';
import { AuthProvider } from '../../../context/AuthContext';
import { orderService } from '../../../services/orderService';
import { CheckoutValidationResponse, CheckoutResponse } from '../../../types/order';

// Mock services
jest.mock('../../../services/orderService');
const mockOrderService = orderService as jest.Mocked<typeof orderService>;

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock cart context
jest.mock('../../../context/CartContext', () => ({
  useCart: () => ({
    state: {
      items: [
        {
          itemId: '1',
          name: 'Apple',
          quantity: 2,
          price: 1.50,
          totalPrice: 3.00,
          item: {
            _id: '1',
            name: 'Apple',
            category: 'Fruit' as const,
            price: 1.50,
            stock: 10,
            description: 'Fresh apple',
            isActive: true,
            createdAt: '2023-01-01',
            updatedAt: '2023-01-01'
          }
        }
      ],
      isLoading: false,
      error: null
    },
    getCartTotal: jest.fn(() => 3.00),
    getCartItemCount: jest.fn(() => 2),
    clearCart: jest.fn(),
    addToCart: jest.fn(),
    updateCartItem: jest.fn(),
    removeFromCart: jest.fn(),
    loadCart: jest.fn()
  }),
  CartProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

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

describe('CheckoutForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful validation by default
    const mockValidationResponse: CheckoutValidationResponse = {
      success: true,
      data: {
        validation: {
          valid: true,
          items: [
            {
              itemId: '1',
              name: 'Apple',
              quantity: 2,
              price: 1.50,
              totalPrice: 3.00,
              availableStock: 10,
              valid: true
            }
          ],
          totalAmount: 3.00,
          itemCount: 2
        }
      }
    };
    
    mockOrderService.validateCheckout.mockResolvedValue(mockValidationResponse);
  });

  describe('Form Validation', () => {
    it('should display validation errors for empty address fields', async () => {
      render(
        <TestWrapper>
          <CheckoutForm />
        </TestWrapper>
      );

      // Wait for validation to complete
      await waitFor(() => {
        expect(screen.getByText('Place Order - 3.24')).toBeInTheDocument();
      });

      // Try to submit without filling address
      const submitButton = screen.getByText('Place Order - 3.24');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Street address is required')).toBeInTheDocument();
        expect(screen.getByText('City is required')).toBeInTheDocument();
        expect(screen.getByText('State is required')).toBeInTheDocument();
        expect(screen.getByText('ZIP code is required')).toBeInTheDocument();
      });
    });

    it('should validate ZIP code format', async () => {
      render(
        <TestWrapper>
          <CheckoutForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Place Order - 3.24')).toBeInTheDocument();
      });

      // Fill address with invalid ZIP code
      fireEvent.change(screen.getByLabelText(/street address/i), {
        target: { value: '123 Main St' }
      });
      fireEvent.change(screen.getByLabelText(/city/i), {
        target: { value: 'New York' }
      });
      fireEvent.change(screen.getByLabelText(/state/i), {
        target: { value: 'NY' }
      });
      fireEvent.change(screen.getByLabelText(/zip code/i), {
        target: { value: 'invalid' }
      });

      const submitButton = screen.getByText('Place Order - 3.24');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid ZIP code (12345 or 12345-6789)')).toBeInTheDocument();
      });
    });

    it('should accept valid address and proceed with checkout', async () => {
      const mockCheckoutResponse: CheckoutResponse = {
        success: true,
        data: {
          order: {
            _id: 'order1',
            orderId: 'ORD-123',
            userId: 'user1',
            items: [],
            totalAmount: 3.00,
            status: 'pending' as const,
            paymentStatus: 'completed' as const,
            deliveryAddress: {
              street: '123 Main St',
              city: 'New York',
              state: 'NY',
              zipCode: '12345'
            },
            createdAt: '2023-01-01',
            updatedAt: '2023-01-01'
          }
        },
        message: 'Order placed successfully'
      };

      mockOrderService.checkout.mockResolvedValue(mockCheckoutResponse);

      render(
        <TestWrapper>
          <CheckoutForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Place Order - 3.24')).toBeInTheDocument();
      });

      // Fill valid address
      fireEvent.change(screen.getByLabelText(/street address/i), {
        target: { value: '123 Main St' }
      });
      fireEvent.change(screen.getByLabelText(/city/i), {
        target: { value: 'New York' }
      });
      fireEvent.change(screen.getByLabelText(/state/i), {
        target: { value: 'NY' }
      });
      fireEvent.change(screen.getByLabelText(/zip code/i), {
        target: { value: '12345' }
      });

      const submitButton = screen.getByText('Place Order - 3.24');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOrderService.checkout).toHaveBeenCalledWith({
          deliveryAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '12345'
          }
        });
        expect(mockNavigate).toHaveBeenCalledWith('/order-confirmation/ORD-123', {
          state: { order: mockCheckoutResponse.data.order }
        });
      });
    });
  });

  describe('Stock Validation Error Handling', () => {
    it('should display stock unavailability errors', async () => {
      const mockValidationError = {
        response: {
          status: 400,
          data: {
            error: {
              code: 'STOCK_VALIDATION_FAILED',
              message: 'Some items are out of stock',
              details: [
                { name: 'Apple', availableStock: 0 }
              ]
            }
          }
        }
      };

      mockOrderService.validateCheckout.mockRejectedValue(mockValidationError);

      render(
        <TestWrapper>
          <CheckoutForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/validation error/i)).toBeInTheDocument();
        expect(screen.getByText(/some items are out of stock/i)).toBeInTheDocument();
      });
    });

    it('should handle checkout stock validation failure', async () => {
      const mockCheckoutError = {
        response: {
          status: 400,
          data: {
            error: {
              code: 'STOCK_VALIDATION_FAILED',
              message: 'Stock validation failed',
              details: [
                { name: 'Apple', availableStock: 1 }
              ]
            }
          }
        }
      };

      mockOrderService.checkout.mockRejectedValue(mockCheckoutError);

      render(
        <TestWrapper>
          <CheckoutForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Place Order - 3.24')).toBeInTheDocument();
      });

      // Fill valid address
      fireEvent.change(screen.getByLabelText(/street address/i), {
        target: { value: '123 Main St' }
      });
      fireEvent.change(screen.getByLabelText(/city/i), {
        target: { value: 'New York' }
      });
      fireEvent.change(screen.getByLabelText(/state/i), {
        target: { value: 'NY' }
      });
      fireEvent.change(screen.getByLabelText(/zip code/i), {
        target: { value: '12345' }
      });

      const submitButton = screen.getByText('Place Order - 3.24');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/the following items are no longer available: apple/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors during checkout', async () => {
      const networkError = {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed'
      };

      mockOrderService.checkout.mockRejectedValue(networkError);

      render(
        <TestWrapper>
          <CheckoutForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Place Order - 3.24')).toBeInTheDocument();
      });

      // Fill valid address
      fireEvent.change(screen.getByLabelText(/street address/i), {
        target: { value: '123 Main St' }
      });
      fireEvent.change(screen.getByLabelText(/city/i), {
        target: { value: 'New York' }
      });
      fireEvent.change(screen.getByLabelText(/state/i), {
        target: { value: 'NY' }
      });
      fireEvent.change(screen.getByLabelText(/zip code/i), {
        target: { value: '12345' }
      });

      const submitButton = screen.getByText('Place Order - 3.24');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network connection failed during checkout/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during validation', async () => {
      // Make validation take time
      mockOrderService.validateCheckout.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <TestWrapper>
          <CheckoutForm />
        </TestWrapper>
      );

      expect(screen.getByText('Validating your order...')).toBeInTheDocument();
    });

    it('should show processing state during checkout submission', async () => {
      // Make checkout take time
      mockOrderService.checkout.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <TestWrapper>
          <CheckoutForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Place Order - 3.24')).toBeInTheDocument();
      });

      // Fill valid address
      fireEvent.change(screen.getByLabelText(/street address/i), {
        target: { value: '123 Main St' }
      });
      fireEvent.change(screen.getByLabelText(/city/i), {
        target: { value: 'New York' }
      });
      fireEvent.change(screen.getByLabelText(/state/i), {
        target: { value: 'NY' }
      });
      fireEvent.change(screen.getByLabelText(/zip code/i), {
        target: { value: '12345' }
      });

      const submitButton = screen.getByText('Place Order - 3.24');
      fireEvent.click(submitButton);

      expect(screen.getByText('Processing Order...')).toBeInTheDocument();
    });
  });
});