'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { API_ENDPOINTS, apiService } from '@/services/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const IMAGE_URL = API_URL.replace('/api', '') || 'http://localhost:5000';

export default function StudentPortalDashboard() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [stats, setStats] = useState({
    applications: 0,
    payments: 0,
    exams: 0,
    results: 0
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [profileResponse, applicationsResponse] = await Promise.all([
        apiService.get(API_ENDPOINTS.STUDENTS.GET_ME),
        apiService.get(API_ENDPOINTS.APPLICATIONS.GET_MY)
      ]);

      const profile = profileResponse.data || profileResponse;
      const applications = applicationsResponse.data?.data || applicationsResponse.data || [];
      const normalizedApplications = Array.isArray(applications) ? applications : [];

      setStudentData(profile);
      setStats({
        applications: normalizedApplications.length,
        payments: normalizedApplications.filter((app) => app.payment_status === 'paid').length,
        exams: normalizedApplications.filter((app) => app.exam_date_id || app.exam_date).length,
        results: normalizedApplications.filter((app) => app.admission_status === 'approved').length
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && session?.accessToken) {
      fetchDashboardData();
    }
  }, [status, session?.user?.id, session?.accessToken, fetchDashboardData]);

  const profilePhotoUrl = useMemo(() => {
    if (!studentData?.profile_photo) return null;
    return `${IMAGE_URL}${studentData.profile_photo}`;
  }, [studentData?.profile_photo]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ background: '#f5f7fb', minHeight: '100vh', margin: '-1rem', padding: '1rem' }}>
      {/* Hero Welcome Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #eef4ff 100%)' }}>
            <div className="card-body p-4">
              <div className="row align-items-center">
                <div className="col-lg-8">
                  <div className="d-flex align-items-center mb-3">
                    <div className="me-3">
                      {profilePhotoUrl ? (
                        <Image
                          src={profilePhotoUrl}
                          alt="Profile"
                          width={70}
                          height={70}
                          unoptimized
                          className="rounded-circle border border-2 border-primary"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div 
                          className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center"
                          style={{ width: '70px', height: '70px', fontSize: '1.8rem' }}
                        >
                          <i className="fas fa-user"></i>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="mb-1 fw-bold">
                        Welcome back, {studentData?.first_name}!
                      </h3>
                      <p className="text-muted mb-0">
                        Ready to continue your academic journey?
                      </p>
                    </div>
                  </div>
                  <div className="d-flex gap-2 flex-wrap align-items-center">
                    <span className="badge border border-primary d-inline-flex align-items-center" style={{ background: '#F8F8F8', color: '#000', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      <i className="fas fa-id-card text-primary me-2"></i>
                      {studentData?.student_id}
                    </span>
                    <span className="badge border border-primary d-inline-flex align-items-center" style={{ background: '#F8F8F8', color: '#000', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      <i className="fas fa-graduation-cap text-primary me-2"></i>
                      {studentData?.schema_display_name}
                    </span>
                    <span className="badge border border-primary d-inline-flex align-items-center" style={{ background: '#F8F8F8', color: '#000', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      <i className="fas fa-check-circle text-primary me-2"></i>
                      Active
                    </span>
                  </div>
                </div>
                <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
                  <Link 
                    href="/admin/dashboard/student-portal/applications" 
                    className="btn btn-primary btn-lg px-4"
                  >
                    <i className="fas fa-list-check me-2"></i>
                    Continue Applications
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border shadow-sm hover-card h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <p className="text-muted mb-1 small text-uppercase fw-semibold">Applications</p>
                  <h2 className="mb-0 fw-bold text-primary">{stats.applications}</h2>
                  <small className="text-muted">
                    <i className="fas fa-arrow-up me-1"></i>
                    Active
                  </small>
                </div>
                <div className="icon-box">
                  <i className="fas fa-file-alt text-primary"></i>
                </div>
              </div>
              <Link href="/admin/dashboard/student-portal/applications" className="btn btn-sm btn-outline-primary w-100" style={{ background: '#F8F8F8' }}>
                <i className="fas fa-arrow-right me-2"></i>
                View All
              </Link>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border shadow-sm hover-card h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <p className="text-muted mb-1 small text-uppercase fw-semibold">Payments</p>
                  <h2 className="mb-0 fw-bold text-primary">{stats.payments}</h2>
                  <small className="text-muted">
                    <i className="fas fa-check-circle me-1"></i>
                    Completed
                  </small>
                </div>
                <div className="icon-box">
                  <i className="fas fa-credit-card text-primary"></i>
                </div>
              </div>
              <Link href="/admin/dashboard/student-portal/payments" className="btn btn-sm btn-outline-primary w-100" style={{ background: '#F8F8F8' }}>
                <i className="fas fa-arrow-right me-2"></i>
                View All
              </Link>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border shadow-sm hover-card h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <p className="text-muted mb-1 small text-uppercase fw-semibold">Exams</p>
                  <h2 className="mb-0 fw-bold text-primary">{stats.exams}</h2>
                  <small className="text-muted">
                    <i className="fas fa-clock me-1"></i>
                    Upcoming
                  </small>
                </div>
                <div className="icon-box">
                  <i className="fas fa-clipboard-check text-primary"></i>
                </div>
              </div>
              <Link href="/admin/dashboard/student-portal/exams" className="btn btn-sm btn-outline-primary w-100" style={{ background: '#F8F8F8' }}>
                <i className="fas fa-arrow-right me-2"></i>
                View All
              </Link>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card border shadow-sm hover-card h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <p className="text-muted mb-1 small text-uppercase fw-semibold">Results</p>
                  <h2 className="mb-0 fw-bold text-primary">{stats.results}</h2>
                  <small className="text-muted">
                    <i className="fas fa-hourglass-half me-1"></i>
                    Pending
                  </small>
                </div>
                <div className="icon-box">
                  <i className="fas fa-chart-line text-primary"></i>
                </div>
              </div>
              <Link href="/admin/dashboard/student-portal/results" className="btn btn-sm btn-outline-primary w-100" style={{ background: '#F8F8F8' }}>
                <i className="fas fa-arrow-right me-2"></i>
                View All
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border shadow-sm">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="mb-0 fw-bold">
                <i className="fas fa-bolt text-primary me-2"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-lg-3 col-md-6">
                  <Link href="/admin/dashboard/student-portal/applications/browse" className="text-decoration-none">
                    <div className="action-card border shadow-sm">
                      <div className="action-icon bg-primary text-white mb-3">
                        <i className="fas fa-clipboard-list"></i>
                      </div>
                      <h6 className="mb-1 fw-bold text-dark">Available Applications</h6>
                      <p className="small text-muted mb-0">Browse admission programs</p>
                    </div>
                  </Link>
                </div>
                
                <div className="col-lg-3 col-md-6">
                  <Link href="/admin/dashboard/student-portal/applications" className="text-decoration-none">
                    <div className="action-card border shadow-sm">
                      <div className="action-icon bg-primary text-white mb-3">
                        <i className="fas fa-list-check"></i>
                      </div>
                      <h6 className="mb-1 fw-bold text-dark">My Applications</h6>
                      <p className="small text-muted mb-0">Track application status</p>
                    </div>
                  </Link>
                </div>
                
                <div className="col-lg-3 col-md-6">
                  <Link href="/admin/dashboard/student-portal/exams" className="text-decoration-none">
                    <div className="action-card border shadow-sm">
                      <div className="action-icon bg-primary text-white mb-3">
                        <i className="fas fa-download"></i>
                      </div>
                      <h6 className="mb-1 fw-bold text-dark">Download Exam Card</h6>
                      <p className="small text-muted mb-0">Get your exam card</p>
                    </div>
                  </Link>
                </div>
                
                <div className="col-lg-3 col-md-6">
                  <Link href="/admin/dashboard/student-portal/profile/edit" className="text-decoration-none">
                    <div className="action-card border shadow-sm">
                      <div className="action-icon bg-primary text-white mb-3">
                        <i className="fas fa-user-edit"></i>
                      </div>
                      <h6 className="mb-1 fw-bold text-dark">Update Profile</h6>
                      <p className="small text-muted mb-0">Edit your information</p>
                    </div>
                  </Link>
                </div>
                
                <div className="col-lg-3 col-md-6">
                  <Link href="/admin/dashboard/student-portal/payments/history" className="text-decoration-none">
                    <div className="action-card border shadow-sm">
                      <div className="action-icon bg-success text-white mb-3">
                        <i className="fas fa-receipt"></i>
                      </div>
                      <h6 className="mb-1 fw-bold text-dark">Payment History</h6>
                      <p className="small text-muted mb-0">View all payment records</p>
                    </div>
                  </Link>
                </div>
                
                <div className="col-lg-3 col-md-6">
                  <Link href="/admin/dashboard/student-portal/results" className="text-decoration-none">
                    <div className="action-card border shadow-sm">
                      <div className="action-icon bg-info text-white mb-3">
                        <i className="fas fa-poll"></i>
                      </div>
                      <h6 className="mb-1 fw-bold text-dark">Results</h6>
                      <p className="small text-muted mb-0">Check admission/result status</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="row">
        {/* Recent Applications */}
        <div className="col-lg-8 mb-4">
          <div className="card border shadow-sm h-100">
            <div className="card-header bg-white border-bottom py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">
                  <i className="fas fa-clock text-primary me-2"></i>
                  Recent Activity
                </h5>
                <Link href="/admin/dashboard/student-portal/applications" className="btn btn-sm btn-outline-primary">
                  View All
                  <i className="fas fa-arrow-right ms-2"></i>
                </Link>
              </div>
            </div>
            <div className="card-body p-4">
              {/* Empty State */}
              <div className="text-center py-5">
                <div className="empty-state-icon mb-4">
                  <i className="fas fa-inbox text-primary"></i>
                </div>
                <h5 className="mb-2 fw-bold">No Applications Yet</h5>
                <p className="text-muted mb-4">
                  Start your admission journey by browsing available programs
                </p>
                <Link 
                  href="/admin/dashboard/student-portal/applications/browse" 
                  className="btn btn-primary btn-lg px-4"
                >
                  <i className="fas fa-rocket me-2"></i>
                  Browse Available Applications
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="col-lg-4 mb-4">
          {/* Student Info Card */}
          <div className="card border shadow-sm mb-4">
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="mb-0 fw-bold">
                <i className="fas fa-user-circle text-primary me-2"></i>
                Student Information
              </h6>
            </div>
            <div className="card-body p-4">
              <div className="text-center mb-3">
                {profilePhotoUrl ? (
                  <Image
                    src={profilePhotoUrl}
                    alt="Profile"
                    width={100}
                    height={100}
                    unoptimized
                    className="rounded-circle border border-2 border-primary mb-3"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div 
                    className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}
                  >
                    <i className="fas fa-user"></i>
                  </div>
                )}
                <h6 className="mb-0 fw-bold">{studentData?.first_name} {studentData?.last_name}</h6>
                <p className="text-muted small mb-0">{studentData?.email}</p>
              </div>
              
              <hr className="my-3" />
              
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">
                    <i className="fas fa-hashtag text-primary me-2"></i>
                    Student ID
                  </span>
                  <span className="info-value fw-bold text-primary">{studentData?.student_id}</span>
                </div>
                
                <div className="info-item">
                  <span className="info-label">
                    <i className="fas fa-layer-group text-primary me-2"></i>
                    Level
                  </span>
                  <span className="info-value">{studentData?.schema_display_name}</span>
                </div>
                
                <div className="info-item">
                  <span className="info-label">
                    <i className="fas fa-calendar text-primary me-2"></i>
                    Joined
                  </span>
                  <span className="info-value">
                    {studentData?.created_at && new Date(studentData.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="info-item">
                  <span className="info-label">
                    <i className="fas fa-signal text-primary me-2"></i>
                    Status
                  </span>
                  <span className="badge bg-primary">Active</span>
                </div>
              </div>
              
              <hr className="my-3" />
              
              <Link 
                href="/admin/dashboard/student-portal/profile/edit" 
                className="btn btn-primary w-100"
              >
                <i className="fas fa-edit me-2"></i>
                Edit Profile
              </Link>
            </div>
          </div>

          {/* Upcoming Events Card */}
          <div className="card border shadow-sm">
            <div className="card-header bg-white border-bottom py-3">
              <h6 className="mb-0 fw-bold">
                <i className="fas fa-calendar-alt text-primary me-2"></i>
                Upcoming Events
              </h6>
            </div>
            <div className="card-body p-4">
              <div className="event-item">
                <div className="event-date border border-primary">
                  <div className="date-day text-primary">--</div>
                  <div className="date-month text-muted">---</div>
                </div>
                <div className="event-details">
                  <h6 className="mb-1 small">No upcoming events</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>
                    Events will appear here
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help & Resources */}
      <div className="row">
        <div className="col-12">
          <div className="card border shadow-sm">
            <div className="card-body p-4">
              <div className="row align-items-center">
                <div className="col-lg-8">
                  <h5 className="mb-2 fw-bold">
                    <i className="fas fa-question-circle text-primary me-2"></i>
                    Need Help?
                  </h5>
                  <p className="text-muted mb-0">
                    Our support team is here to assist you with any questions about the admission process, 
                    payments, or technical issues.
                  </p>
                </div>
                <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
                  <Link href="/admin/dashboard/student-portal/help" className="btn btn-primary px-4">
                    <i className="fas fa-headset me-2"></i>
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .hover-card {
          transition: all 0.3s ease;
        }
        
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15) !important;
        }

        .icon-box {
          width: 56px;
          height: 56px;
          background: rgba(var(--bs-primary-rgb), 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .action-card {
          padding: 2rem 1.5rem;
          border-radius: 8px;
          transition: all 0.3s ease;
          cursor: pointer;
          text-align: center;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: white;
        }

        .action-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);
        }

        .action-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
        }

        .empty-state-icon {
          width: 100px;
          height: 100px;
          background: rgba(var(--bs-primary-rgb), 0.1);
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          margin: 0 auto;
        }

        .info-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-label {
          font-size: 0.875rem;
          color: #6c757d;
        }

        .info-value {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .event-item {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .event-date {
          padding: 0.75rem;
          border-radius: 8px;
          text-align: center;
          min-width: 60px;
          background: white;
        }

        .date-day {
          font-size: 1.25rem;
          font-weight: bold;
          line-height: 1;
        }

        .date-month {
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        .event-details {
          flex: 1;
        }

        @media (max-width: 768px) {
          .icon-box {
            width: 48px;
            height: 48px;
            font-size: 1.25rem;
          }

          .action-card {
            padding: 1.5rem 1rem;
          }

          .action-icon {
            width: 50px;
            height: 50px;
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
