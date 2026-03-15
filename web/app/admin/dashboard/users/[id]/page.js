'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useUsers, useRoles } from '@/hooks/useRedux';

export default function ViewUserPage() {
  const router = useRouter();
  const params = useParams();
  const { status } = useSession();
  const { hasPermission } = usePermissions();
  
  // ✅ Redux
  const { users, loading, fetchUsers, deleteUser } = useUsers();
  const { roles, fetchRoles } = useRoles();
  
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUsers();
      fetchRoles();
    }
  }, [status, fetchUsers, fetchRoles]);

  const user = useMemo(() => {
    if (!params.id) return null;
    return users.find((u) => u.id === parseInt(params.id, 10)) || null;
  }, [users, params.id]);

  const userRole = useMemo(() => {
    if (!user?.role_id) return null;
    return roles.find((r) => r.id === user.role_id) || null;
  }, [roles, user]);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(user.id);
      alert('User deleted successfully!');
      router.replace('/admin/dashboard/users');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.message || 'Failed to delete user');
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

  if (status === 'unauthenticated') {
    router.replace('/login');
    return null;
  }

  if (!hasPermission('user.read')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to view user details.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="alert alert-warning" role="alert">
        <h4 className="alert-heading">User Not Found</h4>
        <p>The requested user could not be found.</p>
        <Link href="/admin/dashboard/users" className="btn btn-primary">
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>User Details</h2>
          <p className="text-muted">View user information</p>
        </div>
        <div className="d-flex gap-2">
          <Link
            href="/admin/dashboard/users"
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to List
          </Link>
          {hasPermission('user.update') && (
            <Link
              href={`/admin/dashboard/users/${user.id}/edit`}
              className="btn btn-primary"
            >
              <i className="fas fa-edit me-2"></i>
              Edit User
            </Link>
          )}
          {hasPermission('user.delete') && (
            <button
              className="btn btn-danger"
              onClick={handleDelete}
            >
              <i className="fas fa-trash me-2"></i>
              Delete User
            </button>
          )}
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Basic Information</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>User ID:</strong>
                </div>
                <div className="col-md-8">
                  {user.id}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Username:</strong>
                </div>
                <div className="col-md-8">
                  <code>{user.username}</code>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Email:</strong>
                </div>
                <div className="col-md-8">
                  {user.email}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Role:</strong>
                </div>
                <div className="col-md-8">
                  {user.role_name ? (
                    <span className="badge bg-info">{user.role_name}</span>
                  ) : (
                    <span className="badge bg-secondary">No role assigned</span>
                  )}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Status:</strong>
                </div>
                <div className="col-md-8">
                  <span className={`badge bg-${user.is_active ? 'success' : 'danger'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Email Verified:</strong>
                </div>
                <div className="col-md-8">
                  {user.email_verified ? (
                    <span className="text-success">
                      <i className="fas fa-check-circle me-1"></i>
                      Yes
                    </span>
                  ) : (
                    <span className="text-muted">
                      <i className="fas fa-times-circle me-1"></i>
                      No
                    </span>
                  )}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Created:</strong>
                </div>
                <div className="col-md-8">
                  {new Date(user.created_at).toLocaleString()}
                </div>
              </div>
              {user.updated_at && (
                <div className="row">
                  <div className="col-md-4">
                    <strong>Last Updated:</strong>
                  </div>
                  <div className="col-md-8">
                    {new Date(user.updated_at).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {userRole && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Role Details</h5>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-4">
                    <strong>Role Name:</strong>
                  </div>
                  <div className="col-md-8">
                    {userRole.name}
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-4">
                    <strong>Role Description:</strong>
                  </div>
                  <div className="col-md-8">
                    {userRole.description || 'No description'}
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-4">
                    <strong>Manage Role:</strong>
                  </div>
                  <div className="col-md-8">
                    <Link
                      href="/admin/dashboard/users/roles"
                      className="btn btn-sm btn-outline-primary"
                    >
                      <i className="fas fa-user-tag me-1"></i>
                      Assign Role
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                {hasPermission('user.update') && (
                  <Link
                    href={`/admin/dashboard/users/${user.id}/edit`}
                    className="btn btn-outline-primary"
                  >
                    <i className="fas fa-edit me-2"></i>
                    Edit User
                  </Link>
                )}
                <Link
                  href="/admin/dashboard/users/roles"
                  className="btn btn-outline-info"
                >
                  <i className="fas fa-user-tag me-2"></i>
                  Manage Roles
                </Link>
                {hasPermission('user.delete') && (
                  <button
                    className="btn btn-outline-danger"
                    onClick={handleDelete}
                  >
                    <i className="fas fa-trash me-2"></i>
                    Delete User
                  </button>
                )}
                <Link
                  href="/admin/dashboard/users"
                  className="btn btn-outline-secondary"
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Back to List
                </Link>
              </div>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h5 className="mb-0">Account Status</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <small className="text-muted">Status</small>
                <h4 className="mb-0">
                  <span className={`badge bg-${user.is_active ? 'success' : 'danger'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </h4>
              </div>
              <div className="mb-3">
                <small className="text-muted">Email Verified</small>
                <h4 className="mb-0">
                  {user.email_verified ? (
                    <i className="fas fa-check-circle text-success fa-2x"></i>
                  ) : (
                    <i className="fas fa-times-circle text-muted fa-2x"></i>
                  )}
                </h4>
              </div>
              {user.temp_password && (
                <div>
                  <small className="text-muted">Password Status</small>
                  <h4 className="mb-0">
                    <span className="badge bg-warning">
                      <i className="fas fa-exclamation-triangle me-1"></i>
                      Temporary
                    </span>
                  </h4>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
