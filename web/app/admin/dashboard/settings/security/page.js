'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useSettings } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

const DEFAULTS = {
  password_policy_enabled: true, password_min_length: 8,
  password_require_uppercase: true, password_require_lowercase: true,
  password_require_numbers: true, password_require_symbols: false,
  password_expiry_days: 90, max_login_attempts: 5,
  lockout_duration_minutes: 30, session_timeout_minutes: 60,
  two_factor_enabled: false, two_factor_method: 'email',
  ip_whitelist_enabled: false, ip_whitelist: [],
  ip_blacklist_enabled: false, ip_blacklist: [],
  audit_log_enabled: true, audit_log_retention_days: 365,
  ssl_enforced: true, csrf_protection_enabled: true, xss_protection_enabled: true,
};

const Toggle = ({ label, name, checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f0f4f8', cursor: 'pointer', fontSize: '0.875rem', color: '#374151' }}>
    <span>{label}</span>
    <span
      onClick={() => onChange({ target: { name, type: 'checkbox', checked: !checked } })}
      style={{ width: 40, height: 22, borderRadius: 11, background: checked ? '#059669' : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
    >
      <span style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </span>
  </label>
);

export default function SecuritySettingsPage() {
  const { data: session, status } = useSession();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const { securitySettings: reduxSettings, loading, error, fetchSecuritySettings, updateSecuritySettings, resetSecuritySettings } = useSettings();

  const [overrides, setOverrides] = useState({});
  const [newIp, setNewIp]         = useState('');
  const [notice, setNotice]       = useState('');
  const loadedRef = useRef(false);

  const canRead   = hasPermission('settings.read');
  const canUpdate = hasPermission('settings.update');

  const settings = useMemo(() => ({ ...DEFAULTS, ...(reduxSettings || {}), ...overrides }), [reduxSettings, overrides]);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current && canRead) {
      loadedRef.current = true; fetchSecuritySettings();
    }
  }, [status, session?.user?.id, canRead, fetchSecuritySettings]);

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setOverrides(p => ({ ...p, [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      updateSecuritySettings(settings);
      setOverrides({});
      setNotice('Security settings updated successfully.');
    } catch { alert('Failed to update security settings'); }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all security settings to defaults?')) return;
    try {
      resetSecuritySettings();
      setOverrides({});
      setNotice('Security settings reset to defaults.');
    } catch { alert('Failed to reset settings'); }
  };

  const addIp = () => {
    if (newIp && !(settings.ip_whitelist || []).includes(newIp)) {
      setOverrides(p => ({ ...p, ip_whitelist: [...(settings.ip_whitelist || []), newIp] }));
      setNewIp('');
    }
  };

  const removeIp = (ip) => setOverrides(p => ({ ...p, ip_whitelist: (settings.ip_whitelist || []).filter(x => x !== ip) }));

  if (status === 'loading' || permissionsLoading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!canRead) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to access security settings.</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#fef2f2', color: '#dc2626' }}><i className="fas fa-shield-alt" /></span>
            Security Settings
          </h1>
          <p className={s.pageSub}>Configure security policies and access controls</p>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}</div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}<button onClick={() => setNotice('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#059669' }}><i className="fas fa-times" /></button></div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>

          {/* Main column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Password policy */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}><i className="fas fa-key" style={{ color: '#dc2626' }} />Password Policy</span>
              </div>
              <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label className={s.formLabel}>Minimum Length</label>
                    <input className={s.formInput} type="number" name="password_min_length" value={settings.password_min_length} onChange={set} min={6} max={20} />
                  </div>
                  <div>
                    <label className={s.formLabel}>Max Age (days)</label>
                    <input className={s.formInput} type="number" name="password_expiry_days" value={settings.password_expiry_days} onChange={set} min={30} max={365} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem' }}>
                  <Toggle label="Require Uppercase" name="password_require_uppercase" checked={settings.password_require_uppercase} onChange={set} />
                  <Toggle label="Require Lowercase" name="password_require_lowercase" checked={settings.password_require_lowercase} onChange={set} />
                  <Toggle label="Require Numbers" name="password_require_numbers" checked={settings.password_require_numbers} onChange={set} />
                  <Toggle label="Require Symbols" name="password_require_symbols" checked={settings.password_require_symbols} onChange={set} />
                </div>
              </div>
            </div>

            {/* Login security */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}><i className="fas fa-sign-in-alt" style={{ color: '#0891b2' }} />Login Security</span>
              </div>
              <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label className={s.formLabel}>Max Attempts</label>
                    <input className={s.formInput} type="number" name="max_login_attempts" value={settings.max_login_attempts} onChange={set} min={3} max={10} />
                  </div>
                  <div>
                    <label className={s.formLabel}>Lockout (min)</label>
                    <input className={s.formInput} type="number" name="lockout_duration_minutes" value={settings.lockout_duration_minutes} onChange={set} min={5} max={60} />
                  </div>
                  <div>
                    <label className={s.formLabel}>Session Timeout (min)</label>
                    <input className={s.formInput} type="number" name="session_timeout_minutes" value={settings.session_timeout_minutes} onChange={set} min={5} max={480} />
                  </div>
                </div>
                <Toggle label="Enable Two-Factor Authentication" name="two_factor_enabled" checked={settings.two_factor_enabled} onChange={set} />
                <Toggle label="Enable IP Whitelist" name="ip_whitelist_enabled" checked={settings.ip_whitelist_enabled} onChange={set} />
                {settings.ip_whitelist_enabled && (
                  <div>
                    <label className={s.formLabel}>IP Whitelist</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input className={s.formInput} type="text" value={newIp} onChange={e => setNewIp(e.target.value)} placeholder="192.168.1.1" style={{ flex: 1 }} />
                      <button type="button" onClick={addIp} className={`${s.btn} ${s.btnOutline}`}><i className="fas fa-plus" />Add</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {(settings.ip_whitelist || []).map(ip => (
                        <span key={ip} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#eff6ff', color: '#2563eb', borderRadius: 999, padding: '0.2rem 0.6rem', fontSize: '0.78rem', fontWeight: 600 }}>
                          {ip}
                          <button type="button" onClick={() => removeIp(ip)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', padding: 0, lineHeight: 1 }}><i className="fas fa-times" style={{ fontSize: '0.65rem' }} /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Security features */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}><i className="fas fa-shield-alt" style={{ color: '#059669' }} />Security Features</span>
              </div>
              <div className={s.cardBody} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem' }}>
                <Toggle label="Enforce SSL/HTTPS" name="ssl_enforced" checked={settings.ssl_enforced} onChange={set} />
                <Toggle label="CSRF Protection" name="csrf_protection_enabled" checked={settings.csrf_protection_enabled} onChange={set} />
                <Toggle label="XSS Protection" name="xss_protection_enabled" checked={settings.xss_protection_enabled} onChange={set} />
                <Toggle label="Audit Logging" name="audit_log_enabled" checked={settings.audit_log_enabled} onChange={set} />
                {settings.audit_log_enabled && (
                  <div style={{ gridColumn: '1/-1', marginTop: '0.5rem' }}>
                    <label className={s.formLabel}>Audit Log Retention (days)</label>
                    <input className={s.formInput} type="number" name="audit_log_retention_days" value={settings.audit_log_retention_days} onChange={set} min={30} max={3650} style={{ maxWidth: 200 }} />
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

          {/* Help sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}><i className="fas fa-exclamation-triangle" style={{ color: '#dc2626' }} />Critical</span>
              </div>
              <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
                {['Enable strong password policies', 'Set appropriate session timeouts', 'Enable audit logging', 'Always use SSL/HTTPS'].map(tip => (
                  <div key={tip} style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', color: '#374151' }}>
                    <i className="fas fa-check" style={{ color: '#dc2626', marginTop: 3, flexShrink: 0 }} />
                    {tip}
                  </div>
                ))}
              </div>
            </div>

            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}><i className="fas fa-lightbulb" style={{ color: '#d97706' }} />Best Practices</span>
              </div>
              <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
                {['Enable two-factor authentication', 'Use IP whitelisting for admin access', 'Regular security audits', 'Keep logs for compliance'].map(tip => (
                  <div key={tip} style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', color: '#374151' }}>
                    <i className="fas fa-check" style={{ color: '#d97706', marginTop: 3, flexShrink: 0 }} />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>

      <style jsx>{`
        @media (max-width: 991px) {
          div[style*="grid-template-columns: 1fr 300px"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 1fr 1fr 1fr"] {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
