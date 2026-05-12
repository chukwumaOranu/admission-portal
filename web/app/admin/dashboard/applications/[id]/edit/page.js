'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';
import apiService from '@/services/api';
import s from '@/styles/admin-portal.module.css';

const fmtDt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_BADGE = {
  pending:  { cls: s.badgePending,  label: 'Pending' },
  approved: { cls: s.badgeApproved, label: 'Approved' },
  rejected: { cls: s.badgeRejected, label: 'Rejected' },
  draft:    { cls: s.badgeInactive, label: 'Draft' },
};

export default function EditApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { applications, updateApplication } = useApplications();

  const applicationId = params.id;

  const [application, setApplication] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [notice, setNotice]           = useState('');
  const loadedRef = useRef(false);

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', middle_name: '',
    email: '', phone: '', date_of_birth: '', gender: '', nationality: '',
    address: '', emergency_contact_name: '', emergency_contact_phone: '',
    custom_data: {},
  });

  const populateForm = useCallback((app) => {
    setFormData({
      first_name:              app.first_name || '',
      last_name:               app.last_name || '',
      middle_name:             app.middle_name || '',
      email:                   app.email || '',
      phone:                   app.phone || '',
      date_of_birth:           app.date_of_birth ? app.date_of_birth.split('T')[0] : '',
      gender:                  app.gender || '',
      nationality:             app.nationality || '',
      address:                 app.address || '',
      emergency_contact_name:  app.emergency_contact_name || '',
      emergency_contact_phone: app.emergency_contact_phone || '',
      custom_data:             app.custom_data || {},
    });
  }, []);

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const found = applications.find(a => a.id == applicationId);
      if (found) { setApplication(found); populateForm(found); return; }
      const res = await apiService.get(`/applications/${applicationId}`);
      const app = res.data.data || res.data;
      setApplication(app); populateForm(app);
    } catch { setError('Failed to load application details'); }
    finally { setLoading(false); }
  }, [applications, applicationId, populateForm]);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && applicationId && !loadedRef.current) {
      loadedRef.current = true; loadDetail();
    }
  }, [status, session?.user?.id, applicationId, loadDetail]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleCustomChange = (key, value) => {
    setFormData(prev => ({ ...prev, custom_data: { ...prev.custom_data, [key]: value } }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setNotice('');
    updateApplication(applicationId, {
      ...formData,
      date_of_birth: formData.date_of_birth ? new Date(formData.date_of_birth).toISOString() : null,
    });
    setNotice('Application updated successfully!');
    setTimeout(() => router.push(`/admin/dashboard/applications/${applicationId}`), 1500);
    setSaving(false);
  };

  if (status === 'loading' || permLoading || loading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('application.update')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to edit applications.</div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error || 'Application not found.'}</div>
        <Link href="/admin/dashboard/applications" className={`${s.btn} ${s.btnOutline}`} style={{ marginTop: '0.75rem' }}><i className="fas fa-arrow-left" />Back to Applications</Link>
      </div>
    );
  }

  const statusInfo = STATUS_BADGE[application.status] || { cls: s.badgeInactive, label: application.status };

  const field = (label, child) => (
    <div style={{ marginBottom: '1rem' }}>
      <label className={s.formLabel}>{label}</label>
      {child}
    </div>
  );

  const capWords = (str) => str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#fef3c7', color: '#d97706' }}><i className="fas fa-edit" /></span>
            Edit Application
          </h1>
          <p className={s.pageSub}>{application.applicant_name || 'Unknown Applicant'} — {application.schema_display_name || application.schema_name}</p>
        </div>
        <div className={s.pageActions}>
          <Link href={`/admin/dashboard/applications/${applicationId}`} className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Back
          </Link>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}</div>}

      {/* Application status banner */}
      <div className={s.card} style={{ marginBottom: '1.25rem' }}>
        <div className={s.cardHeader}>
          <span className={s.cardTitle}><i className="fas fa-info-circle" style={{ color: '#0891b2' }} />Application Status</span>
          <span className={`${s.badge} ${statusInfo.cls}`}>{statusInfo.label}</span>
        </div>
        <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
          {[
            { label: 'Application ID',  value: <span className={`${s.badge} ${s.badgeInfo}`}>{application.application_number || `APP${application.id}`}</span> },
            { label: 'Program',         value: application.schema_display_name || application.schema_name || '—' },
            { label: 'Payment Status',  value: <span className={`${s.badge} ${application.payment_status === 'paid' ? s.badgePaid : s.badgePending}`}>{application.payment_status || 'pending'}</span> },
            { label: 'Submitted',       value: fmtDt(application.created_at) },
          ].map(row => (
            <div key={row.label} className={s.infoRow}>
              <span className={s.infoLabel}>{row.label}</span>
              <span className={s.infoValue}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

          {/* Personal Information */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <i className="fas fa-user" style={{ fontSize: '0.75rem' }} />
                </span>
                Personal Information
              </span>
            </div>
            <div className={s.cardBody} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>{field('First Name *',  <input type="text"  className={s.formInput} name="first_name"  value={formData.first_name}  onChange={handleChange} required disabled={saving} />)}</div>
                <div>{field('Last Name *',   <input type="text"  className={s.formInput} name="last_name"   value={formData.last_name}   onChange={handleChange} required disabled={saving} />)}</div>
                <div>{field('Middle Name',   <input type="text"  className={s.formInput} name="middle_name" value={formData.middle_name} onChange={handleChange} disabled={saving} />)}</div>
                <div>{field('Email *',       <input type="email" className={s.formInput} name="email"       value={formData.email}       onChange={handleChange} required disabled={saving} />)}</div>
                <div>{field('Phone *',       <input type="tel"   className={s.formInput} name="phone"       value={formData.phone}       onChange={handleChange} required disabled={saving} />)}</div>
                <div>{field('Date of Birth *', <input type="date" className={s.formInput} name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required disabled={saving} />)}</div>
                <div>
                  {field('Gender *',
                    <select className={s.formSelect} name="gender" value={formData.gender} onChange={handleChange} required disabled={saving}>
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  )}
                </div>
                <div>{field('Nationality', <input type="text" className={s.formInput} name="nationality" value={formData.nationality} onChange={handleChange} disabled={saving} />)}</div>
              </div>
            </div>
          </div>

          {/* Contact & Emergency */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2' }}>
                    <i className="fas fa-map-marker-alt" style={{ fontSize: '0.75rem' }} />
                  </span>
                  Contact &amp; Emergency
                </span>
              </div>
              <div className={s.cardBody} style={{ padding: '1.25rem' }}>
                {field('Address *', <textarea className={s.formInput} name="address" value={formData.address} onChange={handleChange} rows={3} style={{ resize: 'vertical' }} required disabled={saving} />)}
                {field('Emergency Contact Name *',  <input type="text" className={s.formInput} name="emergency_contact_name"  value={formData.emergency_contact_name}  onChange={handleChange} required disabled={saving} />)}
                {field('Emergency Contact Phone *', <input type="tel"  className={s.formInput} name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} required disabled={saving} />)}
              </div>
            </div>

            {/* Custom Data (dynamic) */}
            {application.custom_data && Object.keys(application.custom_data).length > 0 && (
              <div className={s.card} style={{ marginBottom: 0 }}>
                <div className={s.cardHeader}>
                  <span className={s.cardTitle}>
                    <span style={{ width: 28, height: 28, borderRadius: 6, background: '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <i className="fas fa-cogs" style={{ fontSize: '0.75rem' }} />
                    </span>
                    Additional Information
                  </span>
                </div>
                <div className={s.cardBody} style={{ padding: '1.25rem' }}>
                  {Object.entries(application.custom_data).map(([key]) => (
                    <div key={key} style={{ marginBottom: '1rem' }}>
                      <label className={s.formLabel}>{capWords(key)}</label>
                      <input type="text" className={s.formInput} value={formData.custom_data[key] || ''} onChange={e => handleCustomChange(key, e.target.value)} disabled={saving} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm" />Saving…</> : <><i className="fas fa-save" />Save Changes</>}
              </button>
              <Link href={`/admin/dashboard/applications/${applicationId}`} className={`${s.btn} ${s.btnOutline}`}>
                <i className="fas fa-times" />Cancel
              </Link>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
