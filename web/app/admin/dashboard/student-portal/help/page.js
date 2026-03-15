'use client';

import { useEffect } from 'react';
import { useSettings } from '@/hooks/useRedux';

export default function StudentHelp() {
  const { schoolSettings, loading, fetchSchoolSettings } = useSettings();

  useEffect(() => {
    fetchSchoolSettings();
  }, [fetchSchoolSettings]);

  return (
    <div className="container-fluid">
      <div className="mb-4">
        <h2 className="h4 mb-1">
          <i className="fas fa-question-circle text-info me-2"></i>
          Help & Support
        </h2>
        <p className="text-muted mb-0">Get help and contact support</p>
      </div>

      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-headset me-2"></i>
                Contact Support
              </h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-3">Need assistance? Contact our support team:</p>
                  {schoolSettings?.school_email && (
                    <div className="mb-3">
                      <i className="fas fa-envelope text-primary me-2"></i>
                      <strong>Email:</strong> <a href={`mailto:${schoolSettings.school_email}`}>{schoolSettings.school_email}</a>
                    </div>
                  )}
                  {schoolSettings?.school_phone && (
                    <div className="mb-3">
                      <i className="fas fa-phone text-success me-2"></i>
                      <strong>Phone:</strong> <a href={`tel:${schoolSettings.school_phone}`}>{schoolSettings.school_phone}</a>
                    </div>
                  )}
                  {schoolSettings?.school_address && (
                    <div className="mb-3">
                      <i className="fas fa-map-marker-alt text-danger me-2"></i>
                      <strong>Address:</strong> {schoolSettings.school_address}
                    </div>
                  )}
                  {schoolSettings?.school_website && (
                    <div className="mb-3">
                      <i className="fas fa-globe text-info me-2"></i>
                      <strong>Website:</strong> <a href={schoolSettings.school_website} target="_blank" rel="noopener noreferrer">{schoolSettings.school_website}</a>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-book me-2"></i>
                Quick Links
              </h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                <a href="#" className="list-group-item list-group-item-action">
                  <i className="fas fa-question-circle me-2"></i>
                  Frequently Asked Questions
                </a>
                <a href="#" className="list-group-item list-group-item-action">
                  <i className="fas fa-file-alt me-2"></i>
                  How to Apply
                </a>
                <a href="#" className="list-group-item list-group-item-action">
                  <i className="fas fa-credit-card me-2"></i>
                  Payment Instructions
                </a>
                <a href="#" className="list-group-item list-group-item-action">
                  <i className="fas fa-download me-2"></i>
                  Download Forms
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
