import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ItemCard from '../../inventory/ItemCard';
import { AuthProvider } from '../../../context/AuthContext';
import { CartProvider } from '../../../context/CartContext';
import { FoodItem, FoodCategory } from '../../../types/inventory';

// Mock the cart service
const mockAddToCart = jest.fn();
jest.mock('../../../services/cartService', () => ({
  cartService: {
    addToCart: jest.fn(),
    getCart: jest.fn().mockResolvedValue({ data: { cart: { items: [] } } }),
  },
}));

// Mock the auth context
jest.mock('../../../context/AuthContext', () => ({
  ...jest.requireActual('../../../context/AuthContext'),
  useAuth: () => ({
    state: {
      user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
      isAuthenticated: true,
      isLoading: false,
      error: null,
    },
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
  }),
}));

const mockFoodItem: FoodItem = {
  _id: '1',
  name: 'Test Apple',
  description: 'Fresh red apple',
  category: FoodCategory.FRUIT,
  price: 2.50,
  stock: 10,
  imageUrl: '/test-image.jpg',
  isActive: true,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <CartProvider>
      {children}
    </CartProvider>
  </AuthProvider>
);

describe('ItemCard - Add to Cart Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { cartService } = require('../../../services/cartService');
    cartService.addToCart.mockResolvedValue({
      data: {
        cart: {
          items: [
            {
              itemId: '1',
              item: mockFoodItem,
              quantity: 1,
              priceAtAdd: 2.50,
            },
          ],
        },
      },
    });
  });

  it('renders add to cart button for authenticated user', () => {
    render(
      <TestWrapper>
        <ItemCard item={mockFoodItem} />
      </TestWrapper>
    );

    const addToCartButton = screen.getByRole('button', { name: /add 1 to cart/i });
    expect(addToCartButton).toBeInTheDocument();
    expect(addToCartButton).not.toBeDisabled();
  });

  it('shows quantity selector for available items', () => {
    render(
      <TestWrapper>
        <ItemCard item={mockFoodItem} />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const quantityDisplay = screen.getByText('1');

    // Should have at least 3 buttons: decrease, increase, add to cart
    expect(buttons.length).toBeGreaterThanOrEqual(3);
    expect(quantityDisplay).toBeInTheDocument();
  });

  it('allows quantity adjustment within stock limits', async () => {
    render(
      <TestWrapper>
        <ItemCard item={mockFoodItem} />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const increaseButton = buttons[1]; // Second button is increase
    fireEvent.click(increaseButton);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add 2 to cart/i })).toBeInTheDocument();
    });
  });

  it('prevents quantity from going below 1', () => {
    render(
      <TestWrapper>
        <ItemCard item={mockFoodItem} />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const decreaseButton = buttons[0]; // First button is decrease
    expect(decreaseButton).toBeDisabled();
  });

  it('prevents quantity from exceeding stock', async () => {
    const lowStockItem = { ...mockFoodItem, stock: 2 };
    
    render(
      <TestWrapper>
        <ItemCard item={lowStockItem} />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const increaseButton = buttons[1]; // Second button is increase
    
    // Increase to 2 (max stock)
    fireEvent.click(increaseButton);
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(increaseButton).toBeDisabled();
    });
  });

  it('calls addToCart with correct parameters when button is clicked', async () => {
    render(
      <TestWrapper>
        <ItemCard item={mockFoodItem} />
      </TestWrapper>
    );

    const addToCartButton = screen.getByRole('button', { name: /add 1 to cart/i });
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      const { cartService } = require('../../../services/cartService');
      expect(cartService.addToCart).toHaveBeenCalledWith({
        itemId: '1',
        quantity: 1,
      });
    });
  });

  it('calls addToCart with selected quantity', async () => {
    render(
      <TestWrapper>
        <ItemCard item={mockFoodItem} />
      </TestWrapper>
    );

    // Increase quantity to 3
    const buttons = screen.getAllByRole('button');
    const increaseButton = buttons[1]; // Second button is increase
    fireEvent.click(increaseButton);
    fireEvent.click(increaseButton);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    const addToCartButton = screen.getByRole('button', { name: /add 3 to cart/i });
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      const { cartService } = require('../../../services/cartService');
      expect(cartService.addToCart).toHaveBeenCalledWith({
        itemId: '1',
        quantity: 3,
      });
    });
  });

  it('shows loading state while adding to cart', async () => {
    // Make addToCart take some time
    const { cartService } = require('../../../services/cartService');
    cartService.addToCart.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <TestWrapper>
        <ItemCard item={mockFoodItem} />
      </TestWrapper>
    );

    const addToCartButton = screen.getByRole('button', { name: /add 1 to cart/i });
    fireEvent.click(addToCartButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Adding...')).toBeInTheDocument();
      expect(addToCartButton).toBeDisabled();
    });
  });

  it('shows success feedback after successful add to cart', async () => {
    render(
      <TestWrapper>
        <ItemCard item={mockFoodItem} />
      </TestWrapper>
    );

    const addToCartButton = screen.getByRole('button', { name: /add 1 to cart/i });
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(screen.getByText('Added to Cart!')).toBeInTheDocument();
    });

    // Success message should disappear after timeout
    await waitFor(() => {
      expect(screen.queryByText('Added to Cart!')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('resets quantity to 1 after successful add to cart', async () => {
    render(
      <TestWrapper>
        <ItemCard item={mockFoodItem} />
      </TestWrapper>
    );

    // Increase quantity to 3
    const buttons = screen.getAllByRole('button');
    const increaseButton = buttons[1]; // Second button is increase
    fireEvent.click(increaseButton);
    fireEvent.click(increaseButton);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    const addToCartButton = screen.getByRole('button', { name: /add 3 to cart/i });
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(screen.getByText('Added to Cart!')).toBeInTheDocument();
    });

    // Quantity should reset to 1 (check the quantity display)
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Wait for success message to disappear and button to return to normal state
    await waitFor(() => {
      expect(screen.queryByText('Added to Cart!')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Now check for the normal add to cart button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add 1 to cart/i })).toBeInTheDocument();
    });
  });

  it('shows out of stock button for items with no stock', () => {
    const outOfStockItem = { ...mockFoodItem, stock: 0 };
    
    render(
      <TestWrapper>
        <ItemCard item={outOfStockItem} />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /out of stock/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('does not show quantity selector for out of stock items', () => {
    const outOfStockItem = { ...mockFoodItem, stock: 0 };
    
    render(
      <TestWrapper>
        <ItemCard item={outOfStockItem} />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    // Should only have 1 button (out of stock button), no quantity selectors
    expect(buttons).toHaveLength(1);
    expect(screen.getByRole('button', { name: /out of stock/i })).toBeInTheDocument();
  });

  it('handles add to cart error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    const { cartService } = require('../../../services/cartService');
    cartService.addToCart.mockRejectedValue(new Error('Network error'));

    render(
      <TestWrapper>
        <ItemCard item={mockFoodItem} />
      </TestWrapper>
    );

    const addToCartButton = screen.getByRole('button', { name: /add 1 to cart/i });
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to add item to cart:', expect.any(Error));
      expect(alertSpy).toHaveBeenCalledWith('Failed to add item to cart. Please try again.');
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });
});

