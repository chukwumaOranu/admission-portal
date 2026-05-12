'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useSettings } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

const DEFAULTS = {
  maintenance_mode: false, debug_mode: false, log_level: 'info',
  session_timeout: 3600, max_login_attempts: 5, password_min_length: 8,
  require_email_verification: true, auto_backup: true, backup_frequency: 'daily',
  backup_retention_days: 30, cache_enabled: true, cache_ttl: 300,
  rate_limiting: true, rate_limit_requests: 100, rate_limit_window: 900,
};

const Toggle = ({ label, name, checked, onChange, warn }) => (
  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f0f4f8', cursor: 'pointer', fontSize: '0.875rem', color: warn && checked ? '#dc2626' : '#374151' }}>
    <span>{label}</span>
    <span
      onClick={() => onChange({ target: { name, type: 'checkbox', checked: !checked } })}
      style={{ width: 40, height: 22, borderRadius: 11, background: checked ? (warn ? '#dc2626' : '#059669') : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
    >
      <span style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </span>
  </label>
);

export default function SystemSettingsPage() {
  const { data: session, status } = useSession();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const { systemSettings: reduxSettings, loading, error, fetchSystemSettings, updateSystemSettings, resetSystemSettings } = useSettings();

  const [overrides, setOverrides] = useState({});
  const [notice, setNotice]       = useState('');
  const loadedRef = useRef(false);

  const canRead   = hasPermission('settings.read');
  const canUpdate = hasPermission('settings.update');

  const settings = useMemo(() => ({ ...DEFAULTS, ...(reduxSettings || {}), ...overrides }), [reduxSettings, overrides]);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current && canRead) {
      loadedRef.current = true; fetchSystemSettings();
    }
  }, [status, session?.user?.id, canRead, fetchSystemSettings]);

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setOverrides(p => ({ ...p, [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { updateSystemSettings(settings); setOverrides({}); setNotice('System settings updated.'); }
    catch { alert('Failed to update system settings'); }
  };

  const handleReset = () => {
    if (!window.confirm('Reset all system settings to defaults?')) return;
    try { resetSystemSettings(); setOverrides({}); setNotice('Settings reset to defaults.'); }
    catch { alert('Failed to reset settings'); }
  };

  if (status === 'loading' || permissionsLoading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!canRead) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to access system settings.</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#f1f5f9', color: '#64748b' }}><i className="fas fa-server" /></span>
            System Settings
          </h1>
          <p className={s.pageSub}>Configure system-wide behaviour and performance</p>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}</div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}<button onClick={() => setNotice('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#059669' }}><i className="fas fa-times" /></button></div>}

      {settings.maintenance_mode && (
        <div className={`${s.alert} ${s.alertDanger}`}>
          <i className="fas fa-exclamation-triangle" /><strong>Maintenance mode is ON.</strong> The portal is currently inaccessible to users.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* General */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}><i className="fas fa-cog" style={{ color: '#64748b' }} />General</span>
              </div>
              <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <Toggle label="Maintenance Mode" name="maintenance_mode" checked={settings.maintenance_mode} onChange={set} warn />
                <Toggle label="Debug Mode" name="debug_mode" checked={settings.debug_mode} onChange={set} warn />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label className={s.formLabel}>Log Level</label>
                    <select className={s.formSelect} name="log_level" value={settings.log_level} onChange={set}>
                      <option value="error">Error</option>
                      <option value="warn">Warning</option>
                      <option value="info">Info</option>
                      <option value="debug">Debug</option>
                    </select>
                  </div>
                  <div>
                    <label className={s.formLabel}>Session Timeout (sec)</label>
                    <input className={s.formInput} type="number" name="session_timeout" value={settings.session_timeout} onChange={set} min={300} max={86400} />
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}><i className="fas fa-shield-alt" style={{ color: '#d97706' }} />Security</span>
              </div>
              <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label className={s.formLabel}>Max Login Attempts</label>
                    <input className={s.formInput} type="number" name="max_login_attempts" value={settings.max_login_attempts} onChange={set} min={3} max={10} />
                  </div>
                  <div>
                    <label className={s.formLabel}>Password Min Length</label>
                    <input className={s.formInput} type="number" name="password_min_length" value={settings.password_min_length} onChange={set} min={6} max={20} />
                  </div>
                </div>
                <Toggle label="Require Email Verification" name="require_email_verification" checked={settings.require_email_verification} onChange={set} />
                <Toggle label="Enable Rate Limiting" name="rate_limiting" checked={settings.rate_limiting} onChange={set} />
                {settings.rate_limiting && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                    <div>
                      <label className={s.formLabel}>Requests per window</label>
                      <input className={s.formInput} type="number" name="rate_limit_requests" value={settings.rate_limit_requests} onChange={set} min={10} max={1000} />
                    </div>
                    <div>
                      <label className={s.formLabel}>Window (sec)</label>
                      <input className={s.formInput} type="number" name="rate_limit_window" value={settings.rate_limit_window} onChange={set} min={60} max={3600} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Backup */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}><i className="fas fa-database" style={{ color: '#059669' }} />Backup</span>
              </div>
              <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <Toggle label="Enable Auto Backup" name="auto_backup" checked={settings.auto_backup} onChange={set} />
                {settings.auto_backup && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                    <div>
                      <label className={s.formLabel}>Frequency</label>
                      <select className={s.formSelect} name="backup_frequency" value={settings.backup_frequency} onChange={set}>
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className={s.formLabel}>Retention (days)</label>
                      <input className={s.formInput} type="number" name="backup_retention_days" value={settings.backup_retention_days} onChange={set} min={7} max={365} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Performance */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}><i className="fas fa-tachometer-alt" style={{ color: '#0891b2' }} />Performance</span>
              </div>
              <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <Toggle label="Enable Caching" name="cache_enabled" checked={settings.cache_enabled} onChange={set} />
                {settings.cache_enabled && (
                  <div>
                    <label className={s.formLabel}>Cache TTL (sec)</label>
                    <input className={s.formInput} type="number" name="cache_ttl" value={settings.cache_ttl} onChange={set} min={60} max={3600} style={{ maxWidth: 200 }} />
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={loading || !canUpdate}>
                {loading ? <><span className="spinner-border spinner-border-sm" />Saving…</> : <><i className="fas fa-save" />Save Settings</>}
              </button>
              <button type="button" onClick={handleReset} className={`${s.btn} ${s.btnDanger}`} disabled={loading || !canUpdate}>
                <i className="fas fa-undo" />Reset Defaults
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}><i className="fas fa-lightbulb" style={{ color: '#d97706' }} />Tips</span>
              </div>
              <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
                {['Enable maintenance mode for updates', 'Set appropriate session timeouts', 'Configure regular backups', 'Monitor rate limiting settings'].map(tip => (
                  <div key={tip} style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', color: '#374151', padding: '0.25rem 0', borderBottom: '1px solid #f0f4f8' }}>
                    <i className="fas fa-check" style={{ color: '#059669', marginTop: 3, flexShrink: 0 }} />
                    {tip}
                  </div>
                ))}
              </div>
            </div>

            <div className={`${s.alert} ${s.alertDanger}`} style={{ flexDirection: 'column', gap: '0.25rem' }}>
              <strong><i className="fas fa-exclamation-triangle" /> Warning</strong>
              <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5 }}>
                System setting changes affect the entire application. Test in development first.
              </p>
            </div>
          </div>
        </div>
      </form>

      <style jsx>{`
        @media (max-width: 991px) {
          div[style*="grid-template-columns: 1fr 280px"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
