'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { useApplications } from '@/hooks/useRedux';
import apiService from '@/services/api';

export default function ViewApplication() {
  const { data: session, status } = useSession();
  const params = useParams();
  const { applications, loading, error, fetchMyApplications } = useApplications();
  const [application, setApplication] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [downloadingCard, setDownloadingCard] = useState(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMyApplications(); // Fetch only current user's applications
    }
  }, [status, fetchMyApplications]);

  useEffect(() => {
    const fetchApplication = async () => {
      if (!params.id) return;
      
      setLoadingApp(true);
      try {
        // First try to find in Redux store
        const appFromRedux = applications.find(app => app.id === parseInt(params.id));
        
        if (appFromRedux) {
          setApplication(appFromRedux);
        } else {
          // Fallback to direct API call (which will use /applications/me internally for auth)
          const response = await apiService.get(`/applications/${params.id}`);
          setApplication(response.data || response);
        }
      } catch (error) {
        console.error('Error fetching application:', error);
      } finally {
        setLoadingApp(false);
      }
    };

    if (status === 'authenticated' && params.id) {
      fetchApplication();
    }
  }, [status, params.id, applications]);

  const handleDownloadExamCard = async (applicationId, format = 'pdf') => {
    try {
      setDownloadingCard(applicationId);
      
      // Generate exam card using the new API
      const response = await apiService.get(
        `/exams/cards/generate/${applicationId}?format=${format}`,
        { responseType: 'blob' }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `exam-card-${application?.application_id || applicationId}.${format === 'pdf' ? 'pdf' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading exam card:', error);
      alert('Failed to download exam card. Please try again.');
    } finally {
      setDownloadingCard(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { color: 'warning', icon: 'clock', text: 'Pending Review' },
      'approved': { color: 'success', icon: 'check-circle', text: 'Approved' },
      'rejected': { color: 'danger', icon: 'times-circle', text: 'Rejected' },
      'draft': { color: 'secondary', icon: 'edit', text: 'Draft' }
    };
    
    const badge = badges[status] || badges['pending'];
    
    return (
      <span className={`badge bg-${badge.color}`}>
        <i className={`fas fa-${badge.icon} me-1`}></i>
        {badge.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const badges = {
      'paid': { color: 'success', icon: 'check-circle', text: 'Paid' },
      'pending': { color: 'warning', icon: 'clock', text: 'Pending' },
      'failed': { color: 'danger', icon: 'times-circle', text: 'Failed' }
    };
    
    const badge = badges[paymentStatus] || badges['pending'];
    
    return (
      <span className={`badge bg-${badge.color}`}>
        <i className={`fas fa-${badge.icon} me-1`}></i>
        {badge.text}
      </span>
    );
  };

  if (loading || loadingApp) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
        <Link href="/admin/dashboard/student-portal/applications" className="btn btn-primary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to Applications
        </Link>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container-fluid">
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '4rem' }}></i>
            <h5 className="mt-3">Application Not Found</h5>
            <p className="text-muted">The application you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
            <Link href="/admin/dashboard/student-portal/applications" className="btn btn-primary mt-3">
              <i className="fas fa-arrow-left me-2"></i>
              Back to Applications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-file-alt text-primary me-2"></i>
            Application Details
          </h2>
          <p className="text-muted mb-0">
            <i className="fas fa-hashtag me-1"></i>
            {application.application_number || `APP${application.id}`}
          </p>
        </div>
        <Link href="/admin/dashboard/student-portal/applications" className="btn btn-outline-primary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to Applications
        </Link>
      </div>

      {/* Status Cards */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h6 className="card-title text-muted">Application Status</h6>
              {getStatusBadge(application.status)}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h6 className="card-title text-muted">Payment Status</h6>
              {getPaymentStatusBadge(application.payment_status)}
            </div>
          </div>
        </div>
      </div>

      {/* Application Information */}
      <div className="row">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="fas fa-info-circle text-primary me-2"></i>
                Application Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted small">Program</label>
                    <p className="mb-0 fw-bold">{application.schema_display_name || application.schema_name}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small">Applicant Name</label>
                    <p className="mb-0">{application.first_name} {application.last_name}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small">Email</label>
                    <p className="mb-0">{application.email}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small">Phone</label>
                    <p className="mb-0">{application.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted small">Application Fee</label>
                    <p className="mb-0 fw-bold text-success">₦{parseFloat(application.application_fee || 0).toLocaleString()}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small">Submitted Date</label>
                    <p className="mb-0">{new Date(application.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small">Last Updated</label>
                    <p className="mb-0">{new Date(application.updated_at).toLocaleDateString()}</p>
                  </div>
                  {application.exam_date && (
                    <div className="mb-3">
                      <label className="form-label text-muted small">Exam Date</label>
                      <p className="mb-0">{new Date(application.exam_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {application.additional_info && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <i className="fas fa-plus-circle text-primary me-2"></i>
                  Additional Information
                </h5>
              </div>
              <div className="card-body">
                <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {JSON.stringify(application.additional_info, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Review Notes */}
          {application.review_notes && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <i className="fas fa-sticky-note text-primary me-2"></i>
                  Review Notes
                </h5>
              </div>
              <div className="card-body">
                <p className="mb-0">{application.review_notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Actions */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="fas fa-cogs text-primary me-2"></i>
                Actions
              </h5>
            </div>
            <div className="card-body">
              {application.payment_status !== 'paid' && (
                <Link
                  href={`/admin/dashboard/student-portal/payments/pay/${application.id}`}
                  className="btn btn-success w-100 mb-2"
                >
                  <i className="fas fa-credit-card me-2"></i>
                  Make Payment
                </Link>
              )}
              
              {application.status === 'approved' && application.exam_date && (
                <>
                  <Link
                    href={`/admin/dashboard/student-portal/exams`}
                    className="btn btn-info w-100 mb-2"
                  >
                    <i className="fas fa-clipboard-check me-2"></i>
                    View Exam Details
                  </Link>
                  
                  <button
                    className="btn btn-primary w-100 mb-2"
                    onClick={() => handleDownloadExamCard(application.id, 'pdf')}
                    disabled={downloadingCard === application.id}
                  >
                    {downloadingCard === application.id ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-file-pdf me-2"></i>
                        Download Exam Card (PDF)
                      </>
                    )}
                  </button>
                </>
              )}

              <Link
                href="/admin/dashboard/student-portal/applications"
                className="btn btn-outline-primary w-100"
              >
                <i className="fas fa-list me-2"></i>
                All Applications
              </Link>
            </div>
          </div>

          {/* Payment Information */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="fas fa-credit-card text-primary me-2"></i>
                Payment Information
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label text-muted small">Amount</label>
                <p className="mb-0 fw-bold text-success">₦{parseFloat(application.application_fee || 0).toLocaleString()}</p>
              </div>
              <div className="mb-3">
                <label className="form-label text-muted small">Status</label>
                <div>{getPaymentStatusBadge(application.payment_status)}</div>
              </div>
              {application.payment_status === 'paid' && (
                <div className="mb-3">
                  <label className="form-label text-muted small">Payment Reference</label>
                  <p className="mb-0 small">{application.payment_reference || 'N/A'}</p>
                </div>
              )}
              <Link
                href="/admin/dashboard/student-portal/payments/history"
                className="btn btn-outline-secondary btn-sm w-100"
              >
                <i className="fas fa-history me-1"></i>
                Payment History
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
