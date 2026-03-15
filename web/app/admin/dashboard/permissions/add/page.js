'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePermissionActions } from '@/hooks/useRedux';

export default function AddPermissionPage() {
  const { createPermission } = usePermissionActions();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    resource: '',
    action: '',
    is_active: true
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await createPermission(formData);
      // Redirect to permissions list or show success message
      window.location.href = '/admin/dashboard/permissions';
    } catch (error) {
      console.error('Error creating permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resources = [
    'users', 'roles', 'permissions', 'applications', 'employees', 
    'payments', 'exams', 'settings', 'reports', 'files'
  ];

  const actions = [
    'create', 'read', 'update', 'delete', 'view', 'manage', 'approve', 'reject'
  ];

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-key text-primary-custom me-2"></i>
            Add New Permission
          </h2>
          <p className="text-muted mb-0">Create a new system permission</p>
        </div>
        <Link href="/admin/dashboard/permissions" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to Permissions
        </Link>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-key me-2"></i>
                Permission Information
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Permission Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., users.create, applications.approve"
                    required
                  />
                  <div className="form-text">
                    Format: resource.action (e.g., users.create, applications.read)
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Describe what this permission allows users to do"
                    required
                  ></textarea>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Resource *</label>
                    <select
                      className="form-select"
                      name="resource"
                      value={formData.resource}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Resource</option>
                      {resources.map(resource => (
                        <option key={resource} value={resource}>
                          {resource.charAt(0).toUpperCase() + resource.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Action *</label>
                    <select
                      className="form-select"
                      name="action"
                      value={formData.action}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Action</option>
                      {actions.map(action => (
                        <option key={action} value={action}>
                          {action.charAt(0).toUpperCase() + action.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label">
                      Active Permission
                    </label>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary-custom"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Create Permission
                      </>
                    )}
                  </button>
                  <Link href="/admin/dashboard/permissions" className="btn btn-outline-secondary">
                    <i className="fas fa-times me-2"></i>
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Help & Tips
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <h6><i className="fas fa-lightbulb me-2"></i>Tips:</h6>
                <ul className="mb-0">
                  <li>Use consistent naming convention</li>
                  <li>Be specific about what the permission allows</li>
                  <li>Consider security implications</li>
                  <li>Test permissions after creation</li>
                </ul>
              </div>
              
              <div className="alert alert-warning">
                <h6><i className="fas fa-exclamation-triangle me-2"></i>Security:</h6>
                <p className="mb-0">
                  Permissions control access to system features. Make sure to assign them carefully to maintain security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
