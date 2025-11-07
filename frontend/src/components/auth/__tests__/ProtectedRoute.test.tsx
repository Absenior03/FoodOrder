import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ProtectedRoute from '../ProtectedRoute';
import { AuthProvider } from '../../../context/AuthContext';

// Mock axios
jest.mock('axios');

// Mock the auth service
jest.mock('../../../services/authService', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.location.href
delete (window as any).location;
window.location = { href: '' } as any;

const TestComponent = () => <div>Protected Content</div>;
const FallbackComponent = () => <div>Please log in</div>;

const renderProtectedRoute = (props = {}) => {
  return render(
    <AuthProvider>
      <ProtectedRoute {...props}>
        <TestComponent />
      </ProtectedRoute>
    </AuthProvider>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    window.location.href = '';
  });

  it('shows loading spinner while checking authentication', async () => {
    // Mock a valid token to trigger loading state
    const mockUser = { _id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lp-38RKwAk-qoGVOC8_N_8O8ePTRlhBvCg_N_8O8ePQ';
    
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'food_ordering_token') return mockToken;
      if (key === 'food_ordering_user') return JSON.stringify(mockUser);
      return null;
    });
    
    renderProtectedRoute();
    
    // Should eventually show protected content after loading
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('renders protected content when user is authenticated', async () => {
    const mockUser = { _id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lp-38RKwAk-qoGVOC8_N_8O8ePTRlhBvCg_N_8O8ePQ';
    
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'food_ordering_token') return mockToken;
      if (key === 'food_ordering_user') return JSON.stringify(mockUser);
      return null;
    });
    
    renderProtectedRoute();
    
    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('shows authentication required message when user is not authenticated', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    renderProtectedRoute();
    
    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('You need to be logged in to access this page.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it('renders fallback component when provided and user is not authenticated', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    renderProtectedRoute({ fallback: <FallbackComponent /> });
    
    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByText('Please log in')).toBeInTheDocument();
      expect(screen.queryByText('Authentication Required')).not.toBeInTheDocument();
    });
  });

  it('redirects to custom path when redirectTo is provided', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    renderProtectedRoute({ redirectTo: '/custom-login' });
    
    // Wait for authentication check to complete
    await waitFor(() => {
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      expect(signInButton).toBeInTheDocument();
    });
    
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    signInButton.click();
    
    expect(window.location.href).toBe('/custom-login');
  });

  it('handles expired token by showing authentication required', async () => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
    const mockUser = { _id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'food_ordering_token') return expiredToken;
      if (key === 'food_ordering_user') return JSON.stringify(mockUser);
      return null;
    });
    
    renderProtectedRoute();
    
    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    });
  });

  it('handles malformed token by showing authentication required', async () => {
    const malformedToken = 'invalid.token.format';
    const mockUser = { _id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'food_ordering_token') return malformedToken;
      if (key === 'food_ordering_user') return JSON.stringify(mockUser);
      return null;
    });
    
    renderProtectedRoute();
    
    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    });
  });

  it('handles missing user data by showing authentication required', async () => {
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lp-38RKwAk-qoGVOC8_N_8O8ePTRlhBvCg_N_8O8ePQ';
    
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'food_ordering_token') return mockToken;
      if (key === 'food_ordering_user') return null;
      return null;
    });
    
    renderProtectedRoute();
    
    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    });
  });
});