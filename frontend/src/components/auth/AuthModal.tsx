import React, { useState, useEffect } from 'react';
import { MouseReactiveElement } from '../common/MouseReactiveElement';
import { MouseTrackingText } from '../common/MouseTrackingText';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Update mode when initialMode prop changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  if (!isOpen) return null;

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  const handleSwitchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <MouseReactiveElement
        intensity={1.2}
        magneticRadius={250}
        tiltStrength={8}
        glowIntensity={0.3}
        className="relative auth-form rounded-2xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 z-10 transition-all duration-300 hover:scale-110"
          aria-label="Close modal"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <MouseTrackingText
              glowColor="#3b82f6"
              glowIntensity={1.5}
              trackingRadius={150}
              scaleOnHover={true}
              className="text-2xl font-bold text-gray-900 mb-2"
            >
              {mode === 'login' ? 'Welcome Back!' : 'Join FoodOrder'}
            </MouseTrackingText>
            <p className="text-gray-600">
              {mode === 'login' 
                ? 'Sign in to your account to continue ordering' 
                : 'Create an account to start ordering delicious food'
              }
            </p>
          </div>

          {mode === 'login' ? (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToRegister={handleSwitchMode}
            />
          ) : (
            <RegisterForm
              onSuccess={handleSuccess}
              onSwitchToLogin={handleSwitchMode}
            />
          )}
        </div>
      </MouseReactiveElement>
    </div>
  );
};

export default AuthModal;