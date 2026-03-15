/**
 * Permission and Role Mapping Configuration
 * Centralized configuration for menu visibility and route protection
 */

// Super Admin Only Routes - These routes should never be accessible to other roles
export const SUPER_ADMIN_ONLY_ROUTES = [
  '/admin/dashboard/roles',
  '/admin/dashboard/roles/add',
  '/admin/dashboard/permissions',
  '/admin/dashboard/rolePermissions',
  '/admin/dashboard/settings/system',
  '/admin/dashboard/settings/security',
];

// Admin+ Routes (Super Admin and Admin can access)
export const ADMIN_PLUS_ROUTES = [
  '/admin/dashboard/users',
  '/admin/dashboard/users/add',
  '/admin/dashboard/users/roles',
  '/admin/dashboard/settings/school',
  '/admin/dashboard/settings/email',
  '/admin/dashboard/settings/uploads',
];

// Permission requirements for main sections
export const SECTION_PERMISSIONS = {
  dashboard: null, // No permission needed
  applications: 'application.read',
  payments: 'payment.read',
  exams: 'exam.read',
  employees: 'employee.read',
  users: 'user.read',
  roles: null, // Check by role instead
  settings: 'settings.read',
};

// Role hierarchy (for checking if role has sufficient level)
export const ROLE_HIERARCHY = {
  'Super Admin': 100,
  'Admin': 80,
  'Manager': 60,
  'HR Manager': 60,
  'Finance Manager': 60,
  'Employee': 40,
  'Student': 20,
  'Guest': 10,
};

/**
 * Check if user's role meets minimum required role level
 * @param {string} userRole - Current user's role
 * @param {string} requiredRole - Minimum required role
 * @returns {boolean}
 */
export const hasRoleLevel = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
};

/**
 * Check if user is in any of the allowed roles
 * @param {string} userRole - Current user's role
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {boolean}
 */
export const isInRole = (userRole, allowedRoles) => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole);
};

/**
 * Check if user is Super Admin
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const isSuperAdmin = (userRole) => {
  return userRole === 'Super Admin';
};

/**
 * Check if route is accessible by user role
 * @param {string} pathname - Route pathname
 * @param {string} userRole - Current user's role
 * @returns {boolean}
 */
export const canAccessRoute = (pathname, userRole) => {
  // Check Super Admin only routes
  if (SUPER_ADMIN_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
    return isSuperAdmin(userRole);
  }
  
  // Check Admin+ routes
  if (ADMIN_PLUS_ROUTES.some(route => pathname.startsWith(route))) {
    return hasRoleLevel(userRole, 'Admin');
  }
  
  // Default: accessible to all authenticated users
  return true;
};

const permissionMap = {
  SUPER_ADMIN_ONLY_ROUTES,
  ADMIN_PLUS_ROUTES,
  SECTION_PERMISSIONS,
  ROLE_HIERARCHY,
  hasRoleLevel,
  isInRole,
  isSuperAdmin,
  canAccessRoute,
};

export default permissionMap;
