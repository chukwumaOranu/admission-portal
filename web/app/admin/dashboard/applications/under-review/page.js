'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';
import apiService from '@/services/api';
import { API_URL } from '@/services/api';

export default function UnderReviewPage() {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  const {
    applications,
    loading,
    error,
    fetchApplications
  } = useApplications();
  
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // Filter applications that are submitted (ready for review)
  const underReviewApplications = applications.filter(app => 
    app.status === 'submitted'
  );

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      fetchApplications();
    }
  }, [status, session?.user?.id, session?.accessToken, fetchApplications]);

  const handleSelectApplication = (applicationId) => {
    setSelectedApplications(prev => {
      if (prev.includes(applicationId)) {
        return prev.filter(id => id !== applicationId);
      } else {
        return [...prev, applicationId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(underReviewApplications.map(app => app.id));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkApprove = async () => {
    if (selectedApplications.length === 0) {
      alert('Please select at least one application to approve.');
      return;
    }

    if (!window.confirm(`Are you sure you want to approve ${selectedApplications.length} application(s)?`)) {
      return;
    }

    try {
      setBulkActionLoading(true);
      
      // Process each selected application
      const promises = selectedApplications.map(appId => 
        apiService.put(`/applications/${appId}/status`, {
          status: 'approved'
        })
      );

      await Promise.all(promises);
      
      alert(`${selectedApplications.length} application(s) approved successfully!`);
      setSelectedApplications([]);
      setSelectAll(false);
      fetchApplications(); // Refresh the list
      
    } catch (error) {
      console.error('Error bulk approving applications:', error);
      alert('Failed to approve applications. Please try again.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { class: 'bg-secondary', text: 'Draft' },
      submitted: { class: 'bg-info', text: 'Submitted' },
      approved: { class: 'bg-success', text: 'Approved' }
    };
    
    const config = statusConfig[status] || { class: 'bg-secondary', text: status };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="under-review-page">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link href="/admin/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link href="/admin/dashboard/applications">Applications</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Under Review
              </li>
            </ol>
          </nav>
          <h2 className="h4 mb-1">
            <i className="fas fa-eye text-warning me-2"></i>
            Applications Under Review
          </h2>
          <p className="text-muted mb-0">
            Review and approve submitted applications ({underReviewApplications.length} applications)
          </p>
        </div>
        
        <div className="btn-group">
          <Link 
            href="/admin/dashboard/applications" 
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to Applications
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Bulk Actions */}
      {underReviewApplications.length > 0 && (
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="selectAll"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                  <label className="form-check-label" htmlFor="selectAll">
                    Select All ({selectedApplications.length} selected)
                  </label>
                </div>
              </div>
              
              {selectedApplications.length > 0 && (
                <div className="btn-group">
                  <button 
                    className="btn btn-success"
                    onClick={handleBulkApprove}
                    disabled={bulkActionLoading}
                  >
                    {bulkActionLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check me-2"></i>
                        Approve Selected ({selectedApplications.length})
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Applications List */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-list me-2"></i>
            Under Review Applications ({underReviewApplications.length})
          </h5>
        </div>
        <div className="card-body">
          {underReviewApplications.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-inbox text-muted fs-1 mb-3"></i>
              <h5 className="text-muted">No Applications Under Review</h5>
              <p className="text-muted">
                All submitted applications have been reviewed or there are no submitted applications yet.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th width="50">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Application ID</th>
                    <th>Applicant</th>
                    <th>Email</th>
                    <th>Program</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {underReviewApplications.map(application => (
                    <tr key={application.id}>
                      <td>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedApplications.includes(application.id)}
                          onChange={() => handleSelectApplication(application.id)}
                        />
                      </td>
                      <td>
                        <code className="text-primary">
                          {application.application_number || `APP${application.id}`}
                        </code>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-user text-info me-2"></i>
                          <strong>{application.applicant_name || 'Unknown Applicant'}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-envelope text-secondary me-2"></i>
                          <span>{application.applicant_email || 'No email'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {application.schema_display_name || application.schema_name || 'N/A'}
                        </span>
                      </td>
                      <td>{getStatusBadge(application.status)}</td>
                      <td>
                        <span className={`badge ${application.payment_status === 'paid' ? 'bg-success' : 'bg-warning'}`}>
                          {application.payment_status || 'pending'}
                        </span>
                      </td>
                      <td>
                        <small className="text-muted">
                          {new Date(application.created_at).toLocaleDateString()}
                        </small>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <Link 
                            href={`/admin/dashboard/applications/${application.id}`}
                            className="btn btn-outline-primary btn-sm"
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </Link>
                          
                          <button 
                            className="btn btn-outline-info btn-sm"
                            onClick={() => {
                              const downloadUrl = `${API_URL}/applications/${application.id}/download`;
                              window.open(downloadUrl, '_blank');
                            }}
                            title="Download Application"
                          >
                            <i className="fas fa-download"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
