'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';

export default function EditApplicationSchemaPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  // Redux state
  const { schemas, loading: reduxLoading, fetchApplicationSchemas, updateApplicationSchema } = useApplications();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    schema_name: '',
    display_name: '',
    description: '',
    application_fee: 0,
    is_active: true
  });

  const fetchSchema = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.APPLICATIONS.SCHEMAS.GET_BY_ID(params.id));
      const schema = response.data?.schema || response.data?.data?.schema || response.data;
      
      if (!schema) {
        setError('Schema not found');
        return;
      }
      
      setFormData({
        schema_name: schema.schema_name || '',
        display_name: schema.display_name || '',
        description: schema.description || '',
        application_fee: schema.application_fee || 0,
        is_active: Boolean(schema.is_active)
      });
    } catch (err) {
      console.error('❌ Error fetching schema:', err);
      setError('Failed to load schema');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      // Fetch schemas from Redux if not already loaded
      if (schemas.length === 0) {
        fetchApplicationSchemas();
      }
    }
  }, [status, session?.user?.id, session?.accessToken, schemas.length, fetchApplicationSchemas]);

  useEffect(() => {
    // Find schema from Redux store or fetch directly
    if (params.id && schemas.length > 0) {
      const foundSchema = schemas.find(s => s.id === parseInt(params.id));
      if (foundSchema) {
        setFormData({
          schema_name: foundSchema.schema_name || '',
          display_name: foundSchema.display_name || '',
          description: foundSchema.description || '',
          application_fee: foundSchema.application_fee || 0,
          is_active: Boolean(foundSchema.is_active)
        });
        setLoading(false);
      }
    } else if (params.id && !reduxLoading) {
      fetchSchema();
    }
  }, [params.id, schemas, reduxLoading, fetchSchema]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      await updateApplicationSchema(params.id, formData);
      setSuccess(true);
      alert('Schema updated successfully!');
      setTimeout(() => {
        router.push(`/admin/dashboard/applications/schemas/${params.id}`);
      }, 1000);
    } catch (err) {
      console.error('Error updating schema:', err);
      setError(err.response?.data?.message || 'Failed to update schema');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    window.location.href = '/login';
    return null;
  }

  if (!hasPermission('application_schema.update')) {
    return (
      <div className="alert alert-danger">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to edit application schemas.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-edit text-primary me-2"></i>
            Edit Application Schema
          </h2>
          <p className="text-muted mb-0">Update schema information</p>
        </div>
        <Link href={`/admin/dashboard/applications/schemas/${params.id}`} className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>
          Cancel
        </Link>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          <i className="fas fa-check-circle me-2"></i>
          Schema updated successfully!
          <button type="button" className="btn-close" onClick={() => setSuccess(false)}></button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white">
                <h5 className="card-title mb-0">Schema Details</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Schema Name (ID) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="schema_name"
                      value={formData.schema_name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., primary_admission_2025"
                    />
                    <small className="text-muted">Lowercase, no spaces (use underscore)</small>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Display Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="display_name"
                      value={formData.display_name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Primary School Admission 2025/2026"
                    />
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Describe this application program..."
                    ></textarea>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Application Fee (₦) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="application_fee"
                      value={formData.application_fee}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="100"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Status</label>
                    <div className="form-check form-switch mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        {formData.is_active ? 'Active' : 'Inactive'}
                      </label>
                    </div>
                    <small className="text-muted">
                      {formData.is_active 
                        ? 'Students can apply using this schema' 
                        : 'Schema is hidden from students'}
                    </small>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="d-flex gap-2 mb-4">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Update Schema
                  </>
                )}
              </button>
              
              <Link
                href={`/admin/dashboard/applications/schemas/${params.id}`}
                className="btn btn-outline-secondary"
              >
                Cancel
              </Link>
            </div>
          </div>

          {/* Sidebar Help */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-info text-white">
                <h6 className="card-title mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  Editing Schema
                </h6>
              </div>
              <div className="card-body">
                <div className="alert alert-warning mb-3">
                  <h6><i className="fas fa-exclamation-triangle me-2"></i>Note:</h6>
                  <ul className="mb-0 small">
                    <li>Changing schema name may affect existing applications</li>
                    <li>Deactivating hides it from students</li>
                    <li>Fee changes won&apos;t affect submitted applications</li>
                  </ul>
                </div>

                <h6 className="small">Fields Management:</h6>
                <p className="small mb-0">
                  To add, edit, or remove form fields, use the 
                  <Link href={`/admin/dashboard/applications/schemas/${params.id}/fields`} className="ms-1">
                    Manage Fields
                  </Link> page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
