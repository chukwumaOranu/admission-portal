'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStudents } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const IMAGE_URL = API_URL.replace('/api', '') || 'http://localhost:5000';

export default function EditStudentProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { students, loading: studentsLoading, fetchStudents, updateStudent } = useStudents();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());
  
  // Get redirect URL from query params
  const redirectUrl = searchParams.get('redirect');
  
  const [formData, setFormData] = useState({
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
    country: '',
    guardian_name: '',
    guardian_relationship: '',
    guardian_phone: '',
    guardian_email: ''
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to find student in Redux store first
      const currentStudent = students.find(s => s.email === session?.user?.email);
      if (currentStudent) {
        setStudent(currentStudent);
        setFormData({
          first_name: currentStudent.first_name || '',
          last_name: currentStudent.last_name || '',
          middle_name: currentStudent.middle_name || '',
          email: currentStudent.email || '',
          phone: currentStudent.phone || '',
          date_of_birth: currentStudent.date_of_birth ? currentStudent.date_of_birth.split('T')[0] : '',
          gender: currentStudent.gender || '',
          address: currentStudent.address || '',
          city: currentStudent.city || '',
          state: currentStudent.state || '',
          country: currentStudent.country || '',
          guardian_name: currentStudent.guardian_name || '',
          guardian_relationship: currentStudent.guardian_relationship || '',
          guardian_phone: currentStudent.guardian_phone || '',
          guardian_email: currentStudent.guardian_email || ''
        });
        return;
      }
      
      // If not found, fetch from API
      const response = await apiService.get('/students/me');
      const studentData = response.data;
      setStudent(studentData);
      
      // Pre-populate form
      setFormData({
        first_name: studentData.first_name || '',
        last_name: studentData.last_name || '',
        middle_name: studentData.middle_name || '',
        email: studentData.email || '',
        phone: studentData.phone || '',
        date_of_birth: studentData.date_of_birth ? studentData.date_of_birth.split('T')[0] : '',
        gender: studentData.gender || '',
        address: studentData.address || '',
        city: studentData.city || '',
        state: studentData.state || '',
        country: studentData.country || '',
        guardian_name: studentData.guardian_name || '',
        guardian_relationship: studentData.guardian_relationship || '',
        guardian_phone: studentData.guardian_phone || '',
        guardian_email: studentData.guardian_email || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [students, session?.user?.email]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, fetchProfile]);

  const existingProfilePhotoUrl = useMemo(() => {
    if (!student?.profile_photo) return null;
    return `${IMAGE_URL}${student.profile_photo}?t=${imageRefreshKey}`;
  }, [student?.profile_photo, imageRefreshKey]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user types
    setError('');
    setSuccess('');
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) {
      setError('Please select a photo first');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('profile_photo', photoFile);
      
      const response = await apiService.post(
        `/students/${student.id}/upload-photo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setSuccess('Profile photo uploaded successfully!');
      
      // Update student state with new photo URL
      const newPhotoUrl = response.data?.data?.profile_photo || response.data?.profile_photo;
      if (newPhotoUrl) {
        setStudent(prev => ({
          ...prev,
          profile_photo: newPhotoUrl
        }));
        
        // Force image refresh by updating timestamp
        setImageRefreshKey(Date.now());
      } else {
        console.warn('No profile photo URL in response:', response.data);
      }
      
      // Clear preview
      setPhotoFile(null);
      setPhotoPreview(null);
      
      // Refresh profile after 1 second
      setTimeout(() => {
        fetchProfile();
      }, 1000);
      
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('Are you sure you want to delete your profile photo?')) {
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      await apiService.delete(`/students/${student.id}/delete-photo`);
      
      setSuccess('Profile photo deleted successfully!');
      
      // Update student state
      setStudent(prev => ({
        ...prev,
        profile_photo: null
      }));
      
      // Refresh profile after 1 second
      setTimeout(() => {
        fetchProfile();
      }, 1000);
      
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError(err.response?.data?.message || 'Failed to delete photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.first_name || !formData.last_name || !formData.email) {
      setError('First name, last name, and email are required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      // Use Redux action instead of direct API call
      const result = await updateStudent({ id: student.id, data: formData });
      
      setSuccess('Profile updated successfully!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        // If there's a redirect URL, use it; otherwise go to profile page
        if (redirectUrl) {
          router.push(redirectUrl);
        } else {
          router.push('/admin/dashboard/student-portal/profile');
        }
      }, 2000);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
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

  if (!student) {
    return (
      <div className="alert alert-warning">
        <i className="fas fa-info-circle me-2"></i>
        Profile not found. Please contact administrator.
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-edit text-success me-2"></i>
            Edit Profile
          </h2>
          <p className="text-muted mb-0">Update your personal information</p>
        </div>
        <Link href="/admin/dashboard/student-portal/profile" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to Profile
        </Link>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          <i className="fas fa-check-circle me-2"></i>
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Warning Alert - Profile Photo Required */}
      {redirectUrl && !student?.profile_photo && (
        <div className="alert alert-warning">
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong>Profile Photo Required:</strong> Your profile photo is required for exam card generation. 
          Please upload your photo in the sidebar below before applying.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Main Form */}
          <div className="col-lg-8">
            {/* Personal Information */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-success text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-user me-2"></i>
                  Personal Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <label className="text-muted small d-block mb-1">Student ID</label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={student.student_id}
                      disabled
                    />
                    <small className="text-muted">Student ID cannot be changed</small>
                  </div>
                  
                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      First Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
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
                      onChange={handleChange}
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
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-select"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
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
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-info text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-address-book me-2"></i>
                  Contact Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      <i className="fas fa-envelope me-1"></i>
                      Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      <i className="fas fa-phone me-1"></i>
                      Phone
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+234 XXX XXX XXXX"
                    />
                  </div>
                  
                  <div className="col-12 mb-3">
                    <label className="form-label">
                      <i className="fas fa-map-marker-alt me-1"></i>
                      Address
                    </label>
                    <textarea
                      className="form-control"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="2"
                      placeholder="Street address"
                    ></textarea>
                  </div>
                  
                  <div className="col-md-4 mb-3">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-control"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="col-md-4 mb-3">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      className="form-control"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      className="form-control"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="e.g., Nigeria"
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
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Guardian Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="guardian_name"
                      value={formData.guardian_name}
                      onChange={handleChange}
                      placeholder="Full name"
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Relationship</label>
                    <select
                      className="form-select"
                      name="guardian_relationship"
                      value={formData.guardian_relationship}
                      onChange={handleChange}
                    >
                      <option value="">Select Relationship</option>
                      <option value="father">Father</option>
                      <option value="mother">Mother</option>
                      <option value="guardian">Guardian</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      <i className="fas fa-phone me-1"></i>
                      Guardian Phone
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      name="guardian_phone"
                      value={formData.guardian_phone}
                      onChange={handleChange}
                      placeholder="+234 XXX XXX XXXX"
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      <i className="fas fa-envelope me-1"></i>
                      Guardian Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      name="guardian_email"
                      value={formData.guardian_email}
                      onChange={handleChange}
                      placeholder="guardian@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            {/* Profile Photo */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-light">
                <h6 className="mb-0">
                  <i className="fas fa-camera me-2"></i>
                  Profile Photo
                </h6>
              </div>
              <div className="card-body text-center">
                <div className="mb-3">
                  {photoPreview ? (
                    <Image
                      src={photoPreview}
                      alt="Preview"
                      width={150}
                      height={150}
                      unoptimized
                      className="rounded-circle border border-3 border-success"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : existingProfilePhotoUrl ? (
                    <Image
                      src={existingProfilePhotoUrl}
                      alt="Profile"
                      width={150}
                      height={150}
                      unoptimized
                      className="rounded-circle"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div 
                      className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center"
                      style={{ width: '150px', height: '150px', fontSize: '3rem' }}
                    >
                      <i className="fas fa-user"></i>
                    </div>
                  )}
                </div>
                
                <h6 className="mb-1">{formData.first_name} {formData.last_name}</h6>
                <p className="text-muted small mb-3">{student.schema_display_name}</p>
                
                {/* File Input */}
                <div className="mb-3">
                  <input
                    type="file"
                    id="photoInput"
                    className="form-control form-control-sm"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={uploading}
                  />
                  <small className="text-muted d-block mt-1">
                    Max size: 5MB | Formats: JPG, PNG, GIF
                  </small>
                </div>
                
                {/* Upload Button */}
                {photoFile && (
                  <div className="d-grid gap-2 mb-2">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handlePhotoUpload}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <i className="fas fa-spinner fa-spin me-2"></i>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-upload me-2"></i>
                          Upload Photo
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                        document.getElementById('photoInput').value = '';
                      }}
                      disabled={uploading}
                    >
                      <i className="fas fa-times me-1"></i>
                      Cancel
                    </button>
                  </div>
                )}
                
                {/* Delete Button */}
                {student.profile_photo && !photoFile && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger w-100"
                    onClick={handleDeletePhoto}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-trash me-2"></i>
                        Delete Photo
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Save Actions */}
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-success btn-lg"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Save Changes
                      </>
                    )}
                  </button>
                  
                  <Link
                    href="/admin/dashboard/student-portal/profile"
                    className="btn btn-outline-secondary"
                  >
                    <i className="fas fa-times me-2"></i>
                    Cancel
                  </Link>
                </div>
                
                <div className="alert alert-info mt-3 mb-0 small">
                  <i className="fas fa-info-circle me-1"></i>
                  Fields marked with <span className="text-danger">*</span> are required
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
