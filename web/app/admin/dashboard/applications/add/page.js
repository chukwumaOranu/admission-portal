'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

export default function AddApplicationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { schemas, loading: reduxLoading, fetchApplicationSchemas, createApplication } = useApplications();

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [notice, setNotice] = useState('');
  const loadedRef = useRef(false);

  const [formData, setFormData] = useState({
    schema_id: '', applicant_name: '', applicant_email: '', applicant_phone: '',
    date_of_birth: '', gender: '', address: '', city: '', state: '',
    country: 'Nigeria', guardian_name: '', guardian_phone: '', guardian_email: '',
    custom_data: {},
  });

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchApplicationSchemas();
    }
  }, [status, session?.user?.id, fetchApplicationSchemas]);

  const activeSchemas = schemas.filter(sc => sc.is_active);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setNotice('');
    createApplication({ ...formData, schema_id: Number(formData.schema_id) });
    setNotice('Application submitted successfully!');
    setTimeout(() => router.push('/admin/dashboard/applications'), 1500);
    setSaving(false);
  };

  if (status === 'loading' || permLoading || reduxLoading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('application.create')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to create applications.</div>
        <Link href="/admin/dashboard/applications" className={`${s.btn} ${s.btnOutline}`} style={{ marginTop: '0.75rem' }}><i className="fas fa-arrow-left" />Back to Applications</Link>
      </div>
    );
  }

  const field = (label, child) => (
    <div style={{ marginBottom: '1rem' }}>
      <label className={s.formLabel}>{label}</label>
      {child}
    </div>
  );

  const selectedSchema = activeSchemas.find(sc => sc.id === Number(formData.schema_id));

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-file-alt" /></span>
            New Application
          </h1>
          <p className={s.pageSub}>Create a new admission application</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/applications" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Applications
          </Link>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

          {/* Left: form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Program Selection */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                    <i className="fas fa-graduation-cap" style={{ fontSize: '0.75rem' }} />
                  </span>
                  Application Type
                </span>
              </div>
              <div className={s.cardBody} style={{ padding: '1.25rem' }}>
                {field('Select Program *',
                  <select className={s.formSelect} name="schema_id" value={formData.schema_id} onChange={handleChange} required disabled={saving}>
                    <option value="">Choose a program…</option>
                    {activeSchemas.map(sc => (
                      <option key={sc.id} value={sc.id}>
                        {sc.display_name || sc.schema_name} — ₦{parseFloat(sc.application_fee || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                )}
                {activeSchemas.length === 0 && (
                  <div className={`${s.alert} ${s.alertInfo}`} style={{ marginTop: '0.5rem' }}>
                    <i className="fas fa-info-circle" />
                    <span style={{ fontSize: '0.82rem' }}>No active application programs available.</span>
                  </div>
                )}
                {selectedSchema && (
                  <div className={`${s.alert} ${s.alertSuccess}`} style={{ marginTop: '0.5rem' }}>
                    <i className="fas fa-money-bill-wave" />
                    <span style={{ fontSize: '0.82rem' }}>Application fee: <strong>₦{parseFloat(selectedSchema.application_fee || 0).toLocaleString()}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Applicant Info */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2' }}>
                    <i className="fas fa-user" style={{ fontSize: '0.75rem' }} />
                  </span>
                  Applicant Information
                </span>
              </div>
              <div className={s.cardBody} style={{ padding: '1.25rem' }}>
                {field('Full Name *', <input type="text" className={s.formInput} name="applicant_name" value={formData.applicant_name} onChange={handleChange} required placeholder="John Doe" disabled={saving} />)}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>{field('Email *',   <input type="email" className={s.formInput} name="applicant_email" value={formData.applicant_email} onChange={handleChange} required placeholder="john.doe@email.com"  disabled={saving} />)}</div>
                  <div>{field('Phone *',   <input type="tel"   className={s.formInput} name="applicant_phone" value={formData.applicant_phone} onChange={handleChange} required placeholder="+234 XXX XXX XXXX"    disabled={saving} />)}</div>
                  <div>{field('Date of Birth', <input type="date" className={s.formInput} name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} disabled={saving} />)}</div>
                  <div>
                    {field('Gender',
                      <select className={s.formSelect} name="gender" value={formData.gender} onChange={handleChange} disabled={saving}>
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    )}
                  </div>
                </div>
                {field('Address', <textarea className={s.formInput} name="address" value={formData.address} onChange={handleChange} rows={2} style={{ resize: 'vertical' }} placeholder="Full address" disabled={saving} />)}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>{field('City',  <input type="text" className={s.formInput} name="city"  value={formData.city}  onChange={handleChange} disabled={saving} />)}</div>
                  <div>{field('State', <input type="text" className={s.formInput} name="state" value={formData.state} onChange={handleChange} disabled={saving} />)}</div>
                </div>
              </div>
            </div>

            {/* Guardian */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#fef3c7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                    <i className="fas fa-user-friends" style={{ fontSize: '0.75rem' }} />
                  </span>
                  Guardian / Parent
                </span>
              </div>
              <div className={s.cardBody} style={{ padding: '1.25rem' }}>
                {field('Guardian Name', <input type="text" className={s.formInput} name="guardian_name" value={formData.guardian_name} onChange={handleChange} placeholder="Full name" disabled={saving} />)}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>{field('Guardian Phone', <input type="tel"   className={s.formInput} name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} placeholder="+234 XXX XXX XXXX"  disabled={saving} />)}</div>
                  <div>{field('Guardian Email', <input type="email" className={s.formInput} name="guardian_email" value={formData.guardian_email} onChange={handleChange} placeholder="guardian@email.com" disabled={saving} />)}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm" />Submitting…</> : <><i className="fas fa-save" />Submit Application</>}
              </button>
              <Link href="/admin/dashboard/applications" className={`${s.btn} ${s.btnOutline}`}>
                <i className="fas fa-times" />Cancel
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                    <i className="fas fa-info-circle" style={{ fontSize: '0.75rem' }} />
                  </span>
                  Application Info
                </span>
              </div>
              <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
                <div className={`${s.alert} ${s.alertInfo}`} style={{ marginBottom: '0.75rem' }}>
                  <i className="fas fa-clipboard-list" />
                  <span style={{ fontSize: '0.82rem' }}><strong>Required:</strong> Program, Name, Email &amp; Phone</span>
                </div>
                <div className={`${s.alert} ${s.alertSuccess}`} style={{ marginBottom: '0.75rem' }}>
                  <i className="fas fa-money-bill-wave" />
                  <span style={{ fontSize: '0.82rem' }}>Application fee varies by program. Select a program to see the fee.</span>
                </div>
                <ul style={{ fontSize: '0.82rem', color: '#374151', paddingLeft: '1.1rem', lineHeight: 1.9, margin: 0 }}>
                  <li>Review all information before submitting</li>
                  <li>Ensure contact details are accurate</li>
                  <li>Application can be edited before approval</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
