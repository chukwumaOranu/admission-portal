'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useSettings } from '@/hooks/useRedux';

const SYSTEM_SETTINGS_DEFAULTS = {
  maintenance_mode: false,
  debug_mode: false,
  log_level: 'info',
  session_timeout: 3600,
  max_login_attempts: 5,
  password_min_length: 8,
  require_email_verification: true,
  auto_backup: true,
  backup_frequency: 'daily',
  backup_retention_days: 30,
  cache_enabled: true,
  cache_ttl: 300,
  rate_limiting: true,
  rate_limit_requests: 100,
  rate_limit_window: 900
};

export default function SystemSettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  
  // Redux state
  const {
    systemSettings: reduxSystemSettings,
    loading,
    error: reduxError,
    fetchSystemSettings,
    updateSystemSettings,
    resetSystemSettings
  } = useSettings();
  
  const [systemOverrides, setSystemOverrides] = useState({});
  const canReadSettings = hasPermission('settings.read');
  const systemSettings = useMemo(
    () => ({
      ...SYSTEM_SETTINGS_DEFAULTS,
      ...(reduxSystemSettings || {}),
      ...systemOverrides
    }),
    [reduxSystemSettings, systemOverrides]
  );

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken && canReadSettings) {
      fetchSystemSettings();
    }
  }, [status, session?.user?.id, session?.accessToken, canReadSettings, fetchSystemSettings]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      await updateSystemSettings(systemSettings);
      await fetchSystemSettings();
      setSystemOverrides({});
      alert('System settings updated successfully!');
    } catch (err) {
      console.error('Error updating system settings:', err);
      alert('Failed to update system settings');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSystemOverrides(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const handleResetSettings = async () => {
    if (window.confirm('Are you sure you want to reset all system settings to default values?')) {
      try {
        await resetSystemSettings();
        await fetchSystemSettings();
        setSystemOverrides({});
        alert('System settings reset to defaults!');
      } catch (err) {
        console.error('Error resetting system settings:', err);
        alert('Failed to reset system settings');
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
        <p>You don&apos;t have permission to access system settings.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-server text-primary-custom me-2"></i>
            System Settings
          </h2>
          <p className="text-muted mb-0">Configure system-wide settings and preferences</p>
        </div>
        <Link href="/admin/dashboard/settings" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to Settings
        </Link>
      </div>

      <div className="row">
        {/* System Settings Form */}
        <div className="col-lg-8">
          <form onSubmit={handleUpdateSettings}>
            {/* General Settings */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-cog me-2"></i>
                  General Settings
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="maintenance_mode"
                        checked={systemSettings.maintenance_mode}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Maintenance Mode
                      </label>
                    </div>
                    <small className="form-text text-muted">
                      Enable to put the system in maintenance mode
                    </small>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="debug_mode"
                        checked={systemSettings.debug_mode}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Debug Mode
                      </label>
                    </div>
                    <small className="form-text text-muted">
                      Enable for detailed error logging
                    </small>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Log Level</label>
                    <select
                      className="form-select"
                      name="log_level"
                      value={systemSettings.log_level}
                      onChange={handleInputChange}
                    >
                      <option value="error">Error</option>
                      <option value="warn">Warning</option>
                      <option value="info">Info</option>
                      <option value="debug">Debug</option>
                    </select>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Session Timeout (seconds)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="session_timeout"
                      value={systemSettings.session_timeout}
                      onChange={handleInputChange}
                      min="300"
                      max="86400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-warning text-dark">
                <h5 className="card-title mb-0">
                  <i className="fas fa-shield-alt me-2"></i>
                  Security Settings
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
                      value={systemSettings.max_login_attempts}
                      onChange={handleInputChange}
                      min="3"
                      max="10"
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Password Min Length</label>
                    <input
                      type="number"
                      className="form-control"
                      name="password_min_length"
                      value={systemSettings.password_min_length}
                      onChange={handleInputChange}
                      min="6"
                      max="20"
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="require_email_verification"
                        checked={systemSettings.require_email_verification}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Require Email Verification
                      </label>
                    </div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="rate_limiting"
                        checked={systemSettings.rate_limiting}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Enable Rate Limiting
                      </label>
                    </div>
                  </div>
                </div>

                {systemSettings.rate_limiting && (
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Rate Limit Requests</label>
                      <input
                        type="number"
                        className="form-control"
                        name="rate_limit_requests"
                        value={systemSettings.rate_limit_requests}
                        onChange={handleInputChange}
                        min="10"
                        max="1000"
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Rate Limit Window (seconds)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="rate_limit_window"
                        value={systemSettings.rate_limit_window}
                        onChange={handleInputChange}
                        min="60"
                        max="3600"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Backup Settings */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-success text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-database me-2"></i>
                  Backup Settings
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="auto_backup"
                        checked={systemSettings.auto_backup}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Enable Auto Backup
                      </label>
                    </div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Backup Frequency</label>
                    <select
                      className="form-select"
                      name="backup_frequency"
                      value={systemSettings.backup_frequency}
                      onChange={handleInputChange}
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Backup Retention (days)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="backup_retention_days"
                      value={systemSettings.backup_retention_days}
                      onChange={handleInputChange}
                      min="7"
                      max="365"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Settings */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-info text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-tachometer-alt me-2"></i>
                  Performance Settings
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="cache_enabled"
                        checked={systemSettings.cache_enabled}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label">
                        Enable Caching
                      </label>
                    </div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Cache TTL (seconds)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="cache_ttl"
                      value={systemSettings.cache_ttl}
                      onChange={handleInputChange}
                      min="60"
                      max="3600"
                    />
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
                System Information
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <h6><i className="fas fa-lightbulb me-2"></i>Tips:</h6>
                <ul className="mb-0">
                  <li>Enable maintenance mode for updates</li>
                  <li>Set appropriate session timeouts</li>
                  <li>Configure regular backups</li>
                  <li>Monitor rate limiting settings</li>
                </ul>
              </div>
              
              <div className="alert alert-warning">
                <h6><i className="fas fa-exclamation-triangle me-2"></i>Warning:</h6>
                <p className="mb-0">
                  Changes to system settings can affect the entire application. Test changes in a development environment first.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
