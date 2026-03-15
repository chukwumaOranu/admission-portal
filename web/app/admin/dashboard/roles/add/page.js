'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRoles } from '@/hooks/useRedux';

export default function AddRolePage() {
  const router = useRouter();
  const { status } = useSession();
  const { createRole } = useRoles();  // ✅ New simple hook
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await createRole(formData);
      setSuccess(true);
      // Redirect to roles list after a short delay
      setTimeout(() => {
        router.push('/admin/dashboard/roles');
      }, 1500);
    } catch (error) {
      console.error('Error creating role:', error);
      setError(error.message || 'Failed to create role. Please try again.');
    } finally {
      setIsLoading(false);
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

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    window.location.href = '/login';
    return null;
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-user-shield text-primary-custom me-2"></i>
            Add New Role
          </h2>
          <p className="text-muted mb-0">Create a new user role</p>
        </div>
        <Link href="/admin/dashboard/roles" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to Roles
        </Link>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-user-shield me-2"></i>
                Role Information
              </h5>
            </div>
            <div className="card-body">
              {/* Success Message */}
              {success && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  <i className="fas fa-check-circle me-2"></i>
                  Role created successfully! Redirecting to roles list...
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  {error}
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setError(null)}
                  ></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Role Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Manager, Editor, Viewer"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Describe the role's responsibilities and access level"
                    required
                  ></textarea>
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
                      Active Role
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
                        Create Role
                      </>
                    )}
                  </button>
                  <Link href="/admin/dashboard/roles" className="btn btn-outline-secondary">
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
                  <li>Use clear, descriptive role names</li>
                  <li>Provide detailed descriptions</li>
                  <li>Consider role hierarchy</li>
                  <li>Set permissions after creation</li>
                </ul>
              </div>
              
              <div className="alert alert-warning">
                <h6><i className="fas fa-exclamation-triangle me-2"></i>Note:</h6>
                <p className="mb-0">
                  After creating the role, you&apos;ll need to assign specific permissions to define what users with this role can do.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
