'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useUsers, useRoles } from '@/hooks/useRedux';

export default function UsersPage() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermissions();
  
  // ✅ Redux - Get everything from hooks
  const { users, loading, error, fetchUsers, deleteUser, clearError } = useUsers();
  const { roles, fetchRoles } = useRoles();
  
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all'); // ✅ Role filter state

  // ✅ Fetch users and roles from Redux
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUsers();
      fetchRoles();
    }
  }, [status, fetchUsers, fetchRoles]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  // ✅ Filter users by role
  const filteredUsers = useMemo(() => {
    if (roleFilter === 'all') {
      return users;
    }
    if (roleFilter === 'no_role') {
      return users.filter(u => !u.role_id);
    }
    return users.filter(u => u.role_id === parseInt(roleFilter));
  }, [users, roleFilter]);

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedUsers(filteredUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleExportCSV = () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user to export');
      return;
    }

    const selectedUserData = users.filter(u => selectedUsers.includes(u.id));
    
    // CSV Header
    const headers = ['ID', 'Username', 'Email', 'Role', 'Status', 'Email Verified', 'Created At'];
    
    // CSV Rows
    const rows = selectedUserData.map(user => [
      user.id,
      user.username,
      user.email,
      user.role_name || 'No role',
      user.is_active ? 'Active' : 'Inactive',
      user.email_verified ? 'Yes' : 'No',
      new Date(user.created_at).toLocaleDateString()
    ]);
    
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
    link.download = `user_login_details_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    alert(`Exported ${selectedUsers.length} user(s) successfully!`);
  };

  const handleDelete = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (!window.confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(userId);
      alert('User deleted successfully!');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.message || 'Failed to delete user');
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
    return null;
  }

  // Check permissions
  if (!hasPermission('user.read')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to view users.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-users text-primary-custom me-2"></i>
            Users
          </h2>
          <p className="text-muted mb-0">Manage system users and login details</p>
        </div>
        <div className="d-flex gap-2">
          {selectedUsers.length > 0 && (
            <button 
              className="btn btn-success"
              onClick={handleExportCSV}
            >
              <i className="fas fa-file-export me-2"></i>
              Export Selected ({selectedUsers.length})
            </button>
          )}
          {hasPermission('user.create') && (
            <Link href="/admin/dashboard/users/add" className="btn btn-primary-custom">
              <i className="fas fa-plus me-2"></i>
              Add User
            </Link>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={clearError}></button>
        </div>
      )}

      {/* ✅ Role Filter */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <label htmlFor="roleFilter" className="form-label">
                <i className="fas fa-filter me-2"></i>
                Filter by Role
              </label>
              <select
                id="roleFilter"
                className="form-select"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setSelectedUsers([]); // Clear selection when filter changes
                  setSelectAll(false);
                }}
              >
                <option value="all">All Users ({users.length})</option>
                <option value="no_role">No Role Assigned ({users.filter(u => !u.role_id).length})</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name} ({users.filter(u => u.role_id === role.id).length})
                  </option>
                ))}
              </select>
              <small className="text-muted">
                Showing {filteredUsers.length} of {users.length} users
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card card-stats">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Total Users</p>
                  <h3 className="mb-0">{users.length}</h3>
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
                  <p className="text-muted mb-1">Active Users</p>
                  <h3 className="mb-0">{users.filter(u => u.is_active).length}</h3>
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
                  <p className="text-muted mb-1">With Roles</p>
                  <h3 className="mb-0">{users.filter(u => u.role_id).length}</h3>
                </div>
                <div className="icon-shape bg-gradient-info">
                  <i className="fas fa-user-tag"></i>
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
                  <h3 className="mb-0">{selectedUsers.length}</h3>
                </div>
                <div className="icon-shape bg-gradient-warning">
                  <i className="fas fa-check-square"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Info Bar */}
      {selectedUsers.length > 0 && (
        <div className="alert alert-info d-flex justify-content-between align-items-center">
          <span>
            <i className="fas fa-check-circle me-2"></i>
            {selectedUsers.length} user(s) selected
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
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                setSelectedUsers([]);
                setSelectAll(false);
              }}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <i className="fas fa-list me-2"></i>
              User List
            </h5>
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={fetchUsers}
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
              <p className="mt-2 text-muted">Loading users...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
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
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                        />
                      </td>
                      <td>{user.id}</td>
                      <td>
                        <strong>{user.username}</strong>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        {user.role_name ? (
                          <span className="badge bg-info">{user.role_name}</span>
                        ) : (
                          <span className="badge bg-secondary">No role</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge bg-${user.is_active ? 'success' : 'danger'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          <Link
                            href={`/admin/dashboard/users/${user.id}`}
                            className="btn btn-outline-info"
                            title="View"
                          >
                            <i className="fas fa-eye"></i>
                          </Link>
                          {hasPermission('user.update') && (
                            <Link
                              href={`/admin/dashboard/users/${user.id}/edit`}
                              className="btn btn-outline-primary"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </Link>
                          )}
                          {hasPermission('user.delete') && (
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(user.id)}
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
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
              <h5 className="mt-3 text-muted">
                {roleFilter === 'all' ? 'No users found' : 'No users found for this role'}
              </h5>
              <p className="text-muted">
                {roleFilter === 'all' 
                  ? 'Get started by adding your first user.' 
                  : 'Try selecting a different role filter or add new users.'}
              </p>
              {hasPermission('user.create') && roleFilter === 'all' && (
                <Link 
                  href="/admin/dashboard/users/add" 
                  className="btn btn-primary-custom mt-2"
                >
                  <i className="fas fa-plus me-2"></i>
                  Add User
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
