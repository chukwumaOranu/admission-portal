'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications, usePayments, useEmployees, useExams } from '@/hooks/useRedux';

function StatCard({ title, value, icon, color, subtitle }) {
  return (
    <div className="col-md-3 mb-4">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <p className="text-muted small text-uppercase fw-medium mb-1">{title}</p>
              <h3 className="fw-bold text-dark mb-2">{value.toLocaleString()}</h3>
              {subtitle && <small className="text-muted">{subtitle}</small>}
            </div>
            <div className={`text-${color} fs-1 opacity-75`}>
              <i className={icon}></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { status } = useSession();
  const { loading: permissionsLoading } = usePermissions();
  
  // Fetch real data from Redux stores
  const { applications, loading: appsLoading, fetchApplications } = useApplications();
  const { payments, loading: paymentsLoading, fetchPayments } = usePayments();
  const { employees, loading: employeesLoading, fetchEmployees } = useEmployees();
  const { entryDates, loading: examsLoading, fetchEntryDates } = useExams();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchApplications();
      fetchPayments();
      fetchEmployees();
      fetchEntryDates();
      
      // Set loading to false after a brief delay for data to be fetched
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [status, fetchApplications, fetchPayments, fetchEmployees, fetchEntryDates]);

  // Calculate analytics from real data
  const analytics = {
    applications: {
      total: applications.length,
      pending: applications.filter(a => a.status === 'pending' || a.status === 'submitted').length,
      approved: applications.filter(a => a.status === 'approved' || a.status === 'accepted').length,
      rejected: applications.filter(a => a.status === 'rejected' || a.status === 'declined').length
    },
    payments: {
      total: payments.length,
      successful: payments.filter(p => p.payment_status === 'success' || p.payment_status === 'paid').length,
      failed: payments.filter(p => p.payment_status === 'failed').length,
      pending: payments.filter(p => p.payment_status === 'pending').length
    },
    employees: {
      total: employees.length,
      active: employees.filter(e => e?.status === 'active').length,
      inactive: employees.filter(e => e?.status !== 'active').length
    },
    exams: {
      totalDates: entryDates.length,
      upcoming: entryDates.filter(e => new Date(e.exam_date) > new Date()).length,
      completed: entryDates.filter(e => new Date(e.exam_date) < new Date()).length
    }
  };

  const loading = isLoading || appsLoading || paymentsLoading || employeesLoading || examsLoading || permissionsLoading || status === 'loading';

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
            <i className="fas fa-chart-line text-primary-custom me-2"></i>
            Analytics Dashboard
          </h2>
          <p className="text-muted mb-0">Comprehensive analytics and insights for the admission portal</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary">
            <i className="fas fa-download me-2"></i>
            Export Report
          </button>
          <button className="btn btn-primary-custom">
            <i className="fas fa-sync me-2"></i>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Applications Analytics */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-file-alt me-2"></i>
                Application Analytics
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <StatCard
                  title="Total Applications"
                  value={analytics.applications.total}
                  icon="fas fa-file-alt"
                  color="info"
                  subtitle="All time"
                />
                <StatCard
                  title="Pending Review"
                  value={analytics.applications.pending}
                  icon="fas fa-clock"
                  color="warning"
                  subtitle="Awaiting review"
                />
                <StatCard
                  title="Approved"
                  value={analytics.applications.approved}
                  icon="fas fa-check-circle"
                  color="success"
                  subtitle="Successfully approved"
                />
                <StatCard
                  title="Rejected"
                  value={analytics.applications.rejected}
                  icon="fas fa-times-circle"
                  color="danger"
                  subtitle="Not approved"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Analytics */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-credit-card me-2"></i>
                Payment Analytics
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <StatCard
                  title="Total Payments"
                  value={analytics.payments.total}
                  icon="fas fa-credit-card"
                  color="success"
                  subtitle="All transactions"
                />
                <StatCard
                  title="Successful"
                  value={analytics.payments.successful}
                  icon="fas fa-check-double"
                  color="success"
                  subtitle="Completed payments"
                />
                <StatCard
                  title="Failed"
                  value={analytics.payments.failed}
                  icon="fas fa-times"
                  color="danger"
                  subtitle="Failed transactions"
                />
                <StatCard
                  title="Pending"
                  value={analytics.payments.pending}
                  icon="fas fa-hourglass-half"
                  color="warning"
                  subtitle="In progress"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee & Exam Analytics */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-users me-2"></i>
                Employee Analytics
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <StatCard
                    title="Total Employees"
                    value={analytics.employees.total}
                    icon="fas fa-users"
                    color="primary"
                  />
                </div>
                <div className="col-6">
                  <StatCard
                    title="Active"
                    value={analytics.employees.active}
                    icon="fas fa-user-check"
                    color="success"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-warning text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-clipboard-check me-2"></i>
                Exam Analytics
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <StatCard
                    title="Total Dates"
                    value={analytics.exams.totalDates}
                    icon="fas fa-calendar"
                    color="warning"
                  />
                </div>
                <div className="col-6">
                  <StatCard
                    title="Upcoming"
                    value={analytics.exams.upcoming}
                    icon="fas fa-clock"
                    color="info"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-secondary text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-2">
                  <Link href="/admin/dashboard/applications" className="btn btn-outline-info w-100">
                    <i className="fas fa-file-alt me-2"></i>
                    View Applications
                  </Link>
                </div>
                <div className="col-md-3 mb-2">
                  <Link href="/admin/dashboard/payments" className="btn btn-outline-success w-100">
                    <i className="fas fa-credit-card me-2"></i>
                    View Payments
                  </Link>
                </div>
                <div className="col-md-3 mb-2">
                  <Link href="/admin/dashboard/employees" className="btn btn-outline-primary w-100">
                    <i className="fas fa-users me-2"></i>
                    Manage Employees
                  </Link>
                </div>
                <div className="col-md-3 mb-2">
                  <Link href="/admin/dashboard/exams" className="btn btn-outline-warning w-100">
                    <i className="fas fa-clipboard-check me-2"></i>
                    Manage Exams
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
