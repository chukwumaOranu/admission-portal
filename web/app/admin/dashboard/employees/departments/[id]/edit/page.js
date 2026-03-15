'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { API_ENDPOINTS, apiService } from '@/services/api';

export default function EditDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const fetchDepartment = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.get(API_ENDPOINTS.DEPARTMENTS.GET_BY_ID(params.id));
      setFormData({
        name: response.data.name || '',
        description: response.data.description || ''
      });
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name) {
      setError('Department name is required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await apiService.put(API_ENDPOINTS.DEPARTMENTS.UPDATE(params.id), formData);
      
      setSuccess(true);
      alert('Department updated successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/admin/dashboard/employees/departments/${params.id}`);
      }, 1500);
      
    } catch (err) {
      console.error('Error updating department:', err);
      setError(err.message || 'Failed to update department');
    } finally {
      setIsSaving(false);
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
  if (!hasPermission('department.update')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to edit departments.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-edit text-primary-custom me-2"></i>
            Edit Department
          </h2>
          <p className="text-muted mb-0">Update department information</p>
        </div>
        <div className="d-flex gap-2">
          <Link 
            href={`/admin/dashboard/employees/departments/${params.id}`}
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to Details
          </Link>
        </div>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          Department updated successfully! Redirecting...
          <button type="button" className="btn-close" onClick={() => setSuccess(false)}></button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Form */}
      <div className="row">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-building me-2"></i>
                Department Information
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">
                    Department Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Human Resources"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Brief description of the department's role and responsibilities"
                  ></textarea>
                </div>

                {/* Submit Buttons */}
                <div className="d-flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary-custom"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Save Changes
                      </>
                    )}
                  </button>
                  
                  <Link
                    href={`/admin/dashboard/employees/departments/${params.id}`}
                    className="btn btn-outline-secondary"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Help & Info */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Edit Information
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info mb-3">
                <h6><i className="fas fa-lightbulb me-2"></i>Tips:</h6>
                <ul className="mb-0 ps-3">
                  <li>Department name should be clear and descriptive</li>
                  <li>Update description to reflect current responsibilities</li>
                  <li>Changes will take effect immediately</li>
                </ul>
              </div>

              <div className="alert alert-warning mb-0">
                <h6><i className="fas fa-exclamation-triangle me-2"></i>Note:</h6>
                <p className="mb-0">
                  Changing the department name will not affect the department code or any existing employee assignments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
