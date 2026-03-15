'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useEmployees, useUsers } from '@/hooks/useRedux';
import CredentialsModal from '@/components/CredentialsModal';

export default function EmployeesPage() {
  const { status } = useSession();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  
  // ✅ Redux - Simple!
  const { employees, loading: isLoading, error, fetchEmployees, deleteEmployee, createEmployeeLogin } = useEmployees();
  
  // Also need users for viewing login details
  const { users, fetchUsers } = useUsers();
  
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedCredentials, setSelectedCredentials] = useState(null);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [showLoginDetailsModal, setShowLoginDetailsModal] = useState(false);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEmployees();
      fetchUsers(); // Needed for viewing login details
    }
  }, [status, fetchEmployees, fetchUsers]);

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      setDeleteLoading(employeeId);
      await deleteEmployee(employeeId);  // ✅ Redux - auto-removes from store
      alert('Employee deleted successfully!');
    } catch (err) {
      console.error('Error deleting employee:', err);
      alert('Failed to delete employee');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleCreateLogin = async (employee) => {
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
      const result = await createEmployeeLogin(employee.id, false);
      const response = result.payload;

      if (response.userAccount && response.userAccount.created) {
        // Store credentials in localStorage for future viewing
        localStorage.setItem(`employee_creds_${employee.id}`, JSON.stringify({
          username: response.userAccount.username,
          password: response.userAccount.password,
          email: response.userAccount.email,
          createdAt: new Date().toISOString()
        }));
        
        setSelectedCredentials(response.userAccount);
        setSelectedEmployeeName(`${employee.first_name} ${employee.last_name}`);
        setShowCredentialsModal(true);
        fetchEmployees(); // Refresh to show updated login status
      }
    } catch (err) {
      console.error('Error creating login:', err);
      alert(err.message || 'Failed to create login account');
    }
  };

  const handleViewLoginDetails = async (employee) => {
    console.log('🔍 Viewing login details for employee:', employee);
    
    try {
      if (!employee.user_id) {
        console.log('❌ No user_id found for employee');
        alert('This employee does not have a user account yet.');
        return;
      }

      console.log('📡 Finding user data for user_id:', employee.user_id);
      
      // ✅ Use Redux state instead of direct API call
    const user = users.find(u => u.id === employee.user_id);
      console.log('✅ User found in Redux:', user);
    
    if (user) {
        console.log('👤 User found:', user);
        
        // Check if we have stored credentials for this employee
        const storedCredsKey = `employee_creds_${employee.id}`;
        console.log('🔑 Checking localStorage for key:', storedCredsKey);
        const storedCreds = localStorage.getItem(storedCredsKey);
        console.log('📦 Stored credentials:', storedCreds);
        
        let tempPassword = null;
        
        if (storedCreds) {
          try {
            const creds = JSON.parse(storedCreds);
            tempPassword = creds.password;
            console.log('✅ Password retrieved from localStorage:', tempPassword ? '***' : 'null');
          } catch (e) {
            console.error('❌ Error parsing stored credentials:', e);
          }
        } else {
          console.log('⚠️ No stored credentials found in localStorage');
        }

        const employeeDetails = {
          employee,
          user: {
            ...user,
            temp_password: tempPassword || user.temp_password // Try localStorage first, then database field
          }
        };
        
        console.log('📋 Setting employee details:', employeeDetails);
        setSelectedEmployeeDetails(employeeDetails);
        setShowLoginDetailsModal(true);
        console.log('✅ Modal should now be visible');
        
        // If no password found, show helpful message
        if (!tempPassword && !user.temp_password) {
          console.log('⚠️ WARNING: Password not available for this employee');
          console.log('💡 TIP: Passwords are only stored when created through the Add Employee page');
        }
    } else {
        console.log('❌ User not found in response');
        alert('User account not found. It may have been deleted.');
      }
    } catch (err) {
      console.error('❌ Error fetching user details:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch login details';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleDownloadLoginDetails = () => {
    if (!selectedEmployeeDetails) return;

    const { employee, user } = selectedEmployeeDetails;
    
    // Create text content
    const content = `
═══════════════════════════════════════════════
        EMPLOYEE LOGIN CREDENTIALS
═══════════════════════════════════════════════

Employee Information:
─────────────────────────────────────────────
Name:           ${employee.first_name} ${employee.last_name}
Employee ID:    ${employee.employee_id}
Email:          ${employee.email}
Department:     ${employee.department_name || employee.department || 'N/A'}
Position:       ${employee.position || 'N/A'}

Login Credentials:
─────────────────────────────────────────────
Username:       ${user.username}
Password:       ${user.temp_password || '[Password not available - contact admin to reset]'}
Email:          ${user.email}
Status:         ${user.is_active ? 'Active' : 'Inactive'}

Account Created: ${new Date(user.created_at).toLocaleString()}

═══════════════════════════════════════════════

⚠️  IMPORTANT SECURITY NOTICE:
   • Keep these credentials confidential
   • Change password on first login (recommended)
   • Do not share with unauthorized persons
   • Contact support if account is compromised

═══════════════════════════════════════════════
Generated: ${new Date().toLocaleString()}
═══════════════════════════════════════════════
    `.trim();

    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${employee.employee_id}_login_credentials_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleCopyLoginDetails = () => {
    if (!selectedEmployeeDetails) return;

    const { employee, user } = selectedEmployeeDetails;
    
    const text = `Employee: ${employee.first_name} ${employee.last_name}
Employee ID: ${employee.employee_id}
Username: ${user.username}
Password: ${user.temp_password || '[Not available - contact admin]'}
Email: ${user.email}
Status: ${user.is_active ? 'Active' : 'Inactive'}`;

    navigator.clipboard.writeText(text).then(() => {
      alert('Login details copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const getLoginStatusBadge = (employee) => {
    if (employee.user_id) {
      return (
        <button 
          className="badge bg-success border-0" 
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Has Login badge clicked for employee:', employee.id, employee.first_name);
            handleViewLoginDetails(employee);
          }}
          title="Click to view login details"
        >
          <i className="fas fa-check-circle me-1"></i>Has Login
        </button>
      );
    }
    return <span className="badge bg-secondary"><i className="fas fa-times-circle me-1"></i>No Access</span>;
  };

  // Show loading while checking authentication and permissions
  if (status === 'loading' || permissionsLoading) {
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
  if (!hasPermission('employee.read')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to view employees.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Credentials Modal */}
      <CredentialsModal
        isOpen={showCredentialsModal}
        onClose={() => setShowCredentialsModal(false)}
        credentials={selectedCredentials}
        employeeName={selectedEmployeeName}
      />

      {/* Login Details Modal */}
      {showLoginDetailsModal && selectedEmployeeDetails && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fas fa-user-lock me-2"></i>
                  Employee Login Details
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowLoginDetailsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Employee Info Section */}
                <div className="card border-0 bg-light mb-3">
                  <div className="card-body">
                    <h6 className="card-title mb-3">
                      <i className="fas fa-users text-primary me-2"></i>
                      Employee Information
                    </h6>
                    <div className="row">
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Full Name</small>
                        <strong>{selectedEmployeeDetails.employee.first_name} {selectedEmployeeDetails.employee.last_name}</strong>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Employee ID</small>
                        <strong className="text-primary">{selectedEmployeeDetails.employee.employee_id}</strong>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Email</small>
                        <span>{selectedEmployeeDetails.employee.email}</span>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Department</small>
                        <span>{selectedEmployeeDetails.employee.department_name || selectedEmployeeDetails.employee.department || 'N/A'}</span>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Position</small>
                        <span>{selectedEmployeeDetails.employee.position || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Login Credentials Section */}
                <div className="card border-success mb-3">
                  <div className="card-header bg-success text-white">
                    <h6 className="mb-0">
                      <i className="fas fa-key me-2"></i>
                      Portal Access Credentials
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label small text-muted mb-1">
                          <i className="fas fa-user me-1"></i>
                          Username
                        </label>
                        <div className="input-group">
                          <input 
                            type="text" 
                            className="form-control" 
                            value={selectedEmployeeDetails.user.username} 
                            readOnly 
                          />
                          <button 
                            className="btn btn-outline-secondary"
                            onClick={() => navigator.clipboard.writeText(selectedEmployeeDetails.user.username)}
                            title="Copy username"
                          >
                            <i className="fas fa-copy"></i>
                          </button>
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label small text-muted mb-1">
                          <i className="fas fa-key me-1"></i>
                          Password
                        </label>
                        {selectedEmployeeDetails.user.temp_password ? (
                          <div className="input-group">
                            <input 
                              type="text" 
                              className="form-control font-monospace" 
                              value={selectedEmployeeDetails.user.temp_password} 
                              readOnly 
                            />
                            <button 
                              className="btn btn-outline-secondary"
                              onClick={() => navigator.clipboard.writeText(selectedEmployeeDetails.user.temp_password)}
                              title="Copy password"
                            >
                              <i className="fas fa-copy"></i>
                            </button>
                          </div>
                        ) : (
                          <div className="alert alert-warning mb-0 small py-2">
                            <i className="fas fa-exclamation-triangle me-1"></i>
                            Password not available. Contact admin to reset.
                          </div>
                        )}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label small text-muted mb-1">
                          <i className="fas fa-envelope me-1"></i>
                          Email
                        </label>
                        <div className="input-group">
                          <input 
                            type="text" 
                            className="form-control" 
                            value={selectedEmployeeDetails.user.email} 
                            readOnly 
                          />
                          <button 
                            className="btn btn-outline-secondary"
                            onClick={() => navigator.clipboard.writeText(selectedEmployeeDetails.user.email)}
                            title="Copy email"
                          >
                            <i className="fas fa-copy"></i>
                          </button>
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label small text-muted mb-1">
                          <i className="fas fa-toggle-on me-1"></i>
                          Status
                        </label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={selectedEmployeeDetails.user.is_active ? 'Active' : 'Inactive'} 
                          readOnly 
                        />
                      </div>
                    </div>

                    {selectedEmployeeDetails.user.temp_password ? (
                      <div className="alert alert-success mb-0">
                        <i className="fas fa-check-circle me-2"></i>
                        <strong>Password Available:</strong> You can copy or download the credentials above. 
                        Store them securely and share with the employee.
                      </div>
                    ) : (
                      <div className="alert alert-warning mb-0">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        <strong>Password Not Available:</strong> This account was created without storing the password. 
                        You can reset it from the user management page if needed.
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Details */}
                <div className="card border-0 bg-light">
                  <div className="card-body">
                    <h6 className="card-title mb-3">
                      <i className="fas fa-info-circle text-info me-2"></i>
                      Account Details
                    </h6>
                    <div className="row small">
                      <div className="col-md-6 mb-2">
                        <span className="text-muted">Created:</span>
                        <strong className="ms-2">{new Date(selectedEmployeeDetails.user.created_at).toLocaleString()}</strong>
                      </div>
                      <div className="col-md-6 mb-2">
                        <span className="text-muted">Email Verified:</span>
                        <strong className="ms-2">
                          {selectedEmployeeDetails.user.email_verified ? (
                            <span className="text-success">
                              <i className="fas fa-check-circle me-1"></i>
                              Yes
                            </span>
                          ) : (
                            <span className="text-warning">
                              <i className="fas fa-exclamation-circle me-1"></i>
                              No
                            </span>
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary"
                  onClick={handleCopyLoginDetails}
                >
                  <i className="fas fa-copy me-2"></i>
                  Copy to Clipboard
                </button>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={handleDownloadLoginDetails}
                >
                  <i className="fas fa-download me-2"></i>
                  Download as TXT
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => setShowLoginDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-users text-primary-custom me-2"></i>
            Employees
          </h2>
          <p className="text-muted mb-0">Manage employee records</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/dashboard/employees/departments" className="btn btn-outline-info">
            <i className="fas fa-building me-2"></i>
            Departments
          </Link>
          <Link href="/admin/dashboard/employees/schemas" className="btn btn-outline-secondary">
            <i className="fas fa-list me-2"></i>
            Schemas
          </Link>
          {hasPermission('employee.create') && (
            <Link href="/admin/dashboard/employees/add" className="btn btn-primary-custom">
              <i className="fas fa-plus me-2"></i>
              Add Employee
            </Link>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card card-stats">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Total Employees</p>
                  <h3 className="mb-0">{employees.length}</h3>
                </div>
                <div className="icon-shape bg-gradient-primary">
                  <i className="fas fa-users"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-stats">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Active</p>
                  <h3 className="mb-0">{employees.filter(e => e?.status === 'active').length}</h3>
                </div>
                <div className="icon-shape bg-gradient-success">
                  <i className="fas fa-check-circle"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-stats">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">With Login</p>
                  <h3 className="mb-0">{employees.filter(e => e && e.user_id).length}</h3>
                </div>
                <div className="icon-shape bg-gradient-info">
                  <i className="fas fa-user-lock"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-stats">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">No Access</p>
                  <h3 className="mb-0">{employees.filter(e => e && !e.user_id).length}</h3>
                </div>
                <div className="icon-shape bg-gradient-secondary">
                  <i className="fas fa-user-slash"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <i className="fas fa-list me-2"></i>
              Employee List
            </h5>
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={fetchEmployees}
              disabled={isLoading}
            >
              <i className="fas fa-sync me-2"></i>
              Refresh
            </button>
          </div>
        </div>
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading employees...</p>
            </div>
          ) : employees.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Status</th>
                    <th>Login Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.filter(e => e).map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <strong>{employee.employee_id}</strong>
                      </td>
                      <td>
                        {employee.first_name} {employee.last_name}
                      </td>
                      <td>{employee.email || 'N/A'}</td>
                      <td>{employee.department_name || employee.department || 'Unassigned'}</td>
                      <td>{employee.position || 'N/A'}</td>
                      <td>
                        <span className={`badge bg-${employee?.status === 'active' ? 'success' : 'secondary'}`}>
                          {employee?.status || 'N/A'}
                        </span>
                      </td>
                      <td>
                        {getLoginStatusBadge(employee)}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          {!employee.user_id && employee.email && hasPermission('user.create') && (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => handleCreateLogin(employee)}
                              title="Create Login"
                            >
                              <i className="fas fa-user-plus"></i>
                            </button>
                          )}
                          {hasPermission('employee.update') && (
                            <Link
                              href={`/admin/dashboard/employees/${employee.id}/edit`}
                              className="btn btn-outline-primary"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </Link>
                          )}
                          <Link
                            href={`/admin/dashboard/employees/${employee.id}`}
                            className="btn btn-outline-info"
                            title="View"
                          >
                            <i className="fas fa-eye"></i>
                          </Link>
                          {hasPermission('employee.delete') && (
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteEmployee(employee.id)}
                              disabled={deleteLoading === employee.id}
                              title="Delete"
                            >
                              {deleteLoading === employee.id ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                <i className="fas fa-trash"></i>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-users text-muted" style={{ fontSize: '4rem' }}></i>
              <h5 className="mt-3 text-muted">No employees found</h5>
              <p className="text-muted">Get started by adding your first employee.</p>
              {hasPermission('employee.create') && (
                <Link 
                  href="/admin/dashboard/employees/add" 
                  className="btn btn-primary-custom mt-2"
                >
                  <i className="fas fa-plus me-2"></i>
                  Add Employee
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
