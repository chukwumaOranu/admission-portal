'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEmployeeSchemaActions } from '@/hooks/useRedux';
import { usePermissions } from '@/hooks/usePermissions';

export default function AddEmployeeSchemaPage() {
  const { data: session, status } = useSession();
  const { createEmployeeSchema } = useEmployeeSchemaActions();
  const { hasPermission } = usePermissions();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    schema_name: '',
    display_name: '',
    description: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await createEmployeeSchema(formData);
      // Redirect to schemas list
      window.location.href = '/admin/dashboard/employees/schemas';
    } catch (error) {
      console.error('Error creating schema:', error);
      setError('Failed to create schema. Please try again.');
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

  // Check permissions
  if (!hasPermission('employee_schema.create')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to create employee schemas.</p>
        <hr />
        <p className="mb-0">
          <Link href="/admin/dashboard/employees/schemas" className="btn btn-primary">Back to Schemas</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-database text-primary-custom me-2"></i>
            Add Employee Schema
          </h2>
          <p className="text-muted mb-0">Create a new employee data schema</p>
        </div>
        <Link href="/admin/dashboard/employees/schemas" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to Schemas
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        <div className="col-lg-8">
          <div className="card card-custom">
            <div className="card-header">
              <h5 className="card-title mb-0">Schema Information</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  {/* Schema Name */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="schema_name" className="form-label">
                      Schema Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="schema_name"
                      name="schema_name"
                      value={formData.schema_name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., basic_employee"
                    />
                    <div className="form-text">Internal name for the schema (lowercase, underscores)</div>
                  </div>

                  {/* Display Name */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="display_name" className="form-label">
                      Display Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="display_name"
                      name="display_name"
                      value={formData.display_name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Basic Employee"
                    />
                    <div className="form-text">User-friendly name for the schema</div>
                  </div>

                  {/* Description */}
                  <div className="col-12 mb-3">
                    <label htmlFor="description" className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Describe what this schema is used for..."
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="d-flex gap-2 mt-4">
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
                        Create Schema
                      </>
                    )}
                  </button>
                  <Link href="/admin/dashboard/employees/schemas" className="btn btn-outline-secondary">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="col-lg-4">
          <div className="card card-custom">
            <div className="card-header">
              <h6 className="card-title mb-0">
                <i className="fas fa-info-circle text-info me-2"></i>
                About Employee Schemas
              </h6>
            </div>
            <div className="card-body">
              <p className="small text-muted mb-3">
                Employee schemas define the structure and fields for employee records. 
                Each schema can have different custom fields based on your organization&apos;s needs.
              </p>
              
              <h6 className="small fw-bold mb-2">Common Schema Types:</h6>
              <ul className="small text-muted mb-3">
                <li><strong>Basic Employee:</strong> Standard employee information</li>
                <li><strong>Manager:</strong> Additional fields for management roles</li>
                <li><strong>Contractor:</strong> Fields specific to contract workers</li>
                <li><strong>Intern:</strong> Simplified fields for interns</li>
              </ul>

              <h6 className="small fw-bold mb-2">After Creating:</h6>
              <p className="small text-muted">
                You can add custom fields to your schema to capture specific information 
                needed for different types of employees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}