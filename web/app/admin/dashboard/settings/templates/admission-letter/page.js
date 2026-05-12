'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_ENDPOINTS, apiService } from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';
import s from '@/styles/admin-portal.module.css';

const PLACEHOLDERS = [
  '{{reference}}', '{{issued_date}}', '{{student_name}}', '{{first_name}}',
  '{{last_name}}', '{{application_number}}', '{{student_email}}',
  '{{school_name}}', '{{school_address}}', '{{school_phone}}', '{{school_email}}',
];

const SAMPLE_VARS = {
  reference: 'ADM-APP-001122', issued_date: new Date().toLocaleDateString(),
  student_name: 'Jane Doe', first_name: 'Jane', last_name: 'Doe',
  application_number: 'APP20260001', student_email: 'jane@example.com',
  school_name: 'Deepflux Academy', school_address: 'No 1 School Avenue',
  school_phone: '+2348000000000', school_email: 'admissions@school.com',
};

export default function AdmissionLetterTemplatePage() {
  const { hasPermission } = usePermissions();
  const [templates, setTemplates]       = useState([]);
  const [activeTemplate, setActive]     = useState(null);
  const [selectedId, setSelectedId]     = useState(null);
  const [form, setForm]                 = useState({ template_name: 'Admission Letter Template', subject: 'Provisional Admission Letter', text_body: '' });
  const [preview, setPreview]           = useState('');
  const [busy, setBusy]                 = useState(false);
  const [error, setError]               = useState('');
  const [notice, setNotice]             = useState('');

  const canRead     = hasPermission('settings.template.read');
  const canCreate   = hasPermission('settings.template.create');
  const canUpdate   = hasPermission('settings.template.update');
  const canActivate = hasPermission('settings.template.activate');
  const canPreview  = hasPermission('settings.template.preview');

  const load = async () => {
    try {
      const [activeRes, listRes] = await Promise.all([
        apiService.get(API_ENDPOINTS.SETTINGS.TEMPLATES.ACTIVE('admission_letter')),
        apiService.get(`${API_ENDPOINTS.SETTINGS.TEMPLATES.LIST}?template_key=admission_letter`),
      ]);
      const active = activeRes.data || null;
      const all    = listRes.data || [];
      setActive(active); setTemplates(all);
      setSelectedId(active?.id || all?.[0]?.id || null);
      if (active) setForm({ template_name: active.template_name || '', subject: active.subject || '', text_body: active.text_body || '' });
    } catch (e) { setError(e.message || 'Failed to load templates'); }
  };

  useEffect(() => { if (canRead) load(); }, [canRead]);

  const setField = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSaveNew = async () => {
    if (!canCreate) { setError('No permission to create templates'); return; }
    try {
      setBusy(true); setError(''); setNotice('');
      const res = await apiService.post(API_ENDPOINTS.SETTINGS.TEMPLATES.CREATE, { template_key: 'admission_letter', ...form, placeholders_json: PLACEHOLDERS, is_active: true });
      setNotice(`Saved and activated version ${res.data?.version || ''}`.trim());
      await load();
    } catch (e) { setError(e.message || 'Failed to save template'); }
    finally { setBusy(false); }
  };

  const handleUpdate = async () => {
    if (!canUpdate || !selectedId) { setError('Select a version to update'); return; }
    try {
      setBusy(true); setError(''); setNotice('');
      await apiService.put(API_ENDPOINTS.SETTINGS.TEMPLATES.UPDATE(selectedId), { ...form, placeholders_json: PLACEHOLDERS });
      setNotice('Template updated.'); await load();
    } catch (e) { setError(e.message || 'Failed to update template'); }
    finally { setBusy(false); }
  };

  const handleActivate = async (id) => {
    if (!canActivate) { setError('No permission to activate'); return; }
    try {
      setBusy(true); setError(''); setNotice('');
      await apiService.post(API_ENDPOINTS.SETTINGS.TEMPLATES.ACTIVATE(id));
      setNotice('Template activated.'); await load();
    } catch (e) { setError(e.message || 'Failed to activate'); }
    finally { setBusy(false); }
  };

  const handlePreview = () => {
    let rendered = form.text_body || '';
    Object.entries(SAMPLE_VARS).forEach(([k, v]) => { rendered = rendered.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v ?? '')); });
    setPreview(rendered);
  };

  const loadVersion = (t) => {
    setSelectedId(t.id);
    setForm({ template_name: t.template_name || '', subject: t.subject || '', text_body: t.text_body || '' });
    setNotice(`Loaded version ${t.version}`); setError('');
  };

  if (!canRead) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to view templates.</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#d1fae5', color: '#059669' }}><i className="fas fa-file-signature" /></span>
            Admission Letter Template
          </h1>
          <p className={s.pageSub}>Customise the DB-driven admission letter sent to successful candidates</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/settings/school" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Settings
          </Link>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}<button onClick={() => setNotice('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#059669' }}><i className="fas fa-times" /></button></div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Editor */}
        <div className={s.card} style={{ marginBottom: 0 }}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}><i className="fas fa-edit" style={{ color: '#059669' }} />Template Editor</span>
            {activeTemplate && <span className={`${s.badge} ${s.badgeActive}`}>Active: v{activeTemplate.version}</span>}
          </div>
          <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className={s.formLabel}>Template Name</label>
              <input className={s.formInput} value={form.template_name} onChange={e => setField('template_name', e.target.value)} />
            </div>
            <div>
              <label className={s.formLabel}>Subject</label>
              <input className={s.formInput} value={form.subject} onChange={e => setField('subject', e.target.value)} />
            </div>
            <div>
              <label className={s.formLabel}>Text Body <span style={{ color: '#9ca3af', fontWeight: 400 }}>(use placeholders from the right panel)</span></label>
              <textarea
                className={s.formInput}
                rows={18}
                value={form.text_body}
                onChange={e => setField('text_body', e.target.value)}
                style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.875rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className={`${s.btn} ${s.btnOutline}`} disabled={busy || !selectedId || !canUpdate} onClick={handleUpdate}>
                <i className="fas fa-save" />Save Changes to Version
              </button>
              <button className={`${s.btn} ${s.btnGreen}`} disabled={busy || !canCreate} onClick={handleSaveNew}>
                <i className="fas fa-plus" />Save as New Version
              </button>
              <button className={`${s.btn} ${s.btnOutline}`} disabled={busy || !canPreview} onClick={handlePreview}>
                <i className="fas fa-eye" />Preview
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Placeholders */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-code" style={{ color: '#7c3aed' }} />Placeholders</span>
            </div>
            <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {PLACEHOLDERS.map(p => (
                <div key={p} style={{ padding: '0.3rem 0', borderBottom: '1px solid #f0f4f8' }}>
                  <code style={{ background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.8rem', color: '#7c3aed' }}>{p}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Versions */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-history" style={{ color: '#2563eb' }} />Versions</span>
            </div>
            <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {templates.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: '#9ca3af', margin: 0 }}>No templates saved yet.</p>
              ) : templates.map(t => (
                <div key={t.id} style={{ padding: '0.6rem 0.75rem', borderRadius: 8, border: `1px solid ${selectedId === t.id ? '#2563eb' : '#e5e7eb'}`, background: selectedId === t.id ? '#eff6ff' : '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e3a5f' }}>v{t.version}</span>
                    {t.is_active && <span className={`${s.badge} ${s.badgeActive}`}>Active</span>}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '0.4rem' }}>{t.template_name}</div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => loadVersion(t)} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} disabled={busy || !canUpdate}>
                      <i className="fas fa-edit" />Edit
                    </button>
                    {!t.is_active && (
                      <button onClick={() => handleActivate(t.id)} className={`${s.btn} ${s.btnGreen} ${s.btnSm}`} disabled={busy || !canActivate}>
                        <i className="fas fa-check" />Activate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}><i className="fas fa-eye" style={{ color: '#059669' }} />Preview</span>
              </div>
              <div className={s.cardBody}>
                <pre style={{ fontSize: '0.82rem', background: '#f9fafb', padding: '0.75rem', borderRadius: 8, maxHeight: 280, overflowY: 'auto', whiteSpace: 'pre-wrap', margin: 0, color: '#374151' }}>{preview}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 991px) {
          div[style*="grid-template-columns: 1fr 300px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
