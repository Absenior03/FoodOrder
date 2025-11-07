import React from 'react';
import { OrderStatus, PaymentStatus } from '../../types/order';

interface OrderStatusIndicatorProps {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  size?: 'sm' | 'md' | 'lg';
  showPaymentStatus?: boolean;
}

const OrderStatusIndicator: React.FC<OrderStatusIndicatorProps> = ({
  status,
  paymentStatus,
  size = 'md',
  showPaymentStatus = false
}) => {
  const getStatusConfig = (orderStatus: OrderStatus) => {
    switch (orderStatus) {
      case OrderStatus.PENDING:
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          ),
          label: 'Pending'
        };
      case OrderStatus.CONFIRMED:
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ),
          label: 'Confirmed'
        };
      case OrderStatus.PREPARING:
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          ),
          label: 'Preparing'
        };
      case OrderStatus.DELIVERED:
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707L16 7.586A1 1 0 0015.414 7H14z" />
            </svg>
          ),
          label: 'Delivered'
        };
      case OrderStatus.CANCELLED:
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ),
          label: 'Cancelled'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          ),
          label: 'Unknown'
        };
    }
  };

  const getPaymentStatusConfig = (payStatus: PaymentStatus) => {
    switch (payStatus) {
      case PaymentStatus.PENDING:
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          label: 'Payment Pending'
        };
      case PaymentStatus.COMPLETED:
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          label: 'Paid'
        };
      case PaymentStatus.FAILED:
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          label: 'Payment Failed'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          label: 'Unknown'
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const paymentConfig = getPaymentStatusConfig(paymentStatus);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className="flex flex-col space-y-2">
      {/* Order Status */}
      <div className={`inline-flex items-center ${sizeClasses[size]} font-medium rounded-full border ${statusConfig.color}`}>
        {statusConfig.icon}
        <span className="ml-1">{statusConfig.label}</span>
      </div>

      {/* Payment Status */}
      {showPaymentStatus && (
        <div className={`inline-flex items-center ${sizeClasses[size]} font-medium rounded-full border ${paymentConfig.color}`}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
          </svg>
          <span className="ml-1">{paymentConfig.label}</span>
        </div>
      )}
    </div>
  );
};

export default OrderStatusIndicator;