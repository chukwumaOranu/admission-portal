'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermissionActions } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

const RESOURCES = ['users', 'roles', 'permissions', 'applications', 'employees', 'payments', 'exams', 'settings', 'reports', 'files'];
const ACTIONS   = ['create', 'read', 'update', 'delete', 'view', 'manage', 'approve', 'reject'];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function AddPermissionPage() {
  const router = useRouter();
  const { createPermission } = usePermissionActions();

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [formData, setFormData] = useState({ name: '', description: '', resource: '', action: '', is_active: true });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    createPermission(formData);
    router.push('/admin/dashboard/permissions');
    setSaving(false);
  };

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#fef3c7', color: '#d97706' }}><i className="fas fa-key" /></span>
            Add New Permission
          </h1>
          <p className={s.pageSub}>Create a new system permission</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/permissions" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Back to Permissions
          </Link>
        </div>
      </div>

      {error && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

        {/* Form */}
        <div className={s.card} style={{ marginBottom: 0 }}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>
              <span style={{ width: 28, height: 28, borderRadius: 6, background: '#fef3c7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                <i className="fas fa-key" style={{ fontSize: '0.75rem' }} />
              </span>
              Permission Information
            </span>
          </div>
          <div className={s.cardBody} style={{ padding: '1.25rem' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className={s.formLabel}>Permission Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="text" className={s.formInput} name="name" value={formData.name} onChange={handleChange} placeholder="e.g., users.create, applications.approve" required />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>Format: resource.action</p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className={s.formLabel}>Description <span style={{ color: '#dc2626' }}>*</span></label>
                <textarea className={s.formInput} name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Describe what this permission allows users to do" required style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className={s.formLabel}>Resource <span style={{ color: '#dc2626' }}>*</span></label>
                  <select className={s.formSelect} name="resource" value={formData.resource} onChange={handleChange} required>
                    <option value="">Select Resource</option>
                    {RESOURCES.map(r => <option key={r} value={r}>{cap(r)}</option>)}
                  </select>
                </div>
                <div>
                  <label className={s.formLabel}>Action <span style={{ color: '#dc2626' }}>*</span></label>
                  <select className={s.formSelect} name="action" value={formData.action} onChange={handleChange} required>
                    <option value="">Select Action</option>
                    {ACTIONS.map(a => <option key={a} value={a}>{cap(a)}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} style={{ width: 15, height: 15, accentColor: '#d97706' }} />
                  Active Permission
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm" />Creating…</> : <><i className="fas fa-save" />Create Permission</>}
                </button>
                <Link href="/admin/dashboard/permissions" className={`${s.btn} ${s.btnOutline}`}>
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
                <li>Use consistent naming convention</li>
                <li>Be specific about what the permission allows</li>
                <li>Consider security implications</li>
                <li>Test permissions after creation</li>
              </ul>
            </div>
          </div>
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              <div className={`${s.alert} ${s.alertDanger}`} style={{ marginBottom: 0 }}>
                <i className="fas fa-shield-alt" />
                <span style={{ fontSize: '0.82rem' }}>Permissions control access to system features. Assign them carefully to maintain security.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
