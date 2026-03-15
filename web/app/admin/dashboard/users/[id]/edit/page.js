'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useUsers, useRoles } from '@/hooks/useRedux';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermissions();
  
  // ✅ Redux
  const { users, loading, error, fetchUsers, updateUser } = useUsers();
  const { roles, fetchRoles } = useRoles();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role_id: '',
    is_active: true,
    email_verified: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUsers();
      fetchRoles();
    }
  }, [status, fetchUsers, fetchRoles]);

  useEffect(() => {
    if (users.length > 0 && params.id) {
      const user = users.find(u => u.id === parseInt(params.id));
      if (user) {
        setFormData({
          username: user.username || '',
          email: user.email || '',
          role_id: user.role_id || '',
          is_active: user.is_active !== undefined ? user.is_active : true,
          email_verified: user.email_verified || false
        });
      }
    }
  }, [users, params.id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      // ✅ Redux Action
      await updateUser(parseInt(params.id), formData);
      
      setSubmitSuccess(true);
      setTimeout(() => {
        router.push(`/admin/dashboard/users/${params.id}`);
      }, 1500);
    } catch (err) {
      console.error('Error updating user:', err);
      setSubmitError(err.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!hasPermission('user.update')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to edit users.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Edit User</h2>
          <p className="text-muted">Update user information</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => {}}></button>
        </div>
      )}

      {submitError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {submitError}
          <button type="button" className="btn-close" onClick={() => setSubmitError('')}></button>
        </div>
      )}

      {submitSuccess && (
        <div className="alert alert-success" role="alert">
          User updated successfully! Redirecting...
        </div>
      )}

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">User Information</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    Username <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                  <small className="text-muted">
                    Unique username for login
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                  <small className="text-muted">
                    User&apos;s email address
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="role_id" className="form-label">
                    Role
                  </label>
                  <select
                    className="form-select"
                    id="role_id"
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    <option value="">-- No Role --</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">
                    Assign a role to this user
                  </small>
                </div>

                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    <label className="form-check-label" htmlFor="is_active">
                      Active User
                    </label>
                    <small className="form-text text-muted d-block">
                      Inactive users cannot log in
                    </small>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="email_verified"
                      name="email_verified"
                      checked={formData.email_verified}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    <label className="form-check-label" htmlFor="email_verified">
                      Email Verified
                    </label>
                    <small className="form-text text-muted d-block">
                      Mark email as verified
                    </small>
                  </div>
                </div>

                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                  >
                    <i className="fas fa-times me-2"></i>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Update User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Tips</h5>
            </div>
            <div className="card-body">
              <ul className="mb-0">
                <li className="mb-2">
                  <strong>Username:</strong> Cannot be changed after creation
                </li>
                <li className="mb-2">
                  <strong>Email:</strong> Must be unique in the system
                </li>
                <li className="mb-2">
                  <strong>Role:</strong> Determines user permissions
                </li>
                <li className="mb-2">
                  <strong>Active Status:</strong> Inactive users cannot log in
                </li>
                <li>
                  <strong>Password:</strong> Use &quot;Reset Password&quot; to change
                </li>
              </ul>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h5 className="mb-0">Security</h5>
            </div>
            <div className="card-body">
              <p className="text-muted mb-2">
                <i className="fas fa-info-circle me-1"></i>
                Password management
              </p>
              <button
                className="btn btn-outline-warning w-100"
                onClick={() => alert('Password reset feature coming soon!')}
              >
                <i className="fas fa-key me-2"></i>
                Reset Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
