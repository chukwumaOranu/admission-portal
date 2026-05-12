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

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (session && !schoolSettings) fetchSchoolSettings();
  }, [session, schoolSettings, fetchSchoolSettings]);

  useEffect(() => {
    const routeChanged = previousPathnameRef.current !== pathname;
    if (routeChanged && isMobile && isOpen) onClose();
    previousPathnameRef.current = pathname;
  }, [pathname, isMobile, isOpen, onClose]);

  const isStudent = userRole === 'Student';

  const menuItems = isStudent ? [
    { id: 'student-dashboard',     title: 'Dashboard',      icon: 'fas fa-home',           href: '/admin/dashboard/student-portal' },
    { id: 'student-profile',       title: 'My Profile',     icon: 'fas fa-user',           href: '/admin/dashboard/student-portal/profile',      permission: 'student_profile.read' },
    { id: 'student-applications',  title: 'Applications',   icon: 'fas fa-file-alt',       href: '/admin/dashboard/student-portal/applications', permission: 'student_application.read' },
    { id: 'student-payments',      title: 'Payments',       icon: 'fas fa-credit-card',    href: '/admin/dashboard/student-portal/payments',     permission: 'student_payment.read',
      children: [
        { title: 'Make Payment',    href: '/admin/dashboard/student-portal/payments' },
        { title: 'Payment History', href: '/admin/dashboard/student-portal/payments/history' },
      ]
    },
    { id: 'student-exams',         title: 'Exams',          icon: 'fas fa-clipboard-check',href: '/admin/dashboard/student-portal/exams',        permission: 'student_exam.read' },
    { id: 'student-results',       title: 'Results',        icon: 'fas fa-chart-line',     href: '/admin/dashboard/student-portal/results',      permission: 'student_result.read' },
    { id: 'student-help',          title: 'Help & Support', icon: 'fas fa-question-circle',href: '/admin/dashboard/student-portal/help' },
  ] : [
    {
      id: 'dashboard', title: 'Dashboard', icon: 'fas fa-tachometer-alt', href: '/admin/dashboard',
      children: [
        { title: 'Overview',   href: '/admin/dashboard' },
        { title: 'Analytics',  href: '/admin/dashboard/analytics',  permission: 'analytics.read' },
        { title: 'Reports',    href: '/admin/dashboard/reports',    permission: 'report.read' },
      ]
    },
    {
      id: 'applications', title: 'Applications', icon: 'fas fa-file-alt', href: '/admin/dashboard/applications', permission: 'application.read',
      children: [
        { title: 'All Applications',  href: '/admin/dashboard/applications' },
        { title: 'Under Review',      href: '/admin/dashboard/applications/under-review' },
        { title: 'Admission Results', href: '/admin/dashboard/applications/admission', permission: 'admission_result.read' },
        { title: 'App Schemas',       href: '/admin/dashboard/applications/schemas',   permission: 'application_schema.read' },
      ]
    },
    {
      id: 'payments', title: 'Payments', icon: 'fas fa-credit-card', href: '/admin/dashboard/payments', permission: 'payment.read',
      children: [
        { title: 'All Payments', href: '/admin/dashboard/payments' },
      ]
    },
    {
      id: 'exams', title: 'Exams', icon: 'fas fa-clipboard-check', href: '/admin/dashboard/exams/entry-dates', permission: 'exam.read',
      children: [
        { title: 'Entry Dates',  href: '/admin/dashboard/exams/entry-dates' },
        { title: 'Assign Exams', href: '/admin/dashboard/exams/assign', permission: 'exam_assignment.manage' },
        { title: 'Exam Cards',   href: '/admin/dashboard/exams/cards' },
      ]
    },
    {
      id: 'employees', title: 'Employees', icon: 'fas fa-users-cog', href: '/admin/dashboard/employees', permission: 'employee.read',
      children: [
        { title: 'All Employees',    href: '/admin/dashboard/employees' },
        { title: 'Departments',      href: '/admin/dashboard/employees/departments', permission: 'department.read' },
        { title: 'Emp. Schemas',     href: '/admin/dashboard/employees/schemas',    permission: 'employee_schema.read' },
        { title: 'Add Employee',     href: '/admin/dashboard/employees/add',        permission: 'employee.create' },
      ]
    },
    {
      id: 'students', title: 'Students', icon: 'fas fa-user-graduate', href: '/admin/dashboard/students', permission: 'student.read',
      children: [
        { title: 'All Students',    href: '/admin/dashboard/students' },
        { title: 'Student Schemas', href: '/admin/dashboard/students/schemas', permission: 'student_schema.read' },
        { title: 'Add Student',     href: '/admin/dashboard/students/add',     permission: 'student.create' },
      ]
    },
    {
      id: 'userManagement', title: 'Users', icon: 'fas fa-users', href: '/admin/dashboard/users', permission: 'user.read',
      children: [
        { title: 'All Users', href: '/admin/dashboard/users' },
        { title: 'Add User',  href: '/admin/dashboard/users/add',   permission: 'user.create' },
        { title: 'User Roles',href: '/admin/dashboard/users/roles', permission: 'role.assign' },
      ]
    },
    {
      id: 'settings', title: 'Settings', icon: 'fas fa-cog', href: '/admin/dashboard/settings/school', permission: 'settings.read',
      children: [
        { title: 'School Settings',   href: '/admin/dashboard/settings/school',                         permission: 'settings.school' },
        { title: 'Email Settings',    href: '/admin/dashboard/settings/email',                          permission: 'settings.email' },
        { title: 'Letter Templates',  href: '/admin/dashboard/settings/templates/admission-letter',     permission: 'settings.template.read' },
      ]
    },
    {
      id: 'superAdminExtra', title: 'Super Admin', icon: 'fas fa-crown', href: '/admin/dashboard/roles',
      visibleTo: ['Super Admin'], badge: 'SA',
      children: [
        { title: 'All Roles',         href: '/admin/dashboard/roles' },
        { title: 'Add Role',          href: '/admin/dashboard/roles/add' },
        { title: 'Permissions',       href: '/admin/dashboard/permissions' },
        { title: 'Role Permissions',  href: '/admin/dashboard/rolePermissions' },
        { title: 'System Settings',   href: '/admin/dashboard/settings/system' },
        { title: 'Security Settings', href: '/admin/dashboard/settings/security' },
      ]
    },
  ];

  const shouldShowItem = (item) => {
    if (item.visibleTo?.length > 0 && !isInRoleList(item.visibleTo)) return false;
    if (item.permission && !hasPermission(item.permission)) return false;
    return true;
  };

  const visibleMenuItems = menuItems.filter(shouldShowItem).map(item => ({
    ...item,
    children: item.children ? item.children.filter(shouldShowItem) : [],
  }));

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev =>
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');
  const isMenuExpanded = (menuId) => expandedMenus.includes(menuId);

  const isSuperAdminOnly = (item) => item.visibleTo?.includes('Super Admin') && item.visibleTo.length === 1;

  return (
    <>
      {isOpen && isMobile && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1040 }}
          onClick={onClose}
        />
      )}

      <div className={`sidebar ${isOpen ? 'show' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>

        {/* Brand */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <Link href="/admin/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {logoSrc && failedLogoSrc !== logoSrc ? (
              <Image
                src={logoSrc} alt="Logo" width={32} height={32} unoptimized
                style={{ height: '32px', width: 'auto', borderRadius: '6px' }}
                onError={() => setFailedLogoSrc(logoSrc)}
              />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fas fa-graduation-cap" style={{ color: '#fff', fontSize: '0.9rem' }} />
              </div>
            )}
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {schoolSettings?.school_name || 'Admission Portal'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Admin Portal
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.75rem', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          {isStudent && (
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.8px', textTransform: 'uppercase', padding: '0.25rem 0.5rem 0.5rem' }}>
              Student Portal
            </div>
          )}
          <nav>
            {visibleMenuItems.map((menu) => {
              const active = isActive(menu.href);
              const expanded = isMenuExpanded(menu.id);
              const superOnly = isSuperAdminOnly(menu);
              return (
                <div key={menu.id} style={{ marginBottom: '2px' }}>
                  <div
                    onClick={() => menu.children?.length > 0 ? toggleMenu(menu.id) : null}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.55rem 0.75rem', borderRadius: '8px', cursor: 'pointer',
                      background: active ? '#2563eb' : 'transparent',
                      transition: 'background 0.15s',
                      borderLeft: superOnly ? '3px solid #f59e0b' : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Link
                      href={menu.href}
                      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, color: active ? '#fff' : 'rgba(255,255,255,0.75)' }}
                      onClick={(e) => {
                        if (menu.children?.length > 0) e.preventDefault();
                        if (isMobile) onClose();
                      }}
                    >
                      <i className={menu.icon} style={{ width: '16px', textAlign: 'center', fontSize: '0.85rem', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: active ? 600 : 500 }}>{menu.title}</span>
                      {menu.badge && (
                        <span style={{ background: '#f59e0b', color: '#1e3a5f', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', marginLeft: 'auto', marginRight: '0.25rem' }}>
                          {menu.badge}
                        </span>
                      )}
                    </Link>
                    {menu.children?.length > 0 && (
                      <i className={`fas fa-chevron-${expanded ? 'down' : 'right'}`} style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
                    )}
                  </div>

                  {menu.children?.length > 0 && expanded && (
                    <div style={{ paddingLeft: '0.75rem', marginTop: '2px', marginBottom: '4px' }}>
                      {menu.children.map((child, i) => {
                        const childActive = isActive(child.href);
                        return (
                          <Link
                            key={i}
                            href={child.href}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.5rem',
                              padding: '0.45rem 0.75rem', borderRadius: '6px',
                              textDecoration: 'none', marginBottom: '1px',
                              fontSize: '0.825rem', fontWeight: childActive ? 600 : 400,
                              color: childActive ? '#93c5fd' : 'rgba(255,255,255,0.55)',
                              background: childActive ? 'rgba(37,99,235,0.2)' : 'transparent',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => { if (!childActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; } }}
                            onMouseLeave={(e) => { if (!childActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; } }}
                            onClick={() => { if (isMobile) onClose(); }}
                          >
                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: childActive ? '#93c5fd' : 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                            {child.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        {session?.user && (
          <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, background: 'rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fas fa-user" style={{ color: '#fff', fontSize: '0.8rem' }} />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.825rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {session.user.username}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {session.user.role}
                  {isSuperAdmin && <i className="fas fa-crown" style={{ color: '#f59e0b', fontSize: '0.65rem' }} />}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
