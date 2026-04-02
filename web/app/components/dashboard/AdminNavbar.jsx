'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useSettings } from '@/hooks/useRedux';
import { getImageUrl } from '@/utils/imageUtils';

export default function AdminNavbar({ onToggleSidebar }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [failedLogoSrc, setFailedLogoSrc] = useState(null);
  const { data: session, status } = useSession();
  const { schoolSettings, fetchSchoolSettings } = useSettings();
  const logoSrc = schoolSettings?.school_logo ? getImageUrl(schoolSettings.school_logo) : null;

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown')) {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch school settings when component mounts
  useEffect(() => {
    if (status === 'authenticated' && !schoolSettings) {
      fetchSchoolSettings();
    }
  }, [status, schoolSettings, fetchSchoolSettings]);

  const notifications = [
    {
      id: 1,
      title: 'New Application Submitted',
      message: 'John Doe submitted an application',
      time: '5 minutes ago',
      unread: true
    },
    {
      id: 2,
      title: 'System Update',
      message: 'System will be updated tonight at 2 AM',
      time: '1 hour ago',
      unread: true
    },
    {
      id: 3,
      title: 'User Registration',
      message: 'New user registered: Jane Smith',
      time: '2 hours ago',
      unread: false
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/login' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm border-bottom sticky-top">
      <div className="container-fluid px-3">
        {/* Left Section - Mobile Menu & Brand */}
        <div className="d-flex align-items-center">
          {/* Mobile Menu Button */}
          <button
            className="btn btn-link text-primary d-lg-none me-2 p-2"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            data-sidebar-toggle
          >
            <i className="fas fa-bars fs-5"></i>
          </button>
          
          {/* Brand */}
          <Link href="/admin/dashboard" className="navbar-brand fw-bold text-dark text-decoration-none">
            {logoSrc && failedLogoSrc !== logoSrc ? (
              <Image
                src={logoSrc}
                alt="School Logo"
                width={120}
                height={32}
                unoptimized
                className="me-2"
                style={{ height: '32px', width: 'auto' }}
                onError={() => setFailedLogoSrc(logoSrc)}
              />
            ) : null}
            <i 
              className="fas fa-graduation-cap me-2 text-primary" 
              style={{ display: logoSrc && failedLogoSrc !== logoSrc ? 'none' : 'inline' }}
            ></i>
            <span className="d-none d-sm-inline">
              {schoolSettings?.school_name || 'DeepFlux Admissions'}
            </span>
            <span className="d-sm-none">
              {schoolSettings?.school_name ? schoolSettings.school_name.split(' ')[0] : 'DeepFlux'}
            </span>
          </Link>
        </div>

        {/* Right Section - Notifications & User Menu */}
        <div className="d-flex align-items-center">
          {/* Notifications */}
          <div className="dropdown me-2 me-lg-3">
            <button
              className="btn btn-link position-relative p-2"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              aria-label="Notifications"
            >
              <i className="fas fa-bell fs-5 text-muted"></i>
              {unreadCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                  {unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="dropdown-menu show" style={{ 
                width: isMobile ? '280px' : '320px', 
                maxHeight: '400px', 
                overflowY: 'auto',
                right: isMobile ? '0' : 'auto',
                left: isMobile ? 'auto' : 'auto'
              }}>
                <div className="dropdown-header d-flex justify-content-between align-items-center">
                  <span className="fw-semibold">Notifications</span>
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setShowNotifications(false)}
                  >
                    Mark all read
                  </button>
                </div>
                <div className="dropdown-divider"></div>
                {notifications.map((notification) => (
                  <div key={notification.id} className="dropdown-item-text px-3 py-2">
                    <div className="d-flex">
                      <div className="flex-grow-1">
                        <div className="fw-medium small">{notification.title}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{notification.message}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>{notification.time}</div>
                      </div>
                      {notification.unread && (
                        <div className="ms-2 d-flex align-items-center">
                          <span className="badge bg-primary rounded-pill" style={{ fontSize: '0.5rem' }}></span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="dropdown-divider"></div>
                <Link href="/admin/dashboard/notifications" className="dropdown-item text-center">
                  View all notifications
                </Link>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="dropdown">
            <button
              className="btn btn-link d-flex align-items-center p-2"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              aria-label="User menu"
            >
              {/* User Info - Hidden on mobile */}
              <div className="me-2 text-end d-none d-md-block">
                <div className="fw-medium text-dark small">
                  {status === 'loading' ? 'Loading...' : session?.user?.username || 'Guest'}
                </div>
                <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                  {status === 'loading' ? 'Loading...' : session?.user?.role || 'Not logged in'}
                </small>
              </div>
              
              {/* User Avatar */}
              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                <i className="fas fa-user text-white" style={{ fontSize: '0.9rem' }}></i>
              </div>
            </button>
            
            {showUserMenu && (
              <div className="dropdown-menu show" style={{ 
                width: isMobile ? '280px' : '320px',
                right: isMobile ? '0' : 'auto',
                left: isMobile ? 'auto' : 'auto'
              }}>
                {/* User Info Header */}
                <div className="dropdown-header">
                  <div className="fw-medium">{session?.user?.username || 'User'}</div>
                  <small className="text-muted">{session?.user?.email || 'user@example.com'}</small>
                  {session?.user?.role && (
                    <div className="mt-1">
                      <span className="badge bg-primary text-white small">
                        {session.user.role}
                      </span>
                    </div>
                  )}
                  {status === 'loading' && (
                    <div className="mt-1">
                      <small className="text-warning">
                        <i className="fas fa-spinner fa-spin me-1"></i>
                        Loading user data...
                      </small>
                    </div>
                  )}
                </div>
                <div className="dropdown-divider"></div>
                
                {/* Menu Items */}
                <Link href="/admin/dashboard/profile" className="dropdown-item">
                  <i className="fas fa-user me-2"></i>
                  Profile
                </Link>
                <Link href="/admin/dashboard/settings" className="dropdown-item">
                  <i className="fas fa-cog me-2"></i>
                  Settings
                </Link>
                <Link href="/admin/dashboard/help" className="dropdown-item">
                  <i className="fas fa-question-circle me-2"></i>
                  Help
                </Link>
                <div className="dropdown-divider"></div>
                
                {/* User Status Information */}
                {session?.user && (
                  <>
                    <div className="dropdown-item-text px-3 py-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">Account Status</small>
                        <span className={`badge ${session.user.isActive ? 'bg-success' : 'bg-danger'} small`}>
                          {session.user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="dropdown-item-text px-3 py-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">Email Status</small>
                        <span className={`badge ${session.user.emailVerified ? 'bg-success' : 'bg-warning'} small`}>
                          {session.user.emailVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                  </>
                )}
                
                {/* Debug Information - Only on desktop */}
                {!isMobile && (
                  <>
                    <div className="dropdown-item-text px-3 py-2">
                      <small className="text-muted">
                        <strong>Debug Info:</strong><br/>
                        Status: {status}<br/>
                        Session: {session ? 'Active' : 'None'}<br/>
                        Username: {session?.user?.username || 'N/A'}<br/>
                        Email: {session?.user?.email || 'N/A'}<br/>
                        Role: {session?.user?.role || 'N/A'}
                      </small>
                    </div>
                    <div className="dropdown-divider"></div>
                  </>
                )}
                
                {/* Logout Button */}
                <button 
                  onClick={handleLogout}
                  className="dropdown-item text-danger"
                  style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
                >
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
