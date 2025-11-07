import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CartSummary from '../CartSummary';
import { CartItem } from '../../../types/cart';
import { FoodCategory } from '../../../types/inventory';

// Mock the cart context with test data
const mockCartItems: CartItem[] = [
  {
    itemId: {
      _id: '1',
      name: 'Apple',
      description: 'Fresh red apple',
      category: FoodCategory.FRUIT,
      price: 2.50,
      stock: 10,
      imageUrl: '/apple.jpg',
      isActive: true,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
    },
    quantity: 2,
    priceAtAdd: 2.50,
  },
  {
    itemId: {
      _id: '2',
      name: 'Banana',
      description: 'Yellow banana',
      category: FoodCategory.FRUIT,
      price: 1.25,
      stock: 15,
      imageUrl: '/banana.jpg',
      isActive: true,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
    },
    quantity: 3,
    priceAtAdd: 1.25,
  },
];

// Mock the useCart hook
jest.mock('../../../context/CartContext', () => ({
  useCart: () => {
    const items = mockCartItems;
    return {
      state: {
        items,
        isOpen: true,
        isLoading: false,
        error: null,
      },
      getCartTotal: () => items.reduce((total, item) => total + (item.priceAtAdd * item.quantity), 0),
      getCartItemCount: () => items.reduce((count, item) => count + item.quantity, 0),
      addToCart: jest.fn(),
      updateCartItem: jest.fn(),
      removeFromCart: jest.fn(),
      clearCart: jest.fn(),
      toggleCart: jest.fn(),
    };
  },
}));

describe('CartSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calculates and displays correct subtotal', () => {
    render(<CartSummary />);
    
    // 2 * 2.50 + 3 * 1.25 = 5.00 + 3.75 = 8.75
    expect(screen.getByText('$8.75')).toBeInTheDocument();
  });

  it('displays correct item count', () => {
    render(<CartSummary />);
    
    // 2 + 3 = 5 items
    expect(screen.getByText('Items (5)')).toBeInTheDocument();
  });

  it('shows delivery fee when subtotal is under $50', () => {
    render(<CartSummary />);
    
    expect(screen.getByText('Delivery Fee')).toBeInTheDocument();
    expect(screen.getByText('$5.99')).toBeInTheDocument();
  });

  it('calculates correct tax amount', () => {
    render(<CartSummary />);
    
    // 8.75 * 0.08 = 0.70
    expect(screen.getByText('Tax (8%)')).toBeInTheDocument();
    expect(screen.getByText('$0.70')).toBeInTheDocument();
  });

  it('calculates correct total with delivery fee and tax', () => {
    render(<CartSummary />);
    
    // 8.75 + 5.99 + 0.70 = 15.44
    expect(screen.getByText('$15.44')).toBeInTheDocument();
  });

  it('shows free delivery progress bar when under $50', () => {
    render(<CartSummary />);
    
    expect(screen.getByText(/Add \$41\.25 more for free delivery/)).toBeInTheDocument();
    expect(screen.getByText('18%')).toBeInTheDocument(); // (8.75 / 50) * 100 = 17.5% rounded to 18%
  });

  it('displays checkout button', () => {
    render(<CartSummary />);
    
    const checkoutButton = screen.getByRole('button', { name: /proceed to checkout/i });
    expect(checkoutButton).toBeInTheDocument();
  });
});

