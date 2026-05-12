'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudents } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

export default function EditStudentPage() {
  const params  = useParams();
  const router  = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { students, schemas: studentSchemas, loading: reduxLoading, fetchStudents, fetchStudentSchemas, updateStudent } = useStudents();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [notice, setNotice]   = useState('');
  const loadedRef = useRef(false);

  const [formData, setFormData] = useState({
    schema_id: '', first_name: '', last_name: '', middle_name: '',
    email: '', phone: '', date_of_birth: '', gender: '',
    address: '', city: '', state: '', country: 'Nigeria', postal_code: '',
    guardian_name: '', guardian_phone: '', guardian_email: '', guardian_relationship: '',
    previous_school: '', graduation_year: '', status: 'active',
  });

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchStudents(); fetchStudentSchemas();
    }
  }, [status, session?.user?.id, fetchStudents, fetchStudentSchemas]);

  useEffect(() => {
    if (students.length > 0 && params.id) {
      const st = students.find(x => x.id === parseInt(params.id, 10));
      if (!st) { setError('Student not found'); setLoading(false); return; }
      setFormData({
        schema_id:              st.schema_id || '',
        first_name:             st.first_name || '',
        last_name:              st.last_name || '',
        middle_name:            st.middle_name || '',
        email:                  st.email || '',
        phone:                  st.phone || '',
        date_of_birth:          st.date_of_birth ? st.date_of_birth.split('T')[0] : '',
        gender:                 st.gender || '',
        address:                st.address || '',
        city:                   st.city || '',
        state:                  st.state || '',
        country:                st.country || 'Nigeria',
        postal_code:            st.postal_code || '',
        guardian_name:          st.guardian_name || '',
        guardian_phone:         st.guardian_phone || '',
        guardian_email:         st.guardian_email || '',
        guardian_relationship:  st.guardian_relationship || '',
        previous_school:        st.previous_school || '',
        graduation_year:        st.graduation_year || '',
        status:                 st.status || 'active',
      });
      setLoading(false);
    }
  }, [students, params.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setNotice('');
    updateStudent(parseInt(params.id, 10), formData);
    setNotice('Student updated successfully!');
    setTimeout(() => router.push(`/admin/dashboard/students/${params.id}`), 1500);
    setSaving(false);
  };

  if (status === 'loading' || permLoading || reduxLoading || loading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('student.update')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to edit students.</div>
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
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-user-edit" /></span>
            Edit Student
          </h1>
          <p className={s.pageSub}>Update student information</p>
        </div>
        <div className={s.pageActions}>
          <Link href={`/admin/dashboard/students/${params.id}`} className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Back
          </Link>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

          {/* Left: all form sections */}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    {field('School Level / Class *',
                      <select className={s.formSelect} name="schema_id" value={formData.schema_id} onChange={handleChange} required disabled={saving}>
                        <option value="">Select Level</option>
                        {studentSchemas.map(sc => <option key={sc.id} value={sc.id}>{sc.display_name || sc.schema_name}</option>)}
                      </select>
                    )}
                  </div>
                  <div>
                    {field('Status',
                      <select className={s.formSelect} name="status" value={formData.status} onChange={handleChange} disabled={saving}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="graduated">Graduated</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>{field('First Name *', <input type="text" className={s.formInput} name="first_name" value={formData.first_name} onChange={handleChange} required disabled={saving} />)}</div>
                  <div>{field('Last Name *',  <input type="text" className={s.formInput} name="last_name"  value={formData.last_name}  onChange={handleChange} required disabled={saving} />)}</div>
                  <div>{field('Middle Name',  <input type="text" className={s.formInput} name="middle_name" value={formData.middle_name} onChange={handleChange} disabled={saving} />)}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                  <div>{field('Date of Birth', <input type="date" className={s.formInput} name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} disabled={saving} />)}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>{field('Email *', <input type="email" className={s.formInput} name="email" value={formData.email} onChange={handleChange} required disabled={saving} />)}</div>
                  <div>{field('Phone',   <input type="tel"   className={s.formInput} name="phone" value={formData.phone}  onChange={handleChange} disabled={saving} />)}</div>
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
                {field('Street Address', <textarea className={s.formInput} name="address" value={formData.address} onChange={handleChange} rows={2} style={{ resize: 'vertical' }} disabled={saving} />)}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>{field('City',    <input type="text" className={s.formInput} name="city"        value={formData.city}        onChange={handleChange} disabled={saving} />)}</div>
                  <div>{field('State',   <input type="text" className={s.formInput} name="state"       value={formData.state}       onChange={handleChange} disabled={saving} />)}</div>
                  <div>{field('Country', <input type="text" className={s.formInput} name="country"     value={formData.country}     onChange={handleChange} disabled={saving} />)}</div>
                  <div>{field('Postal Code', <input type="text" className={s.formInput} name="postal_code" value={formData.postal_code} onChange={handleChange} disabled={saving} />)}</div>
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
                  <div>{field('Guardian Name',  <input type="text"  className={s.formInput} name="guardian_name"         value={formData.guardian_name}         onChange={handleChange} disabled={saving} />)}</div>
                  <div>{field('Relationship',   <input type="text"  className={s.formInput} name="guardian_relationship" value={formData.guardian_relationship} onChange={handleChange} disabled={saving} />)}</div>
                  <div>{field('Guardian Phone', <input type="tel"   className={s.formInput} name="guardian_phone"        value={formData.guardian_phone}        onChange={handleChange} disabled={saving} />)}</div>
                  <div>{field('Guardian Email', <input type="email" className={s.formInput} name="guardian_email"        value={formData.guardian_email}        onChange={handleChange} disabled={saving} />)}</div>
                </div>
              </div>
            </div>

            {/* Previous School */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    <i className="fas fa-school" style={{ fontSize: '0.75rem' }} />
                  </span>
                  Previous School
                </span>
              </div>
              <div className={s.cardBody} style={{ padding: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div>{field('Previous School', <input type="text"   className={s.formInput} name="previous_school" value={formData.previous_school} onChange={handleChange} disabled={saving} />)}</div>
                  <div>{field('Year Left',        <input type="number" className={s.formInput} name="graduation_year" value={formData.graduation_year} onChange={handleChange} min="2000" max="2030" disabled={saving} />)}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm" />Saving…</> : <><i className="fas fa-save" />Save Changes</>}
              </button>
              <button type="button" className={`${s.btn} ${s.btnOutline}`} onClick={() => router.back()} disabled={saving}>
                <i className="fas fa-times" />Cancel
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                    <i className="fas fa-lightbulb" style={{ fontSize: '0.75rem' }} />
                  </span>
                  Tips
                </span>
              </div>
              <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
                <ul style={{ fontSize: '0.82rem', color: '#374151', paddingLeft: '1.1rem', lineHeight: 1.9, margin: 0 }}>
                  <li>Student ID cannot be changed</li>
                  <li>User account settings are managed separately</li>
                  <li>Changes take effect immediately</li>
                  <li><strong>Required:</strong> School Level, First Name, Last Name, Email</li>
                </ul>
              </div>
            </div>

            <div className={`${s.alert} ${s.alertInfo}`} style={{ margin: 0 }}>
              <i className="fas fa-info-circle" />
              <span style={{ fontSize: '0.78rem' }}>To manage login credentials, go to <strong>User Management</strong>.</span>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
