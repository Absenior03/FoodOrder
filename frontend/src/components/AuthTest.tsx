import React, { useState } from 'react';

const AuthTest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  const API_BASE_URL = 'http://localhost:5001/api';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin 
        ? { email, password }
        : { email, password, firstName, lastName };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`${isLogin ? 'Login' : 'Registration'} successful!`);
        if (data.data?.tokens?.accessToken) {
          setToken(data.data.tokens.accessToken);
          localStorage.setItem('accessToken', data.data.tokens.accessToken);
        }
      } else {
        setMessage(`Error: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testProtectedRoute = async () => {
    setLoading(true);
    setMessage('');

    try {
      const storedToken = localStorage.getItem('accessToken') || token;
      if (!storedToken) {
        setMessage('No token found. Please login first.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`Profile data: ${JSON.stringify(data.data.user, null, 2)}`);
      } else {
        setMessage(`Error: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testHealthCheck = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      setMessage(`Health check: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setMessage(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Authentication Test
      </h2>

      {/* Health Check Button */}
      <div className="mb-4">
        <button
          onClick={testHealthCheck}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test API Health
        </button>
      </div>

      {/* Toggle between Login and Register */}
      <div className="mb-4">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
        >
          Switch to {isLogin ? 'Register' : 'Login'}
        </button>
      </div>

      {/* Auth Form */}
      <form onSubmit={handleAuth} className="space-y-4">
        {!isLogin && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required={!isLogin}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required={!isLogin}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
        </button>
      </form>

      {/* Test Protected Route */}
      <div className="mt-4">
        <button
          onClick={testProtectedRoute}
          disabled={loading}
          className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test Protected Route (Get Profile)
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap">{message}</pre>
        </div>
      )}

      {/* Token Display */}
      {token && (
        <div className="mt-4 p-3 bg-yellow-100 rounded-md">
          <p className="text-sm font-medium text-gray-700">Access Token:</p>
          <p className="text-xs text-gray-600 break-all">{token}</p>
        </div>
      )}
    </div>
  );
};

export default AuthTest;