'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useDepartments } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

export default function AddDepartmentPage() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { createDepartment } = useDepartments();

  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Department name is required'); return; }
    setSaving(true);
    createDepartment(formData);
    setSuccess(true);
    setTimeout(() => router.push('/admin/dashboard/employees/departments'), 1500);
    setSaving(false);
  };

  if (status === 'loading' || permLoading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('department.create')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to create departments.</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#e0f2fe', color: '#0891b2' }}><i className="fas fa-building" /></span>
            Add Department
          </h1>
          <p className={s.pageSub}>Create a new department in the organisation</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/employees/departments" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Departments
          </Link>
        </div>
      </div>

      {error   && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {success && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />Department created! Redirecting…</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

        <div className={s.card} style={{ marginBottom: 0 }}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>
              <span style={{ width: 28, height: 28, borderRadius: 6, background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2' }}>
                <i className="fas fa-building" style={{ fontSize: '0.75rem' }} />
              </span>
              Department Information
            </span>
          </div>
          <div className={s.cardBody} style={{ padding: '1.25rem' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className={s.formLabel}>Department Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="text" className={s.formInput} name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Human Resources" required />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className={s.formLabel}>Description</label>
                <textarea className={s.formInput} name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Brief description of the department's role and responsibilities" style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm" />Creating…</> : <><i className="fas fa-save" />Create Department</>}
                </button>
                <Link href="/admin/dashboard/employees/departments" className={`${s.btn} ${s.btnOutline}`}>
                  <i className="fas fa-times" />Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2' }}>
                  <i className="fas fa-lightbulb" style={{ fontSize: '0.75rem' }} />
                </span>
                Tips
              </span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              <ul style={{ fontSize: '0.82rem', color: '#374151', paddingLeft: '1.1rem', lineHeight: 1.9, margin: 0 }}>
                <li>Choose a clear, descriptive name</li>
                <li>Add a brief description of the department&apos;s purpose</li>
                <li>Department will be active by default</li>
                <li>You can add more details later when editing</li>
              </ul>
            </div>
          </div>
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              <div className={`${s.alert} ${s.alertSuccess}`} style={{ marginBottom: 0 }}>
                <i className="fas fa-check-circle" />
                <span style={{ fontSize: '0.82rem' }}>Just provide the essential information to get started. Additional details can be added when editing.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
