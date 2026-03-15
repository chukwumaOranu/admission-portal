'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useApplications, useStudents } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';

export default function NewApplicationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const { schemas, loading: schemasLoading, fetchApplicationSchemas, createApplication } = useApplications();
  const { students, loading: studentsLoading, fetchStudents } = useStudents();
  
  const [schema, setSchema] = useState(null);
  const [fields, setFields] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});

  const schemaId = searchParams.get('schema');

  const fetchSchemaAndProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch schemas if not already loaded
      if (schemas.length === 0) {
        await fetchApplicationSchemas();
      }
      
      // Find the specific schema
      const foundSchema = schemas.find(s => s.id == schemaId);
      if (!foundSchema) {
        setError('Schema not found');
        return;
      }
      setSchema(foundSchema);
      
      // Fetch schema fields - still using direct API call as schema fields are not yet in Redux
      const fieldsResponse = await apiService.get(API_ENDPOINTS.APPLICATIONS.SCHEMAS.FIELDS.GET_ALL(schemaId));
      const fieldsData = fieldsResponse.data?.fields || fieldsResponse.data || [];
      setFields(fieldsData.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
      
      // Try to find student in Redux store first
      const currentStudent = students.find(s => s.email === session?.user?.email);
      if (currentStudent) {
        setStudentProfile(currentStudent);
        // Pre-fill basic info from student profile
        setFormData({
          applicant_name: `${currentStudent.first_name} ${currentStudent.last_name}`,
          applicant_email: currentStudent.email,
          applicant_phone: currentStudent.phone || '',
          date_of_birth: currentStudent.date_of_birth ? currentStudent.date_of_birth.split('T')[0] : '',
          gender: currentStudent.gender || '',
          address: currentStudent.address || '',
          city: currentStudent.city || '',
          state: currentStudent.state || '',
          country: currentStudent.country || 'Nigeria',
          guardian_name: currentStudent.guardian_name || '',
          guardian_phone: currentStudent.guardian_phone || '',
          guardian_email: currentStudent.guardian_email || ''
        });
      } else {
        // If not found in Redux, fetch from API
        const profileResponse = await apiService.get(API_ENDPOINTS.STUDENTS.GET_ME);
        const studentData = profileResponse.data || profileResponse;
        setStudentProfile(studentData);
        
        // Pre-fill basic info from student profile
        setFormData({
          applicant_name: `${studentData.first_name} ${studentData.last_name}`,
          applicant_email: studentData.email,
          applicant_phone: studentData.phone || '',
          date_of_birth: studentData.date_of_birth ? studentData.date_of_birth.split('T')[0] : '',
          gender: studentData.gender || '',
          address: studentData.address || '',
          city: studentData.city || '',
          state: studentData.state || '',
          country: studentData.country || 'Nigeria',
          guardian_name: studentData.guardian_name || '',
          guardian_phone: studentData.guardian_phone || '',
          guardian_email: studentData.guardian_email || ''
        });
      }
      
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError('Failed to load application form');
    } finally {
      setLoading(false);
    }
  }, [
    schemas,
    schemaId,
    students,
    session?.user?.email,
    fetchApplicationSchemas
  ]);

  useEffect(() => {
    if (status === 'authenticated' && schemaId) {
      fetchSchemaAndProfile();
    }
  }, [status, schemaId, fetchSchemaAndProfile]);

  useEffect(() => {
    if (status === 'authenticated' && students.length === 0) {
      fetchStudents();
    }
  }, [status, students.length, fetchStudents]);

  useEffect(() => {
    if (studentProfile && !studentProfile.profile_photo) {
      const redirect = () => {
        alert('Profile photo is required for exam card generation. Please upload your profile photo first.');
        router.push('/admin/dashboard/student-portal/profile/edit?redirect=/admin/dashboard/student-portal/applications/new?schema=' + schemaId);
      };

      const timer = setTimeout(redirect, 100);
      return () => clearTimeout(timer);
    }
  }, [studentProfile, schemaId, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (fieldName, e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFiles(prev => ({
        ...prev,
        [fieldName]: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      // Prepare custom_data from dynamic fields
      const customData = {};
      fields.forEach(field => {
        if (formData[field.field_name]) {
          customData[field.field_name] = formData[field.field_name];
        }
      });
      
      const applicationData = {
        schema_id: schemaId,
        applicant_name: formData.applicant_name,
        applicant_email: formData.applicant_email,
        applicant_phone: formData.applicant_phone,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        guardian_name: formData.guardian_name,
        guardian_phone: formData.guardian_phone,
        guardian_email: formData.guardian_email,
        custom_data: customData
      };
      
      console.log('📤 Submitting application:', applicationData);
      
      // Use Redux action instead of direct API call
      const response = await createApplication(applicationData);
      console.log('✅ Application created:', response);
      
      const applicationId = response?.id || response?.application?.id;
      
      alert('Application submitted successfully!');
      
      // Redirect to payment if there's an application fee
      if (schema.application_fee > 0 && applicationId) {
        router.push(`/admin/dashboard/student-portal/payments/pay/${applicationId}`);
      } else {
        router.push('/admin/dashboard/student-portal/applications');
      }
      
    } catch (err) {
      console.error('❌ Error submitting application:', err);
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const commonProps = {
      name: field.field_name,
      value: formData[field.field_name] || '',
      onChange: handleInputChange,
      required: field.is_required,
      placeholder: field.placeholder || '',
      className: 'form-control'
    };

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return <input type={field.field_type === 'phone' ? 'tel' : field.field_type} {...commonProps} />;
      
      case 'number':
        return <input type="number" {...commonProps} />;
      
      case 'date':
        return <input type="date" {...commonProps} />;
      
      case 'textarea':
        return <textarea {...commonProps} rows="3"></textarea>;
      
      case 'select':
        return (
          <select {...commonProps} className="form-select">
            <option value="">Select an option</option>
            {field.field_options && field.field_options.split(',').map((option, i) => (
              <option key={i} value={option.trim()}>
                {option.trim()}
              </option>
            ))}
          </select>
        );
      
      case 'radio':
        return (
          <div>
            {field.field_options && field.field_options.split(',').map((option, i) => (
              <div key={i} className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name={field.field_name}
                  value={option.trim()}
                  checked={formData[field.field_name] === option.trim()}
                  onChange={handleInputChange}
                  required={field.is_required}
                />
                <label className="form-check-label">{option.trim()}</label>
              </div>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div>
            {field.field_options && field.field_options.split(',').map((option, i) => (
              <div key={i} className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name={`${field.field_name}_${i}`}
                  value={option.trim()}
                  onChange={(e) => {
                    const current = formData[field.field_name] || [];
                    const newValue = e.target.checked
                      ? [...current, option.trim()]
                      : current.filter(v => v !== option.trim());
                    setFormData(prev => ({...prev, [field.field_name]: newValue}));
                  }}
                />
                <label className="form-check-label">{option.trim()}</label>
              </div>
            ))}
          </div>
        );
      
      case 'file':
        return (
          <div>
            <input
              type="file"
              className="form-control"
              onChange={(e) => handleFileChange(field.field_name, e)}
              required={field.is_required}
            />
            {uploadedFiles[field.field_name] && (
              <small className="text-success d-block mt-1">
                <i className="fas fa-check-circle me-1"></i>
                {uploadedFiles[field.field_name].name}
              </small>
            )}
          </div>
        );
      
      default:
        return <input type="text" {...commonProps} />;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="container-fluid">
        <div className="alert alert-warning">
          <h5>Program Not Found</h5>
          <p>The selected program is not available.</p>
          <Link href="/admin/dashboard/student-portal/applications/browse" className="btn btn-primary">
            Browse Programs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="mb-4">
        <h2 className="h4 mb-1">
          <i className="fas fa-file-alt text-success me-2"></i>
          New Application
        </h2>
        <p className="text-muted mb-0">{schema.display_name || schema.schema_name}</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Progress Steps */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-center flex-fill">
              <div className="step-circle active">1</div>
              <small className="d-block mt-2">Fill Form</small>
            </div>
            <div className="step-line"></div>
            <div className="text-center flex-fill">
              <div className="step-circle">2</div>
              <small className="d-block mt-2">Review</small>
            </div>
            <div className="step-line"></div>
            <div className="text-center flex-fill">
              <div className="step-circle">3</div>
              <small className="d-block mt-2">Payment</small>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-lg-8">
            {/* Basic Information (Pre-filled) */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-user me-2"></i>
                  Basic Information
                </h5>
              </div>
              <div className="card-body">
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Pre-filled from your profile.</strong> You can edit if needed.
                </div>
                
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
                      className="form-control"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="col-md-12 mb-3">
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-control"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Enter your full address"
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-control"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      className="form-control"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="State"
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      className="form-control"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Guardian/Parent Information */}
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

            {/* Dynamic Fields from Schema */}
            {fields.length > 0 && (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-success text-white">
                  <h5 className="card-title mb-0">
                    <i className="fas fa-edit me-2"></i>
                    Additional Information
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    {fields.map((field) => (
                      <div key={field.id} className="col-md-12 mb-3">
                        <label className="form-label">
                          {field.field_label}
                          {field.is_required && <span className="text-danger ms-1">*</span>}
                        </label>
                        {renderField(field)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="d-flex gap-2 mb-4">
              <button
                type="submit"
                className="btn btn-success btn-lg"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane me-2"></i>
                    Submit Application
                  </>
                )}
              </button>
              
              <button
                type="button"
                className="btn btn-outline-secondary btn-lg"
                disabled={submitting}
              >
                <i className="fas fa-save me-2"></i>
                Save as Draft
              </button>
              
              <Link
                href="/admin/dashboard/student-portal/applications/browse"
                className="btn btn-outline-danger btn-lg"
              >
                Cancel
              </Link>
            </div>
          </div>

          {/* Sidebar - Application Summary */}
          <div className="col-lg-4">
            {/* Program Info */}
            <div className="card border-0 shadow-sm mb-4 sticky-top" style={{ top: '20px' }}>
              <div className="card-header bg-gradient-primary text-white">
                <h6 className="card-title mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  Application Summary
                </h6>
              </div>
              <div className="card-body">
                <h6 className="mb-3">{schema.display_name}</h6>
                
                <div className="mb-3 p-3 bg-light rounded">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small text-muted">Application Fee:</span>
                    <strong className="text-success fs-5">
                      ₦{parseFloat(schema.application_fee || 0).toLocaleString()}
                    </strong>
                  </div>
                  <small className="text-muted d-block">
                    To be paid after submission
                  </small>
                </div>

                <div className="mb-3">
                  <h6 className="small mb-2">Your Information:</h6>
                  <div className="small">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Name:</span>
                      <strong>{formData.applicant_name || 'Not filled'}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Email:</span>
                      <span>{formData.applicant_email || 'Not filled'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Phone:</span>
                      <span>{formData.applicant_phone || 'Not filled'}</span>
                    </div>
                  </div>
                </div>

                <hr />

                <div className="mb-3">
                  <h6 className="small mb-2">Required Documents:</h6>
                  <ul className="small mb-0 ps-3">
                    {fields.filter(f => f.field_type === 'file').map(f => (
                      <li key={f.id}>
                        {f.field_label}
                        {uploadedFiles[f.field_name] && (
                          <i className="fas fa-check-circle text-success ms-2"></i>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="alert alert-warning small mb-0">
                  <i className="fas fa-exclamation-triangle me-1"></i>
                  <strong>Note:</strong> Review all information before submitting. 
                  You can save as draft and continue later.
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      <style jsx>{`
        .step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e9ecef;
          color: #6c757d;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .step-circle.active {
          background: #27ae60;
          color: white;
        }

        .step-line {
          height: 2px;
          background: #e9ecef;
          flex: 1;
          margin: 0 1rem;
        }

        .bg-gradient-primary {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
        }
      `}</style>
    </div>
  );
}
