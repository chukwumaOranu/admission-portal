'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { API_ENDPOINTS, apiService } from '@/services/api';

export default function TestAPIPage() {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testAPI = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Testing API with NextAuth.js token...');
      console.log('Session:', session);
      
      const response = await apiService.get(API_ENDPOINTS.PERMISSIONS.GET_ALL);
      console.log('API Response:', response);
      
      setPermissions(response.data.data.permissions || []);
    } catch (err) {
      setError('Failed to fetch permissions: ' + err.message);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      testAPI();
    }
  }, [status, session, testAPI]);

  if (status === 'loading') {
    return <div>Loading authentication...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>Please log in to test API</div>;
  }

  return (
    <div className="container mt-4">
      <h2>API Test Page</h2>
      
      <div className="mb-3">
        <button 
          className="btn btn-primary" 
          onClick={testAPI}
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test API Call'}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="mb-3">
        <h4>Session Info:</h4>
        <pre>{JSON.stringify(session, null, 2)}</pre>
      </div>

      <div>
        <h4>Permissions ({permissions.length}):</h4>
        <ul>
          {permissions.slice(0, 5).map(permission => (
            <li key={permission.id}>
              {permission.name} - {permission.description}
            </li>
          ))}
        </ul>
        {permissions.length > 5 && <p>... and {permissions.length - 5} more</p>}
      </div>
    </div>
  );
}
