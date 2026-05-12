'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useDepartments } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

export default function DepartmentsPage() {
  const { data: session, status } = useSession();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const { departments, loading, error, fetchDepartments, deleteDepartment } = useDepartments();
  const [deleteLoading, setDeleteLoading] = useState(null);
  const loadedRef = useRef(false);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchDepartments();
    }
  }, [status, session?.user?.id, fetchDepartments]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      setDeleteLoading(id);
      deleteDepartment(id);
    } catch { alert('Failed to delete department'); }
    finally { setDeleteLoading(null); }
  };

  if (status === 'loading' || permissionsLoading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('department.read')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to view departments.</div>
      </div>
    );
  }

  const active   = departments.filter(d => d.is_active !== 0).length;
  const inactive = departments.filter(d => d.is_active === 0).length;

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#e0f2fe', color: '#0891b2' }}><i className="fas fa-building" /></span>
            Departments
          </h1>
          <p className={s.pageSub}>Manage organisational departments and units</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/employees" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Employees
          </Link>
          {hasPermission('department.create') && (
            <Link href="/admin/dashboard/employees/departments/add" className={`${s.btn} ${s.btnPrimary}`}>
              <i className="fas fa-plus" />Add Department
            </Link>
          )}
        </div>
      </div>

      {error && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}</div>}

      {/* Stats */}
      <div className={s.statsGrid} style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total',    value: departments.length, icon: 'fas fa-building',       color: '#0891b2' },
          { label: 'Active',   value: active,             icon: 'fas fa-check-circle',   color: '#059669' },
          { label: 'Inactive', value: inactive,           icon: 'fas fa-times-circle',   color: '#dc2626' },
          { label: 'Described',value: departments.filter(d => d.description).length, icon: 'fas fa-file-alt', color: '#7c3aed' },
        ].map(st => (
          <div key={st.label} className={s.statCard} style={{ '--accent': st.color }}>
            <div className={s.statInfo}>
              <div className={s.statLabel}>{st.label}</div>
              <div className={s.statNumber} style={{ color: st.color }}>{st.value}</div>
            </div>
            <div className={s.statIcon} style={{ background: `${st.color}18`, color: st.color }}>
              <i className={st.icon} />
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>
      ) : departments.length === 0 ? (
        <div className={s.card}>
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#e0f2fe', color: '#0891b2' }}><i className="fas fa-building" /></div>
            <div className={s.emptyTitle}>No Departments Yet</div>
            <p className={s.emptySub}>Create your first department to organise employees.</p>
            {hasPermission('department.create') && (
              <Link href="/admin/dashboard/employees/departments/add" className={`${s.btn} ${s.btnPrimary}`}><i className="fas fa-plus" />Add Department</Link>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {departments.map(dept => (
            <div key={dept.id} className={s.card} style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2', flexShrink: 0 }}>
                    <i className="fas fa-building" style={{ fontSize: '0.78rem' }} />
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e3a5f' }}>{dept.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {dept.code && <span className={`${s.badge} ${s.badgeInfo}`}>{dept.code}</span>}
                  <span className={`${s.badge} ${dept.is_active !== 0 ? s.badgeActive : s.badgeInactive}`}>
                    {dept.is_active !== 0 ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div style={{ padding: '0.875rem 1.25rem', flex: 1 }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, lineHeight: 1.6, minHeight: 40 }}>
                  {dept.description || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>No description</span>}
                </p>
              </div>
              <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #f0f4f8', display: 'flex', gap: '0.5rem' }}>
                <Link href={`/admin/dashboard/employees/departments/${dept.id}`} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} style={{ flex: 1, justifyContent: 'center' }}>
                  <i className="fas fa-eye" />View
                </Link>
                {hasPermission('department.update') && (
                  <Link href={`/admin/dashboard/employees/departments/${dept.id}/edit`} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} style={{ flex: 1, justifyContent: 'center' }}>
                    <i className="fas fa-edit" />Edit
                  </Link>
                )}
                {hasPermission('department.delete') && (
                  <button onClick={() => handleDelete(dept.id)} className={`${s.btnIcon} ${s.btnIconDanger}`} disabled={deleteLoading === dept.id} title="Delete">
                    {deleteLoading === dept.id ? <span className="spinner-border spinner-border-sm" /> : <i className="fas fa-trash" />}
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
