'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications, usePayments, useExams } from '@/hooks/useRedux';

export default function StudentReports() {
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

  // Generate reports from real data
  const reports = [
    {
      id: 1,
      title: 'Application Summary Report',
      description: 'Overview of your applications',
      type: 'applications',
      icon: 'fas fa-file-alt',
      color: 'info',
      lastGenerated: new Date().toISOString().split('T')[0],
      records: applications.length
    },
    {
      id: 2,
      title: 'Payment Transaction Report',
      description: 'Detailed payment analysis',
      type: 'payments',
      icon: 'fas fa-credit-card',
      color: 'success',
      lastGenerated: new Date().toISOString().split('T')[0],
      records: payments.length
    },
    {
      id: 3,
      title: 'Exam Schedule Report',
      description: 'Upcoming and completed exams',
      type: 'exams',
      icon: 'fas fa-clipboard-check',
      color: 'warning',
      lastGenerated: new Date().toISOString().split('T')[0],
      records: entryDates.length
    },
    {
      id: 4,
      title: 'Profile Summary',
      description: 'Your profile information',
      type: 'profile',
      icon: 'fas fa-user',
      color: 'primary',
      lastGenerated: new Date().toISOString().split('T')[0],
      records: 1
    }
  ];

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

  if (!hasPermission('student_report.read')) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <h4>Access Denied</h4>
          <p>You don&apos;t have permission to view reports.</p>
        </div>
      </div>
    );
  }

  const ReportCard = ({ report }) => (
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
                <small className="text-muted">Last Updated</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="mb-4">
        <h2 className="h4 mb-1">
          <i className="fas fa-chart-bar text-primary me-2"></i>
          My Reports
        </h2>
        <p className="text-muted mb-0">View your summary reports</p>
      </div>

      {/* Reports Grid */}
      <div className="row">
        {reports.map(report => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>
    </div>
  );
}
