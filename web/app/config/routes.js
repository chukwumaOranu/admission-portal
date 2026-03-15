// Route configuration for the application
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN_REGISTER: '/admin/register',
  
  // Protected routes
  DASHBOARD: '/admin/dashboard',
  USERS: '/admin/dashboard/users',
  ROLES: '/admin/dashboard/roles',
  PERMISSIONS: '/admin/dashboard/permissions',
  ROLE_PERMISSIONS: '/admin/dashboard/rolePermissions',
  SETTINGS: '/admin/dashboard/settings',
  PROFILE: '/admin/dashboard/profile',
  
  // API routes
  API: {
    HEALTH: '/api/health',
    AUTH: {
      LOGIN: '/api/users/login',
      REGISTER: '/api/users/register',
      LOGOUT: '/api/users/logout',
      CHECK_AUTH: '/api/users/check-auth',
      REFRESH_TOKEN: '/api/users/refresh-token',
      CHANGE_PASSWORD: '/api/users/change-password',
      PROFILE: '/api/users/profile',
    },
    USERS: {
      BASE: '/api/users',
      BY_ID: (id) => `/api/users/${id}`,
      ASSIGN_ROLE: (id) => `/api/users/${id}/assign-role`,
      PERMISSIONS: (id) => `/api/users/${id}/permissions`,
      CHECK_PERMISSION: (id) => `/api/users/${id}/check-permission`,
    },
    ROLES: {
      BASE: '/api/roles',
      BY_ID: (id) => `/api/roles/${id}`,
      PERMISSIONS: (id) => `/api/roles/${id}/permissions`,
      USERS: (id) => `/api/roles/${id}/users`,
    },
    PERMISSIONS: {
      BASE: '/api/permissions',
      BY_ID: (id) => `/api/permissions/${id}`,
      ROLES: (id) => `/api/permissions/${id}/roles`,
      RESOURCES: '/api/permissions/resources',
      ACTIONS: '/api/permissions/actions',
      GROUPED: '/api/permissions/grouped',
      BULK: '/api/permissions/bulk',
    },
    ROLE_PERMISSIONS: {
      BASE: '/api/role-permissions',
      BY_ID: (id) => `/api/role-permissions/${id}`,
      BULK: '/api/role-permissions/bulk',
      STATISTICS: '/api/role-permissions/statistics',
      BY_ROLE: (roleId) => `/api/role-permissions/role/${roleId}/permissions`,
      BY_PERMISSION: (permissionId) => `/api/role-permissions/permission/${permissionId}/roles`,
    },
  },
};

// Route permissions configuration
export const ROUTE_PERMISSIONS = {
  [ROUTES.DASHBOARD]: [],
  [ROUTES.USERS]: ['users.read'],
  [ROUTES.ROLES]: ['roles.read'],
  [ROUTES.PERMISSIONS]: ['permissions.read'],
  [ROUTES.ROLE_PERMISSIONS]: ['role_permissions.read'],
  [ROUTES.SETTINGS]: ['settings.read'],
  [ROUTES.PROFILE]: [],
};

// Route roles configuration
export const ROUTE_ROLES = {
  [ROUTES.DASHBOARD]: ['User', 'Moderator', 'Admin', 'Super Admin'],
  [ROUTES.USERS]: ['Admin', 'Super Admin'],
  [ROUTES.ROLES]: ['Admin', 'Super Admin'],
  [ROUTES.PERMISSIONS]: ['Admin', 'Super Admin'],
  [ROUTES.ROLE_PERMISSIONS]: ['Admin', 'Super Admin'],
  [ROUTES.SETTINGS]: ['Super Admin'],
  [ROUTES.PROFILE]: ['User', 'Moderator', 'Admin', 'Super Admin'],
};

// Route metadata
export const ROUTE_METADATA = {
  [ROUTES.HOME]: {
    title: 'Home',
    description: 'DeepFlux Admissions Portal',
    requiresAuth: false,
  },
  [ROUTES.LOGIN]: {
    title: 'Login',
    description: 'Admin Login - DeepFlux Admissions',
    requiresAuth: false,
  },
  [ROUTES.REGISTER]: {
    title: 'Register',
    description: 'User Registration - DeepFlux Admissions',
    requiresAuth: false,
  },
  [ROUTES.ADMIN_REGISTER]: {
    title: 'Admin Register',
    description: 'Admin Registration - DeepFlux Admissions',
    requiresAuth: false,
  },
  [ROUTES.DASHBOARD]: {
    title: 'Dashboard',
    description: 'Admin Dashboard - DeepFlux Admissions',
    requiresAuth: true,
  },
  [ROUTES.USERS]: {
    title: 'User Management',
    description: 'Manage Users - DeepFlux Admissions',
    requiresAuth: true,
    requiredRole: 'Admin',
  },
  [ROUTES.ROLES]: {
    title: 'Role Management',
    description: 'Manage Roles - DeepFlux Admissions',
    requiresAuth: true,
    requiredRole: 'Admin',
  },
  [ROUTES.PERMISSIONS]: {
    title: 'Permission Management',
    description: 'Manage Permissions - DeepFlux Admissions',
    requiresAuth: true,
    requiredRole: 'Admin',
  },
  [ROUTES.ROLE_PERMISSIONS]: {
    title: 'Role-Permission Management',
    description: 'Manage Role-Permission Assignments - DeepFlux Admissions',
    requiresAuth: true,
    requiredRole: 'Admin',
  },
  [ROUTES.SETTINGS]: {
    title: 'Settings',
    description: 'System Settings - DeepFlux Admissions',
    requiresAuth: true,
    requiredRole: 'Super Admin',
  },
  [ROUTES.PROFILE]: {
    title: 'Profile',
    description: 'User Profile - DeepFlux Admissions',
    requiresAuth: true,
  },
};

// Navigation menu configuration
export const NAVIGATION_MENU = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: 'fas fa-tachometer-alt',
    href: ROUTES.DASHBOARD,
    permissions: [],
    roles: ['User', 'Moderator', 'Admin', 'Super Admin'],
    children: [
      {
        title: 'Overview',
        href: ROUTES.DASHBOARD,
        permissions: [],
        roles: ['User', 'Moderator', 'Admin', 'Super Admin'],
      },
      {
        title: 'Analytics',
        href: `${ROUTES.DASHBOARD}/analytics`,
        permissions: ['analytics.read'],
        roles: ['Admin', 'Super Admin'],
      },
      {
        title: 'Reports',
        href: `${ROUTES.DASHBOARD}/reports`,
        permissions: ['reports.read'],
        roles: ['Admin', 'Super Admin'],
      },
    ],
  },
  {
    id: 'users',
    title: 'User Management',
    icon: 'fas fa-users',
    href: ROUTES.USERS,
    permissions: ['users.read'],
    roles: ['Admin', 'Super Admin'],
    children: [
      {
        title: 'All Users',
        href: ROUTES.USERS,
        permissions: ['users.read'],
        roles: ['Admin', 'Super Admin'],
      },
      {
        title: 'Add User',
        href: `${ROUTES.USERS}/add`,
        permissions: ['users.create'],
        roles: ['Admin', 'Super Admin'],
      },
      {
        title: 'User Roles',
        href: `${ROUTES.USERS}/roles`,
        permissions: ['users.read', 'roles.read'],
        roles: ['Admin', 'Super Admin'],
      },
    ],
  },
  {
    id: 'roles',
    title: 'Role Management',
    icon: 'fas fa-user-shield',
    href: ROUTES.ROLES,
    permissions: ['roles.read'],
    roles: ['Admin', 'Super Admin'],
    children: [
      {
        title: 'All Roles',
        href: ROUTES.ROLES,
        permissions: ['roles.read'],
        roles: ['Admin', 'Super Admin'],
      },
      {
        title: 'Add Role',
        href: `${ROUTES.ROLES}/add`,
        permissions: ['roles.create'],
        roles: ['Admin', 'Super Admin'],
      },
      {
        title: 'Role Permissions',
        href: `${ROUTES.ROLES}/permissions`,
        permissions: ['roles.read', 'permissions.read'],
        roles: ['Admin', 'Super Admin'],
      },
    ],
  },
  {
    id: 'permissions',
    title: 'Permissions',
    icon: 'fas fa-key',
    href: ROUTES.PERMISSIONS,
    permissions: ['permissions.read'],
    roles: ['Admin', 'Super Admin'],
    children: [
      {
        title: 'All Permissions',
        href: ROUTES.PERMISSIONS,
        permissions: ['permissions.read'],
        roles: ['Admin', 'Super Admin'],
      },
      {
        title: 'Add Permission',
        href: `${ROUTES.PERMISSIONS}/add`,
        permissions: ['permissions.create'],
        roles: ['Admin', 'Super Admin'],
      },
      {
        title: 'Permission Groups',
        href: `${ROUTES.PERMISSIONS}/groups`,
        permissions: ['permissions.read'],
        roles: ['Admin', 'Super Admin'],
      },
    ],
  },
  {
    id: 'rolePermissions',
    title: 'Role Permissions',
    icon: 'fas fa-link',
    href: ROUTES.ROLE_PERMISSIONS,
    permissions: ['role_permissions.read'],
    roles: ['Admin', 'Super Admin'],
    children: [
      {
        title: 'Assignments',
        href: ROUTES.ROLE_PERMISSIONS,
        permissions: ['role_permissions.read'],
        roles: ['Admin', 'Super Admin'],
      },
      {
        title: 'Bulk Assign',
        href: `${ROUTES.ROLE_PERMISSIONS}/bulk`,
        permissions: ['role_permissions.create'],
        roles: ['Admin', 'Super Admin'],
      },
      {
        title: 'Statistics',
        href: `${ROUTES.ROLE_PERMISSIONS}/statistics`,
        permissions: ['role_permissions.read'],
        roles: ['Admin', 'Super Admin'],
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'fas fa-cog',
    href: ROUTES.SETTINGS,
    permissions: ['settings.read'],
    roles: ['Super Admin'],
    children: [
      {
        title: 'General',
        href: ROUTES.SETTINGS,
        permissions: ['settings.read'],
        roles: ['Super Admin'],
      },
      {
        title: 'Email',
        href: `${ROUTES.SETTINGS}/email`,
        permissions: ['settings.read', 'email.read'],
        roles: ['Super Admin'],
      },
      {
        title: 'Security',
        href: `${ROUTES.SETTINGS}/security`,
        permissions: ['settings.read', 'security.read'],
        roles: ['Super Admin'],
      },
      {
        title: 'Backup',
        href: `${ROUTES.SETTINGS}/backup`,
        permissions: ['settings.read', 'backup.read'],
        roles: ['Super Admin'],
      },
    ],
  },
];

// Helper functions
export const getRouteMetadata = (pathname) => {
  return ROUTE_METADATA[pathname] || {
    title: 'Page',
    description: 'DeepFlux Admissions Portal',
    requiresAuth: true,
  };
};

export const getRoutePermissions = (pathname) => {
  return ROUTE_PERMISSIONS[pathname] || [];
};

export const getRouteRoles = (pathname) => {
  return ROUTE_ROLES[pathname] || [];
};

export const isRoutePublic = (pathname) => {
  return !getRouteMetadata(pathname).requiresAuth;
};

export const isRouteProtected = (pathname) => {
  return getRouteMetadata(pathname).requiresAuth;
};

export const getRequiredRole = (pathname) => {
  return getRouteMetadata(pathname).requiredRole;
};

export const getRequiredPermissions = (pathname) => {
  return getRoutePermissions(pathname);
};

export const canAccessRoute = (pathname, userRole, userPermissions = []) => {
  const metadata = getRouteMetadata(pathname);
  
  // Public routes are always accessible
  if (!metadata.requiresAuth) {
    return true;
  }
  
  // Check role requirement
  if (metadata.requiredRole) {
    if (userRole !== metadata.requiredRole && userRole !== 'Super Admin') {
      return false;
    }
  }
  
  // Check permission requirements
  const requiredPermissions = getRoutePermissions(pathname);
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every(permission => 
      userPermissions.some(p => p.name === permission || p.name === '*')
    );
    
    if (!hasRequiredPermissions) {
      return false;
    }
  }
  
  return true;
};

export default ROUTES;