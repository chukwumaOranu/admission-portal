'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import apiService from '@/services/api';

export default function TestAuth() {
  const { data: session, status } = useSession();
  const [apiTest, setApiTest] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/users/profile');
      setApiTest({
        success: true,
        data: response.data
      });
    } catch (error) {
      setApiTest({
        success: false,
        error: error.response?.data || error.message
      });
    }
    setLoading(false);
  };

  if (status === 'loading') {
    return <div className="p-4">Loading session...</div>;
  }

  if (status === 'unauthenticated') {
    return <div className="p-4">Please log in to test authentication.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">NextAuth.js Session:</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <div className="mb-4">
        <button
          onClick={testAPI}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test API Call'}
        </button>
      </div>

      {apiTest && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">API Test Result:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(apiTest, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}