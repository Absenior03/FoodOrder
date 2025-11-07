import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { MagneticButton } from '../common/MagneticButton';
import { RegisterCredentials } from '../../types/auth';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { register: registerUser, state, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<RegisterCredentials & { confirmPassword: string }>();

  const password = watch('password');

  const onSubmit = async (data: RegisterCredentials & { confirmPassword: string }) => {
    try {
      setIsSubmitting(true);
      clearError();
      
      // Remove confirmPassword from the data before sending
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      reset();
      onSuccess?.();
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div>
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            <p className="text-sm font-medium">{state.error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-gray-700 text-sm font-semibold mb-2"
              >
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                {...register('firstName', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters',
                  },
                })}
                className={`auth-input w-full px-4 py-3 rounded-xl focus:outline-none ${
                  errors.firstName ? 'border-red-500' : ''
                }`}
                placeholder="First name"
                disabled={isSubmitting}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-2 font-medium">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-gray-700 text-sm font-semibold mb-2"
              >
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                {...register('lastName', {
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters',
                  },
                })}
                className={`auth-input w-full px-4 py-3 rounded-xl focus:outline-none ${
                  errors.lastName ? 'border-red-500' : ''
                }`}
                placeholder="Last name"
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-2 font-medium">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address',
                },
              })}
              className={`auth-input w-full px-4 py-3 rounded-xl focus:outline-none ${
                errors.email ? 'border-red-500' : ''
              }`}
              placeholder="Enter your email"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-2 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Phone Number (Optional)
            </label>
            <input
              id="phone"
              type="tel"
              {...register('phone', {
                pattern: {
                  value: /^[+]?[1-9][\d]{0,15}$/,
                  message: 'Please enter a valid phone number',
                },
              })}
              className={`auth-input w-full px-4 py-3 rounded-xl focus:outline-none ${
                errors.phone ? 'border-red-500' : ''
              }`}
              placeholder="Enter your phone number"
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-2 font-medium">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                },
              })}
              className={`auth-input w-full px-4 py-3 rounded-xl focus:outline-none ${
                errors.password ? 'border-red-500' : ''
              }`}
              placeholder="Create a password"
              disabled={isSubmitting}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-2 font-medium">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
              className={`auth-input w-full px-4 py-3 rounded-xl focus:outline-none ${
                errors.confirmPassword ? 'border-red-500' : ''
              }`}
              placeholder="Confirm your password"
              disabled={isSubmitting}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-2 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>

          <MagneticButton
            magneticStrength={0.4}
            magneticRadius={100}
            disabled={isSubmitting}
            className={`auth-button w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
            }`}
          >
            <button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </MagneticButton>
        </form>

        {onSwitchToLogin && (
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-800 font-semibold focus:outline-none hover:underline transition-colors duration-300"
                disabled={isSubmitting}
              >
                Sign in here
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterForm;