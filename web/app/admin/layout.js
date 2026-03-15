'use client';

import { useState, useEffect } from 'react';
import AdminNavbar from '@/components/dashboard/AdminNavbar';
import SideBar from '@/components/dashboard/SideBar';
import AdminFooter from '@/components/dashboard/AdminFooter';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-close sidebar on mobile when resizing to desktop
      if (!mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [sidebarOpen]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && sidebarOpen && !event.target.closest('.sidebar') && !event.target.closest('[data-sidebar-toggle]')) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobile, sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <AdminNavbar onToggleSidebar={toggleSidebar} />
      <div className="d-flex flex-grow-1">
        <SideBar isOpen={sidebarOpen} onClose={closeSidebar} />
        <main 
          className={`flex-grow-1 p-3 p-md-4 transition-all ${
            sidebarOpen && !isMobile ? 'sidebar-open' : 'sidebar-closed'
          }`}
          style={{ 
            marginLeft: isMobile ? '0' : (sidebarOpen ? '280px' : '0'),
            transition: 'margin-left 0.3s ease-in-out'
          }}
        >
          <div className="fade-in">
            {children}
          </div>
        </main>
      </div>
      <AdminFooter />
    </div>
  );
}