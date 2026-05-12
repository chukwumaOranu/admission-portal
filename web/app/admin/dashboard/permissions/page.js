'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { usePermissionsData } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

export default function PermissionsPage() {
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { permissions, loading, error, fetchPermissions } = usePermissionsData();
  const loadedRef = useRef(false);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchPermissions();
    }
  }, [status, session?.user?.id, fetchPermissions]);

  if (status === 'loading' || permLoading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  const groups = permissions.reduce((acc, p) => {
    const key = p.resource || 'general';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const resources = Object.keys(groups).sort();

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#ede9fe', color: '#7c3aed' }}><i className="fas fa-key" /></span>
            Permissions
          </h1>
          <p className={s.pageSub}>System-level permissions grouped by resource</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/rolePermissions" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-link" />Role Assignments
          </Link>
          {hasPermission('permission.create') && (
            <Link href="/admin/dashboard/permissions/add" className={`${s.btn} ${s.btnPrimary}`}>
              <i className="fas fa-plus" />Add Permission
            </Link>
          )}
        </div>
      </div>

      {error && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}</div>}

      {/* Stats */}
      <div className={s.statsGrid} style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total',     value: permissions.length,   icon: 'fas fa-key',       color: '#7c3aed' },
          { label: 'Resources', value: resources.length,     icon: 'fas fa-folder',    color: '#0891b2' },
          { label: 'Read',      value: permissions.filter(p => p.action === 'read').length,   icon: 'fas fa-eye',       color: '#059669' },
          { label: 'Write',     value: permissions.filter(p => ['create','update','delete'].includes(p.action)).length, icon: 'fas fa-edit', color: '#d97706' },
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

      {loading ? (
        <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>
      ) : permissions.length === 0 ? (
        <div className={s.card}>
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#ede9fe', color: '#7c3aed' }}><i className="fas fa-key" /></div>
            <div className={s.emptyTitle}>No Permissions Yet</div>
            <p className={s.emptySub}>Create your first permission to define access controls.</p>
            {hasPermission('permission.create') && (
              <Link href="/admin/dashboard/permissions/add" className={`${s.btn} ${s.btnPrimary}`}><i className="fas fa-plus" />Add Permission</Link>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {resources.map(resource => (
            <div key={resource} className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}>
                  <i className="fas fa-folder" style={{ color: '#0891b2' }} />
                  <span style={{ textTransform: 'capitalize' }}>{resource}</span>
                  <span className={`${s.badge} ${s.badgeInfo}`} style={{ marginLeft: '0.5rem' }}>{groups[resource].length}</span>
                </span>
              </div>

              {/* Desktop table */}
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: '1.25rem' }}>Name</th>
                      <th>Action</th>
                      <th>Description</th>
                      <th>Created</th>
                      <th style={{ paddingRight: '1.25rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups[resource].map(perm => (
                      <tr key={perm.id}>
                        <td style={{ paddingLeft: '1.25rem' }}>
                          <span className={s.tdName}>{perm.name}</span>
                        </td>
                        <td>
                          <span className={`${s.badge} ${
                            perm.action === 'read'   ? s.badgeInfo :
                            perm.action === 'create' ? s.badgeActive :
                            perm.action === 'update' ? s.badgeSubmitted :
                            perm.action === 'delete' ? s.badgeFailed :
                            s.badgeDraft
                          }`}>{perm.action || '—'}</span>
                        </td>
                        <td><span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{perm.description || <em style={{ color: '#d1d5db' }}>No description</em>}</span></td>
                        <td><span style={{ fontSize: '0.8rem', color: '#374151' }}>{perm.created_at ? new Date(perm.created_at).toLocaleDateString() : '—'}</span></td>
                        <td className={s.actionsCell} style={{ paddingRight: '1.25rem' }}>
                          <div className={s.actionBtns}>
                            {hasPermission('permission.update') && (
                              <Link href={`/admin/dashboard/permissions/edit/${perm.id}`} className={s.btnIcon} title="Edit">
                                <i className="fas fa-edit" />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className={s.mobileList}>
                {groups[resource].map(perm => (
                  <div key={perm.id} className={s.mobileCard}>
                    <div className={s.mobileCardHead}>
                      <span className={s.tdName}>{perm.name}</span>
                      <span className={`${s.badge} ${perm.action === 'read' ? s.badgeInfo : perm.action === 'create' ? s.badgeActive : perm.action === 'delete' ? s.badgeFailed : s.badgeSubmitted}`}>{perm.action || '—'}</span>
                    </div>
                    <div className={s.mobileCardBody}>
                      <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Description</span><span className={s.mobileCardVal}>{perm.description || '—'}</span></div>
                    </div>
                    {hasPermission('permission.update') && (
                      <div className={s.mobileCardFoot}>
                        <Link href={`/admin/dashboard/permissions/edit/${perm.id}`} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}><i className="fas fa-edit" />Edit</Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
