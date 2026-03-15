'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudents } from '@/hooks/useRedux';

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  // ✅ Redux - Simple unified hook
  const { students, schemas: studentSchemas, loading: reduxLoading, fetchStudents, fetchStudentSchemas, updateStudent } = useStudents();
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
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
    status: 'active'
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStudentSchemas();
      fetchStudents(); // Fetch all students into Redux
    }
  }, [status, fetchStudentSchemas, fetchStudents]);

  // Populate form when students are loaded
  useEffect(() => {
    if (students.length > 0 && params.id) {
      const student = students.find(s => s.id === parseInt(params.id));
      if (!student) {
        setError('Student not found');
        setLoading(false);
        return;
      }
      
      // Populate form with student data
      setFormData({
        schema_id: student.schema_id || '',
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        middle_name: student.middle_name || '',
        email: student.email || '',
        phone: student.phone || '',
        date_of_birth: student.date_of_birth ? student.date_of_birth.split('T')[0] : '',
        gender: student.gender || '',
        address: student.address || '',
        city: student.city || '',
        state: student.state || '',
        country: student.country || 'Nigeria',
        postal_code: student.postal_code || '',
        guardian_name: student.guardian_name || '',
        guardian_phone: student.guardian_phone || '',
        guardian_email: student.guardian_email || '',
        guardian_relationship: student.guardian_relationship || '',
        previous_school: student.previous_school || '',
        graduation_year: student.graduation_year || '',
        status: student.status || 'active'
      });
      setLoading(false);
    }
  }, [students, params.id]);

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
    setIsSubmitting(true);
    setError('');
    
    try {
      // ✅ Redux Action
      await updateStudent(parseInt(params.id), formData);
      setSuccess(true);
      alert('Student updated successfully!');
      setTimeout(() => {
        router.push(`/admin/dashboard/students/${params.id}`);
      }, 1000);
    } catch (err) {
      console.error('Error updating student:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update student');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking authentication
  if (status === 'loading' || loading) {
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
  if (!hasPermission('student.update')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to edit students.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-user-edit text-primary-custom me-2"></i>
            Edit Student
          </h2>
          <p className="text-muted mb-0">Update student information</p>
        </div>
        <Link href={`/admin/dashboard/students/${params.id}`} className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to Details
        </Link>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          Student updated successfully!
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
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-lg-8">
            {/* Basic Information */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-user me-2"></i>
                  Basic Information
                </h5>
              </div>
              <div className="card-body">
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
                  </div>

                  {/* Status */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="graduated">Graduated</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>
                  </div>

                  {/* Names */}
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
                    />
                  </div>

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
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Middle Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="middle_name"
                      value={formData.middle_name}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Gender & DOB */}
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

                  {/* Contact */}
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
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
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

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      className="form-control"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
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
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Previous School Information */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-secondary text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-school me-2"></i>
                  Previous School Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-8 mb-3">
                    <label className="form-label">Previous School</label>
                    <input
                      type="text"
                      className="form-control"
                      name="previous_school"
                      value={formData.previous_school}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Year Left</label>
                    <input
                      type="number"
                      className="form-control"
                      name="graduation_year"
                      value={formData.graduation_year}
                      onChange={handleInputChange}
                      min="2000"
                      max="2030"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="d-flex gap-2 mb-4">
              <button
                type="submit"
                className="btn btn-primary-custom"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Update Student
                  </>
                )}
              </button>
              
              <Link
                href={`/admin/dashboard/students/${params.id}`}
                className="btn btn-outline-secondary"
              >
                Cancel
              </Link>
            </div>
          </div>

          {/* Sidebar - Help */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-info text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  Editing Student
                </h5>
              </div>
              <div className="card-body">
                <div className="alert alert-warning mb-3">
                  <h6><i className="fas fa-exclamation-triangle me-2"></i>Note:</h6>
                  <ul className="mb-0 small">
                    <li>Student ID cannot be changed</li>
                    <li>User account settings managed separately</li>
                    <li>Changes take effect immediately</li>
                  </ul>
                </div>

                <h6>Required Fields:</h6>
                <ul className="small">
                  <li>School Level</li>
                  <li>First Name</li>
                  <li>Last Name</li>
                  <li>Email</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
