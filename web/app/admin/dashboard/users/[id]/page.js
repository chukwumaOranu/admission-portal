'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useUsers, useRoles } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

const fmtDt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function ViewUserPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { users, loading, fetchUsers, deleteUser } = useUsers();
  const { roles, fetchRoles } = useRoles();
  const [notice, setNotice] = useState('');
  const [error, setError]   = useState('');
  const loadedRef = useRef(false);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchUsers(); fetchRoles();
    }
  }, [status, session?.user?.id, fetchUsers, fetchRoles]);

  const user     = useMemo(() => users.find(u => u.id === parseInt(params.id, 10)) ?? null, [users, params.id]);
  const userRole = useMemo(() => user?.role_id ? roles.find(r => r.id === user.role_id) ?? null : null, [roles, user]);

  const handleDelete = () => {
    if (!window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    deleteUser(user.id);
    setNotice('User deleted.');
    setTimeout(() => router.replace('/admin/dashboard/users'), 1500);
  };

  if (status === 'loading' || permLoading || loading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('user.read')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to view user details.</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />User not found.</div>
        <Link href="/admin/dashboard/users" className={`${s.btn} ${s.btnOutline}`}><i className="fas fa-arrow-left" />Back to Users</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-user" /></span>
            User Details
          </h1>
          <p className={s.pageSub}>{user.username} — {user.email}</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/users" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Users
          </Link>
          {hasPermission('user.update') && (
            <Link href={`/admin/dashboard/users/${user.id}/edit`} className={`${s.btn} ${s.btnPrimary}`}>
              <i className="fas fa-edit" />Edit
            </Link>
          )}
          {hasPermission('user.delete') && (
            <button onClick={handleDelete} className={`${s.btn} ${s.btnDanger}`}>
              <i className="fas fa-trash" />Delete
            </button>
          )}
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

        {/* Basic info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <i className="fas fa-id-card" style={{ fontSize: '0.75rem' }} />
                </span>
                Basic Information
              </span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              {[
                { label: 'User ID',   value: user.id },
                { label: 'Username',  value: <code style={{ background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.85rem' }}>{user.username}</code> },
                { label: 'Email',     value: user.email },
                { label: 'Role',      value: user.role_name ? <span className={`${s.badge} ${s.badgeInfo}`}>{user.role_name}</span> : <span className={`${s.badge} ${s.badgeInactive}`}>No role</span> },
                { label: 'Status',    value: <span className={`${s.badge} ${user.is_active ? s.badgeActive : s.badgeInactive}`}>{user.is_active ? 'Active' : 'Inactive'}</span> },
                { label: 'Verified',  value: user.email_verified ? <span style={{ color: '#059669', fontSize: '0.85rem' }}><i className="fas fa-check-circle" style={{ marginRight: '0.3rem' }} />Yes</span> : <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}><i className="fas fa-times-circle" style={{ marginRight: '0.3rem' }} />No</span> },
                { label: 'Created',   value: fmtDt(user.created_at) },
                { label: 'Updated',   value: fmtDt(user.updated_at) },
              ].map(row => (
                <div key={row.label} className={s.infoRow}>
                  <span className={s.infoLabel}>{row.label}</span>
                  <span className={s.infoValue}>{row.value}</span>
                </div>
              ))}
              {user.temp_password && (
                <div className={`${s.alert} ${s.alertInfo}`} style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                  <i className="fas fa-exclamation-triangle" />
                  <span style={{ fontSize: '0.82rem' }}>This user has a temporary password and should update it on first login.</span>
                </div>
              )}
            </div>
          </div>

          {userRole && (
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#ede9fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                    <i className="fas fa-user-shield" style={{ fontSize: '0.75rem' }} />
                  </span>
                  Role Details
                </span>
              </div>
              <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
                {[
                  { label: 'Role Name',    value: userRole.name },
                  { label: 'Description', value: userRole.description || 'No description' },
                  { label: 'Status',      value: <span className={`${s.badge} ${userRole.is_active ? s.badgeActive : s.badgeInactive}`}>{userRole.is_active ? 'Active' : 'Inactive'}</span> },
                ].map(row => (
                  <div key={row.label} className={s.infoRow}>
                    <span className={s.infoLabel}>{row.label}</span>
                    <span className={s.infoValue}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-bolt" style={{ color: '#d97706' }} />Quick Actions</span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {hasPermission('user.update') && (
                <Link href={`/admin/dashboard/users/${user.id}/edit`} className={`${s.btn} ${s.btnPrimary}`} style={{ justifyContent: 'flex-start' }}>
                  <i className="fas fa-edit" />Edit User
                </Link>
              )}
              <Link href="/admin/dashboard/users/roles" className={`${s.btn} ${s.btnOutline}`} style={{ justifyContent: 'flex-start' }}>
                <i className="fas fa-user-tag" />Manage Roles
              </Link>
              {hasPermission('user.delete') && (
                <button onClick={handleDelete} className={`${s.btn} ${s.btnDanger}`} style={{ justifyContent: 'flex-start' }}>
                  <i className="fas fa-trash" />Delete User
                </button>
              )}
              <Link href="/admin/dashboard/users" className={`${s.btn} ${s.btnOutline}`} style={{ justifyContent: 'flex-start' }}>
                <i className="fas fa-arrow-left" />Back to List
              </Link>
            </div>
          </div>

          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-chart-bar" style={{ color: '#0891b2' }} />Account Status</span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              {[
                { label: 'Active',     value: user.is_active ? <span style={{ color: '#059669', fontWeight: 700 }}>Yes</span> : <span style={{ color: '#dc2626', fontWeight: 700 }}>No</span> },
                { label: 'Verified',   value: user.email_verified ? <span style={{ color: '#059669', fontWeight: 700 }}>Yes</span> : <span style={{ color: '#9ca3af', fontWeight: 700 }}>No</span> },
                { label: 'Has Role',   value: user.role_id ? <span style={{ color: '#059669', fontWeight: 700 }}>Yes</span> : <span style={{ color: '#d97706', fontWeight: 700 }}>No</span> },
              ].map(row => (
                <div key={row.label} className={s.infoRow}>
                  <span className={s.infoLabel}>{row.label}</span>
                  <span className={s.infoValue}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
