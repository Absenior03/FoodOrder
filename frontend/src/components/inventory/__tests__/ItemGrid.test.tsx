import { render, screen, fireEvent } from '@testing-library/react';
import ItemGrid from '../ItemGrid';
import { FoodItem } from '../../../types/inventory';

const mockItems: FoodItem[] = [
  {
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
  },
  {
    _id: '2',
    name: 'Banana',
    description: 'Yellow ripe banana',
    category: 'Fruit',
    price: 1.99,
    stock: 5,
    imageUrl: 'https://example.com/banana.jpg',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '3',
    name: 'Out of Stock Item',
    description: 'This item is not available',
    category: 'Vegetable',
    price: 3.99,
    stock: 0,
    imageUrl: 'https://example.com/item.jpg',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('ItemGrid', () => {
  const mockOnAddToCart = jest.fn();

  beforeEach(() => {
    mockOnAddToCart.mockClear();
  });

  it('renders all items correctly', () => {
    render(<ItemGrid items={mockItems} onAddToCart={mockOnAddToCart} />);

    expect(screen.getByText('Fresh Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.getByText('Out of Stock Item')).toBeInTheDocument();
  });

  it('displays loading skeleton when isLoading is true', () => {
    render(<ItemGrid items={[]} isLoading={true} />);

    const skeletons = screen.getAllByRole('generic');
    const loadingSkeletons = skeletons.filter(el => 
      el.className.includes('animate-pulse')
    );
    expect(loadingSkeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no items are provided', () => {
    render(<ItemGrid items={[]} />);

    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('Try selecting a different category or check back later for new items.')).toBeInTheDocument();
    expect(screen.getByText('🍽️')).toBeInTheDocument();
  });

  it('shows empty state when items array is empty', () => {
    render(<ItemGrid items={[]} />);

    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('passes onAddToCart function to ItemCard components', () => {
    render(<ItemGrid items={mockItems} onAddToCart={mockOnAddToCart} />);

    const addToCartButtons = screen.getAllByText('Add to Cart');
    expect(addToCartButtons).toHaveLength(2); // Only items with stock > 0

    fireEvent.click(addToCartButtons[0]);
    expect(mockOnAddToCart).toHaveBeenCalledWith(mockItems[0]);
  });

  it('passes addingToCartItemId to correct ItemCard', () => {
    render(<ItemGrid items={mockItems} onAddToCart={mockOnAddToCart} addingToCartItemId="1" />);

    expect(screen.getByText('Adding...')).toBeInTheDocument();
  });

  it('passes showStockAnimation to all ItemCard components', () => {
    render(<ItemGrid items={mockItems} showStockAnimation={true} />);

    // Check that stock indicators have animation class by looking for the specific stock indicator elements
    const stockIndicators = screen.getAllByText(/available|left/);
    stockIndicators.forEach(indicator => {
      // Find the parent element that should have the animate-pulse class
      const stockIndicatorContainer = indicator.parentElement;
      expect(stockIndicatorContainer).toHaveClass('animate-pulse');
    });
  });

  it('renders items in a responsive grid layout', () => {
    const { container } = render(<ItemGrid items={mockItems} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
  });

  it('handles undefined items gracefully', () => {
    render(<ItemGrid items={undefined as any} />);

    expect(screen.getByText('No items found')).toBeInTheDocument();
  });
});