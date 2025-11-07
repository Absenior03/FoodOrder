import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MouseTrackingText } from '../common/MouseTrackingText';
import { MagneticButton } from '../common/MagneticButton';
import AuthModal from '../auth/AuthModal';
import CartToggle from '../cart/CartToggle';
import { sanitizeProfilePictureUrl } from '../../utils/imageUtils';

const Header: React.FC = () => {
  const { state, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleAuthModalOpen = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserInitials = () => {
    if (!state.user) return '';
    return `${state.user.firstName.charAt(0)}${state.user.lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      <header className="navbar-glow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MouseTrackingText
                  glowColor="#3b82f6"
                  glowIntensity={1.5}
                  trackingRadius={100}
                  scaleOnHover={true}
                >
                  <h1 className="text-xl font-bold text-gray-900">
                    FoodOrder
                  </h1>
                </MouseTrackingText>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link
                to="/"
                className="navbar-item text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              <Link
                to="/menu"
                className="navbar-item text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Menu
              </Link>
              {state.isAuthenticated && (
                <Link
                  to="/orders"
                  className="navbar-item text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  My Orders
                </Link>
              )}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Cart Toggle - Show for authenticated users */}
              {state.isAuthenticated && <CartToggle />}
              
              {state.isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md p-2"
                  >
                    {state.user?.profilePicture ? (
                      <img
                        src={sanitizeProfilePictureUrl(state.user.profilePicture) || ''}
                        alt={`${state.user.firstName} ${state.user.lastName}`}
                        className="h-8 w-8 rounded-full object-cover border-2 border-blue-500"
                        onError={(e) => {
                          console.error('Failed to load profile picture');
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-blue-500">
                        {getUserInitials()}
                      </div>
                    )}
                    <span className="hidden md:block text-sm font-medium">
                      {state.user?.firstName}
                    </span>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          {state.user?.profilePicture ? (
                            <img
                              src={sanitizeProfilePictureUrl(state.user.profilePicture) || ''}
                              alt={`${state.user.firstName} ${state.user.lastName}`}
                              className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-gray-200">
                              {getUserInitials()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {state.user?.firstName} {state.user?.lastName}
                            </p>
                            <p className="text-xs text-gray-500 truncate" title={state.user?.email}>
                              {state.user?.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Profile Settings
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Order History
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAuthModalOpen('login')}
                    className="navbar-item text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign In
                  </button>
                  <MagneticButton
                    magneticStrength={0.3}
                    magneticRadius={80}
                    className="auth-button bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => handleAuthModalOpen('register')}
                  >
                    Sign Up
                  </MagneticButton>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200/50">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className="navbar-item text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
            >
              Home
            </Link>
            <Link
              to="/menu"
              className="navbar-item text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
            >
              Menu
            </Link>
            {state.isAuthenticated && (
              <>
                <Link
                  to="/orders"
                  className="navbar-item text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                >
                  My Orders
                </Link>
                <Link
                  to="/cart"
                  className="navbar-item text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Cart
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          setIsUserMenuOpen(false);
        }}
      />

      {/* Overlay to close user menu when clicking outside */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Header;