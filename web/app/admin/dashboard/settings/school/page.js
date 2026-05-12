'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSettings } from '@/hooks/useRedux';
import { usePermissions } from '@/hooks/usePermissions';
import { getImageUrl } from '@/utils/imageUtils';
import s from '@/styles/admin-portal.module.css';

const DEFAULTS = {
  school_name: '', school_logo: '', school_favicon: '', school_address: '', school_phone: '',
  school_email: '', school_website: '', school_motto: '', school_mission: '', school_vision: '',
  academic_year: '', application_fee: 0, currency: 'NGN', timezone: 'Africa/Lagos',
  date_format: 'YYYY-MM-DD', time_format: '24h', language: 'en', theme_color: '#1e3a5f',
};

export default function SchoolSettingsPage() {
  const { schoolSettings, loading, error, fetchSchoolSettings, updateSchoolSettings, uploadSchoolLogo, uploadSchoolFavicon, clearError } = useSettings();
  const { hasPermission } = usePermissions();

  const [showEdit, setShowEdit]           = useState(false);
  const [formData, setFormData]           = useState(DEFAULTS);
  const [logoFile, setLogoFile]           = useState(null);
  const [faviconFile, setFaviconFile]     = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  useEffect(() => { fetchSchoolSettings(); }, [fetchSchoolSettings]);

  useEffect(() => {
    if (schoolSettings) {
      setFormData({ ...DEFAULTS, ...schoolSettings });
    } else if (error?.message?.includes('not found')) {
      setFormData({ ...DEFAULTS, school_name: 'Your School Name', academic_year: new Date().getFullYear().toString() });
    }
  }, [schoolSettings, error]);

  const set = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { updateSchoolSettings(formData); setShowEdit(false); }
    catch { /* error shown from redux */ }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) { alert('Select a logo file first.'); return; }
    setUploadingLogo(true);
    try {
      const fd = new FormData(); fd.append('file', logoFile);
      uploadSchoolLogo(fd); setLogoFile(null);
      document.getElementById('logoFile').value = '';
    } catch { alert('Failed to upload logo.'); }
    finally { setUploadingLogo(false); }
  };

  const handleFaviconUpload = async () => {
    if (!faviconFile) { alert('Select a favicon file first.'); return; }
    setUploadingFavicon(true);
    try {
      const fd = new FormData(); fd.append('favicon', faviconFile);
      uploadSchoolFavicon(fd); setFaviconFile(null);
      document.getElementById('faviconFile').value = '';
    } catch { alert('Failed to upload favicon.'); }
    finally { setUploadingFavicon(false); }
  };

  const canUpdate = hasPermission('school_settings', 'update');

  if (!hasPermission('school_settings', 'read')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to view school settings.</div>
      </div>
    );
  }

  const InfoRow = ({ label, value, href }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f0f4f8', fontSize: '0.875rem' }}>
      <span style={{ color: '#6b7280', fontWeight: 500 }}>{label}</span>
      <span style={{ color: '#1e3a5f', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>
        {href ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>{value}</a> : (value || <span style={{ color: '#d1d5db' }}>Not set</span>)}
      </span>
    </div>
  );

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#f1f5f9', color: '#64748b' }}><i className="fas fa-cog" /></span>
            School Settings
          </h1>
          <p className={s.pageSub}>Configure school information and system preferences</p>
        </div>
        {canUpdate && (
          <div className={s.pageActions}>
            <button onClick={() => setShowEdit(true)} className={`${s.btn} ${s.btnPrimary}`} disabled={loading}>
              <i className="fas fa-edit" />Edit Settings
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className={`${s.alert} ${s.alertDanger}`}>
          <i className="fas fa-exclamation-triangle" />{error}
          <button onClick={clearError} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button>
        </div>
      )}

      {loading ? (
        <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>
      ) : !schoolSettings ? (
        <div className={s.card}>
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#f1f5f9', color: '#64748b' }}><i className="fas fa-cog" /></div>
            <div className={s.emptyTitle}>No Settings Found</div>
            <p className={s.emptySub}>School settings have not been configured yet.</p>
            {canUpdate && <button onClick={() => setShowEdit(true)} className={`${s.btn} ${s.btnPrimary}`}><i className="fas fa-plus" />Configure Now</button>}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

          {/* School Info */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-school" style={{ color: '#1e3a5f' }} />School Information</span>
            </div>
            <div className={s.cardBody}>
              <InfoRow label="School Name" value={schoolSettings.school_name} />
              <InfoRow label="Address" value={schoolSettings.school_address} />
              <InfoRow label="Phone" value={schoolSettings.school_phone} />
              <InfoRow label="Email" value={schoolSettings.school_email} />
              <InfoRow label="Website" value={schoolSettings.school_website} href={schoolSettings.school_website} />
            </div>
          </div>

          {/* Branding */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-palette" style={{ color: '#7c3aed' }} />Branding</span>
            </div>
            <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logo</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {schoolSettings.school_logo ? (
                    <Image src={getImageUrl(schoolSettings.school_logo)} alt="Logo" width={160} height={48} unoptimized style={{ height: 48, width: 'auto', maxWidth: 160, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  ) : (
                    <div style={{ height: 48, width: 160, borderRadius: 8, border: '1px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
                      <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>No logo</span>
                    </div>
                  )}
                  {canUpdate && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <input type="file" id="logoFile" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} className={s.formInput} style={{ fontSize: '0.78rem', padding: '0.25rem 0.5rem' }} />
                      <button className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} onClick={handleLogoUpload} disabled={!logoFile || uploadingLogo}>
                        {uploadingLogo ? <><span className="spinner-border spinner-border-sm" />Uploading…</> : <><i className="fas fa-upload" />Upload Logo</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Favicon</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {schoolSettings.school_favicon ? (
                    <Image src={getImageUrl(schoolSettings.school_favicon)} alt="Favicon" width={32} height={32} unoptimized style={{ borderRadius: 4, border: '1px solid #e5e7eb' }} />
                  ) : (
                    <div style={{ height: 32, width: 32, borderRadius: 4, border: '1px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
                      <i className="fas fa-image" style={{ fontSize: '0.7rem', color: '#9ca3af' }} />
                    </div>
                  )}
                  {canUpdate && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <input type="file" id="faviconFile" accept="image/*" onChange={e => setFaviconFile(e.target.files[0])} className={s.formInput} style={{ fontSize: '0.78rem', padding: '0.25rem 0.5rem' }} />
                      <button className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} onClick={handleFaviconUpload} disabled={!faviconFile || uploadingFavicon}>
                        {uploadingFavicon ? <><span className="spinner-border spinner-border-sm" />Uploading…</> : <><i className="fas fa-upload" />Upload Favicon</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <InfoRow label="Theme Color" value={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: 16, height: 16, borderRadius: 4, background: schoolSettings.theme_color, border: '1px solid #d1d5db', display: 'inline-block' }} />
                  {schoolSettings.theme_color}
                </span>
              } />
            </div>
          </div>

          {/* Vision & Mission */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-star" style={{ color: '#d97706' }} />Vision &amp; Mission</span>
            </div>
            <div className={s.cardBody}>
              <InfoRow label="Motto" value={schoolSettings.school_motto} />
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Mission</div>
                <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}>{schoolSettings.school_mission || <span style={{ color: '#d1d5db' }}>Not set</span>}</p>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Vision</div>
                <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}>{schoolSettings.school_vision || <span style={{ color: '#d1d5db' }}>Not set</span>}</p>
              </div>
            </div>
          </div>

          {/* Academic & System */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-sliders-h" style={{ color: '#0891b2' }} />Academic &amp; System</span>
            </div>
            <div className={s.cardBody}>
              <InfoRow label="Academic Year" value={schoolSettings.academic_year} />
              <InfoRow label="Application Fee" value={schoolSettings.application_fee != null ? `₦${Number(schoolSettings.application_fee).toLocaleString()}` : null} />
              <InfoRow label="Currency" value={schoolSettings.currency} />
              <InfoRow label="Timezone" value={schoolSettings.timezone} />
              <InfoRow label="Date Format" value={schoolSettings.date_format} />
              <InfoRow label="Time Format" value={schoolSettings.time_format} />
              <InfoRow label="Language" value={schoolSettings.language} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className={s.modalOverlay} onClick={() => setShowEdit(false)}>
          <div className={s.modalBox} style={{ maxWidth: 760 }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className={s.modalHead}>
                <span className={s.modalTitle}><i className="fas fa-cog" style={{ color: '#64748b' }} />Edit School Settings</span>
                <button type="button" className={s.modalClose} onClick={() => setShowEdit(false)}><i className="fas fa-times" /></button>
              </div>
              <div className={s.modalBody} style={{ maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>School Information</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label className={s.formLabel}>School Name *</label>
                      <input className={s.formInput} type="text" name="school_name" value={formData.school_name} onChange={set} required />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label className={s.formLabel}>Address</label>
                      <textarea className={s.formInput} name="school_address" rows={2} value={formData.school_address} onChange={set} style={{ resize: 'vertical' }} />
                    </div>
                    <div>
                      <label className={s.formLabel}>Phone</label>
                      <input className={s.formInput} type="tel" name="school_phone" value={formData.school_phone} onChange={set} />
                    </div>
                    <div>
                      <label className={s.formLabel}>Email</label>
                      <input className={s.formInput} type="email" name="school_email" value={formData.school_email} onChange={set} />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label className={s.formLabel}>Website</label>
                      <input className={s.formInput} type="url" name="school_website" value={formData.school_website} onChange={set} />
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Vision &amp; Mission</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div>
                      <label className={s.formLabel}>Motto</label>
                      <input className={s.formInput} type="text" name="school_motto" value={formData.school_motto} onChange={set} />
                    </div>
                    <div>
                      <label className={s.formLabel}>Mission</label>
                      <textarea className={s.formInput} name="school_mission" rows={2} value={formData.school_mission} onChange={set} style={{ resize: 'vertical' }} />
                    </div>
                    <div>
                      <label className={s.formLabel}>Vision</label>
                      <textarea className={s.formInput} name="school_vision" rows={2} value={formData.school_vision} onChange={set} style={{ resize: 'vertical' }} />
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Academic &amp; System</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                    <div>
                      <label className={s.formLabel}>Academic Year</label>
                      <input className={s.formInput} type="text" name="academic_year" placeholder="e.g. 2024/2025" value={formData.academic_year} onChange={set} />
                    </div>
                    <div>
                      <label className={s.formLabel}>Application Fee</label>
                      <input className={s.formInput} type="number" name="application_fee" min={0} step="0.01" value={formData.application_fee} onChange={set} />
                    </div>
                    <div>
                      <label className={s.formLabel}>Currency</label>
                      <select className={s.formSelect} name="currency" value={formData.currency} onChange={set}>
                        <option value="NGN">NGN (Nigerian Naira)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                        <option value="GBP">GBP (British Pound)</option>
                      </select>
                    </div>
                    <div>
                      <label className={s.formLabel}>Timezone</label>
                      <select className={s.formSelect} name="timezone" value={formData.timezone} onChange={set}>
                        <option value="Africa/Lagos">Africa/Lagos</option>
                        <option value="Africa/Abuja">Africa/Abuja</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                    <div>
                      <label className={s.formLabel}>Date Format</label>
                      <select className={s.formSelect} name="date_format" value={formData.date_format} onChange={set}>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      </select>
                    </div>
                    <div>
                      <label className={s.formLabel}>Time Format</label>
                      <select className={s.formSelect} name="time_format" value={formData.time_format} onChange={set}>
                        <option value="24h">24 Hour</option>
                        <option value="12h">12 Hour</option>
                      </select>
                    </div>
                    <div>
                      <label className={s.formLabel}>Language</label>
                      <select className={s.formSelect} name="language" value={formData.language} onChange={set}>
                        <option value="en">English</option>
                        <option value="fr">French</option>
                        <option value="es">Spanish</option>
                      </select>
                    </div>
                    <div>
                      <label className={s.formLabel}>Theme Color</label>
                      <input className={s.formInput} type="color" name="theme_color" value={formData.theme_color} onChange={set} style={{ height: 38, padding: '0.1rem 0.3rem', cursor: 'pointer' }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className={s.modalFoot}>
                <button type="button" onClick={() => setShowEdit(false)} className={`${s.btn} ${s.btnOutline}`}>Cancel</button>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm" />Saving…</> : <><i className="fas fa-save" />Save Settings</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 767px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
