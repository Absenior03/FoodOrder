import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { tokenStorage, userStorage, clearAuthStorage } from '../../utils/auth';

const AuthDebug: React.FC = () => {
  const { state } = useAuth();

  const handleClearAuth = () => {
    clearAuthStorage();
    window.location.reload();
  };

  const token = tokenStorage.get();
  const user = userStorage.get();

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2">Auth Debug</h3>
      <div className="text-xs space-y-1">
        <div>
          <strong>Auth State:</strong> {state.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
        </div>
        <div>
          <strong>Loading:</strong> {state.isLoading ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Error:</strong> {state.error || 'None'}
        </div>
        <div>
          <strong>Token Exists:</strong> {token ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>User Exists:</strong> {user ? 'Yes' : 'No'}
        </div>
        {token && (
          <div>
            <strong>Token Preview:</strong> {token.substring(0, 20)}...
          </div>
        )}
      </div>
      <button
        onClick={handleClearAuth}
        className="mt-3 w-full bg-red-600 text-white text-xs py-2 px-3 rounded hover:bg-red-700"
      >
        Clear Auth & Reload
      </button>
    </div>
  );
};

export default AuthDebug;