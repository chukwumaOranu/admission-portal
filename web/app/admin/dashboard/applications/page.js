'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';
import { API_URL } from '@/services/api';

export default function ApplicationsPage() {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  // Redux state and actions
  const {
    applications,
    loading,
    error: reduxError,
    fetchApplications,
    deleteApplication,
    updateApplicationStatus
  } = useApplications();
  
  const [filter, setFilter] = useState('all'); // all, draft, submitted, approved
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const hasLoadedApplicationsRef = useRef(false);
  const fetchApplicationsRef = useRef(fetchApplications);

  useEffect(() => {
    fetchApplicationsRef.current = fetchApplications;
  }, [fetchApplications]);

  useEffect(() => {
    hasLoadedApplicationsRef.current = false;
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !hasLoadedApplicationsRef.current) {
      hasLoadedApplicationsRef.current = true;
      fetchApplicationsRef.current();
    }
  }, [status, session?.user?.id, session?.accessToken]);

  const handleDeleteApplication = async (applicationId) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        await deleteApplication(applicationId);
        alert('Application deleted successfully!');
      } catch (error) {
        console.error('Error deleting application:', error);
        alert('Failed to delete application');
      }
    }
  };

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
      setSelectedApplications(filteredApplications.map(app => app.id));
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
      // Process each selected application
      const promises = selectedApplications.map(appId => 
        updateApplicationStatus(appId, 'approved')
      );

      await Promise.all(promises);
      
      alert(`${selectedApplications.length} application(s) approved successfully!`);
      setSelectedApplications([]);
      setSelectAll(false);
      
    } catch (error) {
      console.error('Error bulk approving applications:', error);
      alert('Failed to approve applications. Please try again.');
    }
  };

  const handleDownloadApplication = async (applicationId) => {
    try {
      // Create download URL
      const downloadUrl = `${API_URL}/applications/${applicationId}/download`;
      
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `application_${applicationId}.pdf`;
      
      // Add authentication headers by using fetch first
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create object URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      link.href = blobUrl;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      window.URL.revokeObjectURL(blobUrl);
      
    } catch (error) {
      console.error('Error downloading application:', error);
      alert('Failed to download application. Please try again.');
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { class: 'bg-secondary', text: 'Draft' },
      submitted: { class: 'bg-info', text: 'Submitted' },
      approved: { class: 'bg-success', text: 'Approved' }
    };
    
    const config = statusConfig[status] || { class: 'bg-secondary', text: status };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
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
    <div className="applications-page">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-file-alt text-primary me-2"></i>
            Application Management
          </h2>
          <p className="text-muted mb-0">Manage student applications and review process</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/dashboard/applications/admission" className="btn btn-outline-success">
            <i className="fas fa-graduation-cap me-2"></i>
            Admission Results
          </Link>
          <Link href="/admin/dashboard/applications/schemas" className="btn btn-outline-primary">
            <i className="fas fa-cogs me-2"></i>
            Manage Schemas
          </Link>
          <Link href="/admin/dashboard/applications/add" className="btn btn-primary">
            <i className="fas fa-plus me-2"></i>
            Add Application
          </Link>
        </div>
      </div>

      {reduxError && (
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {reduxError}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex gap-2">
            <button 
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('all')}
            >
              All Applications ({applications.length})
            </button>
            <button 
              className={`btn ${filter === 'draft' ? 'btn-secondary' : 'btn-outline-secondary'}`}
              onClick={() => setFilter('draft')}
            >
              Draft ({applications.filter(app => app.status === 'draft').length})
            </button>
            <button 
              className={`btn ${filter === 'submitted' ? 'btn-info' : 'btn-outline-info'}`}
              onClick={() => setFilter('submitted')}
            >
              Submitted ({applications.filter(app => app.status === 'submitted').length})
            </button>
            <button 
              className={`btn ${filter === 'approved' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setFilter('approved')}
            >
              Approved ({applications.filter(app => app.status === 'approved').length})
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {filteredApplications.length > 0 && (
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
                  >
                    <i className="fas fa-check me-2"></i>
                    Approve Selected ({selectedApplications.length})
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
            Applications ({filteredApplications.length})
          </h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-inbox text-muted fs-1 mb-3"></i>
              <h5 className="text-muted">No Applications Found</h5>
              <p className="text-muted">
                {filter === 'all' 
                  ? 'No applications have been submitted yet.' 
                  : `No ${filter} applications found.`
                }
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
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map(application => (
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
                        <small className="text-muted">
                          {application.updated_at 
                            ? new Date(application.updated_at).toLocaleDateString()
                            : '-'
                          }
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
                            onClick={() => handleDownloadApplication(application.id)}
                            title="Download Application"
                          >
                            <i className="fas fa-download"></i>
                          </button>
                          
                          {hasPermission('application.update') && (
                            <>
                              {/* Edit Button - Available for draft applications only */}
                              {application.status === 'draft' && (
                                <Link 
                                  href={`/admin/dashboard/applications/${application.id}/edit`}
                                  className="btn btn-outline-warning btn-sm"
                                  title="Edit Application"
                                >
                                  <i className="fas fa-edit"></i>
                                </Link>
                              )}
                            </>
                          )}
                          
                          {hasPermission('application.delete') && (
                            <button 
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDeleteApplication(application.id)}
                              title="Delete Application"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {filteredApplications.length > 0 && (
          <div className="card-footer">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted">
                Showing {filteredApplications.length} of {applications.length} applications
              </div>
              <div className="btn-group" role="group">
                <button className="btn btn-outline-secondary btn-sm" disabled>
                  <i className="fas fa-chevron-left"></i> Previous
                </button>
                <button className="btn btn-outline-secondary btn-sm" disabled>
                  Next <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
