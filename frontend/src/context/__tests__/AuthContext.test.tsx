import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock axios
jest.mock('axios');

// Mock the auth service
jest.mock('../../services/authService', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

import { authService } from '../../services/authService';
const mockAuthService = authService as jest.Mocked<typeof authService>;

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

// Test component to access auth context
const TestComponent = () => {
  const { state, login, register, logout, clearError, checkAuthStatus } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-state">
        {JSON.stringify({
          isAuthenticated: state.isAuthenticated,
          isLoading: state.isLoading,
          error: state.error,
          user: state.user ? { email: state.user.email } : null
        })}
      </div>
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
      <button onClick={() => register({ 
        email: 'test@example.com', 
        password: 'password',
        firstName: 'Test',
        lastName: 'User'
      })}>
        Register
      </button>
      <button onClick={logout}>Logout</button>
      <button onClick={clearError}>Clear Error</button>
      <div data-testid="auth-status">{checkAuthStatus() ? 'authenticated' : 'not-authenticated'}</div>
    </div>
  );
};

const renderWithAuthProvider = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('initializes with default state when no stored auth data', async () => {
    renderWithAuthProvider();
    
    await waitFor(() => {
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.isLoading).toBe(false);
      expect(authState.error).toBe(null);
      expect(authState.user).toBe(null);
    });
  });

  it('restores authentication state from localStorage on mount', async () => {
    const mockUser = { id: '1', _id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lp-38RKwAk-qoGVOC8_N_8O8ePTRlhBvCg_N_8O8ePQ';
    
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'food_ordering_token') return mockToken;
      if (key === 'food_ordering_user') return JSON.stringify(mockUser);
      return null;
    });
    
    renderWithAuthProvider();
    
    await waitFor(() => {
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.isLoading).toBe(false);
      expect(authState.user.email).toBe('test@example.com');
    });
  });

  it('clears storage when token is expired on mount', async () => {
    const mockUser = { id: '1', _id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
    
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'food_ordering_token') return expiredToken;
      if (key === 'food_ordering_user') return JSON.stringify(mockUser);
      return null;
    });
    
    renderWithAuthProvider();
    
    await waitFor(() => {
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('food_ordering_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('food_ordering_user');
      
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.isAuthenticated).toBe(false);
    });
  });

  it('handles successful login', async () => {
    const mockUser = { id: '1', _id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    const mockToken = 'mock-token';
    
    mockAuthService.login.mockResolvedValue({
      success: true,
      data: { 
        user: mockUser, 
        tokens: { 
          accessToken: mockToken,
          refreshToken: 'mock-refresh-token'
        }
      },
      message: 'Login successful'
    });
    
    renderWithAuthProvider();
    
    const loginButton = screen.getByText('Login');
    
    await act(async () => {
      loginButton.click();
    });
    
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('food_ordering_token', mockToken);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('food_ordering_user', JSON.stringify(mockUser));
      
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.user.email).toBe('test@example.com');
    });
  });

  it('handles login failure', async () => {
    const errorMessage = 'Invalid credentials';
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockAuthService.login.mockRejectedValue(new Error(errorMessage));
    
    renderWithAuthProvider();
    
    const loginButton = screen.getByText('Login');
    
    await act(async () => {
      loginButton.click();
    });
    
    await waitFor(() => {
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.error).toBe(errorMessage);
    });
    
    consoleSpy.mockRestore();
  });

  it('handles successful registration', async () => {
    const mockUser = { id: '1', _id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    const mockToken = 'mock-token';
    
    mockAuthService.register.mockResolvedValue({
      success: true,
      data: { 
        user: mockUser, 
        tokens: { 
          accessToken: mockToken,
          refreshToken: 'mock-refresh-token'
        }
      },
      message: 'Registration successful'
    });
    
    renderWithAuthProvider();
    
    const registerButton = screen.getByText('Register');
    
    await act(async () => {
      registerButton.click();
    });
    
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('food_ordering_token', mockToken);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('food_ordering_user', JSON.stringify(mockUser));
      
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.user.email).toBe('test@example.com');
    });
  });

  it('handles registration failure', async () => {
    const errorMessage = 'Email already exists';
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockAuthService.register.mockRejectedValue(new Error(errorMessage));
    
    renderWithAuthProvider();
    
    const registerButton = screen.getByText('Register');
    
    await act(async () => {
      registerButton.click();
    });
    
    await waitFor(() => {
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.error).toBe(errorMessage);
    });
    
    consoleSpy.mockRestore();
  });

  it('handles logout', async () => {
    // First set up authenticated state
    const mockUser = { id: '1', _id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    const mockToken = 'mock-token';
    
    mockAuthService.login.mockResolvedValue({
      success: true,
      data: { 
        user: mockUser, 
        tokens: { 
          accessToken: mockToken,
          refreshToken: 'mock-refresh-token'
        }
      },
      message: 'Login successful'
    });
    
    mockAuthService.logout.mockResolvedValue();
    
    renderWithAuthProvider();
    
    // Login first
    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
    });
    
    // Wait for login to complete
    await waitFor(() => {
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.isAuthenticated).toBe(true);
    });
    
    // Now logout
    const logoutButton = screen.getByText('Logout');
    await act(async () => {
      logoutButton.click();
    });
    
    await waitFor(() => {
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('food_ordering_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('food_ordering_user');
      
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.user).toBe(null);
    });
  });

  it('clears error when clearError is called', async () => {
    const errorMessage = 'Test error';
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockAuthService.login.mockRejectedValue(new Error(errorMessage));
    
    renderWithAuthProvider();
    
    // Trigger an error
    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
    });
    
    // Verify error is set
    await waitFor(() => {
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.error).toBe(errorMessage);
    });
    
    // Clear error
    const clearErrorButton = screen.getByText('Clear Error');
    await act(async () => {
      clearErrorButton.click();
    });
    
    await waitFor(() => {
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.error).toBe(null);
    });
    
    consoleSpy.mockRestore();
  });

  it('checkAuthStatus returns correct authentication status', async () => {
    renderWithAuthProvider();
    
    // Initially not authenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });
    
    // Login and check status
    const mockUser = { id: '1', _id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lp-38RKwAk-qoGVOC8_N_8O8ePTRlhBvCg_N_8O8ePQ';
    
    mockAuthService.login.mockResolvedValue({
      success: true,
      data: { 
        user: mockUser, 
        tokens: { 
          accessToken: mockToken,
          refreshToken: 'mock-refresh-token'
        }
      },
      message: 'Login successful'
    });
    
    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    const TestComponentOutsideProvider = () => {
      useAuth();
      return <div>Test</div>;
    };
    
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponentOutsideProvider />);
    }).toThrow('useAuth must be used within an AuthProvider');
    
    consoleSpy.mockRestore();
  });
});