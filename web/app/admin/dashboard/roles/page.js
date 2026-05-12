'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRoles } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function RolesPage() {
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { roles, loading, error, fetchRoles, deleteRole } = useRoles();
  const loadedRef = useRef(false);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchRoles();
    }
  }, [status, session?.user?.id, fetchRoles]);

  const handleDelete = (id) => {
    if (!window.confirm('Delete this role? This may affect users assigned to it.')) return;
    deleteRole(id);
  };

  if (status === 'loading' || permLoading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#fef3c7', color: '#d97706' }}><i className="fas fa-user-shield" /></span>
            Roles
          </h1>
          <p className={s.pageSub}>Define roles to group permissions and control user access</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/rolePermissions" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-link" />Role Permissions
          </Link>
          {hasPermission('role.create') && (
            <Link href="/admin/dashboard/roles/add" className={`${s.btn} ${s.btnPrimary}`}>
              <i className="fas fa-plus" />Add Role
            </Link>
          )}
        </div>
      </div>

      {error && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}</div>}

      {/* Stats */}
      <div className={s.statsGrid} style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Roles',  value: roles?.length || 0,          icon: 'fas fa-user-shield', color: '#d97706' },
          { label: 'Active',       value: roles?.length || 0,           icon: 'fas fa-check-circle',color: '#059669' },
          { label: 'Permissions',  value: '—',                          icon: 'fas fa-key',         color: '#7c3aed' },
          { label: 'Users Assigned',value: '—',                         icon: 'fas fa-users',       color: '#2563eb' },
        ].map(st => (
          <div key={st.label} className={s.statCard} style={{ '--accent': st.color, cursor: 'default' }}>
            <div className={s.statInfo}>
              <div className={s.statLabel}>{st.label}</div>
              <div className={s.statNumber} style={{ color: st.color }}>{st.value}</div>
            </div>
            <div className={s.statIcon} style={{ background: `${st.color}18`, color: st.color }}><i className={st.icon} /></div>
          </div>
        ))}
      </div>

      {/* Roles grid */}
      {loading ? (
        <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>
      ) : !roles?.length ? (
        <div className={s.card}>
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#fef3c7', color: '#d97706' }}><i className="fas fa-user-shield" /></div>
            <div className={s.emptyTitle}>No Roles Yet</div>
            <p className={s.emptySub}>Create your first role to start managing user access.</p>
            {hasPermission('role.create') && (
              <Link href="/admin/dashboard/roles/add" className={`${s.btn} ${s.btnPrimary}`}><i className="fas fa-plus" />Add Role</Link>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {roles.map(role => (
            <div key={role.id} className={s.card} style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
              {/* Card header */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                    <i className="fas fa-shield-alt" style={{ fontSize: '0.78rem' }} />
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e3a5f' }}>{role.name}</span>
                </div>
                <span className={`${s.badge} ${s.badgeActive}`}>Active</span>
              </div>

              {/* Card body */}
              <div style={{ padding: '0.875rem 1.25rem', flex: 1 }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem', lineHeight: 1.5, minHeight: 40 }}>
                  {role.description || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>No description</span>}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#9ca3af' }}>
                  <i className="fas fa-calendar" />
                  Created {fmt(role.created_at)}
                </div>
              </div>

              {/* Card footer */}
              <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #f0f4f8', display: 'flex', gap: '0.4rem' }}>
                <Link href={`/admin/dashboard/roles/permissions/${role.id}`} className={`${s.btn} ${s.btnGreen} ${s.btnSm}`} style={{ flex: 1, justifyContent: 'center' }}>
                  <i className="fas fa-key" />Permissions
                </Link>
                {hasPermission('role.update') && (
                  <Link href={`/admin/dashboard/roles/edit/${role.id}`} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}>
                    <i className="fas fa-edit" />Edit
                  </Link>
                )}
                {hasPermission('role.delete') && (
                  <button onClick={() => handleDelete(role.id)} className={`${s.btnIcon} ${s.btnIconDanger}`} title="Delete">
                    <i className="fas fa-trash" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
