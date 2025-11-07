import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OrderTracking as OrderTrackingType, OrderStatus } from '../../types/order';
import { orderService } from '../../services/orderService';
import OrderStatusIndicator from './OrderStatusIndicator';
import { useOrderUpdates } from '../../hooks/useOrderUpdates';

const OrderTracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [tracking, setTracking] = useState<OrderTrackingType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  
  // Use real-time order updates
  const { latestUpdate } = useOrderUpdates(orderId ? [orderId] : []);

  useEffect(() => {
    if (orderId) {
      fetchTrackingInfo();
      
      // Set up polling for real-time updates (every 60 seconds as backup)
      const interval = setInterval(fetchTrackingInfo, 60000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  // Handle real-time order updates
  useEffect(() => {
    if (latestUpdate && latestUpdate.orderId === orderId) {
      console.log('Received real-time order update:', latestUpdate);
      setLastUpdate(latestUpdate.timestamp);
      
      // Refresh tracking info to get the latest data
      fetchTrackingInfo();
    }
  }, [latestUpdate, orderId]);

  const fetchTrackingInfo = async () => {
    if (!orderId) return;
    
    try {
      if (isLoading) setIsLoading(true);
      const response = await orderService.getOrderTracking(orderId);
      setTracking(response.data.tracking);
      setError(null);
    } catch (error: any) {
      console.error('Failed to fetch tracking info:', error);
      setError(error.response?.data?.error?.message || 'Failed to load tracking information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Pending';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatEstimatedDelivery = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading && !tracking) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tracking Information Not Available</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to load tracking information for this order.'}</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Track Your Order</h1>
          <p className="text-gray-600 mt-1">Order #{tracking.orderId}</p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <OrderStatusIndicator 
            status={tracking.currentStatus} 
            paymentStatus={tracking.paymentStatus}
            showPaymentStatus={true}
            size="lg"
          />
        </div>
      </div>

      {/* Estimated Delivery */}
      {tracking.estimatedDelivery && !tracking.isDelivered && !tracking.isCancelled && (
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Estimated Delivery</h2>
              <p className="text-blue-700">{formatEstimatedDelivery(tracking.estimatedDelivery)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Success */}
      {tracking.isDelivered && (
        <div className="bg-green-50 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-green-900">Order Delivered!</h2>
              <p className="text-green-700">Your order has been successfully delivered. Enjoy your meal!</p>
            </div>
          </div>
        </div>
      )}

      {/* Order Cancelled */}
      {tracking.isCancelled && (
        <div className="bg-red-50 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-red-900">Order Cancelled</h2>
              <p className="text-red-700">This order has been cancelled. If you have any questions, please contact support.</p>
            </div>
          </div>
        </div>
      )}

      {/* Order Timeline */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Order Timeline</h2>
        </div>
        
        <div className="px-6 py-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {tracking.timeline.map((step, stepIdx) => (
                <li key={step.status}>
                  <div className="relative pb-8">
                    {stepIdx !== tracking.timeline.length - 1 ? (
                      <span
                        className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${
                          step.completed ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                            step.completed
                              ? 'bg-green-500'
                              : tracking.currentStatus === step.status
                              ? 'bg-blue-500'
                              : 'bg-gray-300'
                          }`}
                        >
                          {step.completed ? (
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : tracking.currentStatus === step.status ? (
                            <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                          )}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5">
                        <div>
                          <p className={`text-sm font-medium ${
                            step.completed || tracking.currentStatus === step.status
                              ? 'text-gray-900'
                              : 'text-gray-500'
                          }`}>
                            {step.title}
                          </p>
                          <p className={`mt-1 text-sm ${
                            step.completed || tracking.currentStatus === step.status
                              ? 'text-gray-600'
                              : 'text-gray-400'
                          }`}>
                            {step.description}
                          </p>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          <time>{formatDate(step.timestamp)}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Delivery Address</h2>
        </div>
        
        <div className="px-6 py-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-gray-400 mt-1 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <div className="text-gray-900">
              <p className="mb-1">{tracking.deliveryAddress.street}</p>
              <p>
                {tracking.deliveryAddress.city}, {tracking.deliveryAddress.state} {tracking.deliveryAddress.zipCode}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => navigate(`/orders/${tracking.orderId}`)}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          View Order Details
        </button>
        
        <button
          onClick={() => navigate('/orders')}
          className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-50 transition-colors font-medium"
        >
          View All Orders
        </button>
        
        <button
          onClick={() => navigate('/menu')}
          className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
        >
          Order Again
        </button>
      </div>

      {/* Auto-refresh indicator */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          This page receives real-time updates and refreshes automatically.
          <br />
          Last updated: {formatDate(lastUpdate || tracking.lastUpdated)}
          {lastUpdate && (
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Live Update
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default OrderTracking;