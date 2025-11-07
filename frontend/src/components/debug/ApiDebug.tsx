import React, { useState } from 'react';
import axios from 'axios';

const ApiDebug: React.FC = () => {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  const testEndpoint = async (name: string, url: string) => {
    setLoading(true);
    try {
      const response = await axios.get(url);
      setResults((prev: any) => ({
        ...prev,
        [name]: {
          status: 'success',
          statusCode: response.status,
          data: response.data,
        },
      }));
    } catch (error: any) {
      setResults((prev: any) => ({
        ...prev,
        [name]: {
          status: 'error',
          statusCode: error.response?.status,
          message: error.message,
          data: error.response?.data,
        },
      }));
    }
    setLoading(false);
  };

  const tests = [
    { name: 'Health Check', url: `${API_URL}/api/health` },
    { name: 'Inventory Items', url: `${API_URL}/api/inventory/items` },
    { name: 'Categories', url: `${API_URL}/api/inventory/categories` },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">API Debug Tool</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-6">
        <p className="font-mono text-sm">
          <strong>API Base URL:</strong> {API_URL}
        </p>
      </div>

      <div className="space-y-4">
        {tests.map((test) => (
          <div key={test.name} className="border rounded p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">{test.name}</h3>
              <button
                onClick={() => testEndpoint(test.name, test.url)}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Test
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-2 font-mono">{test.url}</p>
            
            {results[test.name] && (
              <div className={`mt-2 p-3 rounded ${
                results[test.name].status === 'success' 
                  ? 'bg-green-100 border border-green-300' 
                  : 'bg-red-100 border border-red-300'
              }`}>
                <p className="font-semibold mb-1">
                  Status: {results[test.name].status === 'success' ? '✅ Success' : '❌ Error'}
                  {results[test.name].statusCode && ` (${results[test.name].statusCode})`}
                </p>
                {results[test.name].message && (
                  <p className="text-sm mb-2">Message: {results[test.name].message}</p>
                )}
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-semibold">View Response</summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-64 bg-white p-2 rounded">
                    {JSON.stringify(results[test.name].data, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button
          onClick={() => {
            tests.forEach((test) => testEndpoint(test.name, test.url));
          }}
          disabled={loading}
          className="w-full bg-green-500 text-white px-4 py-3 rounded hover:bg-green-600 disabled:bg-gray-400 font-semibold"
        >
          Test All Endpoints
        </button>
      </div>
    </div>
  );
};

export default ApiDebug;
