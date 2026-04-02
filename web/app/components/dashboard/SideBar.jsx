'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useSettings } from '@/hooks/useRedux';
import { getImageUrl } from '@/utils/imageUtils';

export default function SideBar({ isOpen, onClose }) {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const { data: session } = useSession();
  const { isSuperAdmin, isInRoleList, hasPermission } = usePermissions();
  const { schoolSettings, fetchSchoolSettings } = useSettings();
  const [expandedMenus, setExpandedMenus] = useState(['dashboard']);
  const [isMobile, setIsMobile] = useState(false);
  const [failedLogoSrc, setFailedLogoSrc] = useState(null);
  const logoSrc = schoolSettings?.school_logo ? getImageUrl(schoolSettings.school_logo) : null;

  const userRole = session?.user?.role;

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch school settings when component mounts
  useEffect(() => {
    if (session && !schoolSettings) {
      fetchSchoolSettings();
    }
  }, [session, schoolSettings, fetchSchoolSettings]);

  // Auto-close sidebar on mobile only when route actually changes
  useEffect(() => {
    const routeChanged = previousPathnameRef.current !== pathname;
    if (routeChanged && isMobile && isOpen) {
      onClose();
    }
    previousPathnameRef.current = pathname;
  }, [pathname, isMobile, isOpen, onClose]);

  // Check if user is a student
  const isStudent = userRole === 'Student';

  const menuItems = isStudent ? [
    // STUDENT PORTAL MENU
    {
      id: 'student-dashboard',
      title: 'Dashboard',
      icon: 'fas fa-home',
      href: '/admin/dashboard/student-portal'
    },
    {
      id: 'student-profile',
      title: 'My Profile',
      icon: 'fas fa-user',
      href: '/admin/dashboard/student-portal/profile',
      permission: 'student_profile.read'
    },
    {
      id: 'student-applications',
      title: 'Applications',
      icon: 'fas fa-file-alt',
      href: '/admin/dashboard/student-portal/applications',
      permission: 'student_application.read'
    },
    {
      id: 'student-payments',
      title: 'Payments',
      icon: 'fas fa-credit-card',
      href: '/admin/dashboard/student-portal/payments',
      permission: 'student_payment.read',
      children: [
        { title: 'Make Payment', href: '/admin/dashboard/student-portal/payments' },
        { title: 'Payment History', href: '/admin/dashboard/student-portal/payments/history' }
      ]
    },
    {
      id: 'student-exams',
      title: 'Exams',
      icon: 'fas fa-clipboard-check',
      href: '/admin/dashboard/student-portal/exams',
      permission: 'student_exam.read'
    },
    {
      id: 'student-results',
      title: 'Results',
      icon: 'fas fa-chart-line',
      href: '/admin/dashboard/student-portal/results',
      permission: 'student_result.read'
    },
    {
      id: 'student-help',
      title: 'Help & Support',
      icon: 'fas fa-question-circle',
      href: '/admin/dashboard/student-portal/help'
    }
  ] : [
    // ADMIN/STAFF MENU
    // 1. DASHBOARD (Everyone)
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
      href: '/admin/dashboard',
      visibleTo: null,
      children: [
        { title: 'Overview', href: '/admin/dashboard' },
        { title: 'Analytics', href: '/admin/dashboard/analytics', permission: 'analytics.read' },
        { title: 'Reports', href: '/admin/dashboard/reports', permission: 'report.read' }
      ]
    },
    
    // 2. APPLICATIONS (Core Business)
    {
      id: 'applications',
      title: 'Application Management',
      icon: 'fas fa-file-alt',
      href: '/admin/dashboard/applications',
      permission: 'application.read',
      children: [
        { title: 'All Applications', href: '/admin/dashboard/applications' },
        { title: 'Under Review', href: '/admin/dashboard/applications/under-review' },
        { title: 'Admission Results', href: '/admin/dashboard/applications/admission', permission: 'admission_result.read' },
        { title: 'Application Schemas', href: '/admin/dashboard/applications/schemas', permission: 'application_schema.read' }
      ]
    },
    
    // 3. PAYMENTS
    {
      id: 'payments',
      title: 'Payment Management',
      icon: 'fas fa-credit-card',
      href: '/admin/dashboard/payments',
      permission: 'payment.read',
      children: [
        { title: 'All Payments', href: '/admin/dashboard/payments' }
      ]
    },
    
    // 4. EXAMS
    {
      id: 'exams',
      title: 'Exam Management',
      icon: 'fas fa-clipboard-check',
      href: '/admin/dashboard/exams/entry-dates',
      permission: 'exam.read',
      children: [
        { title: 'Entry Dates', href: '/admin/dashboard/exams/entry-dates' },
        { title: 'Assign Exams', href: '/admin/dashboard/exams/assign', permission: 'exam_assignment.manage' },
        { title: 'Exam Cards', href: '/admin/dashboard/exams/cards' }
      ]
    },
    
    // 5. EMPLOYEES
    {
      id: 'employees',
      title: 'Employee Management',
      icon: 'fas fa-users-cog',
      href: '/admin/dashboard/employees',
      permission: 'employee.read',
      children: [
        { title: 'All Employees', href: '/admin/dashboard/employees' },
        { title: 'Departments', href: '/admin/dashboard/employees/departments', permission: 'department.read' },
        { title: 'Employee Schemas', href: '/admin/dashboard/employees/schemas', permission: 'employee_schema.read' },
        { title: 'Add Employee', href: '/admin/dashboard/employees/add', permission: 'employee.create' }
      ]
    },
    
    // 6. STUDENTS
    {
      id: 'students',
      title: 'Student Management',
      icon: 'fas fa-user-graduate',
      href: '/admin/dashboard/students',
      permission: 'student.read',
      children: [
        { title: 'All Students', href: '/admin/dashboard/students' },
        { title: 'Send Login Details', href: '/admin/dashboard/students', permission: 'student.login.send' },
        { title: 'Student Schemas', href: '/admin/dashboard/students/schemas', permission: 'student_schema.read' },
        { title: 'Add Student', href: '/admin/dashboard/students/add', permission: 'student.create' }
      ]
    },
    
    // 7. USER MANAGEMENT (Admin+)
    {
      id: 'userManagement',
      title: 'User Management',
      icon: 'fas fa-users',
      href: '/admin/dashboard/users',
      permission: 'user.read',
      children: [
        { title: 'All Users', href: '/admin/dashboard/users' },
        { title: 'Add User', href: '/admin/dashboard/users/add', permission: 'user.create' },
        { title: 'User Roles', href: '/admin/dashboard/users/roles', permission: 'role.assign' }
      ]
    },
    
    // 8. SETTINGS (Partially Admin)
    {
      id: 'settings',
      title: 'Settings',
      icon: 'fas fa-cog',
      href: '/admin/dashboard/settings/school',
      permission: 'settings.read',
      children: [
        { 
          title: 'School Settings', 
          href: '/admin/dashboard/settings/school',
          permission: 'settings.school'
        },
        { 
          title: 'Email Settings', 
          href: '/admin/dashboard/settings/email',
          permission: 'settings.email'
        },
        { 
          title: 'File Uploads', 
          href: '/admin/dashboard/settings/uploads',
          permission: 'settings.read'
        },
        {
          title: 'Letter Templates',
          href: '/admin/dashboard/settings/templates/admission-letter',
          permission: 'settings.template.read'
        }
      ]
    },
    
    // 9. SUPER ADMIN EXTRA (Only Super Admin)
    {
      id: 'superAdminExtra',
      title: 'Super Admin',
      icon: 'fas fa-crown',
      href: '/admin/dashboard/roles',
      visibleTo: ['Super Admin'],
      badge: 'SA',
      children: [
        { title: 'All Roles', href: '/admin/dashboard/roles' },
        { title: 'Add Role', href: '/admin/dashboard/roles/add' },
        { title: 'Permissions', href: '/admin/dashboard/permissions' },
        { title: 'Role Permissions', href: '/admin/dashboard/rolePermissions' },
        { title: 'System Settings', href: '/admin/dashboard/settings/system' },
        { title: 'Security Settings', href: '/admin/dashboard/settings/security' }
      ]
    }
  ];

  // Check if menu item should be visible
  const shouldShowItem = (item) => {
    // Check role-based visibility
    if (item.visibleTo && item.visibleTo.length > 0) {
      if (!isInRoleList(item.visibleTo)) {
        return false;
      }
    }
    
    // Check permission-based visibility
    if (item.permission) {
      if (!hasPermission(item.permission)) {
        return false;
      }
    }
    
    return true;
  };

  // Filter menu items based on visibility
  const visibleMenuItems = menuItems.filter(shouldShowItem).map(item => ({
    ...item,
    children: item.children ? item.children.filter(shouldShowItem) : []
  }));

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isActive = (href) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isMenuExpanded = (menuId) => {
    return expandedMenus.includes(menuId);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && isMobile && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1040 }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'show' : ''} d-flex flex-column`}>
        {/* Brand */}
        <div className="p-3 border-bottom">
          <Link href="/admin/dashboard" className="text-decoration-none">
            <h4 className="mb-0 text-primary d-flex align-items-center">
              {logoSrc && failedLogoSrc !== logoSrc ? (
                <Image
                  src={logoSrc}
                  alt="School Logo"
                  width={90}
                  height={24}
                  unoptimized
                  className="me-2"
                  style={{ height: '24px', width: 'auto' }}
                  onError={() => setFailedLogoSrc(logoSrc)}
                />
              ) : null}
              <i 
                className="fas fa-graduation-cap me-2" 
                style={{ display: logoSrc && failedLogoSrc !== logoSrc ? 'none' : 'inline' }}
              ></i>
              {schoolSettings?.school_name || 'Admission Portal'}
            </h4>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-grow-1 overflow-auto p-3">
          <nav>
            {visibleMenuItems.map((menu) => (
              <div key={menu.id} className="mb-2">
                {/* Main Menu Item */}
                <div
                  className={`d-flex align-items-center justify-content-between p-2 rounded cursor-pointer ${
                    isActive(menu.href) ? 'bg-primary text-white' : 'text-dark'
                  } ${menu.visibleTo && menu.visibleTo.includes('Super Admin') && menu.visibleTo.length === 1 ? 'border-start border-danger border-3' : ''}`}
                  onClick={() => menu.children?.length > 0 ? toggleMenu(menu.id) : null}
                  style={{ cursor: menu.children?.length > 0 ? 'pointer' : 'default' }}
                >
                  <Link
                    href={menu.href}
                    className={`text-decoration-none flex-grow-1 ${
                      isActive(menu.href) ? 'text-white' : 'text-dark'
                    }`}
                    onClick={(e) => {
                      if (menu.children?.length > 0) {
                        e.preventDefault();
                      }
                      if (isMobile) {
                        onClose();
                      }
                    }}
                  >
                    <i className={`${menu.icon} me-2`}></i>
                    <span>{menu.title}</span>
                    {menu.badge && (
                      <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.65em' }}>{menu.badge}</span>
                    )}
                  </Link>
                  {menu.children?.length > 0 && (
                    <i className={`fas fa-chevron-${isMenuExpanded(menu.id) ? 'down' : 'right'} text-muted`} style={{ fontSize: '0.75rem' }}></i>
                  )}
                </div>

                {/* Submenu */}
                {menu.children?.length > 0 && isMenuExpanded(menu.id) && (
                  <div className="ms-4 mt-1">
                    {menu.children.map((child, index) => (
                      <Link
                        key={index}
                        href={child.href}
                        className={`d-block p-2 rounded text-decoration-none ${
                          isActive(child.href) 
                            ? 'bg-primary bg-opacity-10 text-primary fw-semibold' 
                            : 'text-secondary'
                        } ${child.visibleTo && child.visibleTo.includes('Super Admin') && child.visibleTo.length === 1 ? 'text-danger' : ''}`}
                        onClick={() => {
                          if (isMobile) {
                            onClose();
                          }
                        }}
                      >
                        <span>{child.title}</span>
                        {child.visibleTo && child.visibleTo.includes('Super Admin') && child.visibleTo.length === 1 && (
                          <>
                            <i className="fas fa-exclamation-triangle ms-2 text-danger" style={{ fontSize: '0.7em' }}></i>
                            <span className="badge bg-danger ms-1" style={{ fontSize: '0.6em' }}>SA</span>
                          </>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* User Info Footer */}
        {session?.user && (
          <div className="p-3 border-top bg-light">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <i className="fas fa-user-circle fa-2x text-primary"></i>
              </div>
              <div className="flex-grow-1">
                <div className="fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>
                  {session.user.username}
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {session.user.role}
                  {isSuperAdmin && (
                    <i className="fas fa-crown text-warning ms-1" title="Super Administrator"></i>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
