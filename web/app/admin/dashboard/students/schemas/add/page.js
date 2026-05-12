'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStudents } from '@/hooks/useRedux';
import { usePermissions } from '@/hooks/usePermissions';
import s from '@/styles/admin-portal.module.css';

export default function AddStudentSchemaPage() {
  const router = useRouter();
  const { status } = useSession();
  const { createStudentSchema } = useStudents();
  const { hasPermission, loading: permLoading } = usePermissions();

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [formData, setFormData] = useState({
    schema_name: '', display_name: '', description: '', is_active: true,
  });

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.schema_name.trim() || !formData.display_name.trim()) {
      setError('Schema name and display name are required.');
      return;
    }
    setSaving(true);
    createStudentSchema(formData);
    router.push('/admin/dashboard/students/schemas');
  };

  if (status === 'loading' || permLoading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('student_schema.create')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to create student schemas.</div>
        <Link href="/admin/dashboard/students/schemas" className={`${s.btn} ${s.btnOutline}`} style={{ marginTop: '0.75rem' }}><i className="fas fa-arrow-left" />Back to Schemas</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#e0f2fe', color: '#0891b2' }}><i className="fas fa-database" /></span>
            Add Student Schema
          </h1>
          <p className={s.pageSub}>Create a new student data schema</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/students/schemas" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Schemas
          </Link>
        </div>
      </div>

      {error && (
        <div className={`${s.alert} ${s.alertDanger}`}>
          <i className="fas fa-exclamation-triangle" />{error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

        <div className={s.card} style={{ marginBottom: 0 }}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>
              <span style={{ width: 28, height: 28, borderRadius: 6, background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2' }}>
                <i className="fas fa-database" style={{ fontSize: '0.75rem' }} />
              </span>
              Schema Information
            </span>
          </div>
          <div className={s.cardBody} style={{ padding: '1.25rem' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className={s.formLabel}>Schema Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    type="text"
                    className={s.formInput}
                    name="schema_name"
                    value={formData.schema_name}
                    onChange={handleChange}
                    placeholder="e.g., undergraduate"
                    required
                  />
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>Lowercase, underscores only</p>
                </div>
                <div>
                  <label className={s.formLabel}>Display Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input
                    type="text"
                    className={s.formInput}
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleChange}
                    placeholder="e.g., Undergraduate"
                    required
                  />
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>User-friendly label</p>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className={s.formLabel}>Description</label>
                <textarea
                  className={s.formInput}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe what this schema is used for…"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', color: '#374151', fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                  />
                  Active schema
                </label>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.2rem 0 0 1.5rem' }}>Inactive schemas are hidden from student registration forms</p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm" />Creating…</>
                    : <><i className="fas fa-save" />Create Schema</>}
                </button>
                <Link href="/admin/dashboard/students/schemas" className={`${s.btn} ${s.btnOutline}`}>
                  <i className="fas fa-times" />Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>

        <div className={s.card} style={{ marginBottom: 0 }}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>
              <span style={{ width: 28, height: 28, borderRadius: 6, background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2' }}>
                <i className="fas fa-info-circle" style={{ fontSize: '0.75rem' }} />
              </span>
              About Student Schemas
            </span>
          </div>
          <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.75rem', lineHeight: 1.6 }}>
              Student schemas define the structure and fields for student records. Each schema can have different custom fields based on your institution&apos;s requirements.
            </p>
            <div style={{ fontSize: '0.82rem', color: '#374151', marginBottom: '0.75rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.4rem' }}>Common schema types:</strong>
              <ul style={{ paddingLeft: '1.1rem', lineHeight: 1.9, margin: 0 }}>
                <li><strong>Undergraduate</strong> — Standard degree programme</li>
                <li><strong>Postgraduate</strong> — Masters &amp; PhD fields</li>
                <li><strong>Diploma</strong> — Shorter qualification fields</li>
                <li><strong>Exchange</strong> — Visiting student fields</li>
              </ul>
            </div>
            <div className={`${s.alert} ${s.alertInfo}`} style={{ marginBottom: 0 }}>
              <i className="fas fa-info-circle" />
              <span style={{ fontSize: '0.78rem' }}>After creating, add custom fields to capture specific information for this student type.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
