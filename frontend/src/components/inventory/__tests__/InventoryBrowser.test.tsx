import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InventoryBrowser from '../InventoryBrowser';
import { inventoryService } from '../../../services/inventoryService';
import { FoodItem, Category } from '../../../types/inventory';

// Mock the inventory service
jest.mock('../../../services/inventoryService');
const mockInventoryService = inventoryService as jest.Mocked<typeof inventoryService>;

const mockCategories: Category[] = [
  { name: 'All', value: 'All', count: 10, availableItems: 8 },
  { name: 'Fruit', value: 'Fruit', count: 5, availableItems: 4 },
  { name: 'Vegetable', value: 'Vegetable', count: 3, availableItems: 3 },
  { name: 'Non-veg', value: 'Non-veg', count: 2, availableItems: 1 }
];

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
    stock: 0,
    imageUrl: 'https://example.com/banana.jpg',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 2,
  hasNextPage: false,
  hasPrevPage: false
};

describe('InventoryBrowser', () => {
  const mockOnAddToCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockInventoryService.getCategories.mockResolvedValue(mockCategories);
    mockInventoryService.getItems.mockResolvedValue({
      items: mockItems,
      pagination: mockPagination
    });
  });

  it('renders the browse menu header', async () => {
    render(<InventoryBrowser onAddToCart={mockOnAddToCart} />);

    expect(screen.getByText('Browse Menu')).toBeInTheDocument();
    expect(screen.getByText('Discover delicious food items and add them to your cart')).toBeInTheDocument();
  });

  it('loads and displays categories on mount', async () => {
    render(<InventoryBrowser onAddToCart={mockOnAddToCart} />);

    await waitFor(() => {
      expect(mockInventoryService.getCategories).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Fruit')).toBeInTheDocument();
      expect(screen.getByText('Vegetable')).toBeInTheDocument();
      expect(screen.getByText('Non-veg')).toBeInTheDocument();
    });
  });

  it('loads and displays items on mount', async () => {
    render(<InventoryBrowser onAddToCart={mockOnAddToCart} />);

    await waitFor(() => {
      expect(mockInventoryService.getItems).toHaveBeenCalledWith({
        category: 'All',
        page: 1,
        limit: 12,
        search: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        sortBy: 'name',
        sortOrder: 'asc'
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Fresh Apple')).toBeInTheDocument();
      expect(screen.getByText('Banana')).toBeInTheDocument();
    });
  });

  it('filters items when category is changed', async () => {
    render(<InventoryBrowser onAddToCart={mockOnAddToCart} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Fresh Apple')).toBeInTheDocument();
    });

    // Click on Fruit category
    const fruitButton = screen.getByRole('button', { name: /Fruit/ });
    fireEvent.click(fruitButton);

    await waitFor(() => {
      expect(mockInventoryService.getItems).toHaveBeenCalledWith({
        category: 'Fruit',
        page: 1,
        limit: 12,
        search: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        sortBy: 'name',
        sortOrder: 'asc'
      });
    });
  });

  it('handles search functionality', async () => {
    render(<InventoryBrowser onAddToCart={mockOnAddToCart} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Fresh Apple')).toBeInTheDocument();
    });

    // Clear previous calls
    mockInventoryService.getItems.mockClear();

    // Type in search input
    const searchInput = screen.getByPlaceholderText('Search food items...');
    fireEvent.change(searchInput, { target: { value: 'apple' } });

    // Wait for debounced search and component to re-render
    await waitFor(() => {
      expect(mockInventoryService.getItems).toHaveBeenCalledWith({
        category: 'All',
        page: 1,
        limit: 12,
        search: 'apple',
        minPrice: undefined,
        maxPrice: undefined,
        sortBy: 'name',
        sortOrder: 'asc'
      });
    }, { timeout: 1000 });
  });

  it('handles add to cart functionality', async () => {
    render(<InventoryBrowser onAddToCart={mockOnAddToCart} />);

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Fresh Apple')).toBeInTheDocument();
    });

    // Click add to cart button
    const addToCartButtons = screen.getAllByText('Add to Cart');
    fireEvent.click(addToCartButtons[0]);

    expect(mockOnAddToCart).toHaveBeenCalledWith(mockItems[0]);
  });

  it('displays real-time updates toggle', async () => {
    render(<InventoryBrowser onAddToCart={mockOnAddToCart} />);

    expect(screen.getByText('Real-time updates')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('toggles real-time updates when clicked', async () => {
    render(<InventoryBrowser onAddToCart={mockOnAddToCart} />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    const toggleButton = Array.from(screen.getAllByRole('button')).find(button => 
      button.className.includes('bg-blue-600')
    );

    if (toggleButton) {
      fireEvent.click(toggleButton);
      await waitFor(() => {
        expect(screen.queryByText('Live')).not.toBeInTheDocument();
      });
    }
  });

  it('displays error state when categories fail to load', async () => {
    mockInventoryService.getCategories.mockRejectedValue(new Error('Failed to load categories'));

    render(<InventoryBrowser onAddToCart={mockOnAddToCart} />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Inventory')).toBeInTheDocument();
      expect(screen.getByText('Failed to load categories')).toBeInTheDocument();
    });
  });

  it('displays error state when items fail to load', async () => {
    mockInventoryService.getItems.mockRejectedValue(new Error('Failed to load items'));

    render(<InventoryBrowser onAddToCart={mockOnAddToCart} />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Inventory')).toBeInTheDocument();
      expect(screen.getByText('Failed to load items')).toBeInTheDocument();
    });
  });

  it('retries loading when Try Again button is clicked', async () => {
    mockInventoryService.getCategories.mockRejectedValueOnce(new Error('Network error'));
    mockInventoryService.getItems.mockRejectedValueOnce(new Error('Network error'));

    render(<InventoryBrowser onAddToCart={mockOnAddToCart} />);

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    // Reset mocks to succeed on retry
    mockInventoryService.getCategories.mockResolvedValue(mockCategories);
    mockInventoryService.getItems.mockResolvedValue({
      items: mockItems,
      pagination: mockPagination
    });

    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);

    await waitFor(() => {
      expect(mockInventoryService.getCategories).toHaveBeenCalledTimes(2);
      expect(mockInventoryService.getItems).toHaveBeenCalledTimes(2);
    });
  });

  it('displays pagination when multiple pages exist', async () => {
    const multiPagePagination = {
      ...mockPagination,
      totalPages: 3,
      hasNextPage: true
    };

    mockInventoryService.getItems.mockResolvedValue({
      items: mockItems,
      pagination: multiPagePagination
    });

    render(<InventoryBrowser onAddToCart={mockOnAddToCart} />);

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
    });
  });

  it('displays items count information', async () => {
    render(<InventoryBrowser onAddToCart={mockOnAddToCart} />);

    await waitFor(() => {
      expect(screen.getByText('Showing 2 of 2 items')).toBeInTheDocument();
    });
  });
});