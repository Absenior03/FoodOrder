import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Order } from '../../types/order';
import { orderService } from '../../services/orderService';
import OrderStatusIndicator from './OrderStatusIndicator';
import { ErrorDisplay, RetryButton } from '../common';

const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(location.state?.order || null);
  const [isLoading, setIsLoading] = useState(!order);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!order && orderId) {
      fetchOrderDetails();
    }
  }, [orderId, order]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await orderService.getOrderById(orderId);
      setOrder(response.data.order);
    } catch (error: any) {
      console.error('Failed to fetch order details:', error);
      
      if (error.code === 'NETWORK_ERROR') {
        setError('Network connection failed. Please check your internet connection and try again.');
      } else if (error.response?.status === 404) {
        setError('Order not found. Please check your order ID and try again.');
      } else if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again to view your order.');
      } else {
        setError(error.response?.data?.error?.message || 'Failed to load order details. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Not Found</h2>
          
          <div className="mb-6">
            <ErrorDisplay
              error={error || 'The order you are looking for could not be found.'}
              type="error"
              showRetry={!!error}
              onRetry={error ? fetchOrderDetails : undefined}
            />
          </div>
          
          <div className="space-x-4">
            <button
              onClick={() => navigate('/orders')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              View Order History
            </button>
            <button
              onClick={() => navigate('/menu')}
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-lg text-gray-600">Thank you for your order. We're preparing it for you.</p>
      </div>

      {/* Order Details Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Order #{order.orderId}</h2>
              <p className="text-sm text-gray-600 mt-1">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <OrderStatusIndicator 
                status={order.status} 
                paymentStatus={order.paymentStatus}
                showPaymentStatus={true}
                size="md"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          {/* Order Items */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <span>Qty: {item.quantity}</span>
                      <span className="mx-2">×</span>
                      <span>₹{item.price.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">
                      ₹{item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>₹{order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery Fee</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax (8%)</span>
                <span>₹{(order.totalAmount * 0.08).toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-semibold text-gray-900">
                <span>Total</span>
                <span>₹{(order.totalAmount * 1.08).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Address</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900">{order.deliveryAddress.street}</p>
              <p className="text-gray-900">
                {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => navigate(`/orders/${order.orderId}/tracking`)}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Track Your Order
        </button>
        <button
          onClick={() => navigate('/orders')}
          className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors font-medium"
        >
          View Order History
        </button>
        <button
          onClick={() => navigate('/menu')}
          className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-50 transition-colors font-medium"
        >
          Continue Shopping
        </button>
      </div>

      {/* Estimated Delivery */}
      <div className="mt-8 text-center">
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Estimated Delivery</h3>
          <p className="text-blue-700">
            Your order will be delivered within 30-45 minutes. You'll receive updates as your order progresses.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;