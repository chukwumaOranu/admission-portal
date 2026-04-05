'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  useUsers, 
  useEmployees, 
  useApplications, 
  usePayments, 
  useExams, 
  useSettings,
  useDepartments 
} from '@/hooks/useRedux';

function StatCard({ title, value, icon, color, href, overallLoading }) {
  return (
    <div className="col-lg-4 col-md-6 mb-4">
      <Link href={href || '#'} className="text-decoration-none">
        <div className="card border-0 shadow-sm h-100 stat-card">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div className="flex-grow-1">
                <p className="text-muted small text-uppercase fw-semibold mb-2 letter-spacing-1">{title}</p>
                <h2 className="fw-bold text-dark mb-0 display-6">{overallLoading ? '...' : value.toLocaleString()}</h2>
              </div>
              <div className={`stat-icon text-${color}`}>
                <i className={icon}></i>
              </div>
            </div>
            <div className="mt-3">
              <div className={`progress progress-sm bg-${color}-light`} style={{ height: '4px' }}>
                <div
                  className={`progress-bar bg-${color}`}
                  style={{ width: `${value > 0 ? 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

function QuickActionCard({ title, description, icon, color, href }) {
  return (
    <div className="col-md-4 mb-3">
      <Link href={href} className="text-decoration-none">
        <div className="card border-0 shadow-sm h-100 quick-action-card">
          <div className="card-body text-center p-4">
            <div className={`text-${color} mb-3 quick-action-icon`}>
              <i className={`${icon} fs-1`}></i>
            </div>
            <h5 className="card-title fw-bold">{title}</h5>
            <p className="card-text text-muted small">{description}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function Dashboard() {
  const { data: session, status } = useSession();

  // Redux hooks for all available data
  const { users, loading: usersLoading, fetchUsers } = useUsers();
  const { employees, loading: employeesLoading, fetchEmployees } = useEmployees();
  const { applications, loading: applicationsLoading, fetchApplications } = useApplications();
  const { payments, loading: paymentsLoading, fetchPayments, fetchPaymentStats } = usePayments();
  const { entryDates, loading: examsLoading, fetchEntryDates } = useExams();
  const { schoolSettings, loading: settingsLoading, fetchSchoolSettings } = useSettings();
  const { departments, loading: departmentsLoading, fetchDepartments } = useDepartments();

  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedDashboardRef = useRef(false);
  const loadDashboardDataRef = useRef(null);

  const generateRecentActivities = useCallback(() => {
    const activities = [];

    if (session?.user?.username) {
      activities.push({
        id: 1,
        type: 'user_login',
        message: `${session.user.username} logged in`,
        time: 'Just now',
        icon: 'fas fa-user',
        color: 'success'
      });
    }

    if (applications.length > 0) {
      const recentApps = applications.slice(0, 2);
      recentApps.forEach((app, index) => {
        activities.push({
          id: `app_${index + 2}`,
          type: 'application',
          message: `New application from ${app.first_name} ${app.last_name}`,
          time: 'Recently',
          icon: 'fas fa-file-alt',
          color: 'info'
        });
      });
    }

    if (payments.length > 0) {
      const recentPayments = payments.slice(0, 2);
      recentPayments.forEach((payment, index) => {
        activities.push({
          id: `payment_${index + 4}`,
          type: 'payment',
          message: `Payment ${payment.payment_status}: ₦${parseFloat(payment.amount).toLocaleString()}`,
          time: 'Recently',
          icon: 'fas fa-credit-card',
          color: payment.payment_status === 'success' ? 'success' : 'warning'
        });
      });
    }

    activities.push({
      id: 'system_1',
      type: 'system',
      message: 'System initialized successfully',
      time: '5 minutes ago',
      icon: 'fas fa-cog',
      color: 'info'
    });

    setRecentActivities(activities.slice(0, 6));
  }, [applications, payments, session?.user?.username]);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch all Redux data
      await Promise.all([
        fetchUsers(),
        fetchEmployees(),
        fetchApplications(),
        fetchPayments(),
        fetchPaymentStats(),
        fetchEntryDates(),
        fetchSchoolSettings(),
        fetchDepartments()
      ]);

      // Generate recent activities based on real data
      generateRecentActivities();

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    fetchUsers,
    fetchEmployees,
    fetchApplications,
    fetchPayments,
    fetchPaymentStats,
    fetchEntryDates,
    fetchSchoolSettings,
    fetchDepartments,
    generateRecentActivities
  ]);

  useEffect(() => {
    loadDashboardDataRef.current = loadDashboardData;
  }, [loadDashboardData]);

  useEffect(() => {
    hasLoadedDashboardRef.current = false;
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !hasLoadedDashboardRef.current) {
      hasLoadedDashboardRef.current = true;
      loadDashboardDataRef.current?.();
    }
  }, [status, session?.user?.id, session?.accessToken]);

  useEffect(() => {
    if (session?.user?.id && (applications.length > 0 || payments.length > 0)) {
      generateRecentActivities();
    }
  }, [applications, payments, session?.user?.id, generateRecentActivities]);

  const stats = useMemo(() => {
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(app =>
      app.status === 'under_review' || app.status === 'pending'
    ).length;
    const approvedApplications = applications.filter(app =>
      app.status === 'approved'
    ).length;

    const totalPayments = payments.length;
    const successfulPayments = payments.filter(payment =>
      payment.payment_status === 'success'
    ).length;

    const totalEntryDates = entryDates.length;
    const upcomingExams = entryDates.filter(date =>
      new Date(date.exam_date) > new Date()
    ).length;

    return {
      totalUsers: users.length,
      totalEmployees: employees.length,
      totalApplications,
      pendingApplications,
      approvedApplications,
      totalPayments,
      successfulPayments,
      totalEntryDates,
      upcomingExams,
      totalDepartments: departments.length
    };
  }, [applications, payments, entryDates, users.length, employees.length, departments.length]);
  const overallLoading = isLoading || usersLoading || employeesLoading || applicationsLoading || paymentsLoading || examsLoading || settingsLoading || departmentsLoading;

  // Show loading if session is still loading or data is being fetched
  if (status === 'loading' || overallLoading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if no session
  if (!session) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          You must be logged in to access the dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <style jsx>{`
        .stat-card {
          transition: all 0.3s ease;
          border-radius: 12px;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          position: relative;
          overflow: hidden;
        }
        
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--bs-primary), var(--bs-info));
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important;
        }
        
        .stat-card:hover::before {
          opacity: 1;
        }
        
        .stat-icon {
          font-size: 3rem;
          opacity: 0.8;
          transition: all 0.3s ease;
        }
        
        .stat-card:hover .stat-icon {
          transform: scale(1.1);
          opacity: 1;
        }
        
        .letter-spacing-1 {
          letter-spacing: 0.5px;
        }
        
        .progress-sm {
          height: 4px !important;
          border-radius: 2px;
          background-color: rgba(0,0,0,0.1);
        }
        
        .bg-primary-light { background-color: rgba(13, 110, 253, 0.1) !important; }
        .bg-info-light { background-color: rgba(13, 202, 240, 0.1) !important; }
        .bg-success-light { background-color: rgba(25, 135, 84, 0.1) !important; }
        .bg-warning-light { background-color: rgba(255, 193, 7, 0.1) !important; }
        .bg-secondary-light { background-color: rgba(108, 117, 125, 0.1) !important; }
        
        .display-6 {
          font-size: 2.5rem;
          font-weight: 700;
        }
        
        @media (max-width: 768px) {
          .display-6 {
            font-size: 2rem;
          }
          .stat-icon {
            font-size: 2.5rem;
          }
        }
        
        .quick-action-card {
          transition: all 0.3s ease;
          border-radius: 12px;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        }
        
        .quick-action-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important;
        }
        
        .quick-action-icon {
          transition: all 0.3s ease;
        }
        
        .quick-action-card:hover .quick-action-icon {
          transform: scale(1.1);
        }
      `}</style>
      {/* Welcome Message */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm bg-primary text-white">
            <div className="card-body">
              <h4 className="card-title mb-2">
                <i className="fas fa-graduation-cap me-2"></i>
                Welcome to {schoolSettings?.school_name || 'Admission Portal'}
              </h4>
              <p className="card-text mb-0">
                Hello <strong>{session?.user?.username || 'User'}</strong>! You are logged in as <span className="badge bg-light text-dark">{session?.user?.role || 'User'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Applications & Users Stats */}
      <div className="row mb-4">
        <StatCard
          title="Total Applications"
          value={stats.totalApplications}
          icon="fas fa-file-alt"
          color="info"
          href="/admin/dashboard/applications"
          overallLoading={overallLoading}
        />
        <StatCard
          title="Pending Review"
          value={stats.pendingApplications}
          icon="fas fa-clock"
          color="warning"
          href="/admin/dashboard/applications?status=under_review"
          overallLoading={overallLoading}
        />
        <StatCard
          title="Approved Applications"
          value={stats.approvedApplications}
          icon="fas fa-check-circle"
          color="success"
          href="/admin/dashboard/applications?status=approved"
          overallLoading={overallLoading}
        />
      </div>

      {/* Users & Departments Stats */}
      <div className="row mb-4">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon="fas fa-users"
          color="primary"
          href="/admin/dashboard/employees"
          overallLoading={overallLoading}
        />
        <StatCard
          title="Departments"
          value={stats.totalDepartments}
          icon="fas fa-building"
          color="secondary"
          href="/admin/dashboard/employees/departments"
          overallLoading={overallLoading}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon="fas fa-user-shield"
          color="dark"
          href="/admin/dashboard/users"
          overallLoading={overallLoading}
        />
      </div>

      {/* Payment & Exam Stats */}
      <div className="row mb-5">
        <StatCard
          title="Total Payments"
          value={stats.totalPayments}
          icon="fas fa-credit-card"
          color="success"
          href="/admin/dashboard/payments"
          overallLoading={overallLoading}
        />
        <StatCard
          title="Successful Payments"
          value={stats.successfulPayments}
          icon="fas fa-check-double"
          color="success"
          href="/admin/dashboard/payments?status=success"
          overallLoading={overallLoading}
        />
        <StatCard
          title="Entry Exam Dates"
          value={stats.totalEntryDates}
          icon="fas fa-calendar-alt"
          color="info"
          href="/admin/dashboard/exams/entry-dates"
          overallLoading={overallLoading}
        />
      </div>

      {/* Exam Stats */}
      <div className="row mb-5">
        <StatCard
          title="Upcoming Exams"
          value={stats.upcomingExams}
          icon="fas fa-clipboard-check"
          color="warning"
          href="/admin/dashboard/exams/cards"
          overallLoading={overallLoading}
        />
        <div className="col-lg-4 col-md-6 mb-4">
          {/* Empty space for consistent layout */}
        </div>
        <div className="col-lg-4 col-md-6 mb-4">
          {/* Empty space for consistent layout */}
        </div>
      </div>

      <div className="row">
        {/* Quick Actions */}
        <div className="col-lg-8 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <QuickActionCard
                  title="Manage Applications"
                  description="Review and process student applications"
                  icon="fas fa-file-check"
                  color="info"
                  href="/admin/dashboard/applications"
                />
                <QuickActionCard
                  title="Employee Management"
                  description="Manage school employees and staff"
                  icon="fas fa-users-cog"
                  color="primary"
                  href="/admin/dashboard/employees"
                />
                <QuickActionCard
                  title="Payment Management"
                  description="Monitor and manage payments"
                  icon="fas fa-credit-card"
                  color="success"
                  href="/admin/dashboard/payments"
                />
                <QuickActionCard
                  title="Exam Management"
                  description="Schedule and manage entry exams"
                  icon="fas fa-clipboard-check"
                  color="warning"
                  href="/admin/dashboard/exams/entry-dates"
                />
                <QuickActionCard
                  title="School Settings"
                  description="Configure school preferences"
                  icon="fas fa-cog"
                  color="secondary"
                  href="/admin/dashboard/settings/school"
                />
                <QuickActionCard
                  title="User Management"
                  description="Manage system users and roles"
                  icon="fas fa-user-shield"
                  color="danger"
                  href="/admin/dashboard/users"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="col-lg-4 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-history me-2"></i>
                Recent Activities
              </h5>
            </div>
            <div className="card-body">
              {overallLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="list-group-item border-0 px-0">
                      <div className="d-flex align-items-start">
                        <div className={`me-3 text-${activity.color}`}>
                          <i className={activity.icon}></i>
                        </div>
                        <div className="flex-grow-1">
                          <p className="mb-1 small">{activity.message}</p>
                          <small className="text-muted">{activity.time}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-center mt-3">
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={loadDashboardData}
                  disabled={overallLoading}
                >
                  <i className="fas fa-sync me-1"></i>
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-server me-2"></i>
                Admission Portal Status
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 text-center mb-3">
                  <i className="fas fa-database text-success fs-1 mb-2"></i>
                  <h6>Database</h6>
                  <span className="badge bg-success">Online</span>
                </div>
                <div className="col-md-3 text-center mb-3">
                  <i className="fas fa-credit-card text-success fs-1 mb-2"></i>
                  <h6>Paystack</h6>
                  <span className="badge bg-success">Active</span>
                </div>
                <div className="col-md-3 text-center mb-3">
                  <i className="fas fa-cloud text-success fs-1 mb-2"></i>
                  <h6>File Uploads</h6>
                  <span className="badge bg-success">Available</span>
                </div>
                <div className="col-md-3 text-center mb-3">
                  <i className="fas fa-shield-alt text-success fs-1 mb-2"></i>
                  <h6>Security</h6>
                  <span className="badge bg-success">Protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
