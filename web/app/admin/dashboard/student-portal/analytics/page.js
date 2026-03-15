'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications, usePayments, useExams } from '@/hooks/useRedux';

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

export default function StudentAnalytics() {
  const { status } = useSession();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  
  // Fetch real data from Redux stores
  const { applications, loading: appsLoading, fetchMyApplications } = useApplications();
  const { payments, loading: paymentsLoading, fetchPayments } = usePayments();
  const { entryDates, loading: examsLoading, fetchEntryDates } = useExams();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMyApplications(); // Fetch only current user's applications
      fetchPayments();
      fetchEntryDates();
      
      // Set loading to false after a brief delay for data to be fetched
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [status, fetchMyApplications, fetchPayments, fetchEntryDates]);

  // Calculate analytics from real data - filtered for current student
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
    exams: {
      totalDates: entryDates.length,
      upcoming: entryDates.filter(e => new Date(e.exam_date) > new Date()).length,
      completed: entryDates.filter(e => new Date(e.exam_date) < new Date()).length
    }
  };

  const loading = isLoading || appsLoading || paymentsLoading || examsLoading || permissionsLoading || status === 'loading';

  // Check permissions
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!hasPermission('student_analytics.read')) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <h4>Access Denied</h4>
          <p>You don&apos;t have permission to view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="mb-4">
        <h2 className="h4 mb-1">
          <i className="fas fa-chart-line text-primary me-2"></i>
          My Analytics
        </h2>
        <p className="text-muted mb-0">View your application and payment analytics</p>
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

      {/* Exam Analytics */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-warning text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-clipboard-check me-2"></i>
                Exam Analytics
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-4">
                  <StatCard
                    title="Total Dates"
                    value={analytics.exams.totalDates}
                    icon="fas fa-calendar"
                    color="warning"
                  />
                </div>
                <div className="col-4">
                  <StatCard
                    title="Upcoming"
                    value={analytics.exams.upcoming}
                    icon="fas fa-clock"
                    color="info"
                  />
                </div>
                <div className="col-4">
                  <StatCard
                    title="Completed"
                    value={analytics.exams.completed}
                    icon="fas fa-check"
                    color="success"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
