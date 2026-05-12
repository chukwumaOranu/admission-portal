'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudents } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

export default function EditStudentSchemaPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { schemas, loading: reduxLoading, fetchStudentSchemas, updateStudentSchema } = useStudents();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [notice, setNotice]   = useState('');
  const loadedRef = useRef(false);

  const [formData, setFormData] = useState({
    schema_name: '', display_name: '', description: '', is_active: true,
  });

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true;
      if (schemas.length === 0) fetchStudentSchemas();
    }
  }, [status, session?.user?.id, schemas.length, fetchStudentSchemas]);

  useEffect(() => {
    if (params.id && schemas.length > 0) {
      const found = schemas.find(sc => sc.id === parseInt(params.id, 10));
      if (found) {
        setFormData({
          schema_name:  found.schema_name || '',
          display_name: found.display_name || '',
          description:  found.description || '',
          is_active:    Boolean(found.is_active),
        });
        setLoading(false);
      } else if (!reduxLoading) { setLoading(false); }
    } else if (params.id && !reduxLoading) { setLoading(false); }
  }, [params.id, schemas, reduxLoading]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setNotice('');
    updateStudentSchema(parseInt(params.id, 10), formData);
    setNotice('Schema updated successfully!');
    setTimeout(() => router.push('/admin/dashboard/students/schemas'), 1500);
    setSaving(false);
  };

  if (status === 'loading' || permLoading || loading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('student_schema.update')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to edit student schemas.</div>
        <Link href="/admin/dashboard/students/schemas" className={`${s.btn} ${s.btnOutline}`} style={{ marginTop: '0.75rem' }}><i className="fas fa-arrow-left" />Back</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-edit" /></span>
            Edit Student Schema
          </h1>
          <p className={s.pageSub}>Update schema information</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/students/schemas" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Back
          </Link>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <i className="fas fa-file-alt" style={{ fontSize: '0.75rem' }} />
                </span>
                Schema Details
              </span>
            </div>
            <div className={s.cardBody} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className={s.formLabel}>Schema Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="text" className={s.formInput} name="schema_name" value={formData.schema_name} onChange={handleChange} required placeholder="e.g., primary_level" disabled={saving} />
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>Lowercase, underscores only</p>
                </div>
                <div>
                  <label className={s.formLabel}>Display Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="text" className={s.formInput} name="display_name" value={formData.display_name} onChange={handleChange} required placeholder="e.g., Primary Level" disabled={saving} />
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>Human-readable name</p>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className={s.formLabel}>Description</label>
                <textarea className={s.formInput} name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Describe this schema's purpose…" style={{ resize: 'vertical' }} disabled={saving} />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className={s.formLabel}>Status</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', color: '#374151' }}>
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} style={{ width: 15, height: 15, accentColor: '#059669' }} disabled={saving} />
                  {formData.is_active ? 'Active' : 'Inactive'}
                </label>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>{formData.is_active ? 'Schema is available for use' : 'Hidden from selection'}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm" />Updating…</> : <><i className="fas fa-save" />Update Schema</>}
                </button>
                <Link href="/admin/dashboard/students/schemas" className={`${s.btn} ${s.btnOutline}`}>
                  <i className="fas fa-times" />Cancel
                </Link>
              </div>
            </div>
          </div>

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
                  <li>Schema name must use lowercase with underscores</li>
                  <li>Display name uses proper capitalisation</li>
                  <li>Inactive schemas won&apos;t be available for selection</li>
                  <li>After updating, manage fields using the Manage Fields page</li>
                </ul>
              </div>
            </div>
            <div className={`${s.alert} ${s.alertInfo}`} style={{ margin: 0 }}>
              <i className="fas fa-cogs" />
              <span style={{ fontSize: '0.78rem' }}>To add or edit form fields, use the <Link href={`/admin/dashboard/students/schemas/${params.id}/fields`} style={{ color: '#0891b2' }}>Manage Fields</Link> page.</span>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
