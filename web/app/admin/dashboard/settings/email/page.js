'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useSettings } from '@/hooks/useRedux';

const EMAIL_SETTINGS_DEFAULTS = {
  smtp_host: '',
  smtp_port: 587,
  smtp_username: '',
  smtp_password: '',
  smtp_secure: false,
  from_email: '',
  from_name: '',
  reply_to: '',
  email_enabled: true,
  email_verification_enabled: true,
  password_reset_enabled: true,
  notification_enabled: true,
  welcome_email_enabled: true,
  application_notifications_enabled: true,
  payment_notifications_enabled: true,
  custom_settings: null
};

export default function EmailSettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  
  // Redux state
  const {
    emailSettings: reduxEmailSettings,
    loading,
    error: reduxError,
    fetchEmailSettings,
    updateEmailSettings,
    testEmailSettings
  } = useSettings();
  
  const [emailOverrides, setEmailOverrides] = useState({});
  const [testEmail, setTestEmail] = useState('');
  const canReadSettings = hasPermission('settings.read');
  const emailSettings = useMemo(
    () => ({
      ...EMAIL_SETTINGS_DEFAULTS,
      ...(reduxEmailSettings || {}),
      ...emailOverrides
    }),
    [reduxEmailSettings, emailOverrides]
  );

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken && canReadSettings) {
      fetchEmailSettings();
    }
  }, [status, session?.user?.id, session?.accessToken, canReadSettings, fetchEmailSettings]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      await updateEmailSettings(emailSettings);
      await fetchEmailSettings();
      setEmailOverrides({});
      alert('Email settings updated successfully!');
    } catch (err) {
      console.error('Error updating email settings:', err);
      alert('Failed to update email settings');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailOverrides(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert('Please enter a test email address');
      return;
    }

    try {
      await testEmailSettings({ email: testEmail });
      alert('Test email sent successfully!');
    } catch (err) {
      console.error('Error sending test email:', err);
      alert('Failed to send test email');
    }
  };

  // Show loading while checking authentication
  if (status === 'loading' || permissionsLoading) {
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
  if (!canReadSettings) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to access email settings.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-envelope text-primary-custom me-2"></i>
            Email Settings
          </h2>
          <p className="text-muted mb-0">Configure email server and notification settings</p>
        </div>
        <Link href="/admin/dashboard/settings" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to Settings
        </Link>
      </div>

      <div className="row">
        {/* Email Settings Form */}
        <div className="col-lg-8">
          <form onSubmit={handleUpdateSettings}>
            {/* SMTP Configuration */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-server me-2"></i>
                  SMTP Configuration
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">SMTP Host</label>
                    <input
                      type="text"
                      className="form-control"
                      name="smtp_host"
                      value={emailSettings.smtp_host}
                      onChange={handleInputChange}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">SMTP Port</label>
                    <input
                      type="number"
                      className="form-control"
                      name="smtp_port"
                      value={emailSettings.smtp_port}
                      onChange={handleInputChange}
                      min="1"
                      max="65535"
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">SMTP Username</label>
                    <input
                      type="text"
                      className="form-control"
                      name="smtp_username"
                      value={emailSettings.smtp_username}
                      onChange={handleInputChange}
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">SMTP Password</label>
                    <input
                      type="password"
                      className="form-control"
                      name="smtp_password"
                      value={emailSettings.smtp_password}
                      onChange={handleInputChange}
                      placeholder="App password or account password"
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="smtp_secure"
                        checked={emailSettings.smtp_secure}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Use SSL/TLS
                      </label>
                    </div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="email_enabled"
                        checked={emailSettings.email_enabled}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Enable Email Service
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Templates */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-success text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-envelope-open-text me-2"></i>
                  Email Templates
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">From Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="from_email"
                      value={emailSettings.from_email}
                      onChange={handleInputChange}
                      placeholder="noreply@yourschool.com"
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">From Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="from_name"
                      value={emailSettings.from_name}
                      onChange={handleInputChange}
                      placeholder="Your School Name"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Reply-To Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="reply_to"
                    value={emailSettings.reply_to}
                    onChange={handleInputChange}
                    placeholder="support@yourschool.com"
                  />
                </div>
              </div>
            </div>

            {/* Email Notifications */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-warning text-dark">
                <h5 className="card-title mb-0">
                  <i className="fas fa-bell me-2"></i>
                  Email Notifications
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="email_verification_enabled"
                        checked={emailSettings.email_verification_enabled}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Email Verification
                      </label>
                    </div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="password_reset_enabled"
                        checked={emailSettings.password_reset_enabled}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Password Reset
                      </label>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="welcome_email_enabled"
                        checked={emailSettings.welcome_email_enabled}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Welcome Emails
                      </label>
                    </div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="notification_enabled"
                        checked={emailSettings.notification_enabled}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        General Notifications
                      </label>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="application_notifications_enabled"
                        checked={emailSettings.application_notifications_enabled}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Application Notifications
                      </label>
                    </div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="payment_notifications_enabled"
                        checked={emailSettings.payment_notifications_enabled}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Payment Notifications
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Email */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-info text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-paper-plane me-2"></i>
                  Test Email Configuration
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-8 mb-3">
                    <label className="form-label">Test Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                    />
                  </div>
                  
                  <div className="col-md-4 mb-3">
                    <label className="form-label">&nbsp;</label>
                    <button
                      type="button"
                      className="btn btn-outline-primary w-100"
                      onClick={handleTestEmail}
                      disabled={loading || !hasPermission('settings.update')}
                    >
                      <i className="fas fa-paper-plane me-2"></i>
                      Send Test Email
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2 mb-4">
              <button
                type="submit"
                className="btn btn-primary-custom"
                disabled={loading || !hasPermission('settings.update')}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Update Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help & Info */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Email Configuration Help
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <h6><i className="fas fa-lightbulb me-2"></i>SMTP Tips:</h6>
                <ul className="mb-0">
                  <li>Gmail: smtp.gmail.com:587</li>
                  <li>Outlook: smtp-mail.outlook.com:587</li>
                  <li>Use app passwords for Gmail</li>
                  <li>Enable SSL/TLS for security</li>
                </ul>
              </div>
              
              <div className="alert alert-warning">
                <h6><i className="fas fa-exclamation-triangle me-2"></i>Security:</h6>
                <p className="mb-0">
                  Never share your SMTP credentials. Use app-specific passwords when possible.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
