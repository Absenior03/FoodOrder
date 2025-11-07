import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterForm from '../RegisterForm';
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

import { authService } from '../../../services/authService';
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

const renderRegisterForm = (props = {}) => {
  return render(
    <AuthProvider>
      <RegisterForm {...props} />
    </AuthProvider>
  );
};

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('renders registration form with all required fields', () => {
    renderRegisterForm();
    
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderRegisterForm();
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
    });
  });  
it('validates name minimum length', async () => {
    renderRegisterForm();
    
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    
    await userEvent.type(firstNameInput, 'A');
    await userEvent.type(lastNameInput, 'B');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('First name must be at least 2 characters')).toBeInTheDocument();
      expect(screen.getByText('Last name must be at least 2 characters')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    renderRegisterForm();
    
    const emailInput = screen.getByLabelText(/email address/i);
    await userEvent.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('validates phone number format', async () => {
    renderRegisterForm();
    
    const phoneInput = screen.getByLabelText(/phone number/i);
    await userEvent.type(phoneInput, 'invalid-phone');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });
  });

  it('validates password complexity', async () => {
    renderRegisterForm();
    
    const passwordInput = screen.getByLabelText('Password');
    await userEvent.type(passwordInput, 'simple');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Password must contain at least one uppercase letter, one lowercase letter, and one number')).toBeInTheDocument();
    });
  });

  it('validates password confirmation match', async () => {
    renderRegisterForm();
    
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await userEvent.type(passwordInput, 'Password123');
    await userEvent.type(confirmPasswordInput, 'DifferentPassword123');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockOnSuccess = jest.fn();
    const mockUser = { 
      _id: '1', 
      email: 'test@example.com', 
      firstName: 'John', 
      lastName: 'Doe',
      phone: '1234567890'
    };
    const mockToken = 'mock-token';
    
    mockAuthService.register.mockResolvedValue({
      success: true,
      data: { user: mockUser, token: mockToken },
      message: 'Registration successful'
    });
    
    renderRegisterForm({ onSuccess: mockOnSuccess });
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/first name/i), 'John');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/phone number/i), '1234567890');
    await userEvent.type(screen.getByLabelText('Password'), 'Password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password123');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockAuthService.register).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '1234567890',
        password: 'Password123'
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('displays error message on registration failure', async () => {
    const errorMessage = 'Email already exists';
    
    mockAuthService.register.mockRejectedValue(new Error(errorMessage));
    
    renderRegisterForm();
    
    // Fill out the form with valid data
    await userEvent.type(screen.getByLabelText(/first name/i), 'John');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
    await userEvent.type(screen.getByLabelText(/email address/i), 'existing@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password123');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    // Mock a delayed response that never resolves during test
    let resolveRegister: () => void;
    mockAuthService.register.mockImplementation(() => 
      new Promise(resolve => {
        resolveRegister = resolve;
      })
    );
    
    renderRegisterForm();
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/first name/i), 'John');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password123');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    // Click submit and immediately check for loading state
    userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Creating Account...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  it('calls onSwitchToLogin when login link is clicked', async () => {
    const mockOnSwitchToLogin = jest.fn();
    
    renderRegisterForm({ onSwitchToLogin: mockOnSwitchToLogin });
    
    const loginLink = screen.getByText('Sign in here');
    await userEvent.click(loginLink);
    
    expect(mockOnSwitchToLogin).toHaveBeenCalled();
  });
});