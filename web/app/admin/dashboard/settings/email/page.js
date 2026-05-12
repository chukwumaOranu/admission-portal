'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useSettings } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

const DEFAULTS = {
  smtp_host: '', smtp_port: 587, smtp_username: '', smtp_password: '', smtp_secure: false,
  from_email: '', from_name: '', reply_to: '',
  email_enabled: true, email_verification_enabled: true, password_reset_enabled: true,
  notification_enabled: true, welcome_email_enabled: true,
  application_notifications_enabled: true, payment_notifications_enabled: true,
};

const Toggle = ({ label, name, checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f0f4f8', cursor: 'pointer', fontSize: '0.875rem', color: '#374151' }}>
    <span>{label}</span>
    <span
      onClick={() => onChange({ target: { name, type: 'checkbox', checked: !checked } })}
      style={{
        width: 40, height: 22, borderRadius: 11, background: checked ? '#059669' : '#d1d5db',
        position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16,
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </span>
  </label>
);

export default function EmailSettingsPage() {
  const { data: session, status } = useSession();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const { emailSettings: reduxSettings, loading, error, fetchEmailSettings, updateEmailSettings, testEmailSettings } = useSettings();

  const [overrides, setOverrides]   = useState({});
  const [testEmail, setTestEmail]   = useState('');
  const [notice, setNotice]         = useState('');
  const loadedRef = useRef(false);

  const canRead   = hasPermission('settings.read');
  const canUpdate = hasPermission('settings.update');

  const settings = useMemo(() => ({ ...DEFAULTS, ...(reduxSettings || {}), ...overrides }), [reduxSettings, overrides]);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current && canRead) {
      loadedRef.current = true; fetchEmailSettings();
    }
  }, [status, session?.user?.id, canRead, fetchEmailSettings]);

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setOverrides(p => ({ ...p, [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      updateEmailSettings(settings);
      setOverrides({});
      setNotice('Email settings updated successfully.');
    } catch { alert('Failed to update email settings'); }
  };

  const handleTestEmail = async () => {
    if (!testEmail) { alert('Enter a test email address.'); return; }
    try {
      testEmailSettings({ email: testEmail });
      setNotice('Test email sent!');
    } catch { alert('Failed to send test email'); }
  };

  if (status === 'loading' || permissionsLoading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!canRead) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to access email settings.</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-envelope" /></span>
            Email Settings
          </h1>
          <p className={s.pageSub}>Configure SMTP server and notification preferences</p>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}</div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}<button onClick={() => setNotice('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#059669' }}><i className="fas fa-times" /></button></div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

          {/* Main column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* SMTP */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}><i className="fas fa-server" style={{ color: '#2563eb' }} />SMTP Configuration</span>
              </div>
              <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '0.875rem' }}>
                  <div>
                    <label className={s.formLabel}>SMTP Host</label>
                    <input className={s.formInput} type="text" name="smtp_host" value={settings.smtp_host} onChange={set} placeholder="smtp.gmail.com" />
                  </div>
                  <div>
                    <label className={s.formLabel}>Port</label>
                    <input className={s.formInput} type="number" name="smtp_port" value={settings.smtp_port} onChange={set} min={1} max={65535} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label className={s.formLabel}>Username</label>
                    <input className={s.formInput} type="text" name="smtp_username" value={settings.smtp_username} onChange={set} placeholder="your@email.com" />
                  </div>
                  <div>
                    <label className={s.formLabel}>Password</label>
                    <input className={s.formInput} type="password" name="smtp_password" value={settings.smtp_password} onChange={set} placeholder="App password" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <Toggle label="Use SSL/TLS" name="smtp_secure" checked={settings.smtp_secure} onChange={set} />
                  <Toggle label="Enable Email Service" name="email_enabled" checked={settings.email_enabled} onChange={set} />
                </div>
              </div>
            </div>

            {/* From details */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}><i className="fas fa-envelope-open-text" style={{ color: '#059669' }} />Sender Details</span>
              </div>
              <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label className={s.formLabel}>From Email</label>
                    <input className={s.formInput} type="email" name="from_email" value={settings.from_email} onChange={set} placeholder="noreply@school.com" />
                  </div>
                  <div>
                    <label className={s.formLabel}>From Name</label>
                    <input className={s.formInput} type="text" name="from_name" value={settings.from_name} onChange={set} placeholder="School Admissions" />
                  </div>
                </div>
                <div>
                  <label className={s.formLabel}>Reply-To Email</label>
                  <input className={s.formInput} type="email" name="reply_to" value={settings.reply_to} onChange={set} placeholder="support@school.com" />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}><i className="fas fa-bell" style={{ color: '#d97706' }} />Email Notifications</span>
              </div>
              <div className={s.cardBody} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem' }}>
                <Toggle label="Email Verification" name="email_verification_enabled" checked={settings.email_verification_enabled} onChange={set} />
                <Toggle label="Password Reset" name="password_reset_enabled" checked={settings.password_reset_enabled} onChange={set} />
                <Toggle label="Welcome Emails" name="welcome_email_enabled" checked={settings.welcome_email_enabled} onChange={set} />
                <Toggle label="General Notifications" name="notification_enabled" checked={settings.notification_enabled} onChange={set} />
                <Toggle label="Application Updates" name="application_notifications_enabled" checked={settings.application_notifications_enabled} onChange={set} />
                <Toggle label="Payment Notifications" name="payment_notifications_enabled" checked={settings.payment_notifications_enabled} onChange={set} />
              </div>
            </div>

            {/* Test */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}><i className="fas fa-paper-plane" style={{ color: '#0891b2' }} />Test Configuration</span>
              </div>
              <div className={s.cardBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <div>
                    <label className={s.formLabel}>Test Email Address</label>
                    <input className={s.formInput} type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@example.com" />
                  </div>
                  <button type="button" className={`${s.btn} ${s.btnOutline}`} onClick={handleTestEmail} disabled={loading || !canUpdate}>
                    <i className="fas fa-paper-plane" />Send Test
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={loading || !canUpdate}>
                {loading ? <><span className="spinner-border spinner-border-sm" />Saving…</> : <><i className="fas fa-save" />Save Settings</>}
              </button>
            </div>
          </div>

          {/* Help sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}><i className="fas fa-lightbulb" style={{ color: '#d97706' }} />SMTP Tips</span>
              </div>
              <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
                {[
                  ['Gmail', 'smtp.gmail.com : 587'],
                  ['Outlook', 'smtp-mail.outlook.com : 587'],
                  ['Yahoo', 'smtp.mail.yahoo.com : 587'],
                ].map(([name, val]) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f0f4f8' }}>
                    <span style={{ color: '#6b7280' }}>{name}</span>
                    <span style={{ color: '#1e3a5f', fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
                <p style={{ color: '#9ca3af', margin: '0.5rem 0 0', lineHeight: 1.5 }}>
                  Use app-specific passwords for Gmail/Outlook to avoid account lockouts.
                </p>
              </div>
            </div>

            <div className={`${s.alert} ${s.alertDanger}`} style={{ flexDirection: 'column', gap: '0.25rem' }}>
              <strong><i className="fas fa-shield-alt" /> Security</strong>
              <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5 }}>
                Never share SMTP credentials. Always use app-specific passwords when available.
              </p>
            </div>
          </div>
        </div>
      </form>

      <style jsx>{`
        @media (max-width: 991px) {
          div[style*="grid-template-columns: 1fr 320px"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 767px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
