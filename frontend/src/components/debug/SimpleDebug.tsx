import React from 'react';
import { useAuth } from '../../context/AuthContext';

const SimpleDebug: React.FC = () => {
  const { state } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50 max-w-xs">
      <div>Auth: {state.isAuthenticated ? '✅' : '❌'}</div>
      <div>Loading: {state.isLoading ? '⏳' : '✅'}</div>
      <div>Error: {state.error ? '❌' : '✅'}</div>
      {state.error && <div className="text-red-300">Error: {state.error}</div>}
    </div>
  );
};

export default SimpleDebug;