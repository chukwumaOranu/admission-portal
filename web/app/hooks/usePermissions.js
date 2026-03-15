import { useCallback, useMemo, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { API_ENDPOINTS, apiService } from '@/services/api';


// Custom hook for permission checks using NextAuth session
export const usePermissions = () => {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get user data from NextAuth session
  const user = session?.user;
  const role = user?.role;
  const roleId = user?.role_id ?? user?.roleId;
  const sessionPermissions = useMemo(
    () => (Array.isArray(user?.permissions) ? user.permissions : []),
    [user?.permissions]
  );
  const normalizedRole = String(role || '').trim().toLowerCase().replace(/[_\s]+/g, ' ');
  const isSuperAdminUser = normalizedRole === 'super admin';

  // Fetch user's permissions based on their role
  useEffect(() => {
    const fetchUserPermissions = async () => {
      // Wait for session to be loaded
      if (status === 'loading') {
        return;
      }
      
      // If not authenticated, set loading to false
      if (!user?.id || status === 'unauthenticated') {
        setLoading(false);
        setPermissions([]);
        return;
      }
      
      setLoading(true);
      try {
        // 1) Prefer permissions attached to NextAuth session from login payload
        if (sessionPermissions.length > 0) {
          setPermissions(sessionPermissions);
          return;
        }

        // 2) Super Admin has full access without explicit permission list
        if (isSuperAdminUser) {
          setPermissions([]);
          return;
        }

        // 3) Fallback to profile endpoint (works for non-admin users)
        if (roleId) {
          const profileRes = await apiService.get(API_ENDPOINTS.USERS.PROFILE);
          const profilePermissions = profileRes?.data?.permissions || [];
          setPermissions(profilePermissions);
        } else {
          setPermissions([]);
        }
      } catch (error) {
        // Keep fallback quiet for non-critical permission loading
        if (isSuperAdminUser) {
          setPermissions([]); // Super Admin has all permissions
        } else {
          setPermissions([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, [status, user?.id, roleId, user?.role, isSuperAdminUser, sessionPermissions]);

  // Check if user has a specific permission
  const hasPermission = useCallback((permissionName) => {
    // Super Admin has all permissions
    if (isSuperAdminUser) {
      return true;
    }
    
    // Check if permission exists in array
    // Handles both string array and object array formats
    const hasSpecificPermission = permissions.some(p => {
      if (typeof p === 'string') {
        return p === permissionName;
      } else if (typeof p === 'object' && p !== null) {
        return p.name === permissionName || p.permission_name === permissionName;
      }
      return false;
    });
    
    return hasSpecificPermission;
  }, [isSuperAdminUser, permissions]);

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback((permissionNames) => {
    if (!Array.isArray(permissionNames)) return false;
    
    return permissionNames.some(permissionName => hasPermission(permissionName));
  }, [hasPermission]);

  // Check if user has all of the specified permissions
  const hasAllPermissions = useCallback((permissionNames) => {
    if (!Array.isArray(permissionNames)) return false;
    
    return permissionNames.every(permissionName => hasPermission(permissionName));
  }, [hasPermission]);

  // Get all user permissions
  const getUserPermissions = useCallback(() => {
    if (!user || !permissions.length) return [];
    return permissions;
  }, [user, permissions]);

  // Check if user can perform action on resource
  const canPerformAction = useCallback((resource, action) => {
    return hasPermission(`${resource}.${action}`) || hasPermission('*');
  }, [hasPermission]);

  // Check if user is admin
  const isAdmin = useCallback(() => {
    if (!user || !role) return false;
    
    return normalizedRole === 'admin' || isSuperAdminUser || hasPermission('admin.*');
  }, [user, role, normalizedRole, isSuperAdminUser, hasPermission]);

  // Check if user is super admin
  const isSuperAdmin = useCallback(() => {
    if (!user || !role) return false;
    
    return isSuperAdminUser || hasPermission('superadmin.*');
  }, [user, role, isSuperAdminUser, hasPermission]);

  // Get user role name
  const getUserRole = useCallback(() => {
    return role || 'User';
  }, [role]);

  // Get user role level (for hierarchy checks)
  const getUserRoleLevel = useCallback(() => {
    const roleLevels = {
      'Super Admin': 4,
      'Admin': 3,
      'Moderator': 2,
      'User': 1,
    };
    
    return roleLevels[getUserRole()] || 0;
  }, [getUserRole]);

  // Check if user has higher or equal role level
  const hasRoleLevel = useCallback((requiredLevel) => {
    return getUserRoleLevel() >= requiredLevel;
  }, [getUserRoleLevel]);

  // Check if user can manage another user
  const canManageUser = useCallback((targetUser) => {
    if (!user || !targetUser) return false;
    
    // Super admin can manage everyone
    if (isSuperAdmin()) return true;
    
    // Admin can manage non-admin users
    if (isAdmin() && targetUser.role !== 'Super Admin' && targetUser.role !== 'Admin') {
      return true;
    }
    
    // Users can only manage themselves
    return user.id === targetUser.id;
  }, [user, isSuperAdmin, isAdmin]);

  // Check if user can manage role
  const canManageRole = useCallback((targetRole) => {
    if (!user || !targetRole) return false;
    
    // Super admin can manage all roles
    if (isSuperAdmin()) return true;
    
    // Admin can manage non-admin roles
    if (isAdmin() && targetRole.name !== 'Super Admin' && targetRole.name !== 'Admin') {
      return true;
    }
    
    return false;
  }, [user, isSuperAdmin, isAdmin]);

  // Check if user is in any of the allowed roles
  const isInRoleList = useCallback((allowedRoles) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(role);
  }, [role]);

  // Memoized permission data
  const permissionData = useMemo(() => ({
    user,
    role,
    permissions: getUserPermissions(),
    isAdmin: isAdmin(),
    isSuperAdmin: isSuperAdmin(),
    roleName: getUserRole(),
    roleLevel: getUserRoleLevel(),
  }), [
    user,
    role,
    getUserPermissions,
    isAdmin,
    isSuperAdmin,
    getUserRole,
    getUserRoleLevel,
  ]);

  return {
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canPerformAction,
    
    // Role checks
    isAdmin,
    isSuperAdmin,
    hasRoleLevel,
    canManageUser,
    canManageRole,
    isInRoleList,
    
    // Data getters
    getUserPermissions,
    getUserRole,
    getUserRoleLevel,
    
    // Loading state
    loading,
    
    // Memoized data
    ...permissionData,
  };
};

// Hook for permission-based conditional rendering
export const usePermissionGate = (requiredPermissions = []) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  
  const checkAccess = useCallback(() => {
    if (requiredPermissions.length === 0) return true;
    
    if (Array.isArray(requiredPermissions[0])) {
      // Multiple permission sets (OR logic)
      return requiredPermissions.some(permissionSet => 
        hasAllPermissions(permissionSet)
      );
    } else {
      // Single permission set (AND logic)
      return hasAllPermissions(requiredPermissions);
    }
  }, [requiredPermissions, hasAllPermissions]);
  
  return {
    hasAccess: checkAccess(),
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};

// Hook for role-based access control
export const useRoleGate = (requiredRoles = [], requireAll = false) => {
  const { getUserRole, getUserRoleLevel, isAdmin, isSuperAdmin } = usePermissions();
  
  const checkRoleAccess = useCallback(() => {
    if (requiredRoles.length === 0) return true;
    
    const userRole = getUserRole();
    const userRoleLevel = getUserRoleLevel();
    
    if (requireAll) {
      // User must have all specified roles
      return requiredRoles.every(role => {
        if (typeof role === 'string') {
          return userRole === role;
        } else if (typeof role === 'number') {
          return userRoleLevel >= role;
        }
        return false;
      });
    } else {
      // User must have any of the specified roles
      return requiredRoles.some(role => {
        if (typeof role === 'string') {
          return userRole === role;
        } else if (typeof role === 'number') {
          return userRoleLevel >= role;
        }
        return false;
      });
    }
  }, [requiredRoles, requireAll, getUserRole, getUserRoleLevel]);
  
  return {
    hasAccess: checkRoleAccess(),
    userRole: getUserRole(),
    userRoleLevel: getUserRoleLevel(),
    isAdmin,
    isSuperAdmin,
  };
};
