'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudents } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

export default function AddStudentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { schemas: studentSchemas, loading: schemasLoading, fetchStudentSchemas, createStudent } = useStudents();

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [notice, setNotice] = useState('');
  const loadedRef = useRef(false);

  const [formData, setFormData] = useState({
    schema_id: '', first_name: '', last_name: '', middle_name: '',
    email: '', phone: '', date_of_birth: '', gender: '',
    address: '', city: '', state: '', country: 'Nigeria', postal_code: '',
    guardian_name: '', guardian_phone: '', guardian_email: '', guardian_relationship: '',
    previous_school: '', graduation_year: '',
    create_user_account: false, send_welcome_email: false,
  });

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchStudentSchemas();
    }
  }, [status, session?.user?.id, fetchStudentSchemas]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.create_user_account && !formData.email) {
      setError('Email is required to create a user account.');
      return;
    }
    setSaving(true); setError(''); setNotice('');
    createStudent({ ...formData, schema_id: Number(formData.schema_id) });
    setNotice('Student created successfully!');
    setTimeout(() => router.push('/admin/dashboard/students'), 1500);
    setSaving(false);
  };

  if (status === 'loading' || permLoading || schemasLoading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('student.create')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to create students.</div>
        <Link href="/admin/dashboard/students" className={`${s.btn} ${s.btnOutline}`} style={{ marginTop: '0.75rem' }}><i className="fas fa-arrow-left" />Back to Students</Link>
      </div>
    );
  }

  const field = (label, child, hint) => (
    <div style={{ marginBottom: '1rem' }}>
      <label className={s.formLabel}>{label}</label>
      {child}
      {hint && <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>{hint}</p>}
    </div>
  );

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-user-plus" /></span>
            Add New Student
          </h1>
          <p className={s.pageSub}>Register a new student</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/students" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Students
          </Link>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

          {/* Left: form sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Basic Information */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                    <i className="fas fa-user" style={{ fontSize: '0.75rem' }} />
                  </span>
                  Basic Information
                </span>
              </div>
              <div className={s.cardBody} style={{ padding: '1.25rem' }}>
                <div className={`${s.alert} ${s.alertInfo}`} style={{ marginBottom: '1rem' }}>
                  <i className="fas fa-info-circle" />
                  <span style={{ fontSize: '0.82rem' }}>Student ID will be auto-generated (e.g., STUD20250001)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    {field('School Level *',
                      <select className={s.formSelect} name="schema_id" value={formData.schema_id} onChange={handleChange} required disabled={saving}>
                        <option value="">Select Level</option>
                        {studentSchemas.map(sc => <option key={sc.id} value={sc.id}>{sc.display_name || sc.schema_name}</option>)}
                      </select>,
                      'e.g., Primary, JSS, SSS, Nursery'
                    )}
                  </div>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>{field('First Name *',  <input type="text" className={s.formInput} name="first_name"  value={formData.first_name}  onChange={handleChange} required placeholder="John"     disabled={saving} />)}</div>
                  <div>{field('Last Name *',   <input type="text" className={s.formInput} name="last_name"   value={formData.last_name}   onChange={handleChange} required placeholder="Doe"      disabled={saving} />)}</div>
                  <div>{field('Middle Name',   <input type="text" className={s.formInput} name="middle_name" value={formData.middle_name} onChange={handleChange}         placeholder="Optional" disabled={saving} />)}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>{field('Email *',        <input type="email" className={s.formInput} name="email"         value={formData.email}         onChange={handleChange} required placeholder="student@email.com"    disabled={saving} />)}</div>
                  <div>{field('Phone',          <input type="tel"   className={s.formInput} name="phone"         value={formData.phone}         onChange={handleChange}         placeholder="+234 XXX XXX XXXX"    disabled={saving} />)}</div>
                  <div>{field('Date of Birth',  <input type="date"  className={s.formInput} name="date_of_birth" value={formData.date_of_birth} onChange={handleChange}                                            disabled={saving} />)}</div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2' }}>
                    <i className="fas fa-map-marker-alt" style={{ fontSize: '0.75rem' }} />
                  </span>
                  Address
                </span>
              </div>
              <div className={s.cardBody} style={{ padding: '1.25rem' }}>
                {field('Street Address', <textarea className={s.formInput} name="address" value={formData.address} onChange={handleChange} rows={2} style={{ resize: 'vertical' }} placeholder="Full address" disabled={saving} />)}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>{field('City',        <input type="text" className={s.formInput} name="city"        value={formData.city}        onChange={handleChange} placeholder="Lagos"   disabled={saving} />)}</div>
                  <div>{field('State',       <input type="text" className={s.formInput} name="state"       value={formData.state}       onChange={handleChange} placeholder="Lagos"   disabled={saving} />)}</div>
                  <div>{field('Country',     <input type="text" className={s.formInput} name="country"     value={formData.country}     onChange={handleChange} placeholder="Nigeria" disabled={saving} />)}</div>
                  <div>{field('Postal Code', <input type="text" className={s.formInput} name="postal_code" value={formData.postal_code} onChange={handleChange} placeholder="100001" disabled={saving} />)}</div>
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
                  Guardian / Emergency Contact
                </span>
              </div>
              <div className={s.cardBody} style={{ padding: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>{field('Guardian Name',     <input type="text"  className={s.formInput} name="guardian_name"         value={formData.guardian_name}         onChange={handleChange} placeholder="Full name"              disabled={saving} />)}</div>
                  <div>{field('Relationship',      <input type="text"  className={s.formInput} name="guardian_relationship" value={formData.guardian_relationship} onChange={handleChange} placeholder="e.g., Parent, Guardian" disabled={saving} />)}</div>
                  <div>{field('Guardian Phone',    <input type="tel"   className={s.formInput} name="guardian_phone"        value={formData.guardian_phone}        onChange={handleChange} placeholder="+234 XXX XXX XXXX"      disabled={saving} />)}</div>
                  <div>{field('Guardian Email',    <input type="email" className={s.formInput} name="guardian_email"        value={formData.guardian_email}        onChange={handleChange} placeholder="guardian@email.com"     disabled={saving} />)}</div>
                </div>
              </div>
            </div>

            {/* Previous School */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    <i className="fas fa-graduation-cap" style={{ fontSize: '0.75rem' }} />
                  </span>
                  Previous School
                </span>
              </div>
              <div className={s.cardBody} style={{ padding: '1.25rem' }}>
                <div className={`${s.alert} ${s.alertInfo}`} style={{ marginBottom: '1rem' }}>
                  <i className="fas fa-info-circle" />
                  <span style={{ fontSize: '0.82rem' }}>For transfers from other schools. Leave blank for new admissions.</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div>{field('Previous School', <input type="text"   className={s.formInput} name="previous_school" value={formData.previous_school} onChange={handleChange} placeholder="e.g., St. Mary's Primary" disabled={saving} />)}</div>
                  <div>{field('Year Left',        <input type="number" className={s.formInput} name="graduation_year" value={formData.graduation_year} onChange={handleChange} placeholder="2024" min="2000" max="2030"  disabled={saving} />)}</div>
                </div>
              </div>
            </div>

            {/* System Access */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#d1fae5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                    <i className="fas fa-user-lock" style={{ fontSize: '0.75rem' }} />
                  </span>
                  Portal Access (Optional)
                </span>
              </div>
              <div className={s.cardBody} style={{ padding: '1.25rem' }}>
                <div className={`${s.alert} ${s.alertInfo}`} style={{ marginBottom: '1rem' }}>
                  <i className="fas fa-info-circle" />
                  <span style={{ fontSize: '0.82rem' }}>Enable to create a login account with <strong>&ldquo;Student&rdquo;</strong> role automatically assigned.</span>
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '1rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="create_user_account" checked={formData.create_user_account} onChange={handleChange} style={{ marginTop: 3, width: 15, height: 15, accentColor: '#059669' }} disabled={saving} />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                    <strong>Create User Account</strong><br />
                    <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Generate login credentials for student portal access</span>
                  </span>
                </label>
                {formData.create_user_account && (
                  <>
                    <div className={`${s.alert} ${s.alertSuccess}`} style={{ marginBottom: '0.75rem' }}>
                      <i className="fas fa-key" />
                      <span style={{ fontSize: '0.82rem' }}>Username &amp; password will be auto-generated. Student ID: STUD20250XXX</span>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer' }}>
                      <input type="checkbox" name="send_welcome_email" checked={formData.send_welcome_email} onChange={handleChange} style={{ marginTop: 3, width: 15, height: 15, accentColor: '#059669' }} disabled={saving} />
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                        Send welcome email with credentials<br />
                        <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>(Requires email configuration)</span>
                      </span>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm" />Creating…</> : <><i className="fas fa-save" />Create Student</>}
              </button>
              <Link href="/admin/dashboard/students" className={`${s.btn} ${s.btnOutline}`}>
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
                  Quick Guide
                </span>
              </div>
              <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
                <div className={`${s.alert} ${s.alertInfo}`} style={{ marginBottom: '0.75rem' }}>
                  <i className="fas fa-clipboard-list" />
                  <span style={{ fontSize: '0.82rem' }}><strong>Required:</strong> School Level, First Name, Last Name, Email</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#374151', marginBottom: '0.75rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.3rem' }}>School Levels:</strong>
                  <ul style={{ paddingLeft: '1.1rem', lineHeight: 1.9, margin: 0 }}>
                    <li><strong>Nursery</strong> — Pre-school children</li>
                    <li><strong>Primary</strong> — Classes 1–6</li>
                    <li><strong>JSS</strong> — Junior Secondary 1–3</li>
                    <li><strong>SSS</strong> — Senior Secondary 1–3</li>
                  </ul>
                </div>
                <div className={`${s.alert} ${s.alertSuccess}`} style={{ marginBottom: 0 }}>
                  <i className="fas fa-id-card" />
                  <span style={{ fontSize: '0.78rem' }}>Student ID is auto-generated: <strong>STUD20250001</strong></span>
                </div>
              </div>
            </div>

            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}><i className="fas fa-user-lock" style={{ color: '#059669' }} />Portal Access</span>
              </div>
              <div className={s.cardBody} style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.7 }}>
                <p style={{ margin: '0 0 0.5rem' }}>When portal access is enabled, students can:</p>
                <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
                  <li>View their student records</li>
                  <li>Track applications</li>
                  <li>Make fee payments</li>
                  <li>Download reports</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
