'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useSettings } from '@/hooks/useRedux';

const BREADCRUMB_MAP = {
  '/admin/dashboard': 'Dashboard',
  '/admin/dashboard/applications': 'Applications',
  '/admin/dashboard/payments': 'Payments',
  '/admin/dashboard/exams': 'Exams',
  '/admin/dashboard/students': 'Students',
  '/admin/dashboard/employees': 'Employees',
  '/admin/dashboard/users': 'Users',
  '/admin/dashboard/settings': 'Settings',
  '/admin/dashboard/roles': 'Roles',
  '/admin/dashboard/student-portal': 'Student Portal',
};

function getPageTitle(pathname) {
  if (!pathname) return 'Dashboard';
  const keys = Object.keys(BREADCRUMB_MAP).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (pathname === k || pathname.startsWith(k + '/')) return BREADCRUMB_MAP[k];
  }
  return 'Dashboard';
}

export default function AdminNavbar({ onToggleSidebar }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { schoolSettings, fetchSchoolSettings } = useSettings();

  const pageTitle = getPageTitle(pathname);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.nb-dropdown')) {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && !schoolSettings) fetchSchoolSettings();
  }, [status, schoolSettings, fetchSchoolSettings]);

  const notifications = [
    { id: 1, title: 'New Application Submitted', message: 'A new application has been submitted for review', time: '5 min ago', unread: true, icon: 'fas fa-file-alt', color: '#2563eb' },
    { id: 2, title: 'System Update',             message: 'System maintenance scheduled for tonight 2 AM',  time: '1 hr ago',  unread: true,  icon: 'fas fa-cog',      color: '#d97706' },
    { id: 3, title: 'New User Registered',        message: 'A new user account has been created',           time: '2 hrs ago', unread: false, icon: 'fas fa-user',     color: '#059669' },
  ];
  const unreadCount = notifications.filter(n => n.unread).length;

  const handleLogout = useCallback(async () => {
    try { await signOut({ callbackUrl: '/login' }); }
    catch (e) { console.error('Logout failed:', e); }
  }, []);

  const iconBtn = {
    background: 'none', border: 'none', cursor: 'pointer',
    width: 38, height: 38, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#64748b', transition: 'background 0.15s, color 0.15s', position: 'relative',
  };

  return (
    <nav style={{
      height: 64, background: '#fff', borderBottom: '1px solid #e5eaf2',
      display: 'flex', alignItems: 'center', padding: '0 1.25rem',
      position: 'sticky', top: 0, zIndex: 1030, gap: '0.75rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>

      {/* Hamburger */}
      <button
        onClick={onToggleSidebar}
        style={{ ...iconBtn, flexShrink: 0 }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#1e3a5f'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748b'; }}
        aria-label="Toggle sidebar"
      >
        <i className="fas fa-bars" style={{ fontSize: '1rem' }} />
      </button>

      {/* Page title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', lineHeight: 1 }}>{pageTitle}</div>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
          {schoolSettings?.school_name || 'DeepFlux Admissions'}
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>

        {/* Notifications */}
        <div className="nb-dropdown" style={{ position: 'relative' }}>
          <button
            style={iconBtn}
            onClick={(e) => { e.stopPropagation(); setShowNotifications(v => !v); setShowUserMenu(false); }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#1e3a5f'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748b'; }}
            aria-label="Notifications"
          >
            <i className="fas fa-bell" style={{ fontSize: '1rem' }} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '2px solid #fff' }} />
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: isMobile ? 288 : 340, background: '#fff', borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #e5eaf2', zIndex: 1000, overflow: 'hidden',
            }}>
              <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                  Notifications <span style={{ background: '#eff6ff', color: '#2563eb', borderRadius: '12px', padding: '1px 8px', fontSize: '0.75rem', fontWeight: 600, marginLeft: '4px' }}>{unreadCount}</span>
                </div>
                <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: '0.8rem', fontWeight: 500 }}>
                  Mark all read
                </button>
              </div>
              {notifications.map((n) => (
                <div key={n.id} style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', borderBottom: '1px solid #f8fafc', background: n.unread ? '#fafcff' : '#fff', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = n.unread ? '#fafcff' : '#fff'; }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: '8px', background: `${n.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={n.icon} style={{ color: n.color, fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {n.title}
                      {n.unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: '#6b7280', marginTop: '1px' }}>{n.message}</div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px' }}>{n.time}</div>
                  </div>
                </div>
              ))}
              <div style={{ padding: '0.625rem', textAlign: 'center' }}>
                <Link href="/admin/dashboard/applications" style={{ fontSize: '0.8rem', color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}
                  onClick={() => setShowNotifications(false)}>
                  View all notifications <i className="fas fa-arrow-right ms-1" style={{ fontSize: '0.7rem' }} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: '#e5eaf2', margin: '0 0.25rem' }} />

        {/* User Menu */}
        <div className="nb-dropdown" style={{ position: 'relative' }}>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.3rem 0.5rem', borderRadius: '8px', transition: 'background 0.15s' }}
            onClick={(e) => { e.stopPropagation(); setShowUserMenu(v => !v); setShowNotifications(false); }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            {!isMobile && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#1e293b', lineHeight: 1.2 }}>
                  {status === 'loading' ? '…' : session?.user?.username || 'User'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  {status === 'loading' ? '…' : session?.user?.role || 'Guest'}
                </div>
              </div>
            )}
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="fas fa-user" style={{ color: '#fff', fontSize: '0.85rem' }} />
            </div>
            <i className="fas fa-chevron-down" style={{ fontSize: '0.65rem', color: '#94a3b8' }} />
          </button>

          {showUserMenu && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: isMobile ? 260 : 240, background: '#fff', borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #e5eaf2', zIndex: 1000, overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-user" style={{ color: '#fff', fontSize: '0.9rem' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>{session?.user?.username || 'User'}</div>
                    {session?.user?.email && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{session.user.email}</div>}
                    {session?.user?.role && (
                      <span style={{ background: '#eff6ff', color: '#2563eb', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600, padding: '1px 6px', display: 'inline-block', marginTop: '3px' }}>
                        {session.user.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu items */}
              {[
                { icon: 'fas fa-user', label: 'My Profile', href: session?.user?.id ? `/admin/dashboard/users/${session.user.id}` : '/admin/dashboard/users' },
                { icon: 'fas fa-cog',  label: 'Settings',   href: '/admin/dashboard/settings/school' },
              ].map((item) => (
                <Link key={item.label} href={item.href}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem', textDecoration: 'none', color: '#374151', fontSize: '0.875rem', fontWeight: 500, transition: 'background 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  onClick={() => setShowUserMenu(false)}
                >
                  <div style={{ width: 30, height: 30, borderRadius: '7px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={item.icon} style={{ color: '#475569', fontSize: '0.8rem' }} />
                  </div>
                  {item.label}
                </Link>
              ))}

              <div style={{ height: 1, background: '#f1f5f9', margin: '0.25rem 0' }} />

              <button
                onClick={handleLogout}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.875rem', fontWeight: 500, textAlign: 'left', transition: 'background 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fff5f5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                <div style={{ width: 30, height: 30, borderRadius: '7px', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-sign-out-alt" style={{ color: '#ef4444', fontSize: '0.8rem' }} />
                </div>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
