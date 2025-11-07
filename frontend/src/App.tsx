import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserProfile from './components/auth/UserProfile';

import CartSidebar from './components/cart/CartSidebar';
import CheckoutForm from './components/checkout/CheckoutForm';
import { OrderConfirmation, OrderHistory, OrderDetails, OrderTracking } from './components/orders';
import ErrorBoundary from './components/common/ErrorBoundary';
import HomePage from './components/pages/HomePage';
import TestPage from './components/pages/TestPage';
import CartPage from './components/pages/CartPage';
import InteractiveInventoryBrowser from './components/inventory/InteractiveInventoryBrowser';
import ApiDebug from './components/debug/ApiDebug';


import './App.css';

const MenuPage: React.FC = () => (
  <InteractiveInventoryBrowser />
);

const OrdersPage: React.FC = () => (
  <ProtectedRoute>
    <OrderHistory />
  </ProtectedRoute>
);

const OrderConfirmationPage: React.FC = () => (
  <ProtectedRoute>
    <OrderConfirmation />
  </ProtectedRoute>
);

const OrderDetailsPage: React.FC = () => (
  <ProtectedRoute>
    <OrderDetails />
  </ProtectedRoute>
);

const OrderTrackingPage: React.FC = () => (
  <ProtectedRoute>
    <OrderTracking />
  </ProtectedRoute>
);

const CartPageWrapper: React.FC = () => (
  <CartPage />
);

const CheckoutPage: React.FC = () => (
  <ProtectedRoute>
    <CheckoutForm />
  </ProtectedRoute>
);

const ProfilePage: React.FC = () => (
  <ProtectedRoute>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <UserProfile />
    </div>
  </ProtectedRoute>
);

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <WebSocketProvider>
            <CartProvider>
              <Router>
                <Layout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/menu" element={<MenuPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
                    <Route path="/orders/:orderId/tracking" element={<OrderTrackingPage />} />
                    <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
                    <Route path="/cart" element={<CartPageWrapper />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/test" element={<TestPage />} />
                    <Route path="/api-debug" element={<ApiDebug />} />
                    {/* Redirect any unknown routes to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                  <CartSidebar />
                </Layout>
              </Router>
            </CartProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
