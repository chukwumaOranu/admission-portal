'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';
import apiService from '@/services/api';

export default function EditApplicationPage() {
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
    updateApplication
  } = useApplications();
  
  const [application, setApplication] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [errorDetail, setErrorDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    nationality: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    custom_data: {}
  });

  const populateFormData = useCallback((appData) => {
    setFormData({
      first_name: appData.first_name || '',
      last_name: appData.last_name || '',
      middle_name: appData.middle_name || '',
      email: appData.email || '',
      phone: appData.phone || '',
      date_of_birth: appData.date_of_birth ? appData.date_of_birth.split('T')[0] : '',
      gender: appData.gender || '',
      nationality: appData.nationality || '',
      address: appData.address || '',
      emergency_contact_name: appData.emergency_contact_name || '',
      emergency_contact_phone: appData.emergency_contact_phone || '',
      custom_data: appData.custom_data || {}
    });
  }, []);

  const loadApplicationDetail = useCallback(async () => {
    try {
      setLoadingDetail(true);
      setErrorDetail(null);
      
      // First try to get from Redux state
      const existingApp = applications.find(app => app.id == applicationId);
      if (existingApp) {
        setApplication(existingApp);
        populateFormData(existingApp);
        setLoadingDetail(false);
        return;
      }
      
      // If not found in Redux, fetch from API
      const response = await apiService.get(`/applications/${applicationId}`);
      const appData = response.data.data || response.data;
      setApplication(appData);
      populateFormData(appData);
    } catch (error) {
      console.error('Error loading application detail:', error);
      setErrorDetail('Failed to load application details');
    } finally {
      setLoadingDetail(false);
    }
  }, [applications, applicationId, populateFormData]);

  useEffect(() => {
    if (status === 'authenticated' && applicationId) {
      loadApplicationDetail();
    }
  }, [status, applicationId, loadApplicationDetail]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustomDataChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      custom_data: {
        ...prev.custom_data,
        [key]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasPermission('application.update')) {
      alert('You do not have permission to update applications');
      return;
    }

    try {
      setSaving(true);
      
      // Prepare data for update
      const updateData = {
        ...formData,
        // Convert date back to ISO string if needed
        date_of_birth: formData.date_of_birth ? new Date(formData.date_of_birth).toISOString() : null
      };

      await updateApplication(applicationId, updateData);
      
      alert('Application updated successfully!');
      router.push(`/admin/dashboard/applications/${applicationId}`);
      
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'bg-warning', text: 'Pending' },
      approved: { class: 'bg-success', text: 'Approved' },
      rejected: { class: 'bg-danger', text: 'Rejected' },
      draft: { class: 'bg-secondary', text: 'Draft' }
    };
    
    const config = statusConfig[status] || { class: 'bg-secondary', text: status };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
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
              <li className="breadcrumb-item">
                <Link href={`/admin/dashboard/applications/${applicationId}`}>
                  Application #{application.application_number || application.id}
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Edit Application
              </li>
            </ol>
          </nav>
          <h2 className="h4 mb-1">
            <i className="fas fa-edit text-warning me-2"></i>
            Edit Application
          </h2>
          <p className="text-muted mb-0">
            {application.applicant_name || 'Unknown Applicant'} - {application.schema_display_name || application.schema_name}
          </p>
        </div>
        
        <div className="btn-group">
          <Link 
            href={`/admin/dashboard/applications/${applicationId}`}
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to Application
          </Link>
        </div>
      </div>

      {/* Application Status */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Application Status
              </h5>
              {getStatusBadge(application.status)}
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
                  <strong>Application ID:</strong><br />
                  <code className="text-primary">
                    {application.application_number || `APP${application.id}`}
                  </code>
                </div>
                <div className="col-md-3">
                  <strong>Program:</strong><br />
                  <span className="badge bg-light text-dark">
                    {application.schema_display_name || application.schema_name || 'N/A'}
                  </span>
                </div>
                <div className="col-md-3">
                  <strong>Payment Status:</strong><br />
                  <span className={`badge ${application.payment_status === 'paid' ? 'bg-success' : 'bg-warning'}`}>
                    {application.payment_status || 'pending'}
                  </span>
                </div>
                <div className="col-md-3">
                  <strong>Submitted:</strong><br />
                  <small className="text-muted">
                    {application.created_at ? new Date(application.created_at).toLocaleDateString() : 'N/A'}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Personal Information */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-user me-2"></i>
                  Personal Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Middle Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="middle_name"
                      value={formData.middle_name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Date of Birth *</label>
                    <input
                      type="date"
                      className="form-control"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Gender *</label>
                    <select
                      className="form-select"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Nationality</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Contact Information
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Address *</label>
                  <textarea
                    className="form-control"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Emergency Contact Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Emergency Contact Phone *</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Data */}
        {application.custom_data && Object.keys(application.custom_data).length > 0 && (
          <div className="row mt-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-cogs me-2"></i>
                    Additional Information
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    {Object.entries(application.custom_data).map(([key, value]) => (
                      <div key={key} className="col-md-6 mb-3">
                        <label className="form-label">{key.replace(/_/g, ' ').toUpperCase()}</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.custom_data[key] || ''}
                          onChange={(e) => handleCustomDataChange(key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <Link 
                    href={`/admin/dashboard/applications/${applicationId}`}
                    className="btn btn-outline-secondary"
                  >
                    <i className="fas fa-times me-2"></i>
                    Cancel
                  </Link>
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={saving || !hasPermission('application.update')}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
