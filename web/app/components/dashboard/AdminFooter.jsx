'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminFooter() {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [isMobile, setIsMobile] = useState(false);
  const currentYear = new Date().getFullYear();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <footer className="bg-white border-top py-3 mt-auto">
      <div className="container-fluid px-3">
        <div className="row align-items-center">
          {/* Left Section - Brand */}
          <div className="col-12 col-md-6 mb-2 mb-md-0">
            <div className="d-flex align-items-center justify-content-center justify-content-md-start">
              <div className="me-3">
                <i className="fas fa-graduation-cap text-primary fs-5"></i>
              </div>
              <div className="text-center text-md-start">
                <small className="text-muted">
                  © {currentYear} DeepFlux Admissions Portal. All rights reserved.
                </small>
              </div>
            </div>
          </div>
          
          {/* Right Section - Status & Actions */}
          <div className="col-12 col-md-6">
            <div className="d-flex flex-column flex-md-row justify-content-center justify-content-md-end align-items-center gap-2 gap-md-3">
              {/* System Status */}
              <div className="d-flex align-items-center gap-2">
                <i className="fas fa-server text-success"></i>
                <small className="text-muted">System Online</small>
              </div>
              
              {/* Current Time */}
              <div className="d-flex align-items-center gap-2">
                <i className="fas fa-clock text-info"></i>
                <small className="text-muted" id="current-time">
                  {currentTime}
                </small>
              </div>
              
              {/* Actions Dropdown */}
              <div className="dropdown">
                <button
                  className="btn btn-link btn-sm text-muted p-1"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  aria-label="More options"
                >
                  <i className="fas fa-ellipsis-v"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link href="/admin/dashboard/help" className="dropdown-item">
                      <i className="fas fa-question-circle me-2"></i>
                      Help & Support
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/dashboard/documentation" className="dropdown-item">
                      <i className="fas fa-book me-2"></i>
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/dashboard/feedback" className="dropdown-item">
                      <i className="fas fa-comment me-2"></i>
                      Feedback
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <Link href="/admin/dashboard/version" className="dropdown-item">
                      <i className="fas fa-info-circle me-2"></i>
                      Version 1.0.0
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile-only additional info */}
        {isMobile && (
          <div className="row mt-2">
            <div className="col-12">
              <div className="text-center">
                <small className="text-muted">
                  <i className="fas fa-mobile-alt me-1"></i>
                  Mobile View Active
                </small>
              </div>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}