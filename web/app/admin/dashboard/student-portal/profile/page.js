'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { API_ENDPOINTS, apiService } from '@/services/api';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const IMAGE_URL = API_URL.replace('/api', '') || 'http://localhost:5000';

export default function StudentProfile() {
  const { data: session, status } = useSession();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch student profile directly from API
      const response = await apiService.get(API_ENDPOINTS.STUDENTS.GET_ME);
      setStudent(response.data || response);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, fetchProfile]);

  const profilePhotoUrl = useMemo(() => {
    if (!student?.profile_photo) return null;
    return `${IMAGE_URL}${student.profile_photo}`;
  }, [student?.profile_photo]);

  const calculateAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
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

  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="fas fa-exclamation-triangle me-2"></i>
        {error}
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
            <i className="fas fa-user text-success me-2"></i>
            My Profile
          </h2>
          <p className="text-muted mb-0">View and manage your personal information</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/dashboard/student-portal" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            Back to Dashboard
          </Link>
          <Link href="/admin/dashboard/student-portal/profile/edit" className="btn btn-success">
            <i className="fas fa-edit me-2"></i>
            Edit Profile
          </Link>
        </div>
      </div>

      <div className="row">
        {/* Main Profile Content */}
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
                <div className="col-md-6 mb-3">
                  <label className="text-muted small d-block mb-1">Student ID</label>
                  <p className="mb-0">
                    <strong className="text-success fs-5">{student.student_id}</strong>
                  </p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted small d-block mb-1">School Level</label>
                  <p className="mb-0">
                    <span className="badge bg-primary">{student.schema_display_name || student.schema_name}</span>
                  </p>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="text-muted small d-block mb-1">First Name</label>
                  <p className="mb-0">{student.first_name}</p>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="text-muted small d-block mb-1">Last Name</label>
                  <p className="mb-0">{student.last_name}</p>
                </div>
                {student.middle_name && (
                  <div className="col-md-4 mb-3">
                    <label className="text-muted small d-block mb-1">Middle Name</label>
                    <p className="mb-0">{student.middle_name}</p>
                  </div>
                )}
                <div className="col-md-6 mb-3">
                  <label className="text-muted small d-block mb-1">Gender</label>
                  <p className="mb-0 text-capitalize">{student.gender || 'Not specified'}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted small d-block mb-1">Date of Birth</label>
                  <p className="mb-0">
                    {student.date_of_birth ? (
                      <>
                        {new Date(student.date_of_birth).toLocaleDateString()}
                        {calculateAge(student.date_of_birth) && (
                          <span className="text-muted small ms-2">
                            (Age: {calculateAge(student.date_of_birth)})
                          </span>
                        )}
                      </>
                    ) : (
                      'Not specified'
                    )}
                  </p>
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
                  <label className="text-muted small d-block mb-1">
                    <i className="fas fa-envelope me-1"></i>
                    Email
                  </label>
                  <p className="mb-0">{student.email}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted small d-block mb-1">
                    <i className="fas fa-phone me-1"></i>
                    Phone
                  </label>
                  <p className="mb-0">{student.phone || 'Not provided'}</p>
                </div>
                <div className="col-12 mb-3">
                  <label className="text-muted small d-block mb-1">
                    <i className="fas fa-map-marker-alt me-1"></i>
                    Address
                  </label>
                  <p className="mb-0">{student.address || 'Not provided'}</p>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="text-muted small d-block mb-1">City</label>
                  <p className="mb-0">{student.city || 'Not specified'}</p>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="text-muted small d-block mb-1">State</label>
                  <p className="mb-0">{student.state || 'Not specified'}</p>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="text-muted small d-block mb-1">Country</label>
                  <p className="mb-0">{student.country || 'Not specified'}</p>
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
                  <label className="text-muted small d-block mb-1">Guardian Name</label>
                  <p className="mb-0">{student.guardian_name || 'Not provided'}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted small d-block mb-1">Relationship</label>
                  <p className="mb-0">{student.guardian_relationship || 'Not specified'}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted small d-block mb-1">
                    <i className="fas fa-phone me-1"></i>
                    Guardian Phone
                  </label>
                  <p className="mb-0">{student.guardian_phone || 'Not provided'}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted small d-block mb-1">
                    <i className="fas fa-envelope me-1"></i>
                    Guardian Email
                  </label>
                  <p className="mb-0">{student.guardian_email || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Profile Photo */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body text-center">
              <div className="mb-3">
                {profilePhotoUrl ? (
                  <Image
                    src={profilePhotoUrl}
                    alt="Profile"
                    width={120}
                    height={120}
                    unoptimized
                    className="rounded-circle"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div 
                    className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center"
                    style={{ width: '120px', height: '120px', fontSize: '3rem' }}
                  >
                    <i className="fas fa-user"></i>
                  </div>
                )}
              </div>
              <h6 className="mb-1">{student.first_name} {student.last_name}</h6>
              <p className="text-muted small mb-3">{student.schema_display_name}</p>
              <Link 
                href="/admin/dashboard/student-portal/profile/edit" 
                className="btn btn-sm btn-success w-100"
              >
                <i className="fas fa-camera me-2"></i>
                Update Photo
              </Link>
            </div>
          </div>

          {/* Account Status */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light">
              <h6 className="card-title mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Account Status
              </h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="text-muted small d-block mb-1">Status</label>
                <span className="badge bg-success">Active</span>
              </div>
              <div className="mb-0">
                <label className="text-muted small d-block mb-1">Member Since</label>
                <p className="mb-0 small">{new Date(student.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
