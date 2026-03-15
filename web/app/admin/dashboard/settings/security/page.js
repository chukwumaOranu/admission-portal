'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useSettings } from '@/hooks/useRedux';

const SECURITY_SETTINGS_DEFAULTS = {
  password_policy_enabled: true,
  password_min_length: 8,
  password_require_uppercase: true,
  password_require_lowercase: true,
  password_require_numbers: true,
  password_require_symbols: false,
  password_expiry_days: 90,
  max_login_attempts: 5,
  lockout_duration_minutes: 30,
  session_timeout_minutes: 60,
  two_factor_enabled: false,
  two_factor_method: 'email',
  ip_whitelist_enabled: false,
  ip_whitelist: [],
  ip_blacklist_enabled: false,
  ip_blacklist: [],
  audit_log_enabled: true,
  audit_log_retention_days: 365,
  ssl_enforced: true,
  csrf_protection_enabled: true,
  xss_protection_enabled: true,
  custom_settings: null
};

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  
  // Redux state
  const {
    securitySettings: reduxSecuritySettings,
    loading,
    error: reduxError,
    fetchSecuritySettings,
    updateSecuritySettings,
    resetSecuritySettings
  } = useSettings();
  
  const [securityOverrides, setSecurityOverrides] = useState({});
  const [newIpAddress, setNewIpAddress] = useState('');
  const canReadSettings = hasPermission('settings.read');
  const securitySettings = useMemo(
    () => ({
      ...SECURITY_SETTINGS_DEFAULTS,
      ...(reduxSecuritySettings || {}),
      ...securityOverrides
    }),
    [reduxSecuritySettings, securityOverrides]
  );

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken && canReadSettings) {
      fetchSecuritySettings();
    }
  }, [status, session?.user?.id, session?.accessToken, canReadSettings, fetchSecuritySettings]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      await updateSecuritySettings(securitySettings);
      await fetchSecuritySettings();
      setSecurityOverrides({});
      alert('Security settings updated successfully!');
    } catch (err) {
      console.error('Error updating security settings:', err);
      alert('Failed to update security settings');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecurityOverrides(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const handleAddIpAddress = () => {
    if (newIpAddress && !securitySettings.ip_whitelist.includes(newIpAddress)) {
      setSecurityOverrides(prev => ({
        ...prev,
        ip_whitelist: [...(securitySettings.ip_whitelist || []), newIpAddress]
      }));
      setNewIpAddress('');
    }
  };

  const handleRemoveIpAddress = (ipToRemove) => {
    setSecurityOverrides(prev => ({
      ...prev,
      ip_whitelist: (securitySettings.ip_whitelist || []).filter(ip => ip !== ipToRemove)
    }));
  };

  const handleResetSettings = async () => {
    if (window.confirm('Are you sure you want to reset all security settings to default values?')) {
      try {
        await resetSecuritySettings();
        await fetchSecuritySettings();
        setSecurityOverrides({});
        alert('Security settings reset to defaults!');
      } catch (err) {
        console.error('Error resetting security settings:', err);
        alert('Failed to reset security settings');
      }
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
        <p>You don&apos;t have permission to access security settings.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-shield-alt text-primary-custom me-2"></i>
            Security Settings
          </h2>
          <p className="text-muted mb-0">Configure security policies and access controls</p>
        </div>
        <Link href="/admin/dashboard/settings" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to Settings
        </Link>
      </div>

      <div className="row">
        {/* Security Settings Form */}
        <div className="col-lg-8">
          <form onSubmit={handleUpdateSettings}>
            {/* Password Policy */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-danger text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-key me-2"></i>
                  Password Policy
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Minimum Length</label>
                    <input
                      type="number"
                      className="form-control"
                      name="password_min_length"
                      value={securitySettings.password_min_length}
                      onChange={handleInputChange}
                      min="6"
                      max="20"
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Max Age (days)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="password_expiry_days"
                      value={securitySettings.password_expiry_days}
                      onChange={handleInputChange}
                      min="30"
                      max="365"
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="password_require_uppercase"
                        checked={securitySettings.password_require_uppercase}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Require Uppercase
                      </label>
                    </div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="password_require_lowercase"
                        checked={securitySettings.password_require_lowercase}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Require Lowercase
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
                        name="password_require_numbers"
                        checked={securitySettings.password_require_numbers}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Require Numbers
                      </label>
                    </div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="password_require_symbols"
                        checked={securitySettings.password_require_symbols}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Require Symbols
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Login Security */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-info text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Login Security
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Max Login Attempts</label>
                    <input
                      type="number"
                      className="form-control"
                      name="max_login_attempts"
                      value={securitySettings.max_login_attempts}
                      onChange={handleInputChange}
                      min="3"
                      max="10"
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Lockout Duration (minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="lockout_duration_minutes"
                      value={securitySettings.lockout_duration_minutes}
                      onChange={handleInputChange}
                      min="5"
                      max="60"
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="session_timeout_minutes"
                      value={securitySettings.session_timeout_minutes}
                      onChange={handleInputChange}
                      min="5"
                      max="480"
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="two_factor_enabled"
                        checked={securitySettings.two_factor_enabled}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Enable Two-Factor Authentication
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="ip_whitelist_enabled"
                      checked={securitySettings.ip_whitelist_enabled}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label">
                      Enable IP Whitelist
                    </label>
                  </div>
                </div>

                {securitySettings.ip_whitelist_enabled && (
                  <div className="mb-3">
                    <label className="form-label">IP Whitelist</label>
                    <div className="input-group mb-2">
                      <input
                        type="text"
                        className="form-control"
                        value={newIpAddress}
                        onChange={(e) => setNewIpAddress(e.target.value)}
                        placeholder="192.168.1.1"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={handleAddIpAddress}
                      >
                        Add IP
                      </button>
                    </div>
                    
                    {securitySettings.ip_whitelist.length > 0 && (
                      <div className="mt-2">
                        {securitySettings.ip_whitelist.map((ip, index) => (
                          <span key={index} className="badge bg-primary me-2 mb-1">
                            {ip}
                            <button
                              type="button"
                              className="btn-close btn-close-white ms-2"
                              onClick={() => handleRemoveIpAddress(ip)}
                              style={{ fontSize: '0.7em' }}
                            ></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Security Features */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-success text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-shield-alt me-2"></i>
                  Security Features
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="ssl_enforced"
                        checked={securitySettings.ssl_enforced}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Enforce SSL/HTTPS
                      </label>
                    </div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="csrf_protection_enabled"
                        checked={securitySettings.csrf_protection_enabled}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        CSRF Protection
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
                        name="xss_protection_enabled"
                        checked={securitySettings.xss_protection_enabled}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        XSS Protection
                      </label>
                    </div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="audit_log_enabled"
                        checked={securitySettings.audit_log_enabled}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Enable Audit Logging
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Audit Log Retention (days)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="audit_log_retention_days"
                    value={securitySettings.audit_log_retention_days}
                    onChange={handleInputChange}
                    min="30"
                    max="3650"
                  />
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
              
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={handleResetSettings}
                disabled={loading || !hasPermission('settings.update')}
              >
                <i className="fas fa-undo me-2"></i>
                Reset to Defaults
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
                Security Guidelines
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-danger">
                <h6><i className="fas fa-exclamation-triangle me-2"></i>Critical:</h6>
                <ul className="mb-0">
                  <li>Enable strong password policies</li>
                  <li>Set appropriate session timeouts</li>
                  <li>Enable audit logging</li>
                  <li>Use SSL/HTTPS</li>
                </ul>
              </div>
              
              <div className="alert alert-warning">
                <h6><i className="fas fa-shield-alt me-2"></i>Best Practices:</h6>
                <ul className="mb-0">
                  <li>Enable two-factor authentication</li>
                  <li>Use IP whitelisting for admin access</li>
                  <li>Regular security audits</li>
                  <li>Keep logs for compliance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
