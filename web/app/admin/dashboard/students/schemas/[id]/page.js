'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudents } from '@/hooks/useRedux';

export default function ViewStudentSchemaPage() {
  const params = useParams();
  const { status } = useSession();
  const { hasPermission } = usePermissions();
  
  // ✅ Redux
  const { schemas, loading, fetchStudentSchemas } = useStudents();
  
  useEffect(() => {
    if (status === 'authenticated') {
      fetchStudentSchemas();
    }
  }, [status, fetchStudentSchemas]);

  const schema = useMemo(() => {
    if (!params.id) return null;
    return schemas.find((s) => s.id === parseInt(params.id, 10)) || null;
  }, [schemas, params.id]);

  const fields = useMemo(() => {
    if (!schema?.fields) return [];
    try {
      const parsedFields = typeof schema.fields === 'string'
        ? JSON.parse(schema.fields)
        : schema.fields;
      return Array.isArray(parsedFields) ? parsedFields : [];
    } catch (_) {
      return [];
    }
  }, [schema]);

  if (status === 'loading' || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!hasPermission('student_schema.read')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to view student schemas.</p>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="alert alert-warning" role="alert">
        <h4 className="alert-heading">Schema Not Found</h4>
        <p>The requested student schema could not be found.</p>
        <Link href="/admin/dashboard/students/schemas" className="btn btn-primary">
          Back to Schemas
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Student Schema Details</h2>
          <p className="text-muted">View student schema information</p>
        </div>
        <div className="d-flex gap-2">
          <Link
            href="/admin/dashboard/students/schemas"
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to List
          </Link>
          {hasPermission('student_schema.update') && (
            <Link
              href={`/admin/dashboard/students/schemas/${schema.id}/edit`}
              className="btn btn-primary"
            >
              <i className="fas fa-edit me-2"></i>
              Edit Schema
            </Link>
          )}
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Basic Information</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Schema Name:</strong>
                </div>
                <div className="col-md-8">
                  {schema.schema_name}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Display Name:</strong>
                </div>
                <div className="col-md-8">
                  {schema.display_name}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Description:</strong>
                </div>
                <div className="col-md-8">
                  {schema.description || 'No description'}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Status:</strong>
                </div>
                <div className="col-md-8">
                  <span className={`badge ${schema.is_active ? 'bg-success' : 'bg-secondary'}`}>
                    {schema.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Created:</strong>
                </div>
                <div className="col-md-8">
                  {new Date(schema.created_at).toLocaleString()}
                </div>
              </div>
              {schema.updated_at && (
                <div className="row">
                  <div className="col-md-4">
                    <strong>Last Updated:</strong>
                  </div>
                  <div className="col-md-8">
                    {new Date(schema.updated_at).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Schema Fields ({fields.length})</h5>
              {hasPermission('student_schema.update') && (
                <Link
                  href={`/admin/dashboard/students/schemas/${schema.id}/fields`}
                  className="btn btn-sm btn-primary"
                >
                  <i className="fas fa-plus me-1"></i>
                  Manage Fields
                </Link>
              )}
            </div>
            <div className="card-body">
              {fields.length === 0 ? (
                <p className="text-muted mb-0">No fields defined for this schema.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Field Name</th>
                        <th>Label</th>
                        <th>Type</th>
                        <th>Required</th>
                        <th>Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, index) => (
                        <tr key={index}>
                          <td><code>{field.field_name || field.name}</code></td>
                          <td>{field.field_label || field.label}</td>
                          <td>
                            <span className="badge bg-info">
                              {field.field_type || field.type}
                            </span>
                          </td>
                          <td>
                            {field.is_required ? (
                              <i className="fas fa-check text-success"></i>
                            ) : (
                              <i className="fas fa-times text-muted"></i>
                            )}
                          </td>
                          <td>{field.display_order || index + 1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                {hasPermission('student_schema.update') && (
                  <>
                    <Link
                      href={`/admin/dashboard/students/schemas/${schema.id}/edit`}
                      className="btn btn-outline-primary"
                    >
                      <i className="fas fa-edit me-2"></i>
                      Edit Schema
                    </Link>
                    <Link
                      href={`/admin/dashboard/students/schemas/${schema.id}/fields`}
                      className="btn btn-outline-success"
                    >
                      <i className="fas fa-list-ul me-2"></i>
                      Manage Fields
                    </Link>
                  </>
                )}
                <Link
                  href="/admin/dashboard/students/schemas"
                  className="btn btn-outline-secondary"
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Back to List
                </Link>
              </div>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h5 className="mb-0">Statistics</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <small className="text-muted">Total Fields</small>
                <h4 className="mb-0">{fields.length}</h4>
              </div>
              <div className="mb-3">
                <small className="text-muted">Required Fields</small>
                <h4 className="mb-0">
                  {fields.filter(f => f.is_required).length}
                </h4>
              </div>
              <div>
                <small className="text-muted">Status</small>
                <h4 className="mb-0">
                  <span className={`badge ${schema.is_active ? 'bg-success' : 'bg-secondary'}`}>
                    {schema.is_active ? 'Active' : 'Inactive'}
                  </span>
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
