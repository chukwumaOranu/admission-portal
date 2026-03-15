'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications, usePayments, useEmployees, useExams, useUsers } from '@/hooks/useRedux';

function ReportCard({ report }) {
  return (
    <div className="col-md-6 col-lg-4 mb-4">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div className={`text-${report.color} me-3`}>
              <i className={`${report.icon} fs-2`}></i>
            </div>
            <div>
              <h6 className="card-title mb-0">{report.title}</h6>
              <small className="text-muted">{report.type}</small>
            </div>
          </div>

          <p className="card-text text-muted mb-3">{report.description}</p>

          <div className="row mb-3">
            <div className="col-6">
              <div className="text-center">
                <h6 className="text-primary mb-1">{report.records}</h6>
                <small className="text-muted">Records</small>
              </div>
            </div>
            <div className="col-6">
              <div className="text-center">
                <h6 className="text-info mb-1">{report.lastGenerated}</h6>
                <small className="text-muted">Last Generated</small>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary btn-sm">
              <i className="fas fa-eye me-1"></i> View
            </button>
            <button className="btn btn-outline-success btn-sm">
              <i className="fas fa-download me-1"></i> Download
            </button>
            <button className="btn btn-outline-secondary btn-sm">
              <i className="fas fa-sync me-1"></i> Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { status } = useSession();
  const { loading: permissionsLoading } = usePermissions();
  
  // Fetch real data from Redux stores
  const { applications, loading: appsLoading, fetchApplications } = useApplications();
  const { payments, loading: paymentsLoading, fetchPayments } = usePayments();
  const { employees, loading: employeesLoading, fetchEmployees } = useEmployees();
  const { entryDates, loading: examsLoading, fetchEntryDates } = useExams();
  const { users, loading: usersLoading, fetchUsers } = useUsers();

  const [isLoading, setIsLoading] = useState(true);

  const loadReportsData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchApplications(),
        fetchPayments(),
        fetchEmployees(),
        fetchEntryDates(),
        fetchUsers()
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchApplications, fetchPayments, fetchEmployees, fetchEntryDates, fetchUsers]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadReportsData();
    }
  }, [status, loadReportsData]);

  const today = new Date().toISOString().split('T')[0];
  const reports = useMemo(() => [
    {
      id: 1,
      title: 'Application Summary Report',
      description: 'Comprehensive overview of all applications',
      type: 'applications',
      icon: 'fas fa-file-alt',
      color: 'info',
      lastGenerated: today,
      records: applications.length
    },
    {
      id: 2,
      title: 'Payment Transaction Report',
      description: 'Detailed payment analysis and statistics',
      type: 'payments',
      icon: 'fas fa-credit-card',
      color: 'success',
      lastGenerated: today,
      records: payments.length
    },
    {
      id: 3,
      title: 'Employee Directory Report',
      description: 'Complete employee information and status',
      type: 'employees',
      icon: 'fas fa-users',
      color: 'primary',
      lastGenerated: today,
      records: employees.length
    },
    {
      id: 4,
      title: 'Exam Schedule Report',
      description: 'Upcoming and completed exam schedules',
      type: 'exams',
      icon: 'fas fa-clipboard-check',
      color: 'warning',
      lastGenerated: today,
      records: entryDates.length
    },
    {
      id: 5,
      title: 'User Activity Report',
      description: 'System usage and user activity logs',
      type: 'users',
      icon: 'fas fa-user-clock',
      color: 'secondary',
      lastGenerated: today,
      records: users.length
    }
  ], [applications.length, payments.length, employees.length, entryDates.length, users.length, today]);

  const loading = isLoading || appsLoading || paymentsLoading || employeesLoading || examsLoading || usersLoading || permissionsLoading || status === 'loading';

  // Show loading while checking authentication and permissions
  if (loading || status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Authentication Required</h4>
        <p>You need to be logged in to access this page.</p>
        <hr />
        <p className="mb-0">
          <Link href="/login" className="btn btn-primary">Go to Login</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-chart-bar text-primary-custom me-2"></i>
            Reports Dashboard
          </h2>
          <p className="text-muted mb-0">Generate and manage system reports</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary">
            <i className="fas fa-plus me-2"></i>
            Create Report
          </button>
          <button className="btn btn-primary-custom">
            <i className="fas fa-sync me-2"></i>
            Refresh All
          </button>
        </div>
      </div>

      {/* Report Stats */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="stats-card">
            <div className="d-flex justify-content-between">
              <div>
                <p className="stats-label">Total Reports</p>
                <h3 className="stats-number">{reports.length}</h3>
              </div>
              <i className="fas fa-chart-bar text-primary fs-1 opacity-75"></i>
            </div>
          </div>
        </div>
            <div className="col-md-3">
              <div className="stats-card">
                <div className="d-flex justify-content-between">
                  <div>
                    <p className="stats-label">Available Types</p>
                    <h3 className="stats-number">{reports.length}</h3>
                  </div>
                  <i className="fas fa-list text-success fs-1 opacity-75"></i>
                </div>
              </div>
            </div>
        <div className="col-md-3">
          <div className="stats-card">
            <div className="d-flex justify-content-between">
              <div>
                <p className="stats-label">Total Records</p>
                <h3 className="stats-number">{reports.reduce((sum, r) => sum + r.records, 0)}</h3>
              </div>
              <i className="fas fa-database text-info fs-1 opacity-75"></i>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stats-card">
            <div className="d-flex justify-content-between">
              <div>
                <p className="stats-label">Last Updated</p>
                <h3 className="stats-number">Today</h3>
              </div>
              <i className="fas fa-clock text-warning fs-1 opacity-75"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Report Filters */}
      <div className="card card-custom mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <label className="form-label">Filter by Type</label>
              <select className="form-select">
                <option value="">All Types</option>
                <option value="applications">Applications</option>
                <option value="payments">Payments</option>
                <option value="employees">Employees</option>
                <option value="exams">Exams</option>
                <option value="users">Users</option>
                <option value="system">System</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Date Range</label>
              <select className="form-select">
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">&nbsp;</label>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-primary">
                  <i className="fas fa-filter me-1"></i> Apply Filter
                </button>
                <button className="btn btn-outline-secondary">
                  <i className="fas fa-times me-1"></i> Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading reports...</p>
        </div>
      ) : (
        <div className="row">
          {reports.map(report => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="card card-custom mt-4">
        <div className="card-header-custom">
          <h5 className="card-title mb-0">
            <i className="fas fa-bolt me-2"></i>
            Quick Report Actions
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3 mb-2">
              <Link href="/admin/dashboard/applications" className="btn btn-outline-info w-100">
                <i className="fas fa-file-alt me-2"></i>
                Application Reports
              </Link>
            </div>
            <div className="col-md-3 mb-2">
              <Link href="/admin/dashboard/payments" className="btn btn-outline-success w-100">
                <i className="fas fa-credit-card me-2"></i>
                Payment Reports
              </Link>
            </div>
            <div className="col-md-3 mb-2">
              <Link href="/admin/dashboard/employees" className="btn btn-outline-primary w-100">
                <i className="fas fa-users me-2"></i>
                Employee Reports
              </Link>
            </div>
            <div className="col-md-3 mb-2">
              <Link href="/admin/dashboard/exams" className="btn btn-outline-warning w-100">
                <i className="fas fa-clipboard-check me-2"></i>
                Exam Reports
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
