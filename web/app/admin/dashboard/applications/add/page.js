'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';

export default function AddApplicationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  // Redux state and actions
  const {
    schemas,
    loading: reduxLoading,
    fetchApplicationSchemas,
    fetchApplications,
    createApplication
  } = useApplications();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    schema_id: '',
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    custom_data: {}
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      fetchApplicationSchemas();
    }
  }, [status, session?.user?.id, session?.accessToken, fetchApplicationSchemas]);

  // Filter active schemas
  const activeSchemas = schemas.filter(s => s.is_active);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        ...formData,
        schema_id: Number(formData.schema_id)
      };

      await createApplication(payload).unwrap();
      await fetchApplications();
      setSuccess(true);
      alert('Application created successfully!');
      setTimeout(() => {
        router.push('/admin/dashboard/applications');
      }, 1500);
    } catch (err) {
      console.error('Error creating application:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create application');
    } finally {
      setLoading(false);
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

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    window.location.href = '/login';
    return null;
  }

  // Check permissions
  if (!hasPermission('application.create')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to create applications.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-file-alt text-primary me-2"></i>
            New Application
          </h2>
          <p className="text-muted mb-0">Create a new admission application</p>
        </div>
        <Link href="/admin/dashboard/applications" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to Applications
        </Link>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          Application created successfully!
          <button type="button" className="btn-close" onClick={() => setSuccess(false)}></button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-lg-8">
            {/* Application Type */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-graduation-cap me-2"></i>
                  Application Type
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">
                    Select Program <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="schema_id"
                    value={formData.schema_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Choose a program...</option>
                    {activeSchemas.map((schema) => (
                      <option key={schema.id} value={schema.id}>
                        {schema.display_name || schema.schema_name} - ₦{parseFloat(schema.application_fee).toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {activeSchemas.length === 0 && (
                    <small className="text-muted">No active application schemas available</small>
                  )}
                </div>
              </div>
            </div>

            {/* Applicant Information */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-info text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-user me-2"></i>
                  Applicant Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <label className="form-label">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="applicant_name"
                      value={formData.applicant_name}
                      onChange={handleInputChange}
                      required
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      name="applicant_email"
                      value={formData.applicant_email}
                      onChange={handleInputChange}
                      required
                      placeholder="john.doe@email.com"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Phone <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      name="applicant_phone"
                      value={formData.applicant_phone}
                      onChange={handleInputChange}
                      required
                      placeholder="+234 XXX XXX XXXX"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="form-control"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-select"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-control"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="Full address"
                    ></textarea>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-control"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      className="form-control"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Guardian Information */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-warning text-dark">
                <h5 className="card-title mb-0">
                  <i className="fas fa-user-friends me-2"></i>
                  Guardian/Parent Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Guardian Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="guardian_name"
                      value={formData.guardian_name}
                      onChange={handleInputChange}
                      placeholder="Parent/Guardian full name"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Guardian Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="guardian_phone"
                      value={formData.guardian_phone}
                      onChange={handleInputChange}
                      placeholder="+234 XXX XXX XXXX"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Guardian Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="guardian_email"
                      value={formData.guardian_email}
                      onChange={handleInputChange}
                      placeholder="guardian@email.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="d-flex gap-2 mb-4">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Submit Application
                  </>
                )}
              </button>
              
              <Link
                href="/admin/dashboard/applications"
                className="btn btn-outline-secondary"
              >
                Cancel
              </Link>
            </div>
          </div>

          {/* Sidebar - Help */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-info text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  Application Info
                </h5>
              </div>
              <div className="card-body">
                <div className="alert alert-primary mb-3">
                  <h6><i className="fas fa-clipboard-list me-2"></i>Required Fields:</h6>
                  <ul className="mb-0 ps-3 small">
                    <li>Program/Schema</li>
                    <li>Applicant Name</li>
                    <li>Email & Phone</li>
                  </ul>
                </div>

                <div className="alert alert-success mb-0">
                  <h6><i className="fas fa-money-bill me-2"></i>Application Fee:</h6>
                  <p className="mb-0 small">
                    Application fee varies by program. 
                    Select a program to see the fee amount.
                  </p>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm">
              <div className="card-header bg-warning">
                <h5 className="card-title mb-0">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Important
                </h5>
              </div>
              <div className="card-body">
                <p className="small mb-2">
                  <i className="fas fa-check-circle text-success me-1"></i>
                  Review all information before submitting
                </p>
                <p className="small mb-2">
                  <i className="fas fa-check-circle text-success me-1"></i>
                  Ensure contact details are accurate
                </p>
                <p className="small mb-0">
                  <i className="fas fa-check-circle text-success me-1"></i>
                  Application can be edited before approval
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
