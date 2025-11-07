import React from 'react';
import AuthTest from '../AuthTest';

const TestPage: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Development Tests
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        This page contains development and testing components
      </p>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Authentication Test</h2>
        <AuthTest />
      </div>
    </div>
  </div>
);

export default TestPage;