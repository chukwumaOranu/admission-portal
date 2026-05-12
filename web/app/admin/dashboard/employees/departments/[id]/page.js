'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { API_ENDPOINTS, apiService } from '@/services/api';
import s from '@/styles/admin-portal.module.css';

const fmtDt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function ViewDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();

  const [dept, setDept]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState('');
  const [notice, setNotice]     = useState('');
  const loadedRef = useRef(false);

  const fetchDept = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const res = await apiService.get(API_ENDPOINTS.DEPARTMENTS.GET_BY_ID(params.id));
      setDept(res.data);
    } catch { setError('Failed to load department details'); }
    finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && params.id && !loadedRef.current) {
      loadedRef.current = true; fetchDept();
    }
  }, [status, session?.user?.id, params.id, fetchDept]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this department? This cannot be undone.')) return;
    try {
      setDeleting(true);
      await apiService.delete(API_ENDPOINTS.DEPARTMENTS.DELETE(params.id));
      setNotice('Department deleted.');
      setTimeout(() => router.push('/admin/dashboard/employees/departments'), 1500);
    } catch { setError('Failed to delete department'); setDeleting(false); }
  };

  if (status === 'loading' || permLoading || loading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('department.read')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to view department details.</div>
      </div>
    );
  }

  if (error || !dept) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error || 'Department not found.'}</div>
        <Link href="/admin/dashboard/employees/departments" className={`${s.btn} ${s.btnOutline}`} style={{ marginTop: '0.75rem' }}><i className="fas fa-arrow-left" />Back to Departments</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#e0f2fe', color: '#0891b2' }}><i className="fas fa-building" /></span>
            Department Details
          </h1>
          <p className={s.pageSub}>{dept.name}</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/employees/departments" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Departments
          </Link>
          {hasPermission('department.update') && (
            <Link href={`/admin/dashboard/employees/departments/${params.id}/edit`} className={`${s.btn} ${s.btnPrimary}`}>
              <i className="fas fa-edit" />Edit
            </Link>
          )}
          {hasPermission('department.delete') && (
            <button onClick={handleDelete} className={`${s.btn} ${s.btnDanger}`} disabled={deleting}>
              {deleting ? <><span className="spinner-border spinner-border-sm" />Deleting…</> : <><i className="fas fa-trash" />Delete</>}
            </button>
          )}
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

        {/* Main info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2' }}>
                  <i className="fas fa-info-circle" style={{ fontSize: '0.75rem' }} />
                </span>
                Department Information
              </span>
              <span className={`${s.badge} ${dept.is_active ? s.badgeActive : s.badgeInactive}`}>{dept.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              {[
                { label: 'Name',        value: dept.name },
                { label: 'Code',        value: dept.code ? <span className={`${s.badge} ${s.badgeInfo}`}>{dept.code}</span> : '—' },
                { label: 'Description', value: dept.description || 'No description provided' },
                { label: 'Created',     value: fmtDt(dept.created_at) },
                { label: 'Updated',     value: fmtDt(dept.updated_at) },
              ].map(row => (
                <div key={row.label} className={s.infoRow}>
                  <span className={s.infoLabel}>{row.label}</span>
                  <span className={s.infoValue}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className={s.statsGrid} style={{ margin: 0 }}>
            {[
              { label: 'Employees', value: dept.employee_count ?? 0, icon: 'fas fa-users',        color: '#0891b2' },
              { label: 'Status',    value: dept.is_active ? 'Active' : 'Inactive', icon: 'fas fa-check-circle', color: dept.is_active ? '#059669' : '#64748b', isText: true },
            ].map(st => (
              <div key={st.label} className={s.statCard} style={{ '--accent': st.color, cursor: 'default' }}>
                <div className={s.statInfo}>
                  <div className={s.statLabel}>{st.label}</div>
                  <div className={s.statNumber} style={{ color: st.color, fontSize: st.isText ? '1rem' : undefined }}>{st.value}</div>
                </div>
                <div className={s.statIcon} style={{ background: `${st.color}18`, color: st.color }}><i className={st.icon} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-bolt" style={{ color: '#d97706' }} />Quick Actions</span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {hasPermission('department.update') && (
                <Link href={`/admin/dashboard/employees/departments/${params.id}/edit`} className={`${s.btn} ${s.btnPrimary}`} style={{ justifyContent: 'flex-start' }}>
                  <i className="fas fa-edit" />Edit Department
                </Link>
              )}
              <Link href={`/admin/dashboard/employees?department=${dept.id}`} className={`${s.btn} ${s.btnOutline}`} style={{ justifyContent: 'flex-start' }}>
                <i className="fas fa-users" />View Employees ({dept.employee_count ?? 0})
              </Link>
              {hasPermission('department.delete') && (
                <button onClick={handleDelete} className={`${s.btn} ${s.btnDanger}`} style={{ justifyContent: 'flex-start' }} disabled={deleting}>
                  <i className="fas fa-trash" />Delete Department
                </button>
              )}
              <Link href="/admin/dashboard/employees/departments" className={`${s.btn} ${s.btnOutline}`} style={{ justifyContent: 'flex-start' }}>
                <i className="fas fa-arrow-left" />Back to List
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
