'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useEmployees, useUsers } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

const fmtDt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function ViewEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { employees, loading: empLoading, fetchEmployees, deleteEmployee, createEmployeeLogin } = useEmployees();
  const { users, fetchUsers } = useUsers();

  const [deleting, setDeleting]           = useState(false);
  const [creatingLogin, setCreatingLogin] = useState(false);
  const [error, setError]                 = useState('');
  const [notice, setNotice]               = useState('');
  const loadedRef = useRef(false);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchEmployees(); fetchUsers();
    }
  }, [status, session?.user?.id, fetchEmployees, fetchUsers]);

  const employee    = useMemo(() => employees.find(e => e.id === parseInt(params.id, 10)) ?? null, [employees, params.id]);
  const userDetails = useMemo(() => employee?.user_id ? users.find(u => u.id === employee.user_id) ?? null : null, [users, employee]);

  const handleDelete = () => {
    if (!window.confirm('Delete this employee? This cannot be undone.')) return;
    setDeleting(true);
    deleteEmployee(params.id);
    setNotice('Employee deleted.');
    setTimeout(() => router.push('/admin/dashboard/employees'), 1500);
  };

  const handleCreateLogin = async () => {
    if (!employee.email) { setError('Employee must have an email address to create a login'); return; }
    if (employee.user_id) { setError('Employee already has a user account'); return; }
    if (!window.confirm(`Create login for ${employee.first_name} ${employee.last_name}?`)) return;
    try {
      setCreatingLogin(true); setError('');
      createEmployeeLogin(params.id, false);
      setNotice('Login account created successfully.');
      fetchEmployees(); fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to create login account');
    } finally { setCreatingLogin(false); }
  };

  if (status === 'loading' || permLoading || empLoading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('employee.read')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to view employee details.</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />Employee not found.</div>
        <Link href="/admin/dashboard/employees" className={`${s.btn} ${s.btnOutline}`}><i className="fas fa-arrow-left" />Back to Employees</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#e0f2fe', color: '#0891b2' }}><i className="fas fa-user" /></span>
            Employee Details
          </h1>
          <p className={s.pageSub}>{employee.first_name} {employee.last_name}</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/employees" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Employees
          </Link>
          {hasPermission('employee.update') && (
            <Link href={`/admin/dashboard/employees/${params.id}/edit`} className={`${s.btn} ${s.btnPrimary}`}>
              <i className="fas fa-edit" />Edit
            </Link>
          )}
          {hasPermission('employee.delete') && (
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

          {/* Employee info */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2' }}>
                  <i className="fas fa-id-badge" style={{ fontSize: '0.75rem' }} />
                </span>
                Employee Information
              </span>
              <span className={`${s.badge} ${employee.status === 'active' ? s.badgeActive : s.badgeInactive}`}>{employee.status}</span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              {[
                { label: 'Employee ID',       value: employee.employee_id || '—' },
                { label: 'First Name',        value: employee.first_name },
                { label: 'Last Name',         value: employee.last_name },
                { label: 'Email',             value: employee.email || 'Not provided' },
                { label: 'Phone',             value: employee.phone || 'Not provided' },
                { label: 'Department',        value: employee.department_name || employee.department || 'Unassigned' },
                { label: 'Position',          value: employee.position || 'Not specified' },
                { label: 'Employment Date',   value: employee.employment_date ? new Date(employee.employment_date).toLocaleDateString() : '—' },
                { label: 'Created',           value: fmtDt(employee.created_at) },
                { label: 'Updated',           value: fmtDt(employee.updated_at) },
              ].map(row => (
                <div key={row.label} className={s.infoRow}>
                  <span className={s.infoLabel}>{row.label}</span>
                  <span className={s.infoValue}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Access */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: '#d1fae5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <i className="fas fa-user-lock" style={{ fontSize: '0.75rem' }} />
                </span>
                System Access
              </span>
              <span className={`${s.badge} ${employee.user_id ? s.badgeActive : s.badgeInactive}`}>{employee.user_id ? 'Has Login' : 'No Login'}</span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              {employee.user_id && userDetails ? (
                <>
                  <div className={`${s.alert} ${s.alertSuccess}`} style={{ marginBottom: '0.75rem' }}>
                    <i className="fas fa-check-circle" />
                    <span style={{ fontSize: '0.82rem' }}>This employee has an active user account and can log into the system.</span>
                  </div>
                  {[
                    { label: 'Username',       value: <code style={{ background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.82rem' }}>{userDetails.username}</code> },
                    { label: 'Account Status', value: <span className={`${s.badge} ${userDetails.is_active ? s.badgeActive : s.badgeInactive}`}>{userDetails.is_active ? 'Active' : 'Inactive'}</span> },
                    { label: 'Role',           value: userDetails.role_name ? <span className={`${s.badge} ${s.badgeInfo}`}>{userDetails.role_name}</span> : <span style={{ color: '#9ca3af', fontSize: '0.82rem' }}>No role assigned</span> },
                    { label: 'Email Verified', value: <span className={`${s.badge} ${userDetails.email_verified ? s.badgeActive : s.badgePending}`}>{userDetails.email_verified ? 'Verified' : 'Unverified'}</span> },
                  ].map(row => (
                    <div key={row.label} className={s.infoRow}>
                      <span className={s.infoLabel}>{row.label}</span>
                      <span className={s.infoValue}>{row.value}</span>
                    </div>
                  ))}
                  <div className={`${s.alert} ${s.alertInfo}`} style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                    <i className="fas fa-info-circle" />
                    <span style={{ fontSize: '0.78rem' }}>To assign or change the role, go to User Management → User Roles.</span>
                  </div>
                </>
              ) : (
                <div className={s.emptyState} style={{ padding: '1.5rem 0' }}>
                  <div className={s.emptyIcon} style={{ background: '#f1f5f9', color: '#9ca3af' }}><i className="fas fa-user-slash" /></div>
                  <div className={s.emptyTitle}>No System Access</div>
                  <p className={s.emptySub}>This employee does not have a user account.</p>
                  {employee.email && hasPermission('user.create') && (
                    <button onClick={handleCreateLogin} className={`${s.btn} ${s.btnPrimary}`} disabled={creatingLogin}>
                      {creatingLogin ? <><span className="spinner-border spinner-border-sm" />Creating…</> : <><i className="fas fa-user-plus" />Create Login Account</>}
                    </button>
                  )}
                  {!employee.email && (
                    <div className={`${s.alert} ${s.alertDanger}`} style={{ marginTop: '0.75rem' }}>
                      <i className="fas fa-exclamation-triangle" />
                      <span style={{ fontSize: '0.82rem' }}>Email address required to create login account.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-bolt" style={{ color: '#d97706' }} />Quick Actions</span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {hasPermission('employee.update') && (
                <Link href={`/admin/dashboard/employees/${params.id}/edit`} className={`${s.btn} ${s.btnPrimary}`} style={{ justifyContent: 'flex-start' }}>
                  <i className="fas fa-edit" />Edit Employee
                </Link>
              )}
              {employee.user_id && hasPermission('role.assign') && (
                <Link href="/admin/dashboard/users/roles" className={`${s.btn} ${s.btnOutline}`} style={{ justifyContent: 'flex-start' }}>
                  <i className="fas fa-user-tag" />Assign Role
                </Link>
              )}
              {!employee.user_id && employee.email && hasPermission('user.create') && (
                <button onClick={handleCreateLogin} className={`${s.btn} ${s.btnGreen}`} style={{ justifyContent: 'flex-start' }} disabled={creatingLogin}>
                  <i className="fas fa-user-plus" />Create Login
                </button>
              )}
              {hasPermission('employee.delete') && (
                <button onClick={handleDelete} className={`${s.btn} ${s.btnDanger}`} style={{ justifyContent: 'flex-start' }} disabled={deleting}>
                  <i className="fas fa-trash" />Delete Employee
                </button>
              )}
              <Link href="/admin/dashboard/employees" className={`${s.btn} ${s.btnOutline}`} style={{ justifyContent: 'flex-start' }}>
                <i className="fas fa-arrow-left" />Back to List
              </Link>
            </div>
          </div>

          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-chart-bar" style={{ color: '#0891b2' }} />Summary</span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              {[
                { label: 'Status',     value: <span className={`${s.badge} ${employee.status === 'active' ? s.badgeActive : s.badgeInactive}`}>{employee.status}</span> },
                { label: 'Has Login',  value: employee.user_id ? <span style={{ color: '#059669', fontWeight: 700 }}>Yes</span> : <span style={{ color: '#9ca3af', fontWeight: 700 }}>No</span> },
                { label: 'Department', value: employee.department_name || '—' },
                { label: 'Position',   value: employee.position || '—' },
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
