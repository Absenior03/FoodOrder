import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchAndFilter from '../SearchAndFilter';

describe('SearchAndFilter', () => {
  const mockOnSearchChange = jest.fn();
  const mockOnPriceRangeChange = jest.fn();
  const mockOnSortChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input correctly', () => {
    render(
      <SearchAndFilter
        onSearchChange={mockOnSearchChange}
        onPriceRangeChange={mockOnPriceRangeChange}
        onSortChange={mockOnSortChange}
      />
    );

    expect(screen.getByPlaceholderText('Search food items...')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('calls onSearchChange when typing in search input', async () => {
    render(
      <SearchAndFilter
        onSearchChange={mockOnSearchChange}
        onPriceRangeChange={mockOnPriceRangeChange}
        onSortChange={mockOnSortChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search food items...');
    fireEvent.change(searchInput, { target: { value: 'apple' } });

    // Wait for debounced search
    await waitFor(() => {
      expect(mockOnSearchChange).toHaveBeenCalledWith('apple');
    }, { timeout: 500 });
  });

  it('shows and hides filters when filter button is clicked', () => {
    render(
      <SearchAndFilter
        onSearchChange={mockOnSearchChange}
        onPriceRangeChange={mockOnPriceRangeChange}
        onSortChange={mockOnSortChange}
      />
    );

    const filterButton = screen.getByText('Filters');
    
    // Filters should be hidden initially
    expect(screen.queryByText('Price Range')).not.toBeInTheDocument();
    
    // Click to show filters
    fireEvent.click(filterButton);
    expect(screen.getByText('Price Range')).toBeInTheDocument();
    expect(screen.getByText('Sort By')).toBeInTheDocument();
    
    // Click to hide filters
    fireEvent.click(filterButton);
    expect(screen.queryByText('Price Range')).not.toBeInTheDocument();
  });

  it('calls onSortChange when sort buttons are clicked', () => {
    render(
      <SearchAndFilter
        onSearchChange={mockOnSearchChange}
        onPriceRangeChange={mockOnPriceRangeChange}
        onSortChange={mockOnSortChange}
      />
    );

    // Show filters first
    fireEvent.click(screen.getByText('Filters'));
    
    // Click on Price sort button
    const priceButton = screen.getByText('Price');
    fireEvent.click(priceButton);
    
    expect(mockOnSortChange).toHaveBeenCalledWith('price', 'asc');
  });

  it('displays total items count when provided', () => {
    render(
      <SearchAndFilter
        onSearchChange={mockOnSearchChange}
        onPriceRangeChange={mockOnPriceRangeChange}
        onSortChange={mockOnSortChange}
        totalItems={25}
      />
    );

    expect(screen.getByText('25 items')).toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', () => {
    render(
      <SearchAndFilter
        onSearchChange={mockOnSearchChange}
        onPriceRangeChange={mockOnPriceRangeChange}
        onSortChange={mockOnSortChange}
      />
    );

    // Show filters and set some values
    fireEvent.click(screen.getByText('Filters'));
    
    const searchInput = screen.getByPlaceholderText('Search food items...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Click clear filters
    const clearButton = screen.getByText('Clear All Filters');
    fireEvent.click(clearButton);
    
    expect(searchInput).toHaveValue('');
    expect(mockOnSearchChange).toHaveBeenCalledWith('');
    expect(mockOnPriceRangeChange).toHaveBeenCalledWith(0, 100);
    expect(mockOnSortChange).toHaveBeenCalledWith('name', 'asc');
  });
});