import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CartItem from '../CartItem';
import { CartProvider } from '../../../context/CartContext';
import { AuthProvider } from '../../../context/AuthContext';
import { CartItem as CartItemType } from '../../../types/cart';

// Mock the cart service
jest.mock('../../../services/cartService', () => ({
  cartService: {
    updateCartItem: jest.fn(),
    removeFromCart: jest.fn(),
  },
}));

const mockCartItem: CartItemType = {
  itemId: '1',
  item: {
    _id: '1',
    name: 'Test Apple',
    description: 'Fresh red apple',
    category: 'Fruit',
    price: 2.50,
    stock: 10,
    imageUrl: '/test-image.jpg',
    isActive: true,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  quantity: 2,
  priceAtAdd: 2.50,
};

const mockAuthState = {
  user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
  isAuthenticated: true,
  isLoading: false,
  error: null,
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <CartProvider>
      {children}
    </CartProvider>
  </AuthProvider>
);

describe('CartItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders cart item with correct information', () => {
    render(
      <TestWrapper>
        <CartItem item={mockCartItem} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Apple')).toBeInTheDocument();
    expect(screen.getByText('$2.50 each')).toBeInTheDocument();
    expect(screen.getByText('Fruit')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument();
  });

  it('displays item image with correct alt text', () => {
    render(
      <TestWrapper>
        <CartItem item={mockCartItem} />
      </TestWrapper>
    );

    const image = screen.getByAltText('Test Apple');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');
  });

  it('shows quantity controls with correct values', () => {
    render(
      <TestWrapper>
        <CartItem item={mockCartItem} />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const quantityDisplay = screen.getByText('2');

    // Should have 3 buttons: decrease, increase, remove
    expect(buttons).toHaveLength(3);
    expect(quantityDisplay).toBeInTheDocument();
  });

  it('calculates and displays correct item total', () => {
    const itemWithDifferentQuantity = {
      ...mockCartItem,
      quantity: 3,
      priceAtAdd: 1.99,
    };

    render(
      <TestWrapper>
        <CartItem item={itemWithDifferentQuantity} />
      </TestWrapper>
    );

    // 3 * 1.99 = 5.97
    expect(screen.getByText('$5.97')).toBeInTheDocument();
  });

  it('disables decrease button when quantity is 1', () => {
    const itemWithMinQuantity = {
      ...mockCartItem,
      quantity: 1,
    };

    render(
      <TestWrapper>
        <CartItem item={itemWithMinQuantity} />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const decreaseButton = buttons[0]; // First button is decrease
    expect(decreaseButton).toBeDisabled();
  });

  it('disables increase button when quantity equals stock', () => {
    const itemAtMaxStock = {
      ...mockCartItem,
      quantity: 10, // Same as stock
    };

    render(
      <TestWrapper>
        <CartItem item={itemAtMaxStock} />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const increaseButton = buttons[1]; // Second button is increase
    expect(increaseButton).toBeDisabled();
  });

  it('shows remove confirmation when remove button is clicked', async () => {
    render(
      <TestWrapper>
        <CartItem item={mockCartItem} />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const removeButton = buttons[2]; // Third button is remove
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });

  it('hides remove confirmation when No is clicked', async () => {
    render(
      <TestWrapper>
        <CartItem item={mockCartItem} />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const removeButton = buttons[2]; // Third button is remove
    fireEvent.click(removeButton);

    await waitFor(() => {
      const noButton = screen.getByText('No');
      fireEvent.click(noButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('Yes')).not.toBeInTheDocument();
      expect(screen.queryByText('No')).not.toBeInTheDocument();
    });
  });
});