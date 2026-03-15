'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useApplications } from '@/hooks/useRedux';

export default function StudentApplications() {
  const { data: session, status } = useSession();
  const { applications, schemas: allSchemas, loading, error, fetchMyApplications, fetchApplicationSchemas } = useApplications();
  const [filter, setFilter] = useState('all');
  const [showBrowse, setShowBrowse] = useState(false);
  const searchParams = useSearchParams();

  // Get available schemas (programs)
  const schemas = allSchemas.filter(s => s.is_active);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      console.log('🔍 StudentApplications: Fetching applications for user:', session.user);
      fetchMyApplications(); // Fetch only current user's applications
      fetchApplicationSchemas();
    } else if (status === 'unauthenticated') {
      console.warn('⚠️ StudentApplications: User not authenticated');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.id, session?.accessToken]);

  // Refresh data when user returns to the page (e.g., after payment)
  useEffect(() => {
    const handleFocus = () => {
      if (status === 'authenticated') {
        fetchMyApplications();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Check for payment success parameter and refresh data
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment_success');
    if (paymentSuccess === 'true' && status === 'authenticated') {
      // Refresh applications data to show updated payment status
      fetchMyApplications();
      // Show success message
      alert('Payment successful! Your application status has been updated.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, status]);

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

  const filteredApplications = filter === 'all' 
    ? applications 
    : applications.filter(app => app.status === filter);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-file-alt text-primary me-2"></i>
            My Applications
          </h2>
          <p className="text-muted mb-0">Track your application status</p>
        </div>
        <div className="d-flex gap-2">
          {applications.length === 0 && schemas.length > 0 && !showBrowse && (
            <button 
              className="btn btn-success"
              onClick={() => setShowBrowse(true)}
            >
              <i className="fas fa-plus me-2"></i>
              Browse Programs
            </button>
          )}
          <Link href="/admin/dashboard/student-portal/applications/browse" className="btn btn-outline-primary">
            <i className="fas fa-search me-2"></i>
            {applications.length > 0 ? 'Browse All' : 'Browse Programs'}
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* No Applications - Show Browse Cards */}
      {applications.length === 0 && !showBrowse && (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="fas fa-inbox text-muted" style={{ fontSize: '4rem' }}></i>
            <h5 className="mt-3 text-muted">No Applications Found</h5>
            <p className="text-muted">
              You haven&apos;t submitted any applications yet
            </p>
            <div className="d-flex gap-2 justify-content-center mt-4">
              <button 
                className="btn btn-primary"
                onClick={() => setShowBrowse(true)}
              >
                <i className="fas fa-search me-2"></i>
                Browse Available Programs
              </button>
              <Link 
                href="/admin/dashboard/student-portal/applications/browse" 
                className="btn btn-outline-primary"
              >
                <i className="fas fa-arrow-right me-2"></i>
                View All Programs
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Browse Section (shown when no applications or when toggled) */}
      {((applications.length === 0 && showBrowse) || showBrowse) && schemas.length > 0 && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">
              <i className="fas fa-graduation-cap text-success me-2"></i>
              Available Programs to Apply
            </h5>
            {applications.length > 0 && (
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowBrowse(false)}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Hide Browse
              </button>
            )}
          </div>

          <div className="row mb-4">
            {schemas.map((schema) => (
              <div key={schema.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-gradient-primary text-white">
                    <h6 className="card-title mb-0">
                      <i className="fas fa-graduation-cap me-2"></i>
                      {schema.display_name || schema.schema_name}
                    </h6>
                  </div>
                  <div className="card-body">
                    <p className="text-muted small mb-3">
                      {schema.description || 'No description available'}
                    </p>

                    <div className="mb-3 p-3 bg-light rounded">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Application Fee:</span>
                        <strong className="text-success">
                          ₦{parseFloat(schema.application_fee || 0).toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    <div className="alert alert-light border small mb-0">
                      <ul className="mb-0 ps-3">
                        <li>Valid birth certificate</li>
                        <li>Passport photograph</li>
                        <li>Previous school records</li>
                      </ul>
                    </div>
                  </div>
                  <div className="card-footer bg-white">
                    <Link
                      href={`/admin/dashboard/student-portal/applications/new?schema=${schema.id}`}
                      className="btn btn-success w-100 btn-sm"
                    >
                      <i className="fas fa-paper-plane me-2"></i>
                      Apply Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Applications List (shown when there are applications) */}
      {applications.length > 0 && (
        <>
          {/* Filter Tabs */}
          {!showBrowse && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <div className="btn-group w-100" role="group">
                  <button
                    className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setFilter('all')}
                  >
                    All ({applications.length})
                  </button>
                  <button
                    className={`btn ${filter === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={() => setFilter('pending')}
                  >
                    Pending ({applications.filter(a => a.status === 'pending').length})
                  </button>
                  <button
                    className={`btn ${filter === 'approved' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => setFilter('approved')}
                  >
                    Approved ({applications.filter(a => a.status === 'approved').length})
                  </button>
                  <button
                    className={`btn ${filter === 'rejected' ? 'btn-danger' : 'btn-outline-danger'}`}
                    onClick={() => setFilter('rejected')}
                  >
                    Rejected ({applications.filter(a => a.status === 'rejected').length})
                  </button>
                </div>
              </div>
            </div>
          )}

          {filteredApplications.length === 0 && !showBrowse ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <h5 className="text-muted">No {filter} applications</h5>
              </div>
            </div>
          ) : !showBrowse && (
            <div className="row">
              {filteredApplications.map((app) => (
                <div key={app.id} className="col-md-6 mb-4">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-header bg-light">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{app.schema_display_name || app.schema_name}</h6>
                          <small className="text-muted">
                            <i className="fas fa-hashtag me-1"></i>
                            {app.application_number || `APP${app.id}`}
                          </small>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted small">Submitted:</span>
                          <span className="small">{new Date(app.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted small">Application Fee:</span>
                          <strong className="text-success">₦{parseFloat(app.application_fee || 0).toLocaleString()}</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted small">Payment Status:</span>
                          <span className={`badge bg-${app.payment_status === 'paid' ? 'success' : 'warning'}`}>
                            {app.payment_status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                      </div>

                      {app.status === 'pending' && app.payment_status !== 'paid' && (
                        <div className="alert alert-warning small mb-3">
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          Payment required to complete application
                        </div>
                      )}
                    </div>
                    <div className="card-footer bg-white">
                      <div className="d-flex gap-2">
                        <Link
                          href={`/admin/dashboard/student-portal/applications/${app.id}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="fas fa-eye me-1"></i>
                          View
                        </Link>
                        
                        {app.payment_status !== 'paid' && (
                          <Link
                            href={`/admin/dashboard/student-portal/payments/pay/${app.id}`}
                            className="btn btn-sm btn-success"
                          >
                            <i className="fas fa-credit-card me-1"></i>
                            Pay Now
                          </Link>
                        )}

                        {app.payment_status === 'paid' && !app.exam_date_id && (
                          <Link
                            href={`/admin/dashboard/student-portal/exams?application_id=${app.id}`}
                            className="btn btn-sm btn-info"
                          >
                            <i className="fas fa-calendar-alt me-1"></i>
                            Select Exam Date
                          </Link>
                        )}

                        {app.payment_status === 'paid' && app.exam_date_id && (
                          <span className="btn btn-sm btn-outline-success disabled">
                            <i className="fas fa-check me-1"></i>
                            Exam Date Selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .bg-gradient-primary {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
        }
      `}</style>
    </div>
  );
}
