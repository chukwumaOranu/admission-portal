'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useEmployees, useUsers } from '@/hooks/useRedux';
import CredentialsModal from '@/components/CredentialsModal';

export default function ViewEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  // Redux state
  const { employees, loading: employeesLoading, fetchEmployees, deleteEmployee, createEmployeeLogin } = useEmployees();
  const { users, fetchUsers } = useUsers();
  
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedCredentials, setSelectedCredentials] = useState(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      // Fetch from Redux if not already loaded
      if (employees.length === 0) {
        fetchEmployees();
      }
      if (users.length === 0) {
        fetchUsers();
      }
    }
  }, [status, session?.user?.id, session?.accessToken, employees.length, users.length, fetchEmployees, fetchUsers]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const employee = useMemo(() => {
    if (!params.id) return null;
    return employees.find((e) => e.id === parseInt(params.id, 10)) || null;
  }, [params.id, employees]);

  const userDetails = useMemo(() => {
    if (!employee?.user_id) return null;
    return users.find((u) => u.id === employee.user_id) || null;
  }, [employee, users]);

  const isLoading = status === 'loading' || employeesLoading || (status === 'authenticated' && employees.length === 0);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(true);
      await deleteEmployee(params.id);
      alert('Employee deleted successfully!');
      router.push('/admin/dashboard/employees');
    } catch (err) {
      console.error('Error deleting employee:', err);
      alert('Failed to delete employee');
      setDeleteLoading(false);
    }
  };

  const handleCreateLogin = async () => {
    if (!employee.email) {
      alert('Employee must have an email address to create login');
      return;
    }

    if (employee.user_id) {
      alert('Employee already has a user account');
      return;
    }

    if (!window.confirm(`Create login account for ${employee.first_name} ${employee.last_name}?`)) {
      return;
    }

    try {
      const result = await createEmployeeLogin(params.id, false);
      const response = result.payload;

      if (response.userAccount && response.userAccount.created) {
        setSelectedCredentials(response.userAccount);
        setShowCredentialsModal(true);
        // Refresh Redux data to show updated login status
        fetchEmployees();
        fetchUsers();
      }
    } catch (err) {
      console.error('Error creating login:', err);
      alert(err.message || 'Failed to create login account');
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
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
  if (!hasPermission('employee.read')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to view employee details.</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="container-fluid">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Not Found</h4>
          <p>Employee not found.</p>
          <Link href="/admin/dashboard/employees" className="btn btn-primary mt-2">
            Back to Employees
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Credentials Modal */}
      {selectedCredentials && (
        <CredentialsModal
          isOpen={showCredentialsModal}
          onClose={() => setShowCredentialsModal(false)}
          credentials={selectedCredentials}
          employeeName={`${employee.first_name} ${employee.last_name}`}
        />
      )}

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-user text-primary-custom me-2"></i>
            Employee Details
          </h2>
          <p className="text-muted mb-0">{employee.first_name} {employee.last_name}</p>
        </div>
        <div className="d-flex gap-2">
          <Link 
            href="/admin/dashboard/employees" 
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to Employees
          </Link>
          {hasPermission('employee.update') && (
            <Link 
              href={`/admin/dashboard/employees/${params.id}/edit`}
              className="btn btn-primary-custom"
            >
              <i className="fas fa-edit me-2"></i>
              Edit Employee
            </Link>
          )}
          {hasPermission('employee.delete') && (
            <button
              onClick={handleDelete}
              className="btn btn-danger"
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  Deleting...
                </>
              ) : (
                <>
                  <i className="fas fa-trash me-2"></i>
                  Delete
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="row">
        {/* Main Info */}
        <div className="col-lg-8">
          {/* Basic Information */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Employee Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="text-muted mb-1">Employee ID</label>
                  <h6 className="mb-0">{employee.employee_id}</h6>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="text-muted mb-1">Status</label>
                  <h6 className="mb-0">
                    <span className={`badge bg-${employee.status === 'active' ? 'success' : 'secondary'}`}>
                      {employee.status}
                    </span>
                  </h6>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="text-muted mb-1">First Name</label>
                  <h6 className="mb-0">{employee.first_name}</h6>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="text-muted mb-1">Last Name</label>
                  <h6 className="mb-0">{employee.last_name}</h6>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="text-muted mb-1">Email</label>
                  <h6 className="mb-0">{employee.email || 'Not provided'}</h6>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="text-muted mb-1">Phone</label>
                  <h6 className="mb-0">{employee.phone || 'Not provided'}</h6>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="text-muted mb-1">Department</label>
                  <h6 className="mb-0">{employee.department_name || employee.department || 'Unassigned'}</h6>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="text-muted mb-1">Position</label>
                  <h6 className="mb-0">{employee.position || 'Not specified'}</h6>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="text-muted mb-1">Employment Date</label>
                  <h6 className="mb-0">
                    {employee.employment_date 
                      ? new Date(employee.employment_date).toLocaleDateString()
                      : 'Not provided'}
                  </h6>
                </div>
              </div>
            </div>
          </div>

          {/* System Access Information */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-success text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-user-lock me-2"></i>
                System Access
              </h5>
            </div>
            <div className="card-body">
              {employee.user_id && userDetails ? (
                <div className="row">
                  <div className="col-12 mb-3">
                    <div className="alert alert-success">
                      <i className="fas fa-check-circle me-2"></i>
                      This employee has an active user account and can log into the system.
                    </div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="text-muted mb-1">Username</label>
                    <h6 className="mb-0">
                      <i className="fas fa-user me-2 text-primary"></i>
                      {userDetails.username}
                    </h6>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="text-muted mb-1">Account Status</label>
                    <h6 className="mb-0">
                      <span className={`badge bg-${userDetails.is_active ? 'success' : 'danger'}`}>
                        {userDetails.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </h6>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="text-muted mb-1">Role</label>
                    <h6 className="mb-0">
                      {userDetails.role_name ? (
                        <span className="badge bg-info">{userDetails.role_name}</span>
                      ) : (
                        <span className="text-muted">No role assigned</span>
                      )}
                    </h6>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="text-muted mb-1">Email Verified</label>
                    <h6 className="mb-0">
                      {userDetails.email_verified ? (
                        <span className="badge bg-success">Verified</span>
                      ) : (
                        <span className="badge bg-warning">Not Verified</span>
                      )}
                    </h6>
                  </div>
                  
                  <div className="col-12">
                    <div className="alert alert-info mb-0">
                      <i className="fas fa-info-circle me-2"></i>
                      <strong>Note:</strong> Passwords cannot be viewed for security reasons. 
                      You can only reset the password if needed.
                      To assign or change the role, go to <strong>User Management → User Roles</strong>.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-user-slash text-muted fs-1 mb-3"></i>
                  <h6 className="text-muted">No System Access</h6>
                  <p className="text-muted mb-3">This employee does not have a user account.</p>
                  {employee.email && hasPermission('user.create') && (
                    <button
                      className="btn btn-primary-custom"
                      onClick={handleCreateLogin}
                    >
                      <i className="fas fa-user-plus me-2"></i>
                      Create Login Account
                    </button>
                  )}
                  {!employee.email && (
                    <p className="text-danger">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      Email address required to create login account
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Quick Actions */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-warning text-dark">
              <h5 className="card-title mb-0">
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                {hasPermission('employee.update') && (
                  <Link
                    href={`/admin/dashboard/employees/${params.id}/edit`}
                    className="btn btn-outline-primary"
                  >
                    <i className="fas fa-edit me-2"></i>
                    Edit Employee
                  </Link>
                )}
                
                {employee.user_id && hasPermission('role.assign') && (
                  <Link
                    href="/admin/dashboard/users/roles"
                    className="btn btn-outline-info"
                  >
                    <i className="fas fa-user-tag me-2"></i>
                    Assign Role
                  </Link>
                )}
                
                {hasPermission('employee.delete') && (
                  <button
                    onClick={handleDelete}
                    className="btn btn-outline-danger"
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-trash me-2"></i>
                        Delete Employee
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-secondary text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-clock me-2"></i>
                Timestamps
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="text-muted mb-1">Created At</label>
                <p className="mb-0">
                  {new Date(employee.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div className="mb-0">
                <label className="text-muted mb-1">Last Updated</label>
                <p className="mb-0">
                  {new Date(employee.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
