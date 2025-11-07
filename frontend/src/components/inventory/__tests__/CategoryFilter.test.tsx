import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CategoryFilter from '../CategoryFilter';
import { Category } from '../../../types/inventory';

const mockCategories: Category[] = [
  { name: 'All', value: 'All', count: 28, availableItems: 27 },
  { name: 'Fruit', value: 'Fruit', count: 8, availableItems: 7 },
  { name: 'Vegetable', value: 'Vegetable', count: 7, availableItems: 7 },
  { name: 'Non-veg', value: 'Non-veg', count: 7, availableItems: 7 },
  { name: 'Breads', value: 'Breads', count: 6, availableItems: 6 }
];

describe('CategoryFilter', () => {
  const mockOnCategoryChange = jest.fn();

  beforeEach(() => {
    mockOnCategoryChange.mockClear();
  });

  it('renders all categories correctly', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory="All"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Fruit')).toBeInTheDocument();
    expect(screen.getByText('Vegetable')).toBeInTheDocument();
    expect(screen.getByText('Non-veg')).toBeInTheDocument();
    expect(screen.getByText('Breads')).toBeInTheDocument();
  });

  it('displays item counts for each category', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory="All"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    expect(screen.getByText('(27/28)')).toBeInTheDocument(); // All category
    expect(screen.getByText('(7/8)')).toBeInTheDocument(); // Fruit category
    expect(screen.getAllByText('(7/7)')).toHaveLength(2); // Vegetable and Non-veg categories
    expect(screen.getByText('(6/6)')).toBeInTheDocument(); // Breads category
  });

  it('highlights the selected category', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory="Fruit"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    const fruitButton = screen.getByRole('button', { name: /Fruit/ });
    expect(fruitButton).toHaveClass('bg-blue-600', 'text-white');

    const allButton = screen.getByRole('button', { name: /All/ });
    expect(allButton).toHaveClass('bg-gray-100', 'text-gray-700');
  });

  it('calls onCategoryChange when a category is clicked', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory="All"
        onCategoryChange={mockOnCategoryChange}
      />
    );

    const fruitButton = screen.getByRole('button', { name: /Fruit/ });
    fireEvent.click(fruitButton);

    expect(mockOnCategoryChange).toHaveBeenCalledWith('Fruit');
  });

  it('shows loading skeleton when isLoading is true', () => {
    render(
      <CategoryFilter
        categories={[]}
        selectedCategory="All"
        onCategoryChange={mockOnCategoryChange}
        isLoading={true}
      />
    );

    const skeletons = screen.getAllByRole('generic');
    const loadingSkeletons = skeletons.filter(el => 
      el.className.includes('animate-pulse')
    );
    expect(loadingSkeletons.length).toBeGreaterThan(0);
  });
});