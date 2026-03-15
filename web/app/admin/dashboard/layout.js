'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }) {
  const [activeTab, setActiveTab] = useState('overview');
  const pathname = usePathname();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'fas fa-home', href: '/admin/dashboard/student-portal' },
    { id: 'applications', label: 'Applications', icon: 'fas fa-file-alt', href: '/admin/dashboard/student-portal/applications' },
    { id: 'payments', label: 'Payments', icon: 'fas fa-credit-card', href: '/admin/dashboard/student-portal/payments' },
    { id: 'exams', label: 'Exams', icon: 'fas fa-clipboard-check', href: '/admin/dashboard/student-portal/exams' },
    { id: 'results', label: 'Results', icon: 'fas fa-poll', href: '/admin/dashboard/student-portal/results' },
  ];

  return (
    <div className="dashboard-layout">
      {/* Dashboard Header */}
      <div className="dashboard-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h3 mb-1 text-dark">
              <i className="fas fa-tachometer-alt text-primary-custom me-2"></i>
              Dashboard
            </h1>
            <p className="text-muted mb-0">Welcome to DeepFlux Admissions Admin Portal</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary btn-sm">
              <i className="fas fa-download me-1"></i>
              Export
            </button>
            <button className="btn btn-primary-custom btn-sm">
              <i className="fas fa-plus me-1"></i>
              Quick Add
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div className="dashboard-tabs mb-4">
        <ul className="nav nav-tabs" role="tablist">
          {tabs.map((tab) => (
            <li className="nav-item" key={tab.id}>
              <Link
                href={tab.href}
                className={`nav-link ${pathname === tab.href ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={`${tab.icon} me-2`}></i>
                {tab.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {children}
      </div>
    </div>
  );
}
