import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Order } from '../../types/order';
import { orderService } from '../../services/orderService';
import OrderStatusIndicator from './OrderStatusIndicator';

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    try {
      setIsLoading(true);
      const response = await orderService.getOrderById(orderId);
      setOrder(response.data.order);
    } catch (error: any) {
      console.error('Failed to fetch order details:', error);
      setError(error.response?.data?.error?.message || 'Failed to load order details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The order you are looking for could not be found.'}</p>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/orders')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Orders
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
          <p className="text-gray-600 mt-1">Order #{order.orderId}</p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <OrderStatusIndicator 
            status={order.status} 
            paymentStatus={order.paymentStatus}
            showPaymentStatus={true}
            size="lg"
          />
        </div>
      </div>

      {/* Order Information Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Order Information</h2>
        </div>
        
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Order Date</h3>
              <p className="text-gray-900">{formatDate(order.createdAt)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Last Updated</h3>
              <p className="text-gray-900">{formatDate(order.updatedAt)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Order Status</h3>
              <p className="text-gray-900 capitalize">{order.status.replace('_', ' ')}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Payment Status</h3>
              <p className="text-gray-900 capitalize">{order.paymentStatus.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Order Items</h2>
        </div>
        
        <div className="px-6 py-6">
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{item.name}</h4>
                  <div className="flex items-center text-sm text-gray-600">
                    <span>Quantity: {item.quantity}</span>
                    <span className="mx-2">×</span>
                    <span>₹{item.price.toFixed(2)} each</span>
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
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
        </div>
        
        <div className="px-6 py-6">
          <div className="space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({order.items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
              <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span className="text-green-600">Free</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (8%)</span>
              <span>₹{(order.totalAmount * 0.08).toFixed(2)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between text-xl font-semibold text-gray-900">
              <span>Total</span>
              <span>₹{(order.totalAmount * 1.08).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Delivery Address</h2>
        </div>
        
        <div className="px-6 py-6">
          <div className="text-gray-900">
            <p className="mb-1">{order.deliveryAddress.street}</p>
            <p>
              {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <button
            onClick={() => navigate(`/orders/${order.orderId}/tracking`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Track This Order
          </button>
        )}
        
        <button
          onClick={() => {
            // Reorder functionality could be implemented here
            navigate('/menu');
          }}
          className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
        >
          Reorder Items
        </button>
        
        <button
          onClick={() => navigate('/orders')}
          className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-50 transition-colors font-medium"
        >
          View All Orders
        </button>
      </div>
    </div>
  );
};

export default OrderDetails;