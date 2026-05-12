'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useUsers, useRoles } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

export default function AddUserPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { createUser } = useUsers();
  const { roles, fetchRoles } = useRoles();

  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '', role_id: '', is_active: true,
  });
  const loadedRef = useRef(false);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchRoles();
    }
  }, [status, session?.user?.id, fetchRoles]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    setSaving(true); setError('');
    const { confirmPassword, ...userData } = formData;
    createUser(userData);
    setSuccess(true);
    setTimeout(() => router.push('/admin/dashboard/users'), 1500);
    setSaving(false);
  };

  if (status === 'loading' || permLoading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('user.create')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to create users.</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-user-plus" /></span>
            Add New User
          </h1>
          <p className={s.pageSub}>Create a new user account</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/users" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Back to Users
          </Link>
        </div>
      </div>

      {error   && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {success && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />User created successfully! Redirecting…</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

        {/* Form */}
        <div className={s.card} style={{ marginBottom: 0 }}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>
              <span style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <i className="fas fa-user" style={{ fontSize: '0.75rem' }} />
              </span>
              User Information
            </span>
          </div>
          <div className={s.cardBody} style={{ padding: '1.25rem' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className={s.formLabel}>Username <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="text" className={s.formInput} name="username" value={formData.username} onChange={handleChange} required />
                </div>
                <div>
                  <label className={s.formLabel}>Email <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="email" className={s.formInput} name="email" value={formData.email} onChange={handleChange} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className={s.formLabel}>Password <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="password" className={s.formInput} name="password" value={formData.password} onChange={handleChange} required minLength={6} />
                </div>
                <div>
                  <label className={s.formLabel}>Confirm Password <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="password" className={s.formInput} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className={s.formLabel}>Role <span style={{ color: '#dc2626' }}>*</span></label>
                  <select className={s.formSelect} name="role_id" value={formData.role_id} onChange={handleChange} required>
                    <option value="">Select Role</option>
                    {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>Role determines permissions</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '0.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} style={{ width: 15, height: 15, accentColor: '#2563eb' }} />
                    Active User
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm" />Creating…</> : <><i className="fas fa-save" />Create User</>}
                </button>
                <Link href="/admin/dashboard/users" className={`${s.btn} ${s.btnOutline}`}>
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
                <li>Username must be unique</li>
                <li>Password must be at least 6 characters</li>
                <li>Email will be used for login</li>
                <li>Choose appropriate role for user</li>
              </ul>
            </div>
          </div>
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              <div className={`${s.alert} ${s.alertDanger}`} style={{ marginBottom: 0 }}>
                <i className="fas fa-shield-alt" />
                <span style={{ fontSize: '0.82rem' }}>Assign appropriate roles and permissions to maintain system security.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
