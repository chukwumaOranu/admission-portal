'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';

export default function RejectedApplicationsPage() {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  // Redux state and actions
  const {
    applications: allApplications,
    loading,
    error,
    fetchApplications,
    updateApplicationStatus,
    sendRejectionLetter
  } = useApplications();

  // Filter for rejected applications
  const applications = allApplications.filter(app => app.status === 'rejected');

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      fetchApplications();
    }
  }, [status, session?.user?.id, session?.accessToken, fetchApplications]);

  const handleSendRejectionLetter = async (applicationId) => {
    try {
      await sendRejectionLetter(applicationId);
      alert('Rejection letter sent successfully!');
    } catch (error) {
      console.error('Error sending rejection letter:', error);
      alert('Failed to send rejection letter');
    }
  };

  const handleReconsiderApplication = async (applicationId) => {
    if (window.confirm('Are you sure you want to reconsider this application?')) {
      const reason = prompt('Please provide a reason for reconsideration:');
      if (reason) {
        try {
          await updateApplicationStatus(applicationId, 'pending');
          alert('Application moved back to pending review!');
        } catch (error) {
          console.error('Error reconsidering application:', error);
          alert('Failed to reconsider application');
        }
      }
    }
  };

  const handleAppealApplication = async (applicationId) => {
    const appealReason = prompt('Please provide the appeal reason:');
    if (appealReason) {
      try {
        // Update status with appeal notes (or create a separate Redux action if backend has specific appeal endpoint)
        await updateApplicationStatus(applicationId, 'pending', `Appeal: ${appealReason}`);
        alert('Appeal submitted successfully!');
      } catch (error) {
        console.error('Error submitting appeal:', error);
        alert('Failed to submit appeal');
      }
    }
  };

  // Show loading while checking authentication
  if (status === 'loading') {
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
    <div className="rejected-applications-page">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-times-circle text-danger me-2"></i>
            Rejected Applications
          </h2>
          <p className="text-muted mb-0">Review rejected applications and handle appeals</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/dashboard/applications" className="btn btn-outline-primary">
            <i className="fas fa-arrow-left me-2"></i>
            Back to Applications
          </Link>
          <button 
            className="btn btn-primary"
            onClick={fetchApplications}
            disabled={loading}
          >
            <i className="fas fa-sync me-2"></i>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Rejected Applications */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-list me-2"></i>
            Rejected Applications ({applications.length})
          </h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-check-circle text-success fs-1 mb-3"></i>
              <h5 className="text-success">No Rejected Applications</h5>
              <p className="text-muted">No applications have been rejected yet.</p>
            </div>
          ) : (
            <div className="row">
              {applications.map(application => (
                <div key={application.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100 border-danger">
                    <div className="card-header bg-danger text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-times-circle me-2"></i>
                        {application.schema_name || 'Application'}
                      </h6>
                      <small>Rejected</small>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-user text-info me-2"></i>
                          <strong>{application.applicant_name || 'Unknown Applicant'}</strong>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-envelope text-secondary me-2"></i>
                          <span>{application.applicant_email || 'No email'}</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-calendar text-danger me-2"></i>
                          <span>Rejected: {new Date(application.updated_at || application.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-clock text-warning me-2"></i>
                          <span>Days since rejection: {Math.floor((new Date() - new Date(application.updated_at || application.created_at)) / (1000 * 60 * 60 * 24))}</span>
                        </div>
                      </div>
                      
                      {application.rejection_reason && (
                        <div className="mb-3">
                          <small className="text-muted">
                            <strong>Rejection Reason:</strong> {application.rejection_reason}
                          </small>
                        </div>
                      )}

                      {application.appeal_reason && (
                        <div className="mb-3">
                          <small className="text-info">
                            <strong>Appeal Reason:</strong> {application.appeal_reason}
                          </small>
                        </div>
                      )}
                    </div>
                    <div className="card-footer">
                      <div className="d-flex gap-2 flex-wrap">
                        <Link 
                          href={`/admin/dashboard/applications/${application.id}`}
                          className="btn btn-outline-primary btn-sm"
                        >
                          <i className="fas fa-eye me-1"></i> View
                        </Link>
                        
                        <button 
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleSendRejectionLetter(application.id)}
                        >
                          <i className="fas fa-envelope me-1"></i> Send Letter
                        </button>
                        
                        {hasPermission('application.update') && (
                          <button 
                            className="btn btn-outline-warning btn-sm"
                            onClick={() => handleReconsiderApplication(application.id)}
                          >
                            <i className="fas fa-undo me-1"></i> Reconsider
                          </button>
                        )}

                        <button 
                          className="btn btn-outline-info btn-sm"
                          onClick={() => handleAppealApplication(application.id)}
                        >
                          <i className="fas fa-gavel me-1"></i> Appeal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row mt-4">
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="text-danger">{applications.length}</h5>
              <p className="mb-0">Total Rejected</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="text-warning">
                {applications.filter(app => 
                  Math.floor((new Date() - new Date(app.updated_at || app.created_at)) / (1000 * 60 * 60 * 24)) <= 7
                ).length}
              </h5>
              <p className="mb-0">Rejected This Week</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="text-info">
                {applications.filter(app => app.appeal_reason).length}
              </h5>
              <p className="mb-0">With Appeals</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
