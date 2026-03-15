'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudents } from '@/hooks/useRedux';
import CredentialsModal from '@/components/CredentialsModal';

export default function AddStudentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  // ✅ Redux - Simple unified hook
  const { schemas: studentSchemas, loading: schemasLoading, fetchStudentSchemas, fetchStudents, createStudent } = useStudents();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userCredentials, setUserCredentials] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  
  const [formData, setFormData] = useState({
    schema_id: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postal_code: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_relationship: '',
    previous_school: '',
    graduation_year: '',
    create_user_account: false,
    send_welcome_email: false
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      fetchStudentSchemas();
    }
  }, [status, session?.user?.id, session?.accessToken, fetchStudentSchemas]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Validation
    if (formData.create_user_account && !formData.email) {
      setError('Email is required to create user account');
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        schema_id: Number(formData.schema_id)
      };

      // ✅ Redux Action
      const created = await createStudent(payload).unwrap();
      
      setSuccess(true);
      await fetchStudents();
      
      // If user account was created, show credentials modal
      if (created?.userAccount && created.userAccount.created) {
        const credentials = created.userAccount;
        const studentId = created.student?.id;
        
        // Store credentials in localStorage for future viewing
        if (studentId) {
          localStorage.setItem(`student_creds_${studentId}`, JSON.stringify({
            username: credentials.username,
            password: credentials.password,
            email: credentials.email,
            createdAt: new Date().toISOString()
          }));
        }
        
        setUserCredentials(credentials);
        setShowCredentialsModal(true);
      } else {
        // No user account created, redirect immediately
        alert('Student created successfully!');
        setTimeout(() => {
          router.push('/admin/dashboard/students');
        }, 1500);
      }
      
    } catch (err) {
      console.error('Error creating student:', err);
      setError(err.message || err.error || 'Failed to create student. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCloseCredentialsModal = () => {
    setShowCredentialsModal(false);
    // Redirect after closing credentials modal
    setTimeout(() => {
      router.push('/admin/dashboard/students');
    }, 500);
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
    return null;
  }

  // Check permissions
  if (!hasPermission('student.create')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to create students.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Credentials Modal */}
      <CredentialsModal
        isOpen={showCredentialsModal}
        onClose={handleCloseCredentialsModal}
        credentials={userCredentials}
        employeeName={`${formData.first_name} ${formData.last_name}`}
      />

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-user-plus text-primary-custom me-2"></i>
            Add New Student
          </h2>
          <p className="text-muted mb-0">Register a new student (Nursery, Primary, JSS, or SSS)</p>
        </div>
        <Link href="/admin/dashboard/students" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to Students
        </Link>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          Student created successfully!
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

      {/* Form */}
      <div className="row">
        <div className="col-lg-8">
          <form onSubmit={handleSubmit}>
            {/* Basic Information Card */}
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
                  <strong>Student ID</strong> will be auto-generated (e.g., STUD20250001)
                </div>

                <div className="row">
                  {/* Schema */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      School Level / Class <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      name="schema_id"
                      value={formData.schema_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select School Level</option>
                      {studentSchemas.map((schema) => (
                        <option key={schema.id} value={schema.id}>
                          {schema.display_name || schema.schema_name}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">e.g., Primary, JSS, SSS, Nursery</small>
                  </div>

                  {/* Gender */}
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

                  {/* First Name */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      First Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                      placeholder="John"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Last Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                      placeholder="Doe"
                    />
                  </div>

                  {/* Middle Name */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Middle Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="middle_name"
                      value={formData.middle_name}
                      onChange={handleInputChange}
                      placeholder="Optional"
                    />
                  </div>

                  {/* Email */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="student@email.com"
                    />
                  </div>

                  {/* Phone */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+234 XXX XXX XXXX"
                    />
                  </div>

                  {/* Date of Birth */}
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
                </div>
              </div>
            </div>

            {/* Address Information Card */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-info text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Address Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-12 mb-3">
                    <label className="form-label">Street Address</label>
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
                      placeholder="Lagos"
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
                      placeholder="Lagos"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      className="form-control"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="Nigeria"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Postal Code</label>
                    <input
                      type="text"
                      className="form-control"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      placeholder="100001"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Guardian Information Card */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-warning text-dark">
                <h5 className="card-title mb-0">
                  <i className="fas fa-user-friends me-2"></i>
                  Guardian/Emergency Contact
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Guardian Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="guardian_name"
                      value={formData.guardian_name}
                      onChange={handleInputChange}
                      placeholder="Full name"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Relationship</label>
                    <input
                      type="text"
                      className="form-control"
                      name="guardian_relationship"
                      value={formData.guardian_relationship}
                      onChange={handleInputChange}
                      placeholder="e.g., Parent, Guardian"
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

            {/* Academic Background Card */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-secondary text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-graduation-cap me-2"></i>
                  Previous School Information
                </h5>
              </div>
              <div className="card-body">
                <div className="alert alert-info mb-3">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Note:</strong> For new students or transfers from other schools
                </div>
                <div className="row">
                  <div className="col-md-8 mb-3">
                    <label className="form-label">Previous School (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="previous_school"
                      value={formData.previous_school}
                      onChange={handleInputChange}
                      placeholder="e.g., St. Mary's Primary School"
                    />
                    <small className="text-muted">Leave blank for new admissions</small>
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Year Left (Optional)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="graduation_year"
                      value={formData.graduation_year}
                      onChange={handleInputChange}
                      placeholder="2024"
                      min="2000"
                      max="2030"
                    />
                    <small className="text-muted">Year student left previous school</small>
                  </div>
                </div>
              </div>
            </div>

            {/* System Access Card */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-success text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-user-lock me-2"></i>
                  System Access (Optional)
                </h5>
              </div>
              <div className="card-body">
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  Enable this to create a login account with <strong>&quot;Student&quot; role</strong> automatically assigned.
                  Student can access the student portal to view applications, make payments, and download exam cards.
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="create_user_account"
                    checked={formData.create_user_account}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label">
                    <strong>Create User Account & Auto-Assign &quot;Student&quot; Role</strong>
                    <br />
                    <small className="text-muted">
                      Generate login credentials for student portal access
                    </small>
                  </label>
                </div>

                {formData.create_user_account && (
                  <div className="ps-4 border-start border-success border-3">
                    <div className="alert alert-success mb-3">
                      <i className="fas fa-key me-2"></i>
                      <strong>Auto-Generated:</strong>
                      <ul className="mb-0 mt-2 ps-3">
                        <li>Student ID: STUD20250XXX</li>
                        <li>Username & Password (shown after creation)</li>
                        <li>Role: &quot;Student&quot; (auto-assigned)</li>
                      </ul>
                    </div>

                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="send_welcome_email"
                        checked={formData.send_welcome_email}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Send welcome email with credentials
                        <br />
                        <small className="text-muted">
                          (Requires email configuration)
                        </small>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="d-flex gap-2 mb-4">
              <button
                type="submit"
                className="btn btn-primary-custom"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Create Student
                  </>
                )}
              </button>
              
              <Link
                href="/admin/dashboard/students"
                className="btn btn-outline-secondary"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Help & Info */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-info text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Quick Guide
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-primary mb-3">
                <h6><i className="fas fa-clipboard-list me-2"></i>Required Fields:</h6>
                <ul className="mb-0 ps-3">
                  <li>School Level (Nursery, Primary, JSS, SSS)</li>
                  <li>First & Last Name</li>
                  <li>Email (for parents/guardians)</li>
                </ul>
              </div>

              <div className="alert alert-success mb-3">
                <h6><i className="fas fa-id-card me-2"></i>Student ID:</h6>
                <p className="mb-0">
                  Auto-generated in format: <strong>STUD20250001</strong>
                  <br />
                  <small>Unique ID for each student</small>
                </p>
              </div>

              <div className="alert alert-info mb-3">
                <h6><i className="fas fa-school me-2"></i>School Levels:</h6>
                <ul className="mb-0 ps-3 small">
                  <li><strong>Nursery:</strong> Pre-school children</li>
                  <li><strong>Primary:</strong> Classes 1-6</li>
                  <li><strong>JSS:</strong> Junior Secondary 1-3</li>
                  <li><strong>SSS:</strong> Senior Secondary 1-3</li>
                </ul>
              </div>

              <div className="alert alert-warning mb-0">
                <h6><i className="fas fa-user-lock me-2"></i>Parent/Student Portal:</h6>
                <div className="mb-0">
                  <p className="mb-1 small">When enabled, creates portal access for:</p>
                  <ul className="mb-0 ps-3 small">
                    <li>Viewing student records</li>
                    <li>Checking exam results</li>
                    <li>Making fee payments</li>
                    <li>Downloading reports</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
