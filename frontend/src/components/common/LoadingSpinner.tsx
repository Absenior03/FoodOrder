import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'green' | 'red' | 'gray' | 'white';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  text,
  fullScreen = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
    gray: 'border-gray-600',
    white: 'border-white'
  };

  const spinner = (
    <div className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${sizeClasses[size]} ${colorClasses[color]}`} role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          <div className={`inline-block animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent w-12 h-12 mb-4`} role="status">
            <span className="sr-only">Loading...</span>
          </div>
          {text && (
            <p className="text-gray-600 text-lg">{text}</p>
          )}
        </div>
      </div>
    );
  }

  if (text) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {spinner}
        <span className="text-gray-600">{text}</span>
      </div>
    );
  }

  return <div className={className}>{spinner}</div>;
};

export default LoadingSpinner;