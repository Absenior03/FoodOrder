import { useState, useCallback } from 'react';

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
}

export const useErrorHandler = () => {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);

  const handleError = useCallback((error: any, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);

    let errorInfo: ErrorInfo;

    if (error?.response?.data?.error) {
      // API error response
      const apiError = error.response.data.error;
      errorInfo = {
        message: apiError.message || 'An error occurred',
        code: apiError.code,
        details: apiError.details,
        timestamp: new Date()
      };
    } else if (error?.message) {
      // JavaScript Error object
      errorInfo = {
        message: error.message,
        code: error.name,
        details: error.stack,
        timestamp: new Date()
      };
    } else if (typeof error === 'string') {
      // String error
      errorInfo = {
        message: error,
        timestamp: new Date()
      };
    } else {
      // Unknown error format
      errorInfo = {
        message: 'An unexpected error occurred',
        details: error,
        timestamp: new Date()
      };
    }

    setErrors(prev => [errorInfo, ...prev.slice(0, 9)]); // Keep last 10 errors
    return errorInfo;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const removeError = useCallback((timestamp: Date) => {
    setErrors(prev => prev.filter(error => error.timestamp !== timestamp));
  }, []);

  const getErrorMessage = useCallback((error: any): string => {
    if (error?.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred';
  }, []);

  const isNetworkError = useCallback((error: any): boolean => {
    return !error?.response && error?.request;
  }, []);

  const isAuthError = useCallback((error: any): boolean => {
    return error?.response?.status === 401 || error?.response?.data?.error?.code === 'UNAUTHORIZED';
  }, []);

  const isValidationError = useCallback((error: any): boolean => {
    return error?.response?.status === 400 && error?.response?.data?.error?.code === 'VALIDATION_ERROR';
  }, []);

  const isRateLimitError = useCallback((error: any): boolean => {
    return error?.response?.status === 429 || error?.response?.data?.error?.code === 'RATE_LIMIT_EXCEEDED';
  }, []);

  return {
    errors,
    handleError,
    clearErrors,
    removeError,
    getErrorMessage,
    isNetworkError,
    isAuthError,
    isValidationError,
    isRateLimitError
  };
};