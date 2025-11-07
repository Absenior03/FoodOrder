import React from 'react';
import { render, screen } from '@testing-library/react';
import StockIndicator from '../StockIndicator';

describe('StockIndicator', () => {
  it('shows "Not Available" for zero stock', () => {
    render(<StockIndicator stock={0} />);
    expect(screen.getByText('Not Available')).toBeInTheDocument();
    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  it('shows "Only X left" for low stock (1-5)', () => {
    render(<StockIndicator stock={3} />);
    expect(screen.getByText('Only 3 left')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('shows "X available" for medium stock (6-20)', () => {
    render(<StockIndicator stock={15} />);
    expect(screen.getByText('15 available')).toBeInTheDocument();
    expect(screen.getByText('📦')).toBeInTheDocument();
  });

  it('shows "In Stock" for high stock (>20)', () => {
    render(<StockIndicator stock={50} />);
    expect(screen.getByText('In Stock')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('applies correct CSS classes for different stock levels', () => {
    const { rerender, container } = render(<StockIndicator stock={0} />);
    expect(container.firstChild).toHaveClass('bg-red-100', 'text-red-800');

    rerender(<StockIndicator stock={3} />);
    expect(container.firstChild).toHaveClass('bg-yellow-100', 'text-yellow-800');

    rerender(<StockIndicator stock={15} />);
    expect(container.firstChild).toHaveClass('bg-blue-100', 'text-blue-800');

    rerender(<StockIndicator stock={50} />);
    expect(container.firstChild).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('shows animation when showAnimation prop is true', () => {
    const { container } = render(<StockIndicator stock={10} showAnimation={true} />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('does not show animation when showAnimation prop is false', () => {
    const { container } = render(<StockIndicator stock={10} showAnimation={false} />);
    expect(container.firstChild).not.toHaveClass('animate-pulse');
  });
});