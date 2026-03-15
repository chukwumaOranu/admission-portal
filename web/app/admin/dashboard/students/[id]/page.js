'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudents, useUsers } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';

export default function ViewStudentPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  const { students, loading: studentsLoading, fetchStudents, deleteStudent } = useStudents();
  const { users, fetchUsers } = useUsers();
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchStudent = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to find student in Redux store first
      const foundStudent = students.find(s => s.id == params.id);
      if (foundStudent) {
        setStudent(foundStudent);
        return;
      }
      
      // If not found, fetch from API
      const response = await apiService.get(API_ENDPOINTS.STUDENTS.GET_BY_ID(params.id));
      setStudent(response.data);
    } catch (err) {
      console.error('Error fetching student:', err);
      setError('Failed to fetch student details');
    } finally {
      setLoading(false);
    }
  }, [students, params.id]);

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken && params.id) {
      fetchStudent();
    }
  }, [status, session?.user?.id, session?.accessToken, params.id, fetchStudent]);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${student.first_name} ${student.last_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleteLoading(true);
      // Use Redux action instead of direct API call
      await deleteStudent(params.id);
      alert('Student deleted successfully!');
      router.push('/admin/dashboard/students');
    } catch (err) {
      console.error('Error deleting student:', err);
      alert('Failed to delete student');
      setDeleteLoading(false);
    }
  };

  // Show loading while checking authentication
  if (status === 'loading' || loading) {
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
        <p>You don&apos;t have permission to view student details.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error</h4>
          <p>{error}</p>
          <Link href="/admin/dashboard/students" className="btn btn-primary">
            Back to Students
          </Link>
        </div>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-user-graduate text-primary-custom me-2"></i>
            Student Details
          </h2>
          <p className="text-muted mb-0">{student.first_name} {student.last_name} - {student.student_id}</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/dashboard/students" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            Back to List
          </Link>
          {hasPermission('student.update') && (
            <Link href={`/admin/dashboard/students/${params.id}/edit`} className="btn btn-primary-custom">
              <i className="fas fa-edit me-2"></i>
              Edit Student
            </Link>
          )}
          {hasPermission('student.delete') && (
            <button
              className="btn btn-danger"
              onClick={handleDelete}
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
        {/* Main Content */}
        <div className="col-lg-8">
          {/* Basic Information */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-user me-2"></i>
                Basic Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="text-muted small">Student ID</label>
                  <p className="mb-0"><strong className="text-primary">{student.student_id}</strong></p>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="text-muted small">School Level</label>
                  <p className="mb-0">{student.schema_display_name || student.schema_name}</p>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="text-muted small">Status</label>
                  <p className="mb-0">
                    <span className={`badge bg-${student.status === 'active' ? 'success' : 'secondary'}`}>
                      {student.status}
                    </span>
                  </p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted small">First Name</label>
                  <p className="mb-0">{student.first_name}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted small">Last Name</label>
                  <p className="mb-0">{student.last_name}</p>
                </div>
                {student.middle_name && (
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Middle Name</label>
                    <p className="mb-0">{student.middle_name}</p>
                  </div>
                )}
                <div className="col-md-6 mb-3">
                  <label className="text-muted small">Gender</label>
                  <p className="mb-0 text-capitalize">{student.gender || 'Not specified'}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted small">Date of Birth</label>
                  <p className="mb-0">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-info text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-address-book me-2"></i>
                Contact Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="text-muted small">Email</label>
                  <p className="mb-0">{student.email}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted small">Phone</label>
                  <p className="mb-0">{student.phone || 'Not provided'}</p>
                </div>
                <div className="col-12 mb-3">
                  <label className="text-muted small">Address</label>
                  <p className="mb-0">{student.address || 'Not provided'}</p>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="text-muted small">City</label>
                  <p className="mb-0">{student.city || 'Not specified'}</p>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="text-muted small">State</label>
                  <p className="mb-0">{student.state || 'Not specified'}</p>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="text-muted small">Country</label>
                  <p className="mb-0">{student.country || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Guardian Information */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-warning text-dark">
              <h5 className="card-title mb-0">
                <i className="fas fa-user-friends me-2"></i>
                Guardian/Emergency Contact
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="text-muted small">Guardian Name</label>
                  <p className="mb-0">{student.guardian_name || 'Not provided'}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted small">Relationship</label>
                  <p className="mb-0">{student.guardian_relationship || 'Not specified'}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted small">Guardian Phone</label>
                  <p className="mb-0">{student.guardian_phone || 'Not provided'}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted small">Guardian Email</label>
                  <p className="mb-0">{student.guardian_email || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Previous School Information */}
          {(student.previous_school || student.graduation_year) && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-secondary text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-school me-2"></i>
                  Previous School Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-8 mb-3">
                    <label className="text-muted small">Previous School</label>
                    <p className="mb-0">{student.previous_school || 'Not provided'}</p>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="text-muted small">Year Left</label>
                    <p className="mb-0">{student.graduation_year || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* System Access Card */}
          {student.user_id ? (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-success text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-user-lock me-2"></i>
                  System Access
                </h5>
              </div>
              <div className="card-body">
                <div className="alert alert-success mb-3">
                  <i className="fas fa-check-circle me-2"></i>
                  <strong>Account Active</strong>
                  <p className="mb-0 small">This student has portal access</p>
                </div>
                <Link 
                  href={`/admin/dashboard/users/${student.user_id}`}
                  className="btn btn-outline-success btn-sm w-100 mb-2"
                >
                  <i className="fas fa-user-cog me-2"></i>
                  View User Account
                </Link>
                <Link 
                  href={`/admin/dashboard/users/roles`}
                  className="btn btn-outline-primary btn-sm w-100"
                >
                  <i className="fas fa-shield-alt me-2"></i>
                  Manage Role
                </Link>
              </div>
            </div>
          ) : (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-secondary text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-user-lock me-2"></i>
                  System Access
                </h5>
              </div>
              <div className="card-body">
                <div className="alert alert-warning mb-3">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>No Account</strong>
                  <p className="mb-0 small">This student doesn&apos;t have portal access yet</p>
                </div>
                {hasPermission('user.create') && (
                  <button 
                    className="btn btn-success btn-sm w-100"
                    onClick={() => router.push(`/admin/dashboard/students/${params.id}/create-login`)}
                  >
                    <i className="fas fa-user-plus me-2"></i>
                    Create Login Account
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Record Information */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Record Information
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="text-muted small">Created By</label>
                <p className="mb-0">{student.created_by_username || 'System'}</p>
              </div>
              <div className="mb-3">
                <label className="text-muted small">Created At</label>
                <p className="mb-0">{new Date(student.created_at).toLocaleString()}</p>
              </div>
              <div className="mb-0">
                <label className="text-muted small">Last Updated</label>
                <p className="mb-0">{new Date(student.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
