'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useDepartments } from '@/hooks/useRedux';

export default function DepartmentsPage() {
  const { status } = useSession();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  
  // ✅ Redux - Simple!
  const { departments, loading: isLoading, error, fetchDepartments, deleteDepartment } = useDepartments();
  
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDepartments();
    }
  }, [status, fetchDepartments]);

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }

    try {
      setDeleteLoading(id);
      await deleteDepartment(id);  // ✅ Redux - auto-removes from store
      alert('Department deleted successfully!');
    } catch (err) {
      console.error('Error deleting department:', err);
      alert('Failed to delete department');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Show loading while checking authentication and permissions
  if (status === 'loading' || permissionsLoading) {
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
        <p>You don&apos;t have permission to view departments.</p>
      </div>
    );
  }

  const DepartmentCard = ({ department }) => (
    <div className="col-md-6 col-lg-4 mb-4">
      <div className="card card-custom h-100">
        <div className="card-header-custom">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <i className="fas fa-building me-2"></i>
              {department.name}
            </h5>
            <span className="badge bg-primary">{department.code}</span>
          </div>
        </div>
        <div className="card-body">
          <p className="card-text text-muted mb-4" style={{ minHeight: '60px' }}>
            {department.description || 'No description provided'}
          </p>
          
          <div className="d-flex gap-2">
            {hasPermission('department.update') && (
              <Link 
                href={`/admin/dashboard/employees/departments/${department.id}/edit`}
                className="btn btn-sm btn-outline-primary flex-fill"
              >
                <i className="fas fa-edit me-1"></i>
                Edit
              </Link>
            )}
            <Link 
              href={`/admin/dashboard/employees/departments/${department.id}`}
              className="btn btn-sm btn-outline-info flex-fill"
            >
              <i className="fas fa-eye me-1"></i>
              View
            </Link>
            {hasPermission('department.delete') && (
              <button
                onClick={() => handleDeleteDepartment(department.id)}
                className="btn btn-sm btn-outline-danger"
                disabled={deleteLoading === department.id}
              >
                {deleteLoading === department.id ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-trash"></i>
                )}
              </button>
            )}
          </div>
        </div>
        
        {department.is_active === 0 && (
          <div className="card-footer">
            <span className="badge bg-danger">Inactive</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-building text-primary-custom me-2"></i>
            Departments
          </h2>
          <p className="text-muted mb-0">Manage organizational departments</p>
        </div>
        <div className="d-flex gap-2">
          <Link 
            href="/admin/dashboard/employees" 
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to Employees
          </Link>
          {hasPermission('department.create') && (
            <Link 
              href="/admin/dashboard/employees/departments/add" 
              className="btn btn-primary-custom"
            >
              <i className="fas fa-plus me-2"></i>
              Add Department
            </Link>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => {}}></button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading departments...</p>
        </div>
      ) : departments.length > 0 ? (
        <>
          {/* Stats Cards */}
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card card-stats">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <p className="text-muted mb-1">Total Departments</p>
                      <h3 className="mb-0">{departments.length}</h3>
                    </div>
                    <div className="icon-shape bg-gradient-primary">
                      <i className="fas fa-building"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card card-stats">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <p className="text-muted mb-1">Active Departments</p>
                      <h3 className="mb-0">{departments.filter(d => d.is_active === 1).length}</h3>
                    </div>
                    <div className="icon-shape bg-gradient-success">
                      <i className="fas fa-check-circle"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card card-stats">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <p className="text-muted mb-1">With Description</p>
                      <h3 className="mb-0">{departments.filter(d => d.description).length}</h3>
                    </div>
                    <div className="icon-shape bg-gradient-info">
                      <i className="fas fa-file-alt"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Departments Grid */}
          <div className="row">
            {departments.map(department => (
              <DepartmentCard key={department.id} department={department} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-5">
          <i className="fas fa-building text-muted" style={{ fontSize: '4rem' }}></i>
          <h5 className="mt-3 text-muted">No departments found</h5>
          <p className="text-muted">Get started by adding your first department.</p>
          {hasPermission('department.create') && (
            <Link 
              href="/admin/dashboard/employees/departments/add" 
              className="btn btn-primary-custom mt-2"
            >
              <i className="fas fa-plus me-2"></i>
              Add Department
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
