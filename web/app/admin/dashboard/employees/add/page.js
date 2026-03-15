'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useEmployees, useDepartments } from '@/hooks/useRedux';
import CredentialsModal from '@/components/CredentialsModal';

export default function AddEmployeePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  // Redux state
  const { 
    schemas,
    loading: employeesLoading,
    fetchEmployeeSchemas,
    createEmployee 
  } = useEmployees();
  const { departments, fetchDepartments } = useDepartments();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userCredentials, setUserCredentials] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  
  const [formData, setFormData] = useState({
    employee_id: '',
    schema_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    position: '',
    employment_date: '',
    create_user_account: false,
    send_welcome_email: false
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      // Fetch from Redux if not already loaded
      if (departments.length === 0) {
        fetchDepartments();
      }
      if (schemas.length === 0) {
        fetchEmployeeSchemas();
      }
    }
  }, [status, session?.user?.id, session?.accessToken, departments.length, schemas.length, fetchDepartments, fetchEmployeeSchemas]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

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
    setIsLoading(true);
    setError('');
    
    // Validation
    if (!formData.employee_id || !formData.schema_id || !formData.first_name || !formData.last_name) {
      setError('Please fill in all required fields: Employee ID, Employee Type, First Name, and Last Name.');
      setIsLoading(false);
      return;
    }

    if (formData.create_user_account && !formData.email) {
      setError('Email address is required when creating a user account. Please provide an email address or uncheck "Create User Account".');
      setIsLoading(false);
      return;
    }

    try {
      const result = await createEmployee(formData);
      const response = result.payload;
      
      console.log('🔍 Frontend - Result:', result);
      console.log('🔍 Frontend - Response:', response);
      console.log('🔍 Frontend - UserAccount:', response?.userAccount);
      
      setSuccess(true);
      
      // If user account was created, show credentials modal
      if (response && response.userAccount && response.userAccount.created) {
        setUserCredentials(response.userAccount);
        setEmployeeName(`${formData.first_name} ${formData.last_name}`);
        setShowCredentialsModal(true);
      } else {
        // No user account created, redirect immediately
        alert('Employee created successfully!');
        setTimeout(() => {
          router.push('/admin/dashboard/employees');
        }, 1500);
      }
      
    } catch (err) {
      console.error('Error creating employee:', err);
      setError(err.message || 'Failed to create employee. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCloseCredentialsModal = () => {
    setShowCredentialsModal(false);
    // Redirect after closing credentials modal
    setTimeout(() => {
      router.push('/admin/dashboard/employees');
    }, 500);
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
    return null;
  }

  // Check permissions
  if (!hasPermission('employee.create')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to create employees.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Credentials Modal */}
      <CredentialsModal
        isOpen={showCredentialsModal}
        onClose={handleCloseCredentialsModal}
        credentials={userCredentials}
        employeeName={employeeName}
      />

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-user-plus text-primary-custom me-2"></i>
            Add New Employee
          </h2>
          <p className="text-muted mb-0">Create a new employee record</p>
        </div>
        <Link href="/admin/dashboard/employees" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to Employees
        </Link>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          Employee created successfully!
          <button type="button" className="btn-close" onClick={() => setSuccess(false)}></button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Form */}
      <div className="row">
        <div className="col-lg-8">
          <form onSubmit={handleSubmit}>
            {/* Basic Information Card */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-user me-2"></i>
                  Basic Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {/* Employee ID */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="employee_id" className="form-label">
                      Employee ID <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="employee_id"
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., EMP001"
                    />
                  </div>

                  {/* Schema */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="schema_id" className="form-label">
                      Employee Type <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      id="schema_id"
                      name="schema_id"
                      value={formData.schema_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Type</option>
                      {schemas.map((schema) => (
                        <option key={schema.id} value={schema.id}>
                          {schema.display_name || schema.schema_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* First Name */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="first_name" className="form-label">
                      First Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                      placeholder="John"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="last_name" className="form-label">
                      Last Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                      placeholder="Doe"
                    />
                  </div>

                  {/* Email */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="email" className="form-label">
                      Email {formData.create_user_account && <span className="text-danger">*</span>}
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required={formData.create_user_account}
                      placeholder="john.doe@company.com"
                    />
                    {formData.create_user_account && (
                      <small className="form-text text-info">
                        <i className="fas fa-info-circle me-1"></i>
                        Email is required when creating a user account
                      </small>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="phone" className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (234) 567-8900"
                    />
                  </div>

                  {/* Department */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="department_id" className="form-label">Department</label>
                    <select
                      className="form-select"
                      id="department_id"
                      name="department_id"
                      value={formData.department_id}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Position */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="position" className="form-label">Position</label>
                    <input
                      type="text"
                      className="form-control"
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      placeholder="e.g., Manager, Assistant"
                    />
                  </div>

                  {/* Employment Date */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="employment_date" className="form-label">Employment Date</label>
                    <input
                      type="date"
                      className="form-control"
                      id="employment_date"
                      name="employment_date"
                      value={formData.employment_date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* System Access Card */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-success text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-user-lock me-2"></i>
                  System Access (Optional)
                </h5>
              </div>
              <div className="card-body">
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  Enable this option to create a user account for this employee, allowing them to log into the system.
                  The role can be assigned later via the User Roles page.
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="create_user_account"
                    name="create_user_account"
                    checked={formData.create_user_account}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="create_user_account">
                    <strong>Create User Account</strong>
                    <br />
                    <small className="text-muted">
                      Generate login credentials for system access
                    </small>
                  </label>
                </div>

                {formData.create_user_account && (
                  <div className="ps-4 border-start border-success border-3">
                    <div className="alert alert-warning mb-3">
                      <i className="fas fa-key me-2"></i>
                      <strong>Auto-Generated:</strong> Username and password will be automatically created.
                      You&apos;ll see them after submission.
                    </div>

                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="send_welcome_email"
                        name="send_welcome_email"
                        checked={formData.send_welcome_email}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label" htmlFor="send_welcome_email">
                        Send welcome email with credentials
                        <br />
                        <small className="text-muted">
                          (Email functionality may not be configured)
                        </small>
                      </label>
                    </div>

                    <div className="alert alert-secondary mb-0">
                      <small>
                        <i className="fas fa-lightbulb me-2"></i>
                        <strong>Note:</strong> After creation, you can assign a role to this user via 
                        <strong> User Management → User Roles</strong>
                      </small>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="d-flex gap-2 mb-4">
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
                    Create Employee
                  </>
                )}
              </button>
              
              <Link
                href="/admin/dashboard/employees"
                className="btn btn-outline-secondary"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Help & Info */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-info text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Quick Guide
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-primary mb-3">
                <h6><i className="fas fa-clipboard-list me-2"></i>Required Fields:</h6>
                <ul className="mb-0 ps-3">
                  <li>Employee ID (unique)</li>
                  <li>Employee Type (schema)</li>
                  <li>First & Last Name</li>
                  <li>Email (if creating user account)</li>
                </ul>
              </div>

              <div className="alert alert-success mb-3">
                <h6><i className="fas fa-user-lock me-2"></i>System Access:</h6>
                <p className="mb-1">
                  Check &quot;Create User Account&quot; to allow this employee to log into the system.
                </p>
                <p className="mb-0">
                  <small>
                    <strong>Auto-generated:</strong> Username & password
                    <br />
                    <strong>Assign role later:</strong> Via User Roles page
                  </small>
                </p>
              </div>

              <div className="alert alert-warning mb-0">
                <h6><i className="fas fa-shield-alt me-2"></i>Security:</h6>
                <p className="mb-0">
                  Generated passwords are secure and random. Employees should change their password on first login.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
