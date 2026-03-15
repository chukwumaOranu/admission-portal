'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { API_ENDPOINTS, apiService } from '@/services/api';

export default function EmployeeSchemasPage() {
  const { data: session, status } = useSession();
  
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSchemas = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.get(API_ENDPOINTS.EMPLOYEES.SCHEMAS.GET_ALL);
      setSchemas(response.data.schemas || []);
    } catch (err) {
      setError('Failed to fetch employee schemas');
      console.error('Error fetching schemas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      fetchSchemas();
    }
  }, [status, session?.user?.id, session?.accessToken]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Authentication Required</h4>
        <p>You need to be logged in to access this page.</p>
        <hr />
        <p className="mb-0">
          <Link href="/login" className="btn btn-primary">Go to Login</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-database text-primary-custom me-2"></i>
            Employee Schemas
          </h2>
          <p className="text-muted mb-0">Manage employee data schemas</p>
        </div>
        <Link href="/admin/dashboard/employees/schemas/add" className="btn btn-primary-custom">
          <i className="fas fa-plus me-2"></i>
          Add Schema
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Stats Card */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="stats-card">
            <div className="d-flex justify-content-between">
              <div>
                <p className="stats-label">Total Schemas</p>
                <h3 className="stats-number">{schemas.length}</h3>
              </div>
              <i className="fas fa-database text-primary fs-1 opacity-75"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Schemas List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading schemas...</p>
        </div>
      ) : (
        <div className="row">
          {schemas.map((schema) => (
            <div key={schema.id} className="col-md-6 col-lg-4 mb-3">
              <div className="card card-custom h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="card-title mb-0">{schema.display_name || schema.schema_name}</h6>
                    <span className={`badge ${schema.is_active ? 'bg-success' : 'bg-danger'}`}>
                      {schema.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-tag text-info me-2"></i>
                      <span>{schema.schema_name}</span>
                    </div>
                    {schema.description && (
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-info-circle text-primary me-2"></i>
                        <span>{schema.description}</span>
                      </div>
                    )}
                    <div className="d-flex align-items-center">
                      <i className="fas fa-calendar text-warning me-2"></i>
                      <span>Created: {new Date(schema.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="d-flex gap-2">
                    <Link 
                      href={`/admin/dashboard/employees/schemas/edit/${schema.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      <i className="fas fa-edit me-1"></i> Edit
                    </Link>
                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this schema?')) {
                          console.log('Delete schema:', schema.id);
                        }
                      }}
                    >
                      <i className="fas fa-trash me-1"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && schemas.length === 0 && (
        <div className="text-center py-5">
          <i className="fas fa-database text-muted fs-1 mb-3"></i>
          <h5 className="text-muted">No schemas found</h5>
          <p className="text-muted">Create your first employee schema to get started.</p>
          <Link href="/admin/dashboard/employees/schemas/add" className="btn btn-primary-custom">
            <i className="fas fa-plus me-2"></i>
            Add Schema
          </Link>
        </div>
      )}
    </div>
  );
}