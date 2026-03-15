'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';

export default function ApplicationSchemasPage() {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();

  // Redux state and actions
  const {
    schemas,
    loading,
    error: reduxError,
    fetchApplicationSchemas,
    createApplicationSchema,
    deleteApplicationSchema,
    updateApplicationSchema
  } = useApplications();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  
  const [newSchema, setNewSchema] = useState({
    schema_name: '',
    display_name: '',
    description: '',
    application_fee: 0,
    is_active: true
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      fetchApplicationSchemas();
    }
  }, [status, session?.user?.id, session?.accessToken, fetchApplicationSchemas]);

  const handleCreateSchema = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      console.log('📤 Creating schema:', newSchema);
      await createApplicationSchema(newSchema);
      alert('Application schema created successfully!');
      setShowCreateModal(false);
      setNewSchema({
        schema_name: '',
        display_name: '',
        description: '',
        application_fee: 0,
        is_active: true
      });
      await fetchApplicationSchemas(); // Refresh data
    } catch (error) {
      console.error('❌ Error creating schema:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create application schema';
      alert(errorMessage);
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSchema = async (schemaId) => {
    if (window.confirm('Are you sure you want to delete this schema?')) {
      try {
        await deleteApplicationSchema(schemaId);
        alert('Application schema deleted successfully!');
      } catch (error) {
        console.error('Error deleting schema:', error);
        alert('Failed to delete application schema');
      }
    }
  };

  const handleToggleActive = async (schemaId, currentStatus) => {
    try {
      await updateApplication(schemaId, { is_active: !currentStatus });
      alert(`Schema ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      await fetchApplicationSchemas(); // Refresh data
    } catch (error) {
      console.error('Error updating schema:', error);
      alert('Failed to update schema status');
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
    <div className="application-schemas-page">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-cogs text-primary me-2"></i>
            Application Schema Management
          </h2>
          <p className="text-muted mb-0">Create and manage application schemas for different admission types</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/dashboard/applications" className="btn btn-outline-primary">
            <i className="fas fa-arrow-left me-2"></i>
            Back to Applications
          </Link>
          {hasPermission('application_schema.create') && (
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
              <i className="fas fa-plus me-2"></i>
              Create Schema
          </button>
        )}
        </div>
      </div>

      {(error || reduxError) && (
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error || reduxError}
        </div>
      )}

      {/* Schemas List */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-list me-2"></i>
            Application Schemas ({schemas.length})
          </h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : schemas.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-cogs text-muted fs-1 mb-3"></i>
              <h5 className="text-muted">No Application Schemas</h5>
              <p className="text-muted">Create your first application schema to get started.</p>
              {hasPermission('application_schema.create') && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <i className="fas fa-plus me-2"></i>
                  Create First Schema
                </button>
              )}
            </div>
          ) : (
            <div className="row">
              {schemas.map(schema => (
                <div key={schema.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">
                        <i className="fas fa-cog text-primary me-2"></i>
                        {schema.display_name || schema.schema_name}
                      </h6>
                        <span className={`badge ${schema.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {schema.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-tag text-info me-2"></i>
                          <strong>{schema.schema_name}</strong>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-money-bill text-success me-2"></i>
                          <span>Fee: ₦{parseFloat(schema.application_fee || 0).toLocaleString()}</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-calendar text-warning me-2"></i>
                          <span>Created: {new Date(schema.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {schema.description && (
                        <div className="mb-3">
                          <small className="text-muted">
                            <strong>Description:</strong> {schema.description}
                          </small>
                        </div>
                      )}
                    </div>
                    <div className="card-footer">
                      <div className="d-flex gap-1 flex-wrap">
                        <Link 
                          href={`/admin/dashboard/applications/schemas/${schema.id}/fields`}
                          className="btn btn-success btn-sm"
                        >
                          <i className="fas fa-list-ul me-1"></i> Manage Fields
                        </Link>
                        
                        <Link 
                          href={`/admin/dashboard/applications/schemas/${schema.id}`}
                          className="btn btn-outline-primary btn-sm"
                        >
                          <i className="fas fa-eye me-1"></i> View
                        </Link>
                        
                        {hasPermission('application_schema.update') && (
                          <>
                            <Link 
                              href={`/admin/dashboard/applications/schemas/${schema.id}/edit`}
                              className="btn btn-outline-warning btn-sm"
                            >
                              <i className="fas fa-edit me-1"></i> Edit
                            </Link>
                            
                            <button
                              className={`btn btn-outline-${schema.is_active ? 'secondary' : 'success'} btn-sm`}
                              onClick={() => handleToggleActive(schema.id, schema.is_active)}
                            >
                              <i className={`fas fa-${schema.is_active ? 'pause' : 'play'} me-1`}></i>
                              {schema.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </>
                        )}
                        
                        {hasPermission('application_schema.delete') && (
                          <button 
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDeleteSchema(schema.id)}
                          >
                            <i className="fas fa-trash me-1"></i> Delete
                            </button>
                          )}
                        </div>
                    </div>
                  </div>
                </div>
                  ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Schema Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Create Application Schema</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCreateModal(false)}
                  ></button>
                </div>
              <form onSubmit={handleCreateSchema}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Schema Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newSchema.schema_name}
                      onChange={(e) => setNewSchema({...newSchema, schema_name: e.target.value})}
                      required
                      placeholder="e.g., undergraduate_application"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Display Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newSchema.display_name}
                      onChange={(e) => setNewSchema({...newSchema, display_name: e.target.value})}
                      required
                      placeholder="e.g., Undergraduate Application"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={newSchema.description}
                      onChange={(e) => setNewSchema({...newSchema, description: e.target.value})}
                      placeholder="Describe this application type..."
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Application Fee</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newSchema.application_fee}
                      onChange={(e) => setNewSchema({...newSchema, application_fee: parseFloat(e.target.value) || 0})}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="is_active"
                      checked={newSchema.is_active}
                      onChange={(e) => setNewSchema({...newSchema, is_active: e.target.checked})}
                    />
                    <label className="form-check-label" htmlFor="is_active">
                      Active (available for applications)
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={creating}
                  >
                    {creating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus me-2"></i>
                        Create Schema
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
