'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudents } from '@/hooks/useRedux';

export default function StudentSchemasPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  // ✅ Redux - Simple! schemas are now part of useStudents hook
  const { schemas: studentSchemas, loading, error, fetchStudentSchemas } = useStudents();
  
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      fetchStudentSchemas();
    }
  }, [status, session?.user?.id, session?.accessToken, fetchStudentSchemas]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

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

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  // Check permissions
  if (!hasPermission('student_schema.read')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to view student schemas.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-th-list text-primary-custom me-2"></i>
            Student Schemas
          </h2>
          <p className="text-muted mb-0">Manage student profile templates</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/dashboard/students" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            Back to Students
          </Link>
          {hasPermission('student_schema.create') && (
            <Link href="/admin/dashboard/students/schemas/add" className="btn btn-primary-custom">
              <i className="fas fa-plus me-2"></i>
              Add Schema
            </Link>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {(error || localError) && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error || localError}
          <button type="button" className="btn-close" onClick={() => setLocalError('')}></button>
        </div>
      )}

      {/* Info Alert */}
      <div className="alert alert-info mb-4">
        <i className="fas fa-info-circle me-2"></i>
        <strong>What are Student Schemas?</strong>
        <p className="mb-0 mt-2">
          Student schemas define different types of students (e.g., Undergraduate, Postgraduate, Certificate). 
          Each schema can have custom fields specific to that student type.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card card-stats">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Total Schemas</p>
                  <h3 className="mb-0">{studentSchemas.length}</h3>
                </div>
                <div className="icon-shape bg-gradient-primary">
                  <i className="fas fa-th-list"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-stats">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Active</p>
                  <h3 className="mb-0">{studentSchemas.filter(s => s.is_active).length}</h3>
                </div>
                <div className="icon-shape bg-gradient-success">
                  <i className="fas fa-check-circle"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-stats">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Inactive</p>
                  <h3 className="mb-0">{studentSchemas.filter(s => !s.is_active).length}</h3>
                </div>
                <div className="icon-shape bg-gradient-secondary">
                  <i className="fas fa-pause-circle"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-stats">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Default</p>
                  <h3 className="mb-0">3</h3>
                </div>
                <div className="icon-shape bg-gradient-info">
                  <i className="fas fa-star"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schemas Grid */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <i className="fas fa-list me-2"></i>
              Available Schemas
            </h5>
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={() => fetchStudentSchemas()}
              disabled={loading}
            >
              <i className="fas fa-sync me-2"></i>
              Refresh
            </button>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading schemas...</p>
            </div>
          ) : studentSchemas.length > 0 ? (
            <div className="row">
              {studentSchemas.map((schema) => (
                <div key={schema.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100 border shadow-sm hover-shadow">
                    <div className="card-header bg-gradient-primary text-white">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="card-title mb-0">
                          <i className="fas fa-graduation-cap me-2"></i>
                          {schema.display_name || schema.schema_name}
                        </h5>
                        {schema.is_active ? (
                          <span className="badge bg-success">
                            <i className="fas fa-check-circle me-1"></i>
                            Active
                          </span>
                        ) : (
                          <span className="badge bg-secondary">
                            <i className="fas fa-pause-circle me-1"></i>
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="card-body">
                      <p className="text-muted mb-3">
                        {schema.description || 'No description available'}
                      </p>
                      
                      <div className="mb-3">
                        <small className="text-muted d-block mb-1">
                          <i className="fas fa-tag me-1"></i>
                          <strong>Schema Name:</strong>
                        </small>
                        <span className="badge bg-light text-dark">{schema.schema_name}</span>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted d-block mb-1">
                          <i className="fas fa-user me-1"></i>
                          <strong>Created By:</strong>
                        </small>
                        <span>{schema.created_by_username || 'System'}</span>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted d-block mb-1">
                          <i className="fas fa-calendar me-1"></i>
                          <strong>Created:</strong>
                        </small>
                        <span>{new Date(schema.created_at).toLocaleDateString()}</span>
                      </div>

                      {schema.updated_at && (
                        <div className="mb-3">
                          <small className="text-muted d-block mb-1">
                            <i className="fas fa-clock me-1"></i>
                            <strong>Last Updated:</strong>
                          </small>
                          <span>{new Date(schema.updated_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="card-footer bg-white border-top">
                      <div className="d-flex gap-2 justify-content-end">
                        <Link
                          href={`/admin/dashboard/students/schemas/${schema.id}`}
                          className="btn btn-sm btn-outline-info"
                          title="View Details"
                        >
                          <i className="fas fa-eye me-1"></i>
                          View
                        </Link>
                        
                        {hasPermission('student_schema.update') && (
                          <Link
                            href={`/admin/dashboard/students/schemas/${schema.id}/edit`}
                            className="btn btn-sm btn-outline-primary"
                            title="Edit Schema"
                          >
                            <i className="fas fa-edit me-1"></i>
                            Edit
                          </Link>
                        )}

                        {hasPermission('student_schema.update') && (
                          <Link
                            href={`/admin/dashboard/students/schemas/${schema.id}/fields`}
                            className="btn btn-sm btn-outline-success"
                            title="Manage Fields"
                          >
                            <i className="fas fa-list-ul me-1"></i>
                            Fields
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-th-list text-muted" style={{ fontSize: '4rem' }}></i>
              <h5 className="mt-3 text-muted">No schemas found</h5>
              <p className="text-muted">Get started by adding your first student schema.</p>
              {hasPermission('student_schema.create') && (
                <Link 
                  href="/admin/dashboard/students/schemas/add" 
                  className="btn btn-primary-custom mt-2"
                >
                  <i className="fas fa-plus me-2"></i>
                  Add Schema
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-header bg-info text-white">
          <h5 className="card-title mb-0">
            <i className="fas fa-question-circle me-2"></i>
            How Student Schemas Work
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <div className="d-flex align-items-start mb-3">
                <div className="flex-shrink-0">
                  <div className="icon-shape bg-gradient-primary text-white">
                    <i className="fas fa-user-graduate"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6>Student Types</h6>
                  <p className="text-muted mb-0">
                    Define different categories of students (Undergraduate, Postgraduate, Certificate, etc.)
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-start mb-3">
                <div className="flex-shrink-0">
                  <div className="icon-shape bg-gradient-success text-white">
                    <i className="fas fa-list-ul"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6>Custom Fields</h6>
                  <p className="text-muted mb-0">
                    Add specific fields for each schema type (e.g., previous degree for postgraduate students)
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-start mb-3">
                <div className="flex-shrink-0">
                  <div className="icon-shape bg-gradient-warning text-white">
                    <i className="fas fa-cog"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6>Flexible Forms</h6>
                  <p className="text-muted mb-0">
                    Student forms automatically adapt based on the selected schema
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
