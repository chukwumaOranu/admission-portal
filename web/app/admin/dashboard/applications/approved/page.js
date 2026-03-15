'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';

export default function ApprovedApplicationsPage() {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  // Redux state and actions
  const {
    applications: allApplications,
    loading,
    error,
    fetchApplications,
    updateApplicationStatus,
    sendAcceptanceLetter,
    generateAdmissionLetter
  } = useApplications();

  // Filter for approved applications
  const applications = allApplications.filter(app => app.status === 'approved');

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      fetchApplications();
    }
  }, [status, session?.user?.id, session?.accessToken, fetchApplications]);

  const handleSendAcceptanceLetter = async (applicationId) => {
    try {
      await sendAcceptanceLetter(applicationId);
      alert('Acceptance letter sent successfully!');
    } catch (error) {
      console.error('Error sending acceptance letter:', error);
      alert('Failed to send acceptance letter');
    }
  };

  const handleGenerateAdmissionLetter = async (applicationId) => {
    try {
      const result = await generateAdmissionLetter(applicationId);
      // Handle file download
      const blob = result.payload.blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admission-letter-${applicationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating admission letter:', error);
      alert('Failed to generate admission letter');
    }
  };

  const handleRevokeApproval = async (applicationId) => {
    if (window.confirm('Are you sure you want to revoke the approval for this application?')) {
      const reason = prompt('Please provide a reason for revoking approval:');
      if (reason) {
        try {
          await updateApplicationStatus(applicationId, 'pending', reason);
          alert('Approval revoked successfully!');
        } catch (error) {
          console.error('Error revoking approval:', error);
          alert('Failed to revoke approval');
        }
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
    <div className="approved-applications-page">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-check-circle text-success me-2"></i>
            Approved Applications
          </h2>
          <p className="text-muted mb-0">Manage approved applications and send acceptance letters</p>
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

      {/* Approved Applications */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-list me-2"></i>
            Approved Applications ({applications.length})
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
              <i className="fas fa-inbox text-muted fs-1 mb-3"></i>
              <h5 className="text-muted">No Approved Applications</h5>
              <p className="text-muted">No applications have been approved yet.</p>
            </div>
          ) : (
            <div className="row">
              {applications.map(application => (
                <div key={application.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100 border-success">
                    <div className="card-header bg-success text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-check-circle me-2"></i>
                        {application.schema_name || 'Application'}
                      </h6>
                      <small>Approved</small>
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
                          <i className="fas fa-calendar text-success me-2"></i>
                          <span>Approved: {new Date(application.updated_at || application.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-clock text-info me-2"></i>
                          <span>Days since approval: {Math.floor((new Date() - new Date(application.updated_at || application.created_at)) / (1000 * 60 * 60 * 24))}</span>
                        </div>
                      </div>
                      
                      {application.approval_notes && (
                        <div className="mb-3">
                          <small className="text-muted">
                            <strong>Approval Notes:</strong> {application.approval_notes}
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
                          className="btn btn-outline-success btn-sm"
                          onClick={() => handleSendAcceptanceLetter(application.id)}
                        >
                          <i className="fas fa-envelope me-1"></i> Send Letter
                        </button>
                        
                        <button 
                          className="btn btn-outline-info btn-sm"
                          onClick={() => handleGenerateAdmissionLetter(application.id)}
                        >
                          <i className="fas fa-file-pdf me-1"></i> Generate PDF
                        </button>
                        
                        {hasPermission('application.update') && (
                          <button 
                            className="btn btn-outline-warning btn-sm"
                            onClick={() => handleRevokeApproval(application.id)}
                          >
                            <i className="fas fa-undo me-1"></i> Revoke
                          </button>
                        )}
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
              <h5 className="text-success">{applications.length}</h5>
              <p className="mb-0">Total Approved</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="text-info">
                {applications.filter(app => 
                  Math.floor((new Date() - new Date(app.updated_at || app.created_at)) / (1000 * 60 * 60 * 24)) <= 7
                ).length}
              </h5>
              <p className="mb-0">Approved This Week</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="text-warning">
                {applications.filter(app => !app.acceptance_letter_sent).length}
              </h5>
              <p className="mb-0">Pending Letters</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
