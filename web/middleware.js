import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/student-registration',
  '/admin/register',
  '/admin/dashboard/test', // Keep test page accessible for design testing
  '/admin/dashboard/static', // Static dashboard for design testing
  '/api/health',
];

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/admin/dashboard',
  '/admin/users',
  '/admin/roles',
  '/admin/permissions',
  '/admin/rolePermissions',
  '/student', // All student portal routes
];

// Admin+ routes (Super Admin and Admin can access)
const ADMIN_ROUTES = [
  '/admin/dashboard/users',
  '/admin/dashboard/settings/school',
  '/admin/dashboard/settings/email',
  '/admin/dashboard/settings/uploads',
];

// Super Admin ONLY routes (strictly Super Admin)
const SUPER_ADMIN_ROUTES = [
  '/admin/dashboard/roles',
  '/admin/dashboard/permissions',
  '/admin/dashboard/rolePermissions',
  '/admin/dashboard/settings/system',
  '/admin/dashboard/settings/security',
];

function matchesRoute(pathname, route) {
  if (route === '/') return pathname === '/';
  return pathname === route || pathname.startsWith(`${route}/`);
}

// Function to check if a route is public
function isPublicRoute(pathname) {
  return PUBLIC_ROUTES.some(route => matchesRoute(pathname, route));
}

// Function to check if a route is protected
function isProtectedRoute(pathname) {
  return PROTECTED_ROUTES.some(route => matchesRoute(pathname, route));
}

// Function to check if a route requires admin role
function isAdminRoute(pathname) {
  return ADMIN_ROUTES.some(route => matchesRoute(pathname, route));
}

// Function to check if a route requires super admin role
function isSuperAdminRoute(pathname) {
  return SUPER_ADMIN_ROUTES.some(route => matchesRoute(pathname, route));
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const isDev = process.env.NODE_ENV !== 'production';

    if (isDev) {
      console.log(`Middleware: Processing ${pathname}`);
      console.log(`Middleware: User authenticated: ${!!token}`);
    }

    // Allow public routes
    if (isPublicRoute(pathname)) {
      if (isDev) console.log(`Middleware: Allowing public route: ${pathname}`);
      return NextResponse.next();
    }

    // Check if route requires authentication
    if (isProtectedRoute(pathname)) {
      if (!token) {
        if (isDev) console.log(`Middleware: Redirecting to login from protected route: ${pathname}`);
        return NextResponse.redirect(new URL('/login', req.url));
      }

      // Check role-based access
      if (isAdminRoute(pathname) && token.role !== 'Super Admin' && token.role !== 'Admin') {
        if (isDev) console.log(`Middleware: Insufficient permissions for admin route: ${pathname}`);
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }

      if (isSuperAdminRoute(pathname) && token.role !== 'Super Admin') {
        if (isDev) console.log(`Middleware: Insufficient permissions for super admin route: ${pathname}`);
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }

      // Student Portal - Only students can access
      if (pathname.startsWith('/admin/dashboard/student-portal')) {
        if (token.role !== 'Student') {
          if (isDev) console.log(`Middleware: Non-student trying to access student portal: ${pathname}`);
          return NextResponse.redirect(new URL('/admin/dashboard', req.url));
        }
      }

      // Admin Pages - Students cannot access (except student-portal)
      if (pathname.startsWith('/admin/dashboard') && !pathname.startsWith('/admin/dashboard/student-portal')) {
        if (token.role === 'Student') {
          if (isDev) console.log(`Middleware: Student trying to access admin pages: ${pathname}`);
          return NextResponse.redirect(new URL('/admin/dashboard/student-portal', req.url));
        }
      }

      // Redirect students from main dashboard to student portal
      if (pathname === '/admin/dashboard' && token.role === 'Student') {
        if (isDev) console.log(`Middleware: Redirecting student to student portal`);
        return NextResponse.redirect(new URL('/admin/dashboard/student-portal', req.url));
      }

      if (isDev) console.log(`Middleware: Allowing access to protected route: ${pathname}`);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow public routes
        if (isPublicRoute(pathname)) {
          return true;
        }
        
        // For protected routes, require authentication
        if (isProtectedRoute(pathname)) {
          return !!token;
        }
        
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
