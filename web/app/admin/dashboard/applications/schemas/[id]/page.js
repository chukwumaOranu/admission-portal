'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';

export default function ViewApplicationSchemaPage() {
  const params = useParams();
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  // Redux state
  const { schemas, loading: reduxLoading, fetchApplicationSchemas } = useApplications();
  
  const [schema, setSchema] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSchemaFields = useCallback(async () => {
    try {
      const fieldsResponse = await apiService.get(API_ENDPOINTS.APPLICATIONS.SCHEMAS.FIELDS.GET_ALL(params.id));
      const fieldsData = Array.isArray(fieldsResponse.data) ? fieldsResponse.data : (fieldsResponse.data?.data || []);
      setFields(fieldsData.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
      setLoading(false);
    } catch (err) {
      console.error('❌ Error fetching fields:', err);
      setLoading(false);
    }
  }, [params.id]);

  const fetchSchemaDetails = useCallback(async () => {
    try {
      setLoading(true);
      
      const schemaResponse = await apiService.get(API_ENDPOINTS.APPLICATIONS.SCHEMAS.GET_BY_ID(params.id));
      const schemaData = schemaResponse.data?.schema || schemaResponse.data?.data?.schema || schemaResponse.data;
      setSchema(schemaData);
      
      await fetchSchemaFields();
    } catch (err) {
      console.error('❌ Error fetching schema:', err);
      setError('Failed to load schema details');
    } finally {
      setLoading(false);
    }
  }, [params.id, fetchSchemaFields]);

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      // Fetch schemas from Redux if not already loaded
      if (schemas.length === 0) {
        fetchApplicationSchemas();
      }
    }
  }, [status, session?.user?.id, session?.accessToken, schemas.length, fetchApplicationSchemas]);

  useEffect(() => {
    // Find schema from Redux store
    if (params.id && schemas.length > 0) {
      const foundSchema = schemas.find(s => s.id === parseInt(params.id));
      if (foundSchema) {
        setSchema(foundSchema);
        fetchSchemaFields();
      }
    } else if (params.id && !reduxLoading) {
      // If schema not in Redux, fetch directly
      fetchSchemaDetails();
    }
  }, [params.id, schemas, reduxLoading, fetchSchemaDetails, fetchSchemaFields]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !schema) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          {error || 'Schema not found'}
        </div>
        <Link href="/admin/dashboard/applications/schemas" className="btn btn-primary">
          Back to Schemas
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-eye text-primary me-2"></i>
            Application Schema Details
          </h2>
          <p className="text-muted mb-0">{schema.display_name || schema.schema_name}</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/dashboard/applications/schemas" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            Back to Schemas
          </Link>
          <Link href={`/admin/dashboard/applications/schemas/${params.id}/fields`} className="btn btn-success">
            <i className="fas fa-list-ul me-2"></i>
            Manage Fields
          </Link>
          {hasPermission('application_schema.update') && (
            <Link href={`/admin/dashboard/applications/schemas/${params.id}/edit`} className="btn btn-primary">
              <i className="fas fa-edit me-2"></i>
              Edit Schema
            </Link>
          )}
        </div>
      </div>

      <div className="row">
        {/* Schema Information */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Schema Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="text-muted small d-block mb-1">Schema Name (ID)</label>
                  <p className="mb-0"><code>{schema.schema_name}</code></p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted small d-block mb-1">Display Name</label>
                  <p className="mb-0"><strong>{schema.display_name}</strong></p>
                </div>
                <div className="col-12 mb-3">
                  <label className="text-muted small d-block mb-1">Description</label>
                  <p className="mb-0">{schema.description || 'No description'}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted small d-block mb-1">Application Fee</label>
                  <p className="mb-0">
                    <strong className="text-success fs-5">₦{parseFloat(schema.application_fee).toLocaleString()}</strong>
                  </p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted small d-block mb-1">Status</label>
                  <p className="mb-0">
                    <span className={`badge bg-${schema.is_active ? 'success' : 'secondary'}`}>
                      {schema.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-success text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">
                  <i className="fas fa-list-ul me-2"></i>
                  Form Fields ({fields.length})
                </h5>
                <Link 
                  href={`/admin/dashboard/applications/schemas/${params.id}/fields`}
                  className="btn btn-sm btn-light"
                >
                  <i className="fas fa-cog me-2"></i>
                  Manage Fields
                </Link>
              </div>
            </div>
            <div className="card-body">
              {fields.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-inbox text-muted" style={{ fontSize: '3rem' }}></i>
                  <h6 className="mt-3 text-muted">No fields added yet</h6>
                  <Link 
                    href={`/admin/dashboard/applications/schemas/${params.id}/fields`}
                    className="btn btn-sm btn-primary mt-2"
                  >
                    Add First Field
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Field Name</th>
                        <th>Label</th>
                        <th>Type</th>
                        <th>Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, index) => (
                        <tr key={field.id}>
                          <td>{index + 1}</td>
                          <td><code className="small">{field.field_name}</code></td>
                          <td>{field.field_label}</td>
                          <td>
                            <span className="badge bg-info">{field.field_type}</span>
                          </td>
                          <td>
                            {field.is_required ? (
                              <span className="badge bg-danger">Required</span>
                            ) : (
                              <span className="badge bg-secondary">Optional</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Quick Actions */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-light">
              <h6 className="card-title mb-0">
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h6>
            </div>
            <div className="card-body p-2">
              <Link 
                href={`/admin/dashboard/applications/schemas/${params.id}/fields`}
                className="btn btn-success btn-sm w-100 mb-2"
              >
                <i className="fas fa-list-ul me-2"></i>
                Manage Fields
              </Link>
              {hasPermission('application_schema.update') && (
                <Link 
                  href={`/admin/dashboard/applications/schemas/${params.id}/edit`}
                  className="btn btn-primary btn-sm w-100 mb-2"
                >
                  <i className="fas fa-edit me-2"></i>
                  Edit Schema
                </Link>
              )}
              <Link 
                href="/admin/dashboard/applications/schemas"
                className="btn btn-outline-secondary btn-sm w-100"
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back to List
              </Link>
            </div>
          </div>

          {/* Schema Stats */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light">
              <h6 className="card-title mb-0">
                <i className="fas fa-chart-bar me-2"></i>
                Statistics
              </h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="text-muted small d-block mb-1">Total Fields</label>
                <p className="mb-0"><strong className="fs-4">{fields.length}</strong></p>
              </div>
              <div className="mb-3">
                <label className="text-muted small d-block mb-1">Required Fields</label>
                <p className="mb-0"><strong className="fs-4">{fields.filter(f => f.is_required).length}</strong></p>
              </div>
              <div className="mb-3">
                <label className="text-muted small d-block mb-1">Created By</label>
                <p className="mb-0">{schema.created_by_username || 'System'}</p>
              </div>
              <div className="mb-0">
                <label className="text-muted small d-block mb-1">Created On</label>
                <p className="mb-0">{new Date(schema.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
