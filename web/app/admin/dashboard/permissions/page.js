'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissionsData } from '@/hooks/useRedux';

export default function PermissionsPage() {
  const { status } = useSession();
  
  // ✅ Redux - Simple!
  const { permissions, loading, error, fetchPermissions } = usePermissionsData();

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPermissions();
    }
  }, [status, fetchPermissions]);

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
            <i className="fas fa-key text-primary-custom me-2"></i>
            Permissions
          </h2>
          <p className="text-muted mb-0">Manage system permissions</p>
        </div>
        <Link href="/admin/dashboard/permissions/add" className="btn btn-primary-custom">
          <i className="fas fa-plus me-2"></i>
          Add Permission
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
                <p className="stats-label">Total Permissions</p>
                <h3 className="stats-number">{permissions.length}</h3>
              </div>
              <i className="fas fa-key text-primary fs-1 opacity-75"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading permissions...</p>
        </div>
      ) : (
        <div className="row">
          {permissions.map((permission) => (
            <div key={permission.id} className="col-md-6 col-lg-4 mb-3">
              <div className="card card-custom h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="card-title mb-0">{permission.name}</h6>
                    <span className="badge bg-success">Active</span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-folder text-info me-2"></i>
                      <span>{permission.resource || 'N/A'}</span>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-cog text-warning me-2"></i>
                      <span>{permission.action || 'N/A'}</span>
                    </div>
                    {permission.description && (
                      <p className="small text-muted mb-0">{permission.description}</p>
                    )}
                  </div>
                  
                  <div className="small text-muted mb-3">
                    <i className="fas fa-calendar me-1"></i>
                    Created: {new Date(permission.created_at).toLocaleDateString()}
                  </div>
                  
                  <div className="d-flex gap-2">
                    <Link 
                      href={`/admin/dashboard/permissions/edit/${permission.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      <i className="fas fa-edit me-1"></i> Edit
                    </Link>
                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this permission?')) {
                          console.log('Delete permission:', permission.id);
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
      {!loading && permissions.length === 0 && (
        <div className="text-center py-5">
          <i className="fas fa-key text-muted fs-1 mb-3"></i>
          <h5 className="text-muted">No permissions found</h5>
          <p className="text-muted">Create your first permission to get started.</p>
          <Link href="/admin/dashboard/permissions/add" className="btn btn-primary-custom">
            <i className="fas fa-plus me-2"></i>
            Add Permission
          </Link>
        </div>
      )}
    </div>
  );
}
