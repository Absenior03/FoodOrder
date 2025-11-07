import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import OrderSummary from '../OrderSummary';
import { CartProvider } from '../../../context/CartContext';
import { AuthProvider } from '../../../context/AuthContext';
import { ValidationItem } from '../../../types/order';

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
        },
        {
          itemId: '2',
          name: 'Banana',
          quantity: 1,
          price: 0.75,
          totalPrice: 0.75,
          item: {
            _id: '2',
            name: 'Banana',
            category: 'Fruit' as const,
            price: 0.75,
            stock: 5,
            description: 'Fresh banana',
            isActive: true,
            createdAt: '2023-01-01',
            updatedAt: '2023-01-01'
          }
        }
      ],
      isLoading: false,
      error: null
    },
    getCartTotal: jest.fn(() => 3.75),
    getCartItemCount: jest.fn(() => 3),
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

describe('OrderSummary', () => {
  describe('Cart Items Display', () => {
    it('should display cart items correctly', () => {
      render(
        <TestWrapper>
          <OrderSummary />
        </TestWrapper>
      );

      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('Banana')).toBeInTheDocument();
      expect(screen.getByText('Qty: 2')).toBeInTheDocument();
      expect(screen.getByText('Qty: 1')).toBeInTheDocument();
      expect(screen.getByText('$3.00')).toBeInTheDocument();
      expect(screen.getByText('$0.75')).toBeInTheDocument();
    });

    it('should display correct totals', () => {
      render(
        <TestWrapper>
          <OrderSummary />
        </TestWrapper>
      );

      expect(screen.getByText('$3.75')).toBeInTheDocument(); // Subtotal
      expect(screen.getByText('$0.30')).toBeInTheDocument(); // Tax (8%)
      expect(screen.getByText('$4.05')).toBeInTheDocument(); // Total with tax
      expect(screen.getByText('Free')).toBeInTheDocument(); // Delivery fee
    });

    it('should show empty cart message when no items', () => {
      const emptyCartState = {
        ...mockCartState,
        items: []
      };

      render(
        <TestWrapper>
          <OrderSummary />
        </TestWrapper>
      );

      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });
  });

  describe('Validation Items Display', () => {
    it('should display validation items when provided', () => {
      const validationItems: ValidationItem[] = [
        {
          itemId: '1',
          name: 'Apple',
          quantity: 2,
          price: 1.50,
          totalPrice: 3.00,
          availableStock: 10,
          valid: true
        },
        {
          itemId: '2',
          name: 'Banana',
          quantity: 1,
          price: 0.75,
          totalPrice: 0.75,
          availableStock: 0,
          valid: false,
          issue: 'Out of stock'
        }
      ];

      render(
        <TestWrapper>
          <OrderSummary 
            validationItems={validationItems}
            showValidation={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('Banana')).toBeInTheDocument();
      expect(screen.getByText('Out of stock')).toBeInTheDocument();
      expect(screen.getByText('Available: 10 items')).toBeInTheDocument();
      expect(screen.getByText('Available: 0 items')).toBeInTheDocument();
    });

    it('should highlight items with validation issues', () => {
      const validationItems: ValidationItem[] = [
        {
          itemId: '1',
          name: 'Apple',
          quantity: 2,
          price: 1.50,
          totalPrice: 3.00,
          availableStock: 1,
          valid: false,
          issue: 'Insufficient stock - only 1 available'
        }
      ];

      render(
        <TestWrapper>
          <OrderSummary 
            validationItems={validationItems}
            showValidation={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Insufficient stock - only 1 available')).toBeInTheDocument();
      
      // Check if the item has error styling (red background)
      const itemContainer = screen.getByText('Apple').closest('div');
      expect(itemContainer).toHaveClass('bg-red-50', 'border-red-200');
    });

    it('should show validation summary', () => {
      const validationItems: ValidationItem[] = [
        {
          itemId: '1',
          name: 'Apple',
          quantity: 2,
          price: 1.50,
          totalPrice: 3.00,
          availableStock: 10,
          valid: true
        },
        {
          itemId: '2',
          name: 'Banana',
          quantity: 1,
          price: 0.75,
          totalPrice: 0.75,
          availableStock: 0,
          valid: false,
          issue: 'Out of stock'
        }
      ];

      render(
        <TestWrapper>
          <OrderSummary 
            validationItems={validationItems}
            showValidation={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('1 of 2 items available')).toBeInTheDocument();
    });
  });

  describe('Price Calculations', () => {
    it('should calculate totals correctly with validation items', () => {
      const validationItems: ValidationItem[] = [
        {
          itemId: '1',
          name: 'Apple',
          quantity: 2,
          price: 1.50,
          totalPrice: 3.00,
          availableStock: 10,
          valid: true
        },
        {
          itemId: '2',
          name: 'Banana',
          quantity: 1,
          price: 0.75,
          totalPrice: 0.75,
          availableStock: 5,
          valid: true
        }
      ];

      render(
        <TestWrapper>
          <OrderSummary 
            validationItems={validationItems}
            showValidation={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('$3.75')).toBeInTheDocument(); // Subtotal
      expect(screen.getByText('$0.30')).toBeInTheDocument(); // Tax (8%)
      expect(screen.getByText('$4.05')).toBeInTheDocument(); // Total with tax
    });

    it('should handle zero prices correctly', () => {
      const validationItems: ValidationItem[] = [
        {
          itemId: '1',
          name: 'Free Sample',
          quantity: 1,
          price: 0,
          totalPrice: 0,
          availableStock: 10,
          valid: true
        }
      ];

      render(
        <TestWrapper>
          <OrderSummary 
            validationItems={validationItems}
            showValidation={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('$0.00')).toBeInTheDocument(); // Multiple instances for price and total
    });
  });
});