'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useEmployees, useUsers } from '@/hooks/useRedux';
import CredentialsModal from '@/components/CredentialsModal';
import s from '@/styles/admin-portal.module.css';

const initials = (f, l) => `${(f||'')[0]||''}${(l||'')[0]||''}`.toUpperCase() || '?';

export default function EmployeesPage() {
  const { status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { employees, loading, error, fetchEmployees, deleteEmployee, createEmployeeLogin } = useEmployees();
  const { users, fetchUsers } = useUsers();

  const [search, setSearch] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [showCreds, setShowCreds] = useState(false);
  const [creds, setCreds] = useState(null);
  const [credsName, setCredsName] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [loginDetails, setLoginDetails] = useState(null);

  useEffect(() => {
    if (status === 'authenticated') { fetchEmployees(); fetchUsers(); }
  }, [status, fetchEmployees, fetchUsers]);

  const filtered = employees.filter(e => {
    if (!e) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return [e.first_name, e.last_name, e.employee_id, e.email, e.department_name, e.position]
      .filter(Boolean).join(' ').toLowerCase().includes(q);
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try { setDeleteLoading(id); deleteEmployee(id); }
    catch { alert('Failed to delete employee'); }
    finally { setDeleteLoading(null); }
  };

  const handleCreateLogin = async (emp) => {
    if (!emp.email) { alert('Employee needs an email address.'); return; }
    if (emp.user_id) { alert('Employee already has a login account.'); return; }
    if (!window.confirm(`Create login for ${emp.first_name} ${emp.last_name}?`)) return;
    try {
      const result = createEmployeeLogin(emp.id, false);
      const r = result.payload;
      if (r?.userAccount?.created) {
        localStorage.setItem(`employee_creds_${emp.id}`, JSON.stringify({ username: r.userAccount.username, password: r.userAccount.password, email: r.userAccount.email, createdAt: new Date().toISOString() }));
        setCreds(r.userAccount); setCredsName(`${emp.first_name} ${emp.last_name}`);
        setShowCreds(true); fetchEmployees();
      }
    } catch (e) { alert(e.message || 'Failed to create login'); }
  };

  const handleViewLogin = (emp) => {
    if (!emp.user_id) { alert('No user account yet.'); return; }
    const user = users.find(u => u.id === emp.user_id);
    if (!user) { alert('User account not found.'); return; }
    const stored = localStorage.getItem(`employee_creds_${emp.id}`);
    let pwd = null;
    if (stored) { try { pwd = JSON.parse(stored).password; } catch {} }
    setLoginDetails({ employee: emp, user: { ...user, temp_password: pwd || user.temp_password } });
    setShowLogin(true);
  };

  const handleDownloadCreds = () => {
    if (!loginDetails) return;
    const { employee: e, user: u } = loginDetails;
    const txt = `EMPLOYEE LOGIN CREDENTIALS\n\nName: ${e.first_name} ${e.last_name}\nEmployee ID: ${e.employee_id}\nEmail: ${e.email}\nDepartment: ${e.department_name || 'N/A'}\nPosition: ${e.position || 'N/A'}\n\nUsername: ${u.username}\nPassword: ${u.temp_password || '[Contact admin to reset]'}\nStatus: ${u.is_active ? 'Active' : 'Inactive'}\n\nGenerated: ${new Date().toLocaleString()}`;
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${e.employee_id}_credentials.txt`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const counts = {
    total:    employees.filter(Boolean).length,
    active:   employees.filter(e => e?.status === 'active').length,
    withLogin:employees.filter(e => e?.user_id).length,
    noAccess: employees.filter(e => e && !e.user_id).length,
  };

  if (status === 'loading' || permLoading) return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;

  const STATS = [
    { label: 'Total',      value: counts.total,     icon: 'fas fa-users',        color: '#2563eb', bg: '#eff6ff' },
    { label: 'Active',     value: counts.active,    icon: 'fas fa-check-circle', color: '#059669', bg: '#d1fae5' },
    { label: 'With Login', value: counts.withLogin, icon: 'fas fa-user-lock',    color: '#0891b2', bg: '#e0f2fe' },
    { label: 'No Access',  value: counts.noAccess,  icon: 'fas fa-user-slash',   color: '#64748b', bg: '#f1f5f9' },
  ];

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      <CredentialsModal isOpen={showCreds} onClose={() => setShowCreds(false)} credentials={creds} employeeName={credsName} />

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#e0f2fe', color: '#0891b2' }}><i className="fas fa-users-cog" /></span>
            Employees
          </h1>
          <p className={s.pageSub}>Manage employee records and portal access</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/employees/departments" className={`${s.btn} ${s.btnOutline}`}><i className="fas fa-building" />Departments</Link>
          <Link href="/admin/dashboard/employees/schemas" className={`${s.btn} ${s.btnOutline}`}><i className="fas fa-list" />Schemas</Link>
          {hasPermission('employee.create') && (
            <Link href="/admin/dashboard/employees/add" className={`${s.btn} ${s.btnPrimary}`}><i className="fas fa-plus" />Add Employee</Link>
          )}
        </div>
      </div>

      {error && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}</div>}

      {/* Stats */}
      <div className={s.statsGrid} style={{ marginBottom: '1.5rem' }}>
        {STATS.map(st => (
          <div key={st.label} className={s.statCard} style={{ '--accent': st.color, cursor: 'default' }}>
            <div className={s.statInfo}>
              <div className={s.statLabel}>{st.label}</div>
              <div className={s.statNumber} style={{ color: st.color }}>{st.value}</div>
            </div>
            <div className={s.statIcon} style={{ background: st.bg, color: st.color }}><i className={st.icon} /></div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className={s.card} style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', padding: '0.875rem 1.25rem', borderBottom: '1px solid #f0f4f8' }}>
          <span className={s.cardTitle}><i className="fas fa-list" style={{ color: '#2563eb' }} />Employee List <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '0.8rem' }}>({filtered.length})</span></span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div className={s.searchWrap} style={{ maxWidth: 220 }}>
              <i className={`fas fa-search ${s.searchIcon}`} />
              <input className={s.searchInput} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={fetchEmployees} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} disabled={loading}><i className="fas fa-sync" /></button>
          </div>
        </div>

        {loading ? (
          <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>
        ) : filtered.length === 0 ? (
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#e0f2fe', color: '#0891b2' }}><i className="fas fa-users" /></div>
            <div className={s.emptyTitle}>No Employees Found</div>
            <p className={s.emptySub}>{search ? 'No employees match your search.' : 'Add your first employee to get started.'}</p>
            {!search && hasPermission('employee.create') && <Link href="/admin/dashboard/employees/add" className={`${s.btn} ${s.btnPrimary}`}><i className="fas fa-plus" />Add Employee</Link>}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '1.25rem' }}>Employee ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Status</th>
                    <th>Login</th>
                    <th style={{ paddingRight: '1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(emp => (
                    <tr key={emp.id}>
                      <td style={{ paddingLeft: '1.25rem' }}><span className={s.tdMono}>{emp.employee_id}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={s.tdAvatar}>{initials(emp.first_name, emp.last_name)}</span>
                          <span className={s.tdName}>{emp.first_name} {emp.last_name}</span>
                        </div>
                      </td>
                      <td><span className={s.tdEmail}>{emp.email || '—'}</span></td>
                      <td><span style={{ fontSize: '0.85rem', color: '#374151' }}>{emp.department_name || emp.department || 'Unassigned'}</span></td>
                      <td><span style={{ fontSize: '0.85rem', color: '#374151' }}>{emp.position || '—'}</span></td>
                      <td><span className={`${s.badge} ${emp.status === 'active' ? s.badgeActive : s.badgeInactive}`}>{emp.status || 'N/A'}</span></td>
                      <td>
                        {emp.user_id
                          ? <button onClick={() => handleViewLogin(emp)} className={`${s.badge} ${s.badgePaid}`} style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><i className="fas fa-check-circle" style={{ fontSize: '0.65rem' }} />Has Login</button>
                          : <span className={`${s.badge} ${s.badgeInactive}`}><i className="fas fa-times-circle" style={{ fontSize: '0.65rem' }} /> No Access</span>
                        }
                      </td>
                      <td className={s.actionsCell} style={{ paddingRight: '1.25rem' }}>
                        <div className={s.actionBtns}>
                          {!emp.user_id && emp.email && hasPermission('user.create') && (
                            <button className={`${s.btnIcon} ${s.btnIconGreen}`} title="Create Login" onClick={() => handleCreateLogin(emp)}><i className="fas fa-user-plus" /></button>
                          )}
                          <Link href={`/admin/dashboard/employees/${emp.id}`} className={s.btnIcon} title="View"><i className="fas fa-eye" /></Link>
                          {hasPermission('employee.update') && <Link href={`/admin/dashboard/employees/${emp.id}/edit`} className={s.btnIcon} title="Edit"><i className="fas fa-edit" /></Link>}
                          {hasPermission('employee.delete') && (
                            <button className={`${s.btnIcon} ${s.btnIconDanger}`} title="Delete" onClick={() => handleDelete(emp.id)} disabled={deleteLoading === emp.id}>
                              {deleteLoading === emp.id ? <span className="spinner-border spinner-border-sm" /> : <i className="fas fa-trash" />}
                            </button>
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
              {filtered.map(emp => (
                <div key={emp.id} className={s.mobileCard}>
                  <div className={s.mobileCardHead}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={s.tdAvatar}>{initials(emp.first_name, emp.last_name)}</span>
                      <div>
                        <div className={s.tdName}>{emp.first_name} {emp.last_name}</div>
                        <span className={s.tdMono} style={{ fontSize: '0.72rem' }}>{emp.employee_id}</span>
                      </div>
                    </div>
                    <span className={`${s.badge} ${emp.status === 'active' ? s.badgeActive : s.badgeInactive}`}>{emp.status || 'N/A'}</span>
                  </div>
                  <div className={s.mobileCardBody}>
                    <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Email</span><span className={s.mobileCardVal}>{emp.email || '—'}</span></div>
                    <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Department</span><span className={s.mobileCardVal}>{emp.department_name || 'Unassigned'}</span></div>
                    <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Position</span><span className={s.mobileCardVal}>{emp.position || '—'}</span></div>
                    <div className={s.mobileCardRow}>
                      <span className={s.mobileCardKey}>Login</span>
                      {emp.user_id ? <span className={`${s.badge} ${s.badgePaid}`}><i className="fas fa-check-circle" style={{ fontSize: '0.65rem' }} /> Active</span> : <span className={`${s.badge} ${s.badgeInactive}`}>No Access</span>}
                    </div>
                  </div>
                  <div className={s.mobileCardFoot}>
                    <Link href={`/admin/dashboard/employees/${emp.id}`} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}><i className="fas fa-eye" />View</Link>
                    {hasPermission('employee.update') && <Link href={`/admin/dashboard/employees/${emp.id}/edit`} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}><i className="fas fa-edit" />Edit</Link>}
                    {!emp.user_id && emp.email && hasPermission('user.create') && <button onClick={() => handleCreateLogin(emp)} className={`${s.btn} ${s.btnGreen} ${s.btnSm}`}><i className="fas fa-user-plus" />Login</button>}
                    {hasPermission('employee.delete') && <button onClick={() => handleDelete(emp.id)} disabled={deleteLoading === emp.id} className={`${s.btn} ${s.btnDanger} ${s.btnSm}`}><i className="fas fa-trash" />Delete</button>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {filtered.length > 0 && <div className={s.cardFooter}><span>Showing <strong>{filtered.length}</strong> of <strong>{employees.filter(Boolean).length}</strong> employees</span></div>}
      </div>

      {/* Login Details Modal */}
      {showLogin && loginDetails && (
        <div className={s.modalOverlay} onClick={() => setShowLogin(false)}>
          <div className={`${s.modal} ${s.modalLg}`} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <div className={s.modalTitle}><span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-user-lock" /></span>Login Details</div>
              <button className={s.modalClose} onClick={() => setShowLogin(false)}>×</button>
            </div>
            <div className={s.modalBody}>
              {/* Employee info */}
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px', marginBottom: '0.625rem' }}>Employee</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[['Name', `${loginDetails.employee.first_name} ${loginDetails.employee.last_name}`], ['Employee ID', loginDetails.employee.employee_id], ['Email', loginDetails.employee.email], ['Department', loginDetails.employee.department_name || 'N/A']].map(([k, v]) => (
                    <div key={k}><div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '2px' }}>{k}</div><div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>{v}</div></div>
                  ))}
                </div>
              </div>
              {/* Credentials */}
              <div style={{ border: '1.5px solid #bbf7d0', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{ background: '#059669', padding: '0.625rem 1rem' }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}><i className="fas fa-key me-2" />Portal Credentials</span>
                </div>
                <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  {[['Username', loginDetails.user.username], ['Email', loginDetails.user.email]].map(([lbl, val]) => (
                    <div key={lbl}>
                      <div className={s.formLabel}>{lbl}</div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input readOnly value={val} className={s.formInput} style={{ flex: 1 }} />
                        <button onClick={() => navigator.clipboard.writeText(val)} className={`${s.btnIcon}`} title="Copy"><i className="fas fa-copy" /></button>
                      </div>
                    </div>
                  ))}
                  <div>
                    <div className={s.formLabel}>Password</div>
                    {loginDetails.user.temp_password
                      ? <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input readOnly value={loginDetails.user.temp_password} className={s.formInput} style={{ flex: 1, fontFamily: 'monospace' }} />
                          <button onClick={() => navigator.clipboard.writeText(loginDetails.user.temp_password)} className={s.btnIcon} title="Copy"><i className="fas fa-copy" /></button>
                        </div>
                      : <div className={`${s.alert} ${s.alertWarning}`} style={{ margin: 0, padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}><i className="fas fa-exclamation-triangle" />Not available — contact admin to reset</div>
                    }
                  </div>
                  <div>
                    <div className={s.formLabel}>Account Status</div>
                    <span className={`${s.badge} ${loginDetails.user.is_active ? s.badgeActive : s.badgeInactive}`}>{loginDetails.user.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                {loginDetails.user.temp_password
                  ? <div className={`${s.alert} ${s.alertSuccess}`} style={{ margin: '0 1rem 1rem', fontSize: '0.82rem' }}><i className="fas fa-check-circle" />Password available — copy or download and share securely.</div>
                  : <div className={`${s.alert} ${s.alertWarning}`} style={{ margin: '0 1rem 1rem', fontSize: '0.82rem' }}><i className="fas fa-exclamation-triangle" />Password was not stored. Reset it from User Management.</div>
                }
              </div>
            </div>
            <div className={s.modalFooter}>
              <button onClick={() => { navigator.clipboard.writeText(`${loginDetails.employee.first_name} ${loginDetails.employee.last_name}\nUsername: ${loginDetails.user.username}\nPassword: ${loginDetails.user.temp_password || '[N/A]'}`); }} className={`${s.btn} ${s.btnOutline}`}><i className="fas fa-copy" />Copy</button>
              <button onClick={handleDownloadCreds} className={`${s.btn} ${s.btnGreen}`}><i className="fas fa-download" />Download TXT</button>
              <button onClick={() => setShowLogin(false)} className={`${s.btn} ${s.btnPrimary}`}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
