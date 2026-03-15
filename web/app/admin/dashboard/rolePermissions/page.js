'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRoles, usePermissionsData, useRolePermissions } from '@/hooks/useRedux';

export default function RolePermissionsPage() {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  // Redux state
  const { roles, fetchRoles } = useRoles();
  const { permissions, fetchPermissions } = usePermissionsData();
  const {
    rolePermissions,
    loading,
    error,
    fetchAllRolePermissions,
    assignPermissionsToRole,
    removePermissionFromRole
  } = useRolePermissions();
  
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      fetchRoles();
      fetchPermissions();
      fetchAllRolePermissions();
    }
  }, [status, session?.user?.id, session?.accessToken, fetchRoles, fetchPermissions, fetchAllRolePermissions]);

  const handleAssignPermissions = async () => {
    if (!selectedRole || selectedPermissions.length === 0) {
      alert('Please select a role and at least one permission');
      return;
    }

    setAssigning(true);
    try {
      await assignPermissionsToRole({
        roleId: selectedRole,
        permissionIds: selectedPermissions
      });
      
      alert('Permissions assigned successfully!');
      setSelectedRole('');
      setSelectedPermissions([]);
      // Refresh data from Redux
      fetchAllRolePermissions();
    } catch (error) {
      console.error('Error assigning permissions:', error);
      alert('Failed to assign permissions');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemovePermission = async (roleId, permissionId) => {
    if (window.confirm('Are you sure you want to remove this permission from the role?')) {
      try {
        await removePermissionFromRole({ roleId, permissionId });
        alert('Permission removed successfully!');
        // Refresh data from Redux
        fetchAllRolePermissions();
      } catch (error) {
        console.error('Error removing permission:', error);
        alert('Failed to remove permission');
      }
    }
  };

  const getRolePermissions = (roleId) => {
    return rolePermissions.filter(rp => rp.role_id === roleId);
  };

  const isPermissionAssigned = (roleId, permissionId) => {
    return rolePermissions.some(rp => rp.role_id === roleId && rp.permission_id === permissionId);
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

  return (
    <div className="role-permissions-page">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-link text-primary me-2"></i>
            Role Permission Management
          </h2>
          <p className="text-muted mb-0">Assign permissions to roles and manage access controls</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Assignment Form */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-plus-circle me-2"></i>
            Assign Permissions to Role
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <label className="form-label">Select Role</label>
              <select 
                className="form-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="">Choose a role...</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Select Permissions</label>
              <div className="border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {permissions.map(permission => (
                  <div key={permission.id} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`permission-${permission.id}`}
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, permission.id]);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id));
                        }
                      }}
                    />
                    <label className="form-check-label" htmlFor={`permission-${permission.id}`}>
                      <strong>{permission.name}</strong>
                      <br />
                      <small className="text-muted">{permission.description}</small>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button 
                className="btn btn-primary w-100"
                onClick={handleAssignPermissions}
                disabled={assigning || !selectedRole || selectedPermissions.length === 0}
              >
                {assigning ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Assigning...
                  </>
                ) : (
                  <>
                    <i className="fas fa-link me-2"></i>
                    Assign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Role-Permission Assignments */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-list me-2"></i>
            Current Role-Permission Assignments
          </h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="row">
              {roles.map(role => {
                const rolePerms = getRolePermissions(role.id);
                return (
                  <div key={role.id} className="col-md-6 col-lg-4 mb-4">
                    <div className="card h-100">
                      <div className="card-header">
                        <h6 className="mb-0">
                          <i className="fas fa-user-shield text-primary me-2"></i>
                          {role.name}
                        </h6>
                        <small className="text-muted">{rolePerms.length} permissions</small>
                      </div>
                      <div className="card-body">
                        {rolePerms.length === 0 ? (
                          <p className="text-muted mb-0">No permissions assigned</p>
                        ) : (
                          <div className="d-flex flex-wrap gap-1">
                            {rolePerms.map(rp => {
                              const permission = permissions.find(p => p.id === rp.permission_id);
                              return (
                                <span key={rp.id} className="badge bg-primary position-relative">
                                  {permission?.name || 'Unknown'}
                                  <button
                                    className="btn-close btn-close-white position-absolute top-0 end-0"
                                    style={{ fontSize: '0.5rem', padding: '0.1rem' }}
                                    onClick={() => handleRemovePermission(role.id, rp.permission_id)}
                                    title="Remove permission"
                                  ></button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
