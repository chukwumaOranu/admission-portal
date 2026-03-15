'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';

export default function ReviewApplicationsPage() {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  // Redux state and actions
  const {
    applications: allApplications,
    loading,
    error: reduxError,
    fetchApplications,
    updateApplicationStatus
  } = useApplications();
  
  const [filter, setFilter] = useState('pending');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [error, setError] = useState('');

  // Filter applications by status
  const applications = filter === 'all' 
    ? allApplications 
    : allApplications.filter(app => app.status === filter);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchApplications();
    }
  }, [status, fetchApplications]);

  const handleViewDetails = (app) => {
    setSelectedApp(app);
    setShowModal(true);
  };

  const handleApprove = async (appId) => {
    if (!confirm('Are you sure you want to approve this application?')) return;
    
    try {
      setActionLoading(true);
      setActionType('approve');
      
      await updateApplicationStatus(appId, 'approved');
      
      alert('Application approved successfully!');
      setShowModal(false);
    } catch (err) {
      console.error('Error approving application:', err);
      alert('Failed to approve application');
    } finally {
      setActionLoading(false);
      setActionType(null);
    }
  };

  const handleReject = async (appId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      setActionLoading(true);
      setActionType('reject');
      
      await updateApplicationStatus(appId, 'rejected');
      
      alert('Application rejected');
      setShowModal(false);
    } catch (err) {
      console.error('Error rejecting application:', err);
      alert('Failed to reject application');
    } finally {
      setActionLoading(false);
      setActionType(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { color: 'warning', icon: 'clock', text: 'Pending Review' },
      'approved': { color: 'success', icon: 'check-circle', text: 'Approved' },
      'rejected': { color: 'danger', icon: 'times-circle', text: 'Rejected' }
    };
    
    const badge = badges[status] || badges['pending'];
    
    return (
      <span className={`badge bg-${badge.color}`}>
        <i className={`fas fa-${badge.icon} me-1`}></i>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
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
            <i className="fas fa-clipboard-check text-primary me-2"></i>
            Review Applications
          </h2>
          <p className="text-muted mb-0">Review and process student applications</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="btn-group w-100" role="group">
            <button
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`btn ${filter === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
            <button
              className={`btn ${filter === 'approved' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setFilter('approved')}
            >
              Approved
            </button>
            <button
              className={`btn ${filter === 'rejected' ? 'btn-danger' : 'btn-outline-danger'}`}
              onClick={() => setFilter('rejected')}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Applications Table */}
      {applications.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="fas fa-inbox text-muted" style={{ fontSize: '4rem' }}></i>
            <h5 className="mt-3 text-muted">No Applications Found</h5>
            <p className="text-muted">
              {filter === 'all' 
                ? "No applications submitted yet" 
                : `No ${filter} applications`}
            </p>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Application ID</th>
                    <th>Applicant</th>
                    <th>Program</th>
                    <th>Submitted</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <code>{app.application_id || `APP${app.id}`}</code>
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">{app.applicant_name}</div>
                          <small className="text-muted">{app.applicant_email}</small>
                        </div>
                      </td>
                      <td>{app.schema_display_name || app.schema_name}</td>
                      <td>
                        <div className="small">
                          {new Date(app.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span className={`badge bg-${app.payment_status === 'paid' ? 'success' : 'warning'}`}>
                          {app.payment_status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td>{getStatusBadge(app.status)}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleViewDetails(app)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          
                          {app.status === 'pending' && hasPermission('application.update') && (
                            <>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleApprove(app.id)}
                                disabled={actionLoading}
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleReject(app.id)}
                                disabled={actionLoading}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showModal && selectedApp && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-file-alt me-2"></i>
                  Application Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Applicant Info */}
                <div className="mb-4">
                  <h6 className="border-bottom pb-2 mb-3">Applicant Information</h6>
                  <div className="row">
                    <div className="col-md-6 mb-2">
                      <small className="text-muted d-block">Full Name</small>
                      <strong>{selectedApp.applicant_name}</strong>
                    </div>
                    <div className="col-md-6 mb-2">
                      <small className="text-muted d-block">Email</small>
                      <strong>{selectedApp.applicant_email}</strong>
                    </div>
                    <div className="col-md-6 mb-2">
                      <small className="text-muted d-block">Phone</small>
                      <strong>{selectedApp.applicant_phone || 'N/A'}</strong>
                    </div>
                    <div className="col-md-6 mb-2">
                      <small className="text-muted d-block">Application ID</small>
                      <code>{selectedApp.application_id || `APP${selectedApp.id}`}</code>
                    </div>
                  </div>
                </div>

                {/* Program Info */}
                <div className="mb-4">
                  <h6 className="border-bottom pb-2 mb-3">Program Information</h6>
                  <div className="row">
                    <div className="col-md-12 mb-2">
                      <small className="text-muted d-block">Program</small>
                      <strong>{selectedApp.schema_display_name || selectedApp.schema_name}</strong>
                    </div>
                    <div className="col-md-6 mb-2">
                      <small className="text-muted d-block">Application Fee</small>
                      <strong className="text-success">₦{parseFloat(selectedApp.application_fee || 0).toLocaleString()}</strong>
                    </div>
                    <div className="col-md-6 mb-2">
                      <small className="text-muted d-block">Payment Status</small>
                      <span className={`badge bg-${selectedApp.payment_status === 'paid' ? 'success' : 'warning'}`}>
                        {selectedApp.payment_status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Application Data */}
                {selectedApp.application_data && (
                  <div className="mb-4">
                    <h6 className="border-bottom pb-2 mb-3">Application Data</h6>
                    <div className="bg-light p-3 rounded">
                      <pre className="mb-0 small">{JSON.stringify(JSON.parse(selectedApp.application_data), null, 2)}</pre>
                    </div>
                  </div>
                )}

                {/* Status Info */}
                <div className="mb-4">
                  <h6 className="border-bottom pb-2 mb-3">Status Information</h6>
                  <div className="row">
                    <div className="col-md-6 mb-2">
                      <small className="text-muted d-block">Current Status</small>
                      {getStatusBadge(selectedApp.status)}
                    </div>
                    <div className="col-md-6 mb-2">
                      <small className="text-muted d-block">Submitted On</small>
                      <strong>{new Date(selectedApp.created_at).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                {selectedApp.status === 'pending' && hasPermission('application.update') && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => handleApprove(selectedApp.id)}
                      disabled={actionLoading}
                    >
                      {actionLoading && actionType === 'approve' ? (
                        <>
                          <i className="fas fa-spinner fa-spin me-2"></i>
                          Approving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check me-2"></i>
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleReject(selectedApp.id)}
                      disabled={actionLoading}
                    >
                      {actionLoading && actionType === 'reject' ? (
                        <>
                          <i className="fas fa-spinner fa-spin me-2"></i>
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-times me-2"></i>
                          Reject
                        </>
                      )}
                    </button>
                  </>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
