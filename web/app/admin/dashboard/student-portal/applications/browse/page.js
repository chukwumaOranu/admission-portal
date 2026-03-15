'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useApplications } from '@/hooks/useRedux';

export default function BrowseProgramsPage() {
  const { data: session, status } = useSession();
  const { schemas: allSchemas, applications: userApplications, loading, error, fetchApplicationSchemas, fetchMyApplications } = useApplications();

  // Filter to only show active schemas
  const schemas = allSchemas.filter(s => s.is_active);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchApplicationSchemas();
      fetchMyApplications(); // Fetch only current user's applications
    }
  }, [status, fetchApplicationSchemas, fetchMyApplications]);
  
  // Check if user already applied to a schema
  const hasAppliedToSchema = (schemaId) => {
    return userApplications.some(app => app.schema_id === schemaId);
  };
  
  // Get application for a schema
  const getApplicationForSchema = (schemaId) => {
    return userApplications.find(app => app.schema_id === schemaId);
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

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-search text-success me-2"></i>
            Browse Available Programs
          </h2>
          <p className="text-muted mb-0">Select a program to apply</p>
        </div>
        <Link href="/admin/dashboard/student-portal/applications" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to My Applications
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Info Banner */}
      <div className="alert alert-info mb-4">
        <div className="row align-items-center">
          <div className="col-md-8">
            <h6 className="mb-2">
              <i className="fas fa-info-circle me-2"></i>
              How to Apply
            </h6>
            <p className="mb-0 small">
              Select a program below, review the requirements and fees, then click &quot;Apply Now&quot; to start your application.
            </p>
          </div>
          <div className="col-md-4 text-md-end">
            <Link href="/admin/dashboard/student-portal/help" className="btn btn-sm btn-outline-info">
              <i className="fas fa-question-circle me-2"></i>
              Need Help?
            </Link>
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      {schemas.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="fas fa-inbox text-muted" style={{ fontSize: '4rem' }}></i>
            <h5 className="mt-3 text-muted">No Programs Available</h5>
            <p className="text-muted">
              No admission programs are currently open. Please check back later or contact the school.
            </p>
          </div>
        </div>
      ) : (
        <div className="row">
          {schemas.map((schema) => (
            <div key={schema.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card border-0 shadow-sm h-100 hover-card">
                <div className="card-header bg-gradient-primary text-white">
                  <h5 className="card-title mb-0">
                    <i className="fas fa-graduation-cap me-2"></i>
                    {schema.display_name || schema.schema_name}
                  </h5>
                </div>
                <div className="card-body">
                  {/* Description */}
                  <p className="text-muted mb-3">
                    {schema.description || 'No description available'}
                  </p>

                  {/* Application Fee */}
                  <div className="mb-3 p-3 bg-light rounded">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Application Fee:</span>
                      <strong className="text-success fs-5">
                        ₦{parseFloat(schema.application_fee || 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-calendar text-warning me-2"></i>
                      <small className="text-muted">
                        Opened: {new Date(schema.created_at).toLocaleDateString()}
                      </small>
                    </div>
                    <div className="d-flex align-items-center">
                      <i className="fas fa-check-circle text-success me-2"></i>
                      <small className="text-muted">
                        Currently accepting applications
                      </small>
                    </div>
                  </div>

                  {/* Requirements Preview */}
                  <div className="alert alert-light border mb-0">
                    <h6 className="small mb-2">
                      <i className="fas fa-clipboard-list me-2"></i>
                      Requirements:
                    </h6>
                    <ul className="small mb-0 ps-3">
                      <li>Valid birth certificate</li>
                      <li>Passport photograph</li>
                      <li>Previous school records</li>
                      <li>Application fee payment</li>
                    </ul>
                  </div>
                </div>
                
                <div className="card-footer bg-white">
                  {hasAppliedToSchema(schema.id) ? (
                    <div>
                      {(() => {
                        const app = getApplicationForSchema(schema.id);
                        return (
                          <div className="text-center">
                            <div className={`badge bg-${app?.status === 'approved' ? 'success' : app?.status === 'rejected' ? 'danger' : 'warning'} mb-2`}>
                              {app?.status === 'approved' ? '✅ Approved' : app?.status === 'rejected' ? '❌ Rejected' : '⏳ ' + (app?.status || 'Pending')}
                            </div>
                            <div className="d-flex gap-2 mt-2">
                              <Link
                                href={`/admin/dashboard/student-portal/applications/${app.id}`}
                                className="btn btn-sm btn-outline-primary flex-fill"
                              >
                                <i className="fas fa-eye me-1"></i>
                                View
                              </Link>
                              {app?.payment_status !== 'paid' && (
                                <Link
                                  href={`/admin/dashboard/student-portal/payments/pay/${app.id}`}
                                  className="btn btn-sm btn-success flex-fill"
                                >
                                  <i className="fas fa-credit-card me-1"></i>
                                  Pay
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="d-flex gap-2">
                      <Link
                        href={`/admin/dashboard/student-portal/applications/new?schema=${schema.id}`}
                        className="btn btn-success w-100"
                      >
                        <i className="fas fa-paper-plane me-2"></i>
                        Apply Now
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Section */}
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-header bg-info text-white">
          <h6 className="card-title mb-0">
            <i className="fas fa-lightbulb me-2"></i>
            Important Information
          </h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <h6 className="small">
                <i className="fas fa-file-alt text-primary me-2"></i>
                Application Process
              </h6>
              <p className="small text-muted mb-0">
                Fill the application form, upload required documents, and submit for review.
              </p>
            </div>
            <div className="col-md-4 mb-3">
              <h6 className="small">
                <i className="fas fa-credit-card text-success me-2"></i>
                Payment
              </h6>
              <p className="small text-muted mb-0">
                Pay the application fee securely via Paystack (Card, Bank Transfer, or USSD).
              </p>
            </div>
            <div className="col-md-4 mb-3">
              <h6 className="small">
                <i className="fas fa-clock text-warning me-2"></i>
                Processing Time
              </h6>
              <p className="small text-muted mb-0">
                Applications are typically reviewed within 5-7 business days.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hover-card {
          transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.15) !important;
        }

        .bg-gradient-primary {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
        }
      `}</style>
    </div>
  );
}
