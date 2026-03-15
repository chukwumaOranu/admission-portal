'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudents, useUsers } from '@/hooks/useRedux';
import CredentialsModal from '@/components/CredentialsModal';
import { API_ENDPOINTS, apiService } from '@/services/api';

export default function StudentsPage() {
  const { status } = useSession();
  const { hasPermission } = usePermissions();
  
  // ✅ Redux - Simple!
  const { students, loading, error: reduxError, fetchStudents, deleteStudent, createStudentLogin: createLoginAction } = useStudents();
  const { users, fetchUsers } = useUsers();
  
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedCredentials, setSelectedCredentials] = useState(null);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showLoginDetailsModal, setShowLoginDetailsModal] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStudents();
      fetchUsers(); // Needed for viewing login details
    }
  }, [status, fetchStudents, fetchUsers]);

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedStudents(students.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      setDeleteLoading(studentId);
      await deleteStudent(studentId);
      alert('Student deleted successfully!');
    } catch (err) {
      console.error('Error deleting student:', err);
      alert('Failed to delete student');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleSendLoginsBulk = async () => {
    if (selectedStudents.length === 0) {
      alert('Select at least one student');
      return;
    }

    if (!window.confirm(`Send login details to ${selectedStudents.length} selected student(s)?`)) {
      return;
    }

    try {
      setActionError('');
      setActionNotice('');
      const response = await apiService.post(API_ENDPOINTS.STUDENTS.SEND_LOGINS_BULK, {
        student_ids: selectedStudents
      });
      const sent = response.data?.sent || 0;
      const failed = response.data?.failed || 0;
      setActionNotice(`Login emails processed. Sent: ${sent}, Failed: ${failed}`);
    } catch (err) {
      console.error('Error sending login details:', err);
      setActionError(err.message || 'Failed to send login details');
    }
  };

  const handleCreateLogin = async (student) => {
    if (!student.email) {
      alert('Student must have an email address to create login');
      return;
    }

    if (student.user_id) {
      alert('Student already has a user account');
      return;
    }

    if (!window.confirm(`Create login account for ${student.first_name} ${student.last_name}?`)) {
      return;
    }

    try {
      // ✅ Redux Action
      const response = await createLoginAction(student.id, false);

      if (response.payload?.userAccount && response.payload.userAccount.created) {
        const credentials = response.payload.userAccount;
        
        // Store credentials in localStorage for future viewing
        localStorage.setItem(`student_creds_${student.id}`, JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          email: credentials.email,
          createdAt: new Date().toISOString()
        }));
        
        setSelectedCredentials(credentials);
        setSelectedStudentName(`${student.first_name} ${student.last_name}`);
        setShowCredentialsModal(true);
        fetchStudents(); // Refresh to show updated login status
      }
    } catch (err) {
      console.error('Error creating login:', err);
      alert(err.message || 'Failed to create login account');
    }
  };

  const handleViewLoginDetails = async (student) => {
    console.log('🔍 Viewing login details for student:', student);
    
    try {
      if (!student.user_id) {
        console.log('❌ No user_id found for student');
        alert('This student does not have a user account yet.');
        return;
      }

      console.log('📡 Finding user data for user_id:', student.user_id);
      
      // ✅ Use Redux state instead of direct API call
      const user = users.find(u => u.id === student.user_id);
      console.log('✅ User found in Redux:', user);
      
      const role = user?.role_id ? { name: 'Student' } : null; // Role from session
      
      if (user) {
        console.log('👤 User found:', user);
        
        // Check if we have stored credentials for this student
        const storedCredsKey = `student_creds_${student.id}`;
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

        const studentDetails = {
          student,
          user: {
            ...user,
            role_name: role?.name || 'No role assigned',
            temp_password: tempPassword || user.temp_password // Try localStorage first, then database field
          }
        };
        
        console.log('📋 Setting student details:', studentDetails);
        setSelectedStudentDetails(studentDetails);
        setShowLoginDetailsModal(true);
        console.log('✅ Modal should now be visible');
        
        // If no password found, show helpful message
        if (!tempPassword && !user.temp_password) {
          console.log('⚠️ WARNING: Password not available for this student');
          console.log('💡 TIP: Passwords are only stored when created through the Add Student page');
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
    if (!selectedStudentDetails) return;

    const { student, user } = selectedStudentDetails;
    
    // Create text content
    const content = `
═══════════════════════════════════════════════
         STUDENT LOGIN CREDENTIALS
═══════════════════════════════════════════════

Student Information:
─────────────────────────────────────────────
Name:           ${student.first_name} ${student.last_name}
Student ID:     ${student.student_id}
Email:          ${student.email}
School Level:   ${student.schema_display_name || student.schema_name}

Login Credentials:
─────────────────────────────────────────────
Username:       ${user.username}
Password:       ${user.temp_password || '[Password not available - contact admin to reset]'}
Email:          ${user.email}
Role:           ${user.role_name}
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
Generated by: ${session?.user?.username || 'Admin'}
═══════════════════════════════════════════════
    `.trim();

    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${student.student_id}_login_credentials_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleCopyLoginDetails = () => {
    if (!selectedStudentDetails) return;

    const { student, user } = selectedStudentDetails;
    
    const text = `Student: ${student.first_name} ${student.last_name}
Student ID: ${student.student_id}
Username: ${user.username}
Password: ${user.temp_password || '[Not available - contact admin]'}
Email: ${user.email}
Role: ${user.role_name}
Status: ${user.is_active ? 'Active' : 'Inactive'}`;

    navigator.clipboard.writeText(text).then(() => {
      alert('Login details copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const handleExportCSV = () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student to export');
      return;
    }

    const selectedStudentData = students.filter(s => selectedStudents.includes(s.id));
    
    // CSV Header - now includes login credentials
    const headers = [
      'Student ID', 
      'First Name', 
      'Last Name', 
      'Email', 
      'Phone', 
      'Gender', 
      'Status', 
      'School Level',
      'Has Login', 
      'Username',
      'Password',
      'Guardian Name',
      'Guardian Phone',
      'Created At'
    ];
    
    // CSV Rows - fetch credentials from localStorage
    const rows = selectedStudentData.map(student => {
      let username = '';
      let password = '';
      
      if (student.user_id) {
        // Try to get stored credentials from localStorage
        const storedCreds = localStorage.getItem(`student_creds_${student.id}`);
        if (storedCreds) {
          try {
            const creds = JSON.parse(storedCreds);
            username = creds.username || '';
            password = creds.password || '';
          } catch (e) {
            console.error('Error parsing credentials:', e);
          }
        }
      }
      
      return [
        student.student_id,
        student.first_name,
        student.last_name,
        student.email,
        student.phone || '',
        student.gender || '',
        student.status,
        student.schema_display_name || student.schema_name || '',
        student.user_id ? 'Yes' : 'No',
        username,
        password,
        student.guardian_name || '',
        student.guardian_phone || '',
        new Date(student.created_at).toLocaleDateString()
      ];
    });
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students_with_credentials_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    alert(`Exported ${selectedStudents.length} student(s) with login credentials successfully!`);
  };

  const getLoginStatusBadge = (student) => {
    if (student.user_id) {
      return (
        <button 
          className="badge bg-success border-0" 
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Has Login badge clicked for student:', student.id, student.first_name);
            handleViewLoginDetails(student);
          }}
          title="Click to view login details"
        >
          <i className="fas fa-check-circle me-1"></i>Has Login
        </button>
      );
    }
    return <span className="badge bg-secondary"><i className="fas fa-times-circle me-1"></i>No Access</span>;
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

  // Check permissions
  if (!hasPermission('student.read')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to view students.</p>
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
        employeeName={selectedStudentName}
      />

      {/* Login Details Modal */}
      {showLoginDetailsModal && selectedStudentDetails && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fas fa-user-lock me-2"></i>
                  Student Login Details
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowLoginDetailsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Student Info Section */}
                <div className="card border-0 bg-light mb-3">
                  <div className="card-body">
                    <h6 className="card-title mb-3">
                      <i className="fas fa-user-graduate text-primary me-2"></i>
                      Student Information
                    </h6>
                    <div className="row">
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Full Name</small>
                        <strong>{selectedStudentDetails.student.first_name} {selectedStudentDetails.student.last_name}</strong>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Student ID</small>
                        <strong className="text-primary">{selectedStudentDetails.student.student_id}</strong>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Email</small>
                        <span>{selectedStudentDetails.student.email}</span>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">School Level</small>
                        <span>{selectedStudentDetails.student.schema_display_name || selectedStudentDetails.student.schema_name}</span>
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
                            value={selectedStudentDetails.user.username} 
                            readOnly 
                          />
                          <button 
                            className="btn btn-outline-secondary"
                            onClick={() => navigator.clipboard.writeText(selectedStudentDetails.user.username)}
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
                        {selectedStudentDetails.user.temp_password ? (
                          <div className="input-group">
                            <input 
                              type="text" 
                              className="form-control font-monospace" 
                              value={selectedStudentDetails.user.temp_password} 
                              readOnly 
                            />
                            <button 
                              className="btn btn-outline-secondary"
                              onClick={() => navigator.clipboard.writeText(selectedStudentDetails.user.temp_password)}
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
                            value={selectedStudentDetails.user.email} 
                            readOnly 
                          />
                          <button 
                            className="btn btn-outline-secondary"
                            onClick={() => navigator.clipboard.writeText(selectedStudentDetails.user.email)}
                            title="Copy email"
                          >
                            <i className="fas fa-copy"></i>
                          </button>
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label small text-muted mb-1">
                          <i className="fas fa-shield-alt me-1"></i>
                          Role
                        </label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={selectedStudentDetails.user.role_name} 
                          readOnly 
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label small text-muted mb-1">
                          <i className="fas fa-toggle-on me-1"></i>
                          Status
                        </label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={selectedStudentDetails.user.is_active ? 'Active' : 'Inactive'} 
                          readOnly 
                        />
                      </div>
                    </div>

                    {selectedStudentDetails.user.temp_password ? (
                      <div className="alert alert-success mb-0">
                        <i className="fas fa-check-circle me-2"></i>
                        <strong>Password Available:</strong> You can copy or download the credentials above. 
                        Store them securely and share with the parent/guardian.
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
                        <strong className="ms-2">{new Date(selectedStudentDetails.user.created_at).toLocaleString()}</strong>
                      </div>
                      <div className="col-md-6 mb-2">
                        <span className="text-muted">Email Verified:</span>
                        <strong className="ms-2">
                          {selectedStudentDetails.user.email_verified ? (
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
            <i className="fas fa-user-graduate text-primary-custom me-2"></i>
            Students
          </h2>
          <p className="text-muted mb-0">Manage student records and accounts</p>
        </div>
        <div className="d-flex gap-2">
          {selectedStudents.length > 0 && (
            <button 
              className="btn btn-success"
              onClick={handleExportCSV}
            >
              <i className="fas fa-file-export me-2"></i>
              Export Selected ({selectedStudents.length})
            </button>
          )}
          <Link href="/admin/dashboard/students/schemas" className="btn btn-outline-secondary">
            <i className="fas fa-list me-2"></i>
            Schemas
          </Link>
          {hasPermission('student.create') && (
            <>
              <Link href="/admin/dashboard/students/import" className="btn btn-outline-success">
                <i className="fas fa-file-import me-2"></i>
                Import CSV
              </Link>
              <Link href="/admin/dashboard/students/add" className="btn btn-primary-custom">
                <i className="fas fa-plus me-2"></i>
                Add Student
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {(reduxError || actionError) && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {reduxError || actionError}
          <button type="button" className="btn-close" onClick={() => setActionError('')}></button>
        </div>
      )}
      {actionNotice && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {actionNotice}
          <button type="button" className="btn-close" onClick={() => setActionNotice('')}></button>
        </div>
      )}

      {/* Selection Info Bar */}
      {selectedStudents.length > 0 && (
        <div className="alert alert-info d-flex justify-content-between align-items-center">
          <span>
            <i className="fas fa-check-circle me-2"></i>
            {selectedStudents.length} student(s) selected
          </span>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-sm btn-success"
              onClick={handleExportCSV}
            >
              <i className="fas fa-file-csv me-2"></i>
              Export as CSV
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSendLoginsBulk}
            >
              <i className="fas fa-envelope me-2"></i>
              Send Login Details
            </button>
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                setSelectedStudents([]);
                setSelectAll(false);
              }}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card card-stats">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Total Students</p>
                  <h3 className="mb-0">{students.length}</h3>
                </div>
                <div className="icon-shape bg-gradient-primary">
                  <i className="fas fa-user-graduate"></i>
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
                  <h3 className="mb-0">{students.filter(s => s.status === 'active').length}</h3>
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
                  <h3 className="mb-0">{students.filter(s => s.user_id).length}</h3>
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
                  <p className="text-muted mb-1">Selected</p>
                  <h3 className="mb-0">{selectedStudents.length}</h3>
                </div>
                <div className="icon-shape bg-gradient-warning">
                  <i className="fas fa-check-square"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <i className="fas fa-list me-2"></i>
              Student List
            </h5>
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={() => fetchStudents()}
              disabled={loading}
            >
              <i className="fas fa-sync me-2"></i>
              Refresh
            </button>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading students...</p>
            </div>
          ) : students.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Gender</th>
                    <th>Status</th>
                    <th>Login Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleSelectStudent(student.id)}
                        />
                      </td>
                      <td>
                        <strong className="text-primary">{student.student_id}</strong>
                      </td>
                      <td>
                        {student.first_name} {student.last_name}
                      </td>
                      <td>{student.email}</td>
                      <td>{student.phone || 'N/A'}</td>
                      <td>
                        {student.gender ? (
                          <span className="text-capitalize">{student.gender}</span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td>
                        <span className={`badge bg-${student.status === 'active' ? 'success' : 'secondary'}`}>
                          {student.status}
                        </span>
                      </td>
                      <td>
                        {getLoginStatusBadge(student)}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          {!student.user_id && student.email && hasPermission('user.create') && (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => handleCreateLogin(student)}
                              title="Create Login"
                            >
                              <i className="fas fa-user-plus"></i>
                            </button>
                          )}
                          {hasPermission('student.update') && (
                            <Link
                              href={`/admin/dashboard/students/${student.id}/edit`}
                              className="btn btn-outline-primary"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </Link>
                          )}
                          <Link
                            href={`/admin/dashboard/students/${student.id}`}
                            className="btn btn-outline-info"
                            title="View"
                          >
                            <i className="fas fa-eye"></i>
                          </Link>
                          {hasPermission('student.delete') && (
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteStudent(student.id)}
                              disabled={deleteLoading === student.id}
                              title="Delete"
                            >
                              {deleteLoading === student.id ? (
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
              <i className="fas fa-user-graduate text-muted" style={{ fontSize: '4rem' }}></i>
              <h5 className="mt-3 text-muted">No students found</h5>
              <p className="text-muted">Get started by adding your first student.</p>
              {hasPermission('student.create') && (
                <Link 
                  href="/admin/dashboard/students/add" 
                  className="btn btn-primary-custom mt-2"
                >
                  <i className="fas fa-plus me-2"></i>
                  Add Student
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
