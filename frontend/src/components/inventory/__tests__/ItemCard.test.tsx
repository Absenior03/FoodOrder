import { render, screen, fireEvent } from '@testing-library/react';
import ItemCard from '../ItemCard';
import { FoodItem } from '../../../types/inventory';

const mockItem: FoodItem = {
  _id: '1',
  name: 'Fresh Apple',
  description: 'Crispy and sweet red apple',
  category: 'Fruit',
  price: 2.99,
  stock: 10,
  imageUrl: 'https://example.com/apple.jpg',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockOutOfStockItem: FoodItem = {
  ...mockItem,
  _id: '2',
  name: 'Out of Stock Item',
  stock: 0
};

describe('ItemCard', () => {
  const mockOnAddToCart = jest.fn();

  beforeEach(() => {
    mockOnAddToCart.mockClear();
  });

  it('renders item information correctly', () => {
    render(<ItemCard item={mockItem} onAddToCart={mockOnAddToCart} />);

    expect(screen.getByText('Fresh Apple')).toBeInTheDocument();
    expect(screen.getByText('Crispy and sweet red apple')).toBeInTheDocument();
    expect(screen.getByText('Fruit')).toBeInTheDocument();
    expect(screen.getByText('$2.99')).toBeInTheDocument();
  });

  it('displays stock indicator', () => {
    render(<ItemCard item={mockItem} onAddToCart={mockOnAddToCart} />);

    expect(screen.getByText('10 available')).toBeInTheDocument();
    expect(screen.getByText('📦')).toBeInTheDocument();
  });

  it('shows "Add to Cart" button for items in stock', () => {
    render(<ItemCard item={mockItem} onAddToCart={mockOnAddToCart} />);

    const addButton = screen.getByRole('button', { name: 'Add to Cart' });
    expect(addButton).toBeInTheDocument();
    expect(addButton).not.toBeDisabled();
  });

  it('shows "Out of Stock" button for items with zero stock', () => {
    render(<ItemCard item={mockOutOfStockItem} onAddToCart={mockOnAddToCart} />);

    const outOfStockButton = screen.getByRole('button', { name: 'Out of Stock' });
    expect(outOfStockButton).toBeInTheDocument();
    expect(outOfStockButton).toBeDisabled();
  });

  it('calls onAddToCart when Add to Cart button is clicked', () => {
    render(<ItemCard item={mockItem} onAddToCart={mockOnAddToCart} />);

    const addButton = screen.getByRole('button', { name: 'Add to Cart' });
    fireEvent.click(addButton);

    expect(mockOnAddToCart).toHaveBeenCalledWith(mockItem);
  });

  it('does not call onAddToCart for out of stock items', () => {
    render(<ItemCard item={mockOutOfStockItem} onAddToCart={mockOnAddToCart} />);

    const outOfStockButton = screen.getByRole('button', { name: 'Out of Stock' });
    fireEvent.click(outOfStockButton);

    expect(mockOnAddToCart).not.toHaveBeenCalled();
  });

  it('shows loading state when adding to cart', () => {
    render(<ItemCard item={mockItem} onAddToCart={mockOnAddToCart} isAddingToCart={true} />);

    expect(screen.getByText('Adding...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows stock animation when showStockAnimation is true', () => {
    render(<ItemCard item={mockItem} showStockAnimation={true} />);

    const stockIndicator = screen.getByText('10 available').closest('div');
    expect(stockIndicator).toHaveClass('animate-pulse');
  });

  it('displays fallback placeholder when no image URL is provided', () => {
    const itemWithoutImage = { ...mockItem, imageUrl: undefined };
    render(<ItemCard item={itemWithoutImage} />);

    expect(screen.getByText('No Image')).toBeInTheDocument();
    expect(screen.getByText('🍽️')).toBeInTheDocument();
  });

  it('does not render Add to Cart button when onAddToCart is not provided', () => {
    render(<ItemCard item={mockItem} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});