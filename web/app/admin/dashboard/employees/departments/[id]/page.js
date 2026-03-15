'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { API_ENDPOINTS, apiService } from '@/services/api';

export default function ViewDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  const [department, setDepartment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDepartment = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.get(API_ENDPOINTS.DEPARTMENTS.GET_BY_ID(params.id));
      setDepartment(response.data);
    } catch (err) {
      console.error('Error fetching department:', err);
      setError('Failed to fetch department details');
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken && params.id) {
      fetchDepartment();
    }
  }, [status, session?.user?.id, session?.accessToken, params.id, fetchDepartment]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(true);
      await apiService.delete(API_ENDPOINTS.DEPARTMENTS.DELETE(params.id));
      alert('Department deleted successfully!');
      router.push('/admin/dashboard/employees/departments');
    } catch (err) {
      console.error('Error deleting department:', err);
      alert('Failed to delete department');
      setDeleteLoading(false);
    }
  };

  // Show loading while checking authentication
  if (status === 'loading' || isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    window.location.href = '/login';
    return null;
  }

  // Check permissions
  if (!hasPermission('department.read')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to view department details.</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error</h4>
          <p>{error}</p>
          <Link href="/admin/dashboard/employees/departments" className="btn btn-primary mt-2">
            Back to Departments
          </Link>
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="container-fluid">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Not Found</h4>
          <p>Department not found.</p>
          <Link href="/admin/dashboard/employees/departments" className="btn btn-primary mt-2">
            Back to Departments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-building text-primary-custom me-2"></i>
            Department Details
          </h2>
          <p className="text-muted mb-0">View department information</p>
        </div>
        <div className="d-flex gap-2">
          <Link 
            href="/admin/dashboard/employees/departments" 
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to Departments
          </Link>
          {hasPermission('department.update') && (
            <Link 
              href={`/admin/dashboard/employees/departments/${params.id}/edit`}
              className="btn btn-primary-custom"
            >
              <i className="fas fa-edit me-2"></i>
              Edit Department
            </Link>
          )}
          {hasPermission('department.delete') && (
            <button
              onClick={handleDelete}
              className="btn btn-danger"
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  Deleting...
                </>
              ) : (
                <>
                  <i className="fas fa-trash me-2"></i>
                  Delete
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="row">
        {/* Main Info */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Department Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-12 mb-4">
                  <label className="text-muted mb-1">Department Name</label>
                  <h5 className="mb-0">{department.name}</h5>
                </div>
                
                <div className="col-md-12 mb-4">
                  <label className="text-muted mb-1">Department Code</label>
                  <h5 className="mb-0">
                    <span className="badge bg-primary">{department.code}</span>
                  </h5>
                </div>
                
                <div className="col-md-12">
                  <label className="text-muted mb-1">Description</label>
                  <p className="mb-0">{department.description || 'No description provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-chart-bar me-2"></i>
                Department Statistics
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <div className="icon-shape bg-gradient-primary me-3">
                      <i className="fas fa-users"></i>
                    </div>
                    <div>
                      <p className="text-muted mb-0">Total Employees</p>
                      <h4 className="mb-0">{department.employee_count || 0}</h4>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <div className="icon-shape bg-gradient-success me-3">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <div>
                      <p className="text-muted mb-0">Status</p>
                      <h4 className="mb-0">
                        {department.is_active === 1 ? (
                          <span className="badge bg-success">Active</span>
                        ) : (
                          <span className="badge bg-danger">Inactive</span>
                        )}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-secondary text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-clock me-2"></i>
                Timestamps
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="text-muted mb-1">Created At</label>
                <p className="mb-0">
                  {new Date(department.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div className="mb-0">
                <label className="text-muted mb-1">Last Updated</label>
                <p className="mb-0">
                  {new Date(department.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-warning text-dark">
              <h5 className="card-title mb-0">
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                {hasPermission('department.update') && (
                  <Link
                    href={`/admin/dashboard/employees/departments/${params.id}/edit`}
                    className="btn btn-outline-primary"
                  >
                    <i className="fas fa-edit me-2"></i>
                    Edit Department
                  </Link>
                )}
                
                <Link
                  href={`/admin/dashboard/employees?department=${department.id}`}
                  className="btn btn-outline-info"
                >
                  <i className="fas fa-users me-2"></i>
                  View Employees ({department.employee_count || 0})
                </Link>
                
                {hasPermission('department.delete') && (
                  <button
                    onClick={handleDelete}
                    className="btn btn-outline-danger"
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-trash me-2"></i>
                        Delete Department
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
