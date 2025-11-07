import React, { useState } from 'react';

interface RetryButtonProps {
  onRetry: () => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  maxRetries?: number;
}

const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  isLoading = false,
  disabled = false,
  className = '',
  children = 'Retry',
  maxRetries = 3
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (retryCount >= maxRetries) return;
    
    try {
      setIsRetrying(true);
      await onRetry();
      setRetryCount(0); // Reset on success
    } catch (error) {
      setRetryCount(prev => prev + 1);
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const isDisabled = disabled || isLoading || isRetrying || retryCount >= maxRetries;

  return (
    <button
      onClick={handleRetry}
      disabled={isDisabled}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {(isLoading || isRetrying) && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
      {retryCount > 0 && retryCount < maxRetries && (
        <span className="ml-1 text-xs">({retryCount}/{maxRetries})</span>
      )}
      {retryCount >= maxRetries && (
        <span className="ml-1 text-xs">(Max retries reached)</span>
      )}
    </button>
  );
};

export default RetryButton;