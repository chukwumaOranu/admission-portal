'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// Loading component
const LoadingSpinner = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
    <div className="text-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3 text-muted">Loading...</p>
    </div>
  </div>
);

// Access denied component
const AccessDenied = ({ message = 'Access Denied', redirectUrl = '/admin/dashboard' }) => {
  const router = useRouter();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(redirectUrl);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [router, redirectUrl]);
  
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="text-center">
        <div className="mb-4">
          <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '4rem' }}></i>
        </div>
        <h3 className="text-danger mb-3">Access Denied</h3>
        <p className="text-muted mb-4">{message}</p>
        <p className="small text-muted">Redirecting in 3 seconds...</p>
        <button 
          className="btn btn-primary"
          onClick={() => router.push(redirectUrl)}
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

// Protected route component - simplified to rely on middleware
export const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredPermissions = [], 
  fallback = null,
  redirectTo = null 
}) => {
  const { isAuthenticated, isInitialized, user, hasPermission, getUserRole } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    const checkAccess = async () => {
      if (!isInitialized) return;
      
      // Middleware handles authentication, so if we reach here, user is authenticated
      // Just check role and permission requirements
      
      // Check role requirement
      if (requiredRole) {
        const userRole = getUserRole();
        if (userRole !== requiredRole && userRole !== 'Super_Admin') {
          setIsChecking(false);
          return;
        }
      }
      
      // Check permission requirements
      if (requiredPermissions.length > 0) {
        const hasRequiredPermissions = requiredPermissions.every(permission => 
          hasPermission(permission)
        );
        
        if (!hasRequiredPermissions) {
          setIsChecking(false);
          return;
        }
      }
      
      setIsChecking(false);
    };
    
    checkAccess();
  }, [isInitialized, user, hasPermission, getUserRole, requiredRole, requiredPermissions]);
  
  // Show loading while checking
  if (!isInitialized || isChecking) {
    return <LoadingSpinner />;
  }
  
  // Show access denied if requirements not met
  if (requiredRole) {
    const userRole = getUserRole();
    if (userRole !== requiredRole && userRole !== 'Super_Admin') {
      return <AccessDenied message={`This page requires ${requiredRole} access`} redirectUrl={redirectTo || '/admin/dashboard'} />;
    }
  }
  
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every(permission => 
      hasPermission(permission)
    );
    
    if (!hasRequiredPermissions) {
      return <AccessDenied message="You don't have permission to access this page" redirectUrl={redirectTo || '/admin/dashboard'} />;
    }
  }
  
  // Show children if all checks pass
  return children;
};

// Admin-only route component
export const AdminRoute = ({ children, fallback = null }) => {
  return (
    <ProtectedRoute requiredRole="Admin" fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
};

// Super admin-only route component
export const SuperAdminRoute = ({ children, fallback = null }) => {
  return (
    <ProtectedRoute requiredRole="Super_Admin" fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
};

// Permission-based route component
export const PermissionRoute = ({ children, permissions = [], fallback = null }) => {
  return (
    <ProtectedRoute requiredPermissions={permissions} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
};

// Export components
export default ProtectedRoute;