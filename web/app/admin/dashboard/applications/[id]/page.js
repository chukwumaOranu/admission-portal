'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';
import apiService from '@/services/api';
import { API_URL } from '@/services/api';

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  const applicationId = params.id;
  
  const {
    applications,
    loading,
    error,
    fetchApplications,
    updateApplicationStatus,
    deleteApplication
  } = useApplications();
  
  const [application, setApplication] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [errorDetail, setErrorDetail] = useState(null);

  const loadApplicationDetail = useCallback(async () => {
    try {
      setLoadingDetail(true);
      setErrorDetail(null);
      
      // First try to get from Redux state
      const existingApp = applications.find(app => app.id == applicationId);
      if (existingApp) {
        setApplication(existingApp);
        setLoadingDetail(false);
        return;
      }
      
      // If not found in Redux, fetch from API
      const response = await apiService.get(`/applications/${applicationId}`);
      setApplication(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading application detail:', error);
      setErrorDetail('Failed to load application details');
    } finally {
      setLoadingDetail(false);
    }
  }, [applications, applicationId]);

  useEffect(() => {
    if (status === 'authenticated' && applicationId) {
      loadApplicationDetail();
    }
  }, [status, applicationId, loadApplicationDetail]);

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus} this application?`)) {
      return;
    }

    try {
      await updateApplicationStatus(applicationId, newStatus);
      alert(`Application ${newStatus} successfully!`);
      // Reload the application data
      loadApplicationDetail();
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update application status');
    }
  };

  const handleDeleteApplication = async () => {
    if (!window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteApplication(applicationId);
      alert('Application deleted successfully!');
      router.push('/admin/dashboard/applications');
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Failed to delete application');
    }
  };

  const handleDownloadApplication = async () => {
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'bg-warning', text: 'Pending' },
      approved: { class: 'bg-success', text: 'Approved' },
      rejected: { class: 'bg-danger', text: 'Rejected' }
    };
    
    const config = statusConfig[status] || { class: 'bg-secondary', text: status };
    
    return (
      <span className={`badge ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loadingDetail) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (errorDetail || !application) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <h4>Error Loading Application</h4>
          <p>{errorDetail || 'Application not found'}</p>
          <Link href="/admin/dashboard/applications" className="btn btn-primary">
            <i className="fas fa-arrow-left me-2"></i>
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
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
                Application #{application.application_number || application.id}
              </li>
            </ol>
          </nav>
          <h2 className="h4 mb-1">
            <i className="fas fa-file-alt text-primary me-2"></i>
            Application Details
          </h2>
          <p className="text-muted mb-0">
            {application.applicant_name || 'Unknown Applicant'} - {application.schema_display_name || application.schema_name}
          </p>
        </div>
        
        <div className="btn-group">
          <Link 
            href="/admin/dashboard/applications" 
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to List
          </Link>
          
          {hasPermission('application.update') && (
            <Link 
              href={`/admin/dashboard/applications/${applicationId}/edit`}
              className="btn btn-outline-warning"
            >
              <i className="fas fa-edit me-2"></i>
              Edit Application
            </Link>
          )}
        </div>
      </div>

      {/* Application Status Card */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Application Information
              </h5>
              {getStatusBadge(application.status)}
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-medium">Application ID</label>
                    <p className="mb-0">
                      <code className="text-primary">
                        {application.application_number || `APP${application.id}`}
                      </code>
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-medium">Applicant Name</label>
                    <p className="mb-0">
                      <i className="fas fa-user text-info me-2"></i>
                      {application.applicant_name || 'Unknown Applicant'}
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-medium">Email Address</label>
                    <p className="mb-0">
                      <i className="fas fa-envelope text-secondary me-2"></i>
                      {application.applicant_email || 'No email'}
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-medium">Phone Number</label>
                    <p className="mb-0">
                      <i className="fas fa-phone text-success me-2"></i>
                      {application.phone || 'No phone'}
                    </p>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-medium">Program/Schema</label>
                    <p className="mb-0">
                      <span className="badge bg-light text-dark">
                        {application.schema_display_name || application.schema_name || 'N/A'}
                      </span>
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-medium">Application Fee</label>
                    <p className="mb-0">
                      <i className="fas fa-dollar-sign text-warning me-2"></i>
                      ${application.application_fee || '0.00'}
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-medium">Payment Status</label>
                    <p className="mb-0">
                      <span className={`badge ${application.payment_status === 'paid' ? 'bg-success' : 'bg-warning'}`}>
                        {application.payment_status || 'pending'}
                      </span>
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-medium">Date of Birth</label>
                    <p className="mb-0">
                      <i className="fas fa-calendar text-info me-2"></i>
                      {application.date_of_birth ? new Date(application.date_of_birth).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-clock me-2"></i>
                Timeline
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-medium">Submitted</label>
                <p className="mb-0 text-muted">
                  {formatDate(application.created_at)}
                </p>
              </div>
              
              {application.updated_at && (
                <div className="mb-3">
                  <label className="form-label fw-medium">Last Updated</label>
                  <p className="mb-0 text-muted">
                    {formatDate(application.updated_at)}
                  </p>
                </div>
              )}
              
              {application.reviewed_at && (
                <div className="mb-3">
                  <label className="form-label fw-medium">Reviewed</label>
                  <p className="mb-0 text-muted">
                    {formatDate(application.reviewed_at)}
                  </p>
                </div>
              )}
              
              {application.reviewed_by_username && (
                <div className="mb-3">
                  <label className="form-label fw-medium">Reviewed By</label>
                  <p className="mb-0 text-muted">
                    <i className="fas fa-user-check me-2"></i>
                    {application.reviewed_by_username}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {(application.address || application.notes || application.custom_data) && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-info me-2"></i>
                  Additional Information
                </h5>
              </div>
              <div className="card-body">
                {application.address && (
                  <div className="mb-3">
                    <label className="form-label fw-medium">Address</label>
                    <p className="mb-0">
                      <i className="fas fa-map-marker-alt text-danger me-2"></i>
                      {application.address}
                    </p>
                  </div>
                )}
                
                {application.notes && (
                  <div className="mb-3">
                    <label className="form-label fw-medium">Notes</label>
                    <p className="mb-0">
                      {application.notes}
                    </p>
                  </div>
                )}
                
                {application.custom_data && (
                  <div className="mb-3">
                    <label className="form-label fw-medium">Custom Data</label>
                    <pre className="bg-light p-3 rounded">
                      {JSON.stringify(application.custom_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-cogs me-2"></i>
                Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="btn-group" role="group">
                {hasPermission('application.update') && application.status === 'pending' && (
                  <>
                    <button 
                      className="btn btn-success"
                      onClick={() => handleStatusChange('approved')}
                    >
                      <i className="fas fa-check me-2"></i>
                      Approve Application
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleStatusChange('rejected')}
                    >
                      <i className="fas fa-times me-2"></i>
                      Reject Application
                    </button>
                  </>
                )}
                
                <button 
                  className="btn btn-info"
                  onClick={handleDownloadApplication}
                >
                  <i className="fas fa-download me-2"></i>
                  Download PDF
                </button>
                
                {hasPermission('application.delete') && (
                  <button 
                    className="btn btn-outline-danger"
                    onClick={handleDeleteApplication}
                  >
                    <i className="fas fa-trash me-2"></i>
                    Delete Application
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
