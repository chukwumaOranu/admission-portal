'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRoles } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

export default function AddRolePage() {
  const router = useRouter();
  const { status } = useSession();
  const { createRole } = useRoles();

  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', is_active: true });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    createRole(formData);
    setSuccess(true);
    setTimeout(() => router.push('/admin/dashboard/roles'), 1500);
    setSaving(false);
  };

  if (status === 'loading') {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#ede9fe', color: '#7c3aed' }}><i className="fas fa-user-shield" /></span>
            Add New Role
          </h1>
          <p className={s.pageSub}>Create a new user role</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/roles" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Back to Roles
          </Link>
        </div>
      </div>

      {error   && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {success && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />Role created successfully! Redirecting…</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

        {/* Form */}
        <div className={s.card} style={{ marginBottom: 0 }}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>
              <span style={{ width: 28, height: 28, borderRadius: 6, background: '#ede9fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                <i className="fas fa-user-shield" style={{ fontSize: '0.75rem' }} />
              </span>
              Role Information
            </span>
          </div>
          <div className={s.cardBody} style={{ padding: '1.25rem' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className={s.formLabel}>Role Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="text" className={s.formInput} name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Manager, Editor, Viewer" required />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className={s.formLabel}>Description <span style={{ color: '#dc2626' }}>*</span></label>
                <textarea className={s.formInput} name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Describe the role's responsibilities and access level" required style={{ resize: 'vertical' }} />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} style={{ width: 15, height: 15, accentColor: '#7c3aed' }} />
                  Active Role
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm" />Creating…</> : <><i className="fas fa-save" />Create Role</>}
                </button>
                <Link href="/admin/dashboard/roles" className={`${s.btn} ${s.btnOutline}`}>
                  <i className="fas fa-times" />Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Help sidebar */}
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
                <li>Use clear, descriptive role names</li>
                <li>Provide detailed descriptions</li>
                <li>Consider role hierarchy</li>
                <li>Set permissions after creation</li>
              </ul>
            </div>
          </div>
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              <div className={`${s.alert} ${s.alertInfo}`} style={{ marginBottom: 0 }}>
                <i className="fas fa-info-circle" />
                <span style={{ fontSize: '0.82rem' }}>After creating the role, assign specific permissions to define what users with this role can do.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
