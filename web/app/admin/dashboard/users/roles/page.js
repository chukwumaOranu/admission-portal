'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { API_ENDPOINTS, apiService } from '@/services/api';

export default function UserRolesPage() {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Single assignment
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [assigning, setAssigning] = useState(false);
  
  // Bulk assignment
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkRole, setBulkRole] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      fetchData();
    }
  }, [status, session?.user?.id, session?.accessToken]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        apiService.get(API_ENDPOINTS.USERS.GET_ALL),
        apiService.get(API_ENDPOINTS.ROLES.GET_ALL)
      ]);
      
      setUsers(usersRes.data?.users || []);
      setRoles(rolesRes.data?.roles || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedUsers(users.map(u => u.id));
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

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      alert('Please select both a user and a role');
      return;
    }

    setAssigning(true);
    try {
      await apiService.post(
        API_ENDPOINTS.USER_ROLES.ASSIGN,
        { user_id: parseInt(selectedUser), role_id: parseInt(selectedRole) }
      );
      
      alert('Role assigned successfully!');
      setSelectedUser('');
      setSelectedRole('');
      fetchData();
    } catch (error) {
      console.error('Error assigning role:', error);
      alert(error.message || 'Failed to assign role');
    } finally {
      setAssigning(false);
    }
  };

  const handleBulkAssignRole = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    if (!bulkRole) {
      alert('Please select a role to assign');
      return;
    }

    if (!window.confirm(`Assign role to ${selectedUsers.length} user(s)?`)) {
      return;
    }

    setBulkAssigning(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Assign role to each selected user
      for (const userId of selectedUsers) {
        try {
          await apiService.post(
            API_ENDPOINTS.USER_ROLES.ASSIGN,
            { user_id: userId, role_id: parseInt(bulkRole) }
          );
          successCount++;
        } catch (err) {
          console.error(`Error assigning role to user ${userId}:`, err);
          errorCount++;
        }
      }

      alert(`Bulk assignment complete!\nSuccess: ${successCount}\nFailed: ${errorCount}`);
      
      // Clear selections
      setSelectedUsers([]);
      setSelectAll(false);
      setBulkRole('');
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error in bulk assignment:', error);
      alert('Bulk assignment failed');
    } finally {
      setBulkAssigning(false);
    }
  };

  const handleRemoveRole = async (userId, roleId) => {
    if (window.confirm('Are you sure you want to remove this role from the user?')) {
      try {
        await apiService.post(
          API_ENDPOINTS.USER_ROLES.REMOVE,
          { user_id: userId, role_id: roleId }
        );
        alert('Role removed successfully!');
        fetchData();
      } catch (error) {
        console.error('Error removing role:', error);
        alert('Failed to remove role');
      }
    }
  };

  const getUserRoles = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user || !user.role_id) return [];
    
    const role = roles.find(r => r.id === user.role_id);
    return role ? [{ 
      id: `${userId}-${user.role_id}`,
      user_id: userId, 
      role_id: user.role_id, 
      role_name: role.name 
    }] : [];
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
  if (!hasPermission('role.assign')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to assign roles.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-users-cog text-primary-custom me-2"></i>
            User Role Management
          </h2>
          <p className="text-muted mb-0">Assign roles to users and manage access levels</p>
        </div>
        <Link href="/admin/dashboard/users" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to Users
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      <div className="row">
        {/* Single Assignment Card */}
        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-user-tag me-2"></i>
                Assign Role to Single User
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Select User</label>
                <select
                  className="form-select"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Choose a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email}) {user.role_name ? `- Current: ${user.role_name}` : '- No role'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Select Role</label>
                <select
                  className="form-select"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Choose a role...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn-primary-custom w-100"
                onClick={handleAssignRole}
                disabled={!selectedUser || !selectedRole || assigning}
              >
                {assigning ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    Assigning...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check me-2"></i>
                    Assign Role
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Assignment Card */}
        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-users-cog me-2"></i>
                Bulk Role Assignment
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Select multiple users from the list below, then choose a role to assign to all of them at once.
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Selected Users: <strong>{selectedUsers.length}</strong>
                </label>
                {selectedUsers.length > 0 && (
                  <div className="mt-2">
                    {selectedUsers.map(userId => {
                      const user = users.find(u => u.id === userId);
                      return user ? (
                        <span key={userId} className="badge bg-primary me-1 mb-1">
                          {user.username}
                          <button
                            type="button"
                            className="btn-close btn-close-white ms-2"
                            onClick={() => handleSelectUser(userId)}
                            style={{ fontSize: '0.7em' }}
                          ></button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Select Role to Assign</label>
                <select
                  className="form-select"
                  value={bulkRole}
                  onChange={(e) => setBulkRole(e.target.value)}
                  disabled={loading || selectedUsers.length === 0}
                >
                  <option value="">Choose a role...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn-success w-100"
                onClick={handleBulkAssignRole}
                disabled={selectedUsers.length === 0 || !bulkRole || bulkAssigning}
              >
                {bulkAssigning ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    Assigning to {selectedUsers.length} user(s)...
                  </>
                ) : (
                  <>
                    <i className="fas fa-users-cog me-2"></i>
                    Assign Role to {selectedUsers.length} User(s)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User List with Selection */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <i className="fas fa-list me-2"></i>
              Users & Their Roles
            </h5>
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={fetchData}
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
            </div>
          ) : (
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
                    <th>Username</th>
                    <th>Email</th>
                    <th>Current Role</th>
                    <th>Status</th>
                    <th className="mobile-action-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const userRoles = getUserRoles(user.id);
                    return (
                      <tr key={user.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                          />
                        </td>
                        <td>
                          <strong>{user.username}</strong>
                          <div className="mobile-inline-actions d-md-none">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => {
                                setSelectedUser(user.id.toString());
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            >
                              <i className="fas fa-user-tag me-1"></i>
                              Assign
                            </button>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          {userRoles.length > 0 ? (
                            userRoles.map((ur) => (
                              <span key={ur.id} className="badge bg-info me-1">
                                {ur.role_name}
                                <button
                                  type="button"
                                  className="btn-close btn-close-white ms-2"
                                  onClick={() => handleRemoveRole(ur.user_id, ur.role_id)}
                                  style={{ fontSize: '0.7em' }}
                                ></button>
                              </span>
                            ))
                          ) : (
                            <span className="badge bg-secondary">No role assigned</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge bg-${user.is_active ? 'success' : 'danger'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="mobile-action-column">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              setSelectedUser(user.id.toString());
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                          >
                            <i className="fas fa-user-tag me-1"></i>
                            Assign
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
