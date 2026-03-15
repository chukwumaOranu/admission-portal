'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSettings } from '@/hooks/useRedux';
import { usePermissions } from '@/hooks/usePermissions';
import { getImageUrl } from '@/utils/imageUtils';

const SchoolSettingsPage = () => {
  const {
    schoolSettings,
    loading,
    error,
    fetchSchoolSettings,
    updateSchoolSettings,
    uploadSchoolLogo,
    uploadSchoolFavicon,
    clearError
  } = useSettings();
  const { hasPermission } = usePermissions();

  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    school_name: '',
    school_logo: '',
    school_favicon: '',
    school_address: '',
    school_phone: '',
    school_email: '',
    school_website: '',
    school_motto: '',
    school_mission: '',
    school_vision: '',
    academic_year: '',
    application_fee: 0,
    currency: 'NGN',
    timezone: 'Africa/Lagos',
    date_format: 'YYYY-MM-DD',
    time_format: '24h',
    language: 'en',
    theme_color: '#007bff'
  });

  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  useEffect(() => {
    fetchSchoolSettings();
  }, [fetchSchoolSettings]);

  useEffect(() => {
    if (schoolSettings) {
      setFormData({
        school_name: schoolSettings.school_name || '',
        school_logo: schoolSettings.school_logo || '',
        school_favicon: schoolSettings.school_favicon || '',
        school_address: schoolSettings.school_address || '',
        school_phone: schoolSettings.school_phone || '',
        school_email: schoolSettings.school_email || '',
        school_website: schoolSettings.school_website || '',
        school_motto: schoolSettings.school_motto || '',
        school_mission: schoolSettings.school_mission || '',
        school_vision: schoolSettings.school_vision || '',
        academic_year: schoolSettings.academic_year || '',
        application_fee: schoolSettings.application_fee || 0,
        currency: schoolSettings.currency || 'NGN',
        timezone: schoolSettings.timezone || 'Africa/Lagos',
        date_format: schoolSettings.date_format || 'YYYY-MM-DD',
        time_format: schoolSettings.time_format || '24h',
        language: schoolSettings.language || 'en',
        theme_color: schoolSettings.theme_color || '#007bff'
      });
    } else if (error && error.message?.includes('not found')) {
      // If no settings exist, show default values
      setFormData({
        school_name: 'Your School Name',
        school_logo: '',
        school_favicon: '',
        school_address: '',
        school_phone: '',
        school_email: '',
        school_website: '',
        school_motto: '',
        school_mission: '',
        school_vision: '',
        academic_year: new Date().getFullYear().toString(),
        application_fee: 0,
        currency: 'NGN',
        timezone: 'Africa/Lagos',
        date_format: 'YYYY-MM-DD',
        time_format: '24h',
        language: 'en',
        theme_color: '#007bff'
      });
    }
  }, [schoolSettings, error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSchoolSettings(formData);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
    }
  };

  const handleFaviconFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFaviconFile(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      alert('Please select a logo file first.');
      return;
    }

    setUploadingLogo(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', logoFile);

      await uploadSchoolLogo(uploadFormData);
      alert('Logo uploaded successfully!');
      setLogoFile(null);
      // Reset file input
      document.getElementById('logoFile').value = '';
    } catch (error) {
      console.error('Logo upload error:', error);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async () => {
    if (!faviconFile) {
      alert('Please select a favicon file first.');
      return;
    }

    setUploadingFavicon(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('favicon', faviconFile);

      await uploadSchoolFavicon(uploadFormData);
      alert('Favicon uploaded successfully!');
      setFaviconFile(null);
      // Reset file input
      document.getElementById('faviconFile').value = '';
    } catch (error) {
      console.error('Favicon upload error:', error);
      alert('Failed to upload favicon. Please try again.');
    } finally {
      setUploadingFavicon(false);
    }
  };

  if (!hasPermission('school_settings', 'read')) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <h4>Access Denied</h4>
          <p>You don&apos;t have permission to view school settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>School Settings</h2>
          <p className="text-muted">Configure school information and system settings</p>
        </div>
        {hasPermission('school_settings', 'update') && (
          <button
            className="btn btn-primary"
            onClick={() => setShowEditModal(true)}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Edit Settings'}
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={clearError}></button>
        </div>
      )}


      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : schoolSettings ? (
        <div className="row">
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="card-title mb-0">School Information</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">School Name</label>
                  <p className="form-control-plaintext">{schoolSettings.school_name}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Address</label>
                  <p className="form-control-plaintext">{schoolSettings.school_address || 'Not set'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Phone</label>
                  <p className="form-control-plaintext">{schoolSettings.school_phone || 'Not set'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Email</label>
                  <p className="form-control-plaintext">{schoolSettings.school_email || 'Not set'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Website</label>
                  <p className="form-control-plaintext">
                    {schoolSettings.school_website ? (
                      <a href={schoolSettings.school_website} target="_blank" rel="noopener noreferrer">
                        {schoolSettings.school_website}
                      </a>
                    ) : 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="card-title mb-0">School Branding</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">School Logo</label>
                  <div className="d-flex align-items-center gap-3">
                    {schoolSettings.school_logo ? (
                      <Image
                        src={getImageUrl(schoolSettings.school_logo)}
                        alt="School Logo"
                        width={200}
                        height={60}
                        unoptimized
                        style={{ height: '60px', width: 'auto', maxWidth: '200px' }}
                        className="border rounded"
                      />
                    ) : (
                      <div className="border rounded d-flex align-items-center justify-content-center" 
                           style={{ height: '60px', width: '200px', backgroundColor: '#f8f9fa' }}>
                        <span className="text-muted">No logo uploaded</span>
                      </div>
                    )}
                    {hasPermission('school_settings', 'update') && (
                      <div>
                        <input
                          type="file"
                          id="logoFile"
                          accept="image/*"
                          onChange={handleLogoFileSelect}
                          className="form-control form-control-sm mb-2"
                          style={{ width: '200px' }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={handleLogoUpload}
                          disabled={!logoFile || uploadingLogo}
                        >
                          {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Favicon</label>
                  <div className="d-flex align-items-center gap-3">
                    {schoolSettings.school_favicon ? (
                      <Image
                        src={getImageUrl(schoolSettings.school_favicon)}
                        alt="School Favicon"
                        width={32}
                        height={32}
                        unoptimized
                        className="border rounded"
                      />
                    ) : (
                      <div className="border rounded d-flex align-items-center justify-content-center" 
                           style={{ height: '32px', width: '32px', backgroundColor: '#f8f9fa' }}>
                        <i className="fas fa-image text-muted"></i>
                      </div>
                    )}
                    {hasPermission('school_settings', 'update') && (
                      <div>
                        <input
                          type="file"
                          id="faviconFile"
                          accept="image/*"
                          onChange={handleFaviconFileSelect}
                          className="form-control form-control-sm mb-2"
                          style={{ width: '200px' }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={handleFaviconUpload}
                          disabled={!faviconFile || uploadingFavicon}
                        >
                          {uploadingFavicon ? 'Uploading...' : 'Upload Favicon'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="card-title mb-0">School Vision & Mission</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">Motto</label>
                  <p className="form-control-plaintext">{schoolSettings.school_motto || 'Not set'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Mission</label>
                  <p className="form-control-plaintext">{schoolSettings.school_mission || 'Not set'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Vision</label>
                  <p className="form-control-plaintext">{schoolSettings.school_vision || 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="card-title mb-0">Academic Settings</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">Academic Year</label>
                  <p className="form-control-plaintext">{schoolSettings.academic_year || 'Not set'}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Application Fee</label>
                  <p className="form-control-plaintext">₦{schoolSettings.application_fee}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Currency</label>
                  <p className="form-control-plaintext">{schoolSettings.currency}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="card-title mb-0">System Settings</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">Timezone</label>
                  <p className="form-control-plaintext">{schoolSettings.timezone}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Date Format</label>
                  <p className="form-control-plaintext">{schoolSettings.date_format}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Time Format</label>
                  <p className="form-control-plaintext">{schoolSettings.time_format}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Language</label>
                  <p className="form-control-plaintext">{schoolSettings.language}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Theme Color</label>
                  <div className="d-flex align-items-center">
                    <div 
                      className="me-2" 
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        backgroundColor: schoolSettings.theme_color,
                        border: '1px solid #ccc',
                        borderRadius: '3px'
                      }}
                    ></div>
                    <span>{schoolSettings.theme_color}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-info">
          <h4>No Settings Found</h4>
          <p>School settings have not been configured yet.</p>
        </div>
      )}

      {/* Edit Settings Modal */}
      {showEditModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">Edit School Settings</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowEditModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="text-primary mb-3">School Information</h6>
                      <div className="mb-3">
                        <label htmlFor="school_name" className="form-label">School Name</label>
                        <input
                          type="text"
                          className="form-control"
                          id="school_name"
                          name="school_name"
                          value={formData.school_name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="school_address" className="form-label">Address</label>
                        <textarea
                          className="form-control"
                          id="school_address"
                          name="school_address"
                          rows="3"
                          value={formData.school_address}
                          onChange={handleInputChange}
                        ></textarea>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="school_phone" className="form-label">Phone</label>
                        <input
                          type="tel"
                          className="form-control"
                          id="school_phone"
                          name="school_phone"
                          value={formData.school_phone}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="school_email" className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          id="school_email"
                          name="school_email"
                          value={formData.school_email}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="school_website" className="form-label">Website</label>
                        <input
                          type="url"
                          className="form-control"
                          id="school_website"
                          name="school_website"
                          value={formData.school_website}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h6 className="text-primary mb-3">Vision & Mission</h6>
                      <div className="mb-3">
                        <label htmlFor="school_motto" className="form-label">Motto</label>
                        <input
                          type="text"
                          className="form-control"
                          id="school_motto"
                          name="school_motto"
                          value={formData.school_motto}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="school_mission" className="form-label">Mission</label>
                        <textarea
                          className="form-control"
                          id="school_mission"
                          name="school_mission"
                          rows="3"
                          value={formData.school_mission}
                          onChange={handleInputChange}
                        ></textarea>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="school_vision" className="form-label">Vision</label>
                        <textarea
                          className="form-control"
                          id="school_vision"
                          name="school_vision"
                          rows="3"
                          value={formData.school_vision}
                          onChange={handleInputChange}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                  <hr />
                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="text-primary mb-3">Academic Settings</h6>
                      <div className="mb-3">
                        <label htmlFor="academic_year" className="form-label">Academic Year</label>
                        <input
                          type="text"
                          className="form-control"
                          id="academic_year"
                          name="academic_year"
                          value={formData.academic_year}
                          onChange={handleInputChange}
                          placeholder="e.g., 2024/2025"
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="application_fee" className="form-label">Application Fee</label>
                        <input
                          type="number"
                          className="form-control"
                          id="application_fee"
                          name="application_fee"
                          value={formData.application_fee}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="currency" className="form-label">Currency</label>
                        <select
                          className="form-select"
                          id="currency"
                          name="currency"
                          value={formData.currency}
                          onChange={handleInputChange}
                        >
                          <option value="NGN">NGN (Nigerian Naira)</option>
                          <option value="USD">USD (US Dollar)</option>
                          <option value="EUR">EUR (Euro)</option>
                          <option value="GBP">GBP (British Pound)</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h6 className="text-primary mb-3">System Settings</h6>
                      <div className="mb-3">
                        <label htmlFor="timezone" className="form-label">Timezone</label>
                        <select
                          className="form-select"
                          id="timezone"
                          name="timezone"
                          value={formData.timezone}
                          onChange={handleInputChange}
                        >
                          <option value="Africa/Lagos">Africa/Lagos</option>
                          <option value="Africa/Abuja">Africa/Abuja</option>
                          <option value="UTC">UTC</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="date_format" className="form-label">Date Format</label>
                        <select
                          className="form-select"
                          id="date_format"
                          name="date_format"
                          value={formData.date_format}
                          onChange={handleInputChange}
                        >
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="time_format" className="form-label">Time Format</label>
                        <select
                          className="form-select"
                          id="time_format"
                          name="time_format"
                          value={formData.time_format}
                          onChange={handleInputChange}
                        >
                          <option value="24h">24 Hour</option>
                          <option value="12h">12 Hour</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="language" className="form-label">Language</label>
                        <select
                          className="form-select"
                          id="language"
                          name="language"
                          value={formData.language}
                          onChange={handleInputChange}
                        >
                          <option value="en">English</option>
                          <option value="fr">French</option>
                          <option value="es">Spanish</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="theme_color" className="form-label">Theme Color</label>
                        <input
                          type="color"
                          className="form-control form-control-color"
                          id="theme_color"
                          name="theme_color"
                          value={formData.theme_color}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolSettingsPage;
