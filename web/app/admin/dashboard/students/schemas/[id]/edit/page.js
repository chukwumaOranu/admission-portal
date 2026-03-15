'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudents } from '@/hooks/useRedux';

export default function EditStudentSchemaPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermissions();
  
  // ✅ Redux
  const { schemas, loading, error, fetchStudentSchemas, updateStudentSchema } = useStudents();
  
  const [formData, setFormData] = useState({
    schema_name: '',
    display_name: '',
    description: '',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStudentSchemas();
    }
  }, [status, fetchStudentSchemas]);

  useEffect(() => {
    if (schemas.length > 0 && params.id) {
      const schema = schemas.find(s => s.id === parseInt(params.id));
      if (schema) {
        setFormData({
          schema_name: schema.schema_name || '',
          display_name: schema.display_name || '',
          description: schema.description || '',
          is_active: schema.is_active !== undefined ? schema.is_active : true
        });
      }
    }
  }, [schemas, params.id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      // ✅ Redux Action
      await updateStudentSchema(parseInt(params.id), formData);
      
      setSubmitSuccess(true);
      setTimeout(() => {
        router.push('/admin/dashboard/students/schemas');
      }, 1500);
    } catch (err) {
      console.error('Error updating schema:', err);
      setSubmitError(err.message || 'Failed to update student schema');
    } finally {
      setIsSubmitting(false);
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

  if (!hasPermission('student_schema.update')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to edit student schemas.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Edit Student Schema</h2>
          <p className="text-muted">Update student schema information</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => {}}></button>
        </div>
      )}

      {submitError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {submitError}
          <button type="button" className="btn-close" onClick={() => setSubmitError('')}></button>
        </div>
      )}

      {submitSuccess && (
        <div className="alert alert-success" role="alert">
          Student schema updated successfully! Redirecting...
        </div>
      )}

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Schema Information</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="schema_name" className="form-label">
                    Schema Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="schema_name"
                    name="schema_name"
                    value={formData.schema_name}
                    onChange={handleChange}
                    placeholder="e.g., basic_info, primary_level"
                    required
                    disabled={isSubmitting}
                  />
                  <small className="text-muted">
                    Unique identifier (no spaces, use underscores)
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="display_name" className="form-label">
                    Display Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="display_name"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleChange}
                    placeholder="e.g., Basic Information, Primary Level"
                    required
                    disabled={isSubmitting}
                  />
                  <small className="text-muted">
                    Human-readable name shown to users
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="description" className="form-label">
                    Description
                  </label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter a description for this schema"
                    disabled={isSubmitting}
                  ></textarea>
                  <small className="text-muted">
                    Optional description of this schema&apos;s purpose
                  </small>
                </div>

                <div className="mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    <label className="form-check-label" htmlFor="is_active">
                      Active Schema
                    </label>
                    <small className="form-text text-muted d-block">
                      Only active schemas will be available for use
                    </small>
                  </div>
                </div>

                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                  >
                    <i className="fas fa-times me-2"></i>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Update Schema
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Tips</h5>
            </div>
            <div className="card-body">
              <ul className="mb-0">
                <li className="mb-2">
                  <strong>Schema Name:</strong> Use lowercase with underscores (e.g., primary_level)
                </li>
                <li className="mb-2">
                  <strong>Display Name:</strong> Use proper capitalization (e.g., Primary Level)
                </li>
                <li className="mb-2">
                  <strong>Status:</strong> Inactive schemas won&apos;t be available for selection
                </li>
                <li>
                  After updating, manage fields using the &quot;Manage Fields&quot; button
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
