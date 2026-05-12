'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useUsers, useRoles } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { users, loading, fetchUsers, updateUser } = useUsers();
  const { roles, fetchRoles } = useRoles();

  const [formData, setFormData] = useState({
    username: '', email: '', role_id: '', is_active: true, email_verified: false,
  });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [notice, setNotice]   = useState('');
  const loadedRef = useRef(false);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchUsers(); fetchRoles();
    }
  }, [status, session?.user?.id, fetchUsers, fetchRoles]);

  useEffect(() => {
    if (users.length > 0 && params.id) {
      const u = users.find(x => x.id === parseInt(params.id));
      if (u) setFormData({ username: u.username || '', email: u.email || '', role_id: u.role_id || '', is_active: u.is_active ?? true, email_verified: u.email_verified ?? false });
    }
  }, [users, params.id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setNotice('');
    updateUser(parseInt(params.id), formData);
    setNotice('User updated successfully!');
    setTimeout(() => router.push(`/admin/dashboard/users/${params.id}`), 1500);
    setSaving(false);
  };

  if (status === 'loading' || permLoading || loading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('user.update')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to edit users.</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-user-edit" /></span>
            Edit User
          </h1>
          <p className={s.pageSub}>Update user information</p>
        </div>
        <div className={s.pageActions}>
          <Link href={`/admin/dashboard/users/${params.id}`} className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Back
          </Link>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

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
              <div style={{ marginBottom: '1rem' }}>
                <label className={s.formLabel}>Username <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="text" className={s.formInput} name="username" value={formData.username} onChange={handleChange} required disabled={saving} />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>Unique username for login</p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className={s.formLabel}>Email <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="email" className={s.formInput} name="email" value={formData.email} onChange={handleChange} required disabled={saving} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className={s.formLabel}>Role</label>
                <select className={s.formSelect} name="role_id" value={formData.role_id} onChange={handleChange} disabled={saving}>
                  <option value="">— No Role —</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} style={{ width: 15, height: 15, accentColor: '#2563eb' }} disabled={saving} />
                  Active User
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                  <input type="checkbox" name="email_verified" checked={formData.email_verified} onChange={handleChange} style={{ width: 15, height: 15, accentColor: '#059669' }} disabled={saving} />
                  Email Verified
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm" />Saving…</> : <><i className="fas fa-save" />Save Changes</>}
                </button>
                <button type="button" className={`${s.btn} ${s.btnOutline}`} onClick={() => router.back()} disabled={saving}>
                  <i className="fas fa-times" />Cancel
                </button>
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
                <li><strong>Username:</strong> Must be unique in the system</li>
                <li><strong>Email:</strong> Must be unique in the system</li>
                <li><strong>Role:</strong> Determines user permissions</li>
                <li><strong>Active:</strong> Inactive users cannot log in</li>
                <li><strong>Password:</strong> Use Reset Password to change</li>
              </ul>
            </div>
          </div>

          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-key" style={{ color: '#d97706' }} />Password</span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.75rem' }}>Password management is handled separately for security.</p>
              <button
                type="button"
                className={`${s.btn} ${s.btnOutline}`}
                onClick={() => setNotice('Password reset feature coming soon.')}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <i className="fas fa-key" />Reset Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
