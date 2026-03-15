'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRoles } from '@/hooks/useRedux';

export default function RolesPage() {
  const { status } = useSession();
  
  // ✅ Redux - Simple!
  const { roles, loading, error, fetchRoles, deleteRole } = useRoles();

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRoles();
    }
  }, [status, fetchRoles]);

  const handleDelete = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) {
      return;
    }
    
    try {
      await deleteRole(roleId);
      alert('Role deleted successfully!');
    } catch (err) {
      console.error('Error deleting role:', err);
      alert('Failed to delete role');
    }
  };

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
            <i className="fas fa-user-shield text-primary-custom me-2"></i>
            Roles
          </h2>
          <p className="text-muted mb-0">Manage user roles and permissions</p>
        </div>
        <Link href="/admin/dashboard/roles/add" className="btn btn-primary-custom">
          <i className="fas fa-plus me-2"></i>
          Add Role
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
                <p className="stats-label">Total Roles</p>
                <h3 className="stats-number">{roles?.length || 0}</h3>
              </div>
              <i className="fas fa-user-shield text-primary fs-1 opacity-75"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Roles List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading roles...</p>
        </div>
      ) : (
        <div className="row">
          {roles?.map((role) => (
            <div key={role.id} className="col-md-6 col-lg-4 mb-3">
              <div className="card card-custom h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="card-title mb-0">{role.name}</h6>
                    <span className="badge bg-success">Active</span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-info-circle text-info me-2"></i>
                      <span className="small">{role.description || 'No description'}</span>
                    </div>
                  </div>
                  
                  <div className="small text-muted mb-3">
                    <i className="fas fa-calendar me-1"></i>
                    Created: {new Date(role.created_at).toLocaleDateString()}
                  </div>
                  
                  <div className="d-flex gap-2">
                    <Link 
                      href={`/admin/dashboard/roles/edit/${role.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      <i className="fas fa-edit me-1"></i> Edit
                    </Link>
                    <Link 
                      href={`/admin/dashboard/roles/permissions/${role.id}`}
                      className="btn btn-outline-info btn-sm"
                    >
                      <i className="fas fa-key me-1"></i> Permissions
                    </Link>
                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDelete(role.id)}
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
      {!loading && Array.isArray(roles) && roles.length === 0 && (
        <div className="text-center py-5">
          <i className="fas fa-user-shield text-muted fs-1 mb-3"></i>
          <h5 className="text-muted">No roles found</h5>
          <p className="text-muted">Create your first role to get started.</p>
          <Link href="/admin/dashboard/roles/add" className="btn btn-primary-custom">
            <i className="fas fa-plus me-2"></i>
            Add Role
          </Link>
        </div>
      )}
    </div>
  );
}
