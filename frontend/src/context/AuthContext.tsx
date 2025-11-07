import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, AuthContextType, LoginCredentials, RegisterCredentials, User } from '../types/auth';
import { authService } from '../services/authService';
import { tokenStorage, userStorage, isTokenExpired, clearAuthStorage } from '../utils/auth';

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_USER'; payload: User };

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
        error: null,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = tokenStorage.get();
        const user = userStorage.get();

        if (token && user && !isTokenExpired(token)) {
          // Token exists and is valid, restore auth state
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, token },
          });
        } else {
          // Token is expired or doesn't exist, clear storage
          clearAuthStorage();
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearAuthStorage();
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authService.login(credentials);
      const { user, tokens } = response.data;
      const token = tokens.accessToken;

      // Store in localStorage
      tokenStorage.set(token);
      userStorage.set(user);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token },
      });
    } catch (error: any) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.message || 'Login failed',
      });
      throw error;
    }
  };

  // Register function
  const register = async (credentials: RegisterCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authService.register(credentials);
      const { user, tokens } = response.data;
      const token = tokens.accessToken;

      // Store in localStorage
      tokenStorage.set(token);
      userStorage.set(user);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token },
      });
    } catch (error: any) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.message || 'Registration failed',
      });
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage and state
      clearAuthStorage();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Check authentication status
  const checkAuthStatus = (): boolean => {
    const token = tokenStorage.get();
    return !!(token && !isTokenExpired(token) && state.isAuthenticated);
  };

  // Update profile function
  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      
      console.log('Profile updated successfully:', { ...updatedUser, profilePicture: updatedUser.profilePicture ? 'has picture' : 'no picture' });
      
      // Update user in storage and state
      userStorage.set(updatedUser);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update profile';
      console.error('Update profile error:', errorMessage);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    state,
    login,
    register,
    logout,
    clearError,
    checkAuthStatus,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};