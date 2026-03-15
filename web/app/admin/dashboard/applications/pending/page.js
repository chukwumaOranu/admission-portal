'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';

export default function PendingReviewsPage() {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  // Redux state and actions
  const {
    applications: allApplications,
    loading,
    error,
    fetchApplications,
    updateApplicationStatus
  } = useApplications();

  // Filter for pending applications
  const applications = allApplications.filter(app => app.status === 'pending');

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      fetchApplications();
    }
  }, [status, session?.user?.id, session?.accessToken, fetchApplications]);

  const handleApproveApplication = async (applicationId) => {
    if (window.confirm('Are you sure you want to approve this application?')) {
      try {
        await updateApplicationStatus(applicationId, 'approved');
        alert('Application approved successfully!');
      } catch (error) {
        console.error('Error approving application:', error);
        alert('Failed to approve application');
      }
    }
  };

  const handleRejectApplication = async (applicationId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      try {
        await updateApplicationStatus(applicationId, 'rejected');
        alert('Application rejected successfully!');
      } catch (error) {
        console.error('Error rejecting application:', error);
        alert('Failed to reject application');
      }
    }
  };

  const handleRequestMoreInfo = async (applicationId) => {
    const message = prompt('What additional information is needed?');
    if (message) {
      try {
        // Update status to request more info (or you can add a new Redux action)
        await updateApplicationStatus(applicationId, 'pending', message);
        alert('Information request sent successfully!');
      } catch (error) {
        console.error('Error requesting information:', error);
        alert('Failed to send information request');
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
    <div className="pending-reviews-page">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-clock text-warning me-2"></i>
            Pending Reviews
          </h2>
          <p className="text-muted mb-0">Review and process applications awaiting approval</p>
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

      {/* Pending Applications */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-list me-2"></i>
            Applications Pending Review ({applications.length})
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
              <h5 className="text-success">All Caught Up!</h5>
              <p className="text-muted">No applications are currently pending review.</p>
            </div>
          ) : (
            <div className="row">
              {applications.map(application => (
                <div key={application.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100 border-warning">
                    <div className="card-header bg-warning text-dark">
                      <h6 className="mb-0">
                        <i className="fas fa-clock me-2"></i>
                        {application.schema_name || 'Application'}
                      </h6>
                      <small>Pending Review</small>
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
                          <i className="fas fa-calendar text-warning me-2"></i>
                          <span>Submitted: {new Date(application.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-hourglass-half text-danger me-2"></i>
                          <span>Days pending: {Math.floor((new Date() - new Date(application.created_at)) / (1000 * 60 * 60 * 24))}</span>
                        </div>
                      </div>
                      
                      {application.notes && (
                        <div className="mb-3">
                          <small className="text-muted">
                            <strong>Notes:</strong> {application.notes}
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
                          <i className="fas fa-eye me-1"></i> Review
                        </Link>
                        
                        {hasPermission('application.approve') && (
                          <button 
                            className="btn btn-outline-success btn-sm"
                            onClick={() => handleApproveApplication(application.id)}
                          >
                            <i className="fas fa-check me-1"></i> Approve
                          </button>
                        )}
                        
                        {hasPermission('application.reject') && (
                          <button 
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleRejectApplication(application.id)}
                          >
                            <i className="fas fa-times me-1"></i> Reject
                          </button>
                        )}
                        
                        <button 
                          className="btn btn-outline-info btn-sm"
                          onClick={() => handleRequestMoreInfo(application.id)}
                        >
                          <i className="fas fa-question me-1"></i> Request Info
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
              <h5 className="text-warning">{applications.length}</h5>
              <p className="mb-0">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="text-info">
                {applications.filter(app => 
                  Math.floor((new Date() - new Date(app.created_at)) / (1000 * 60 * 60 * 24)) > 7
                ).length}
              </h5>
              <p className="mb-0">Overdue (&gt;7 days)</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="text-success">
                {applications.filter(app => 
                  Math.floor((new Date() - new Date(app.created_at)) / (1000 * 60 * 60 * 24)) <= 3
                ).length}
              </h5>
              <p className="mb-0">Recent (&lt;3 days)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
