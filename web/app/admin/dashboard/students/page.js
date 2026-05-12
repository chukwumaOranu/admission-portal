'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudents, useUsers } from '@/hooks/useRedux';
import CredentialsModal from '@/components/CredentialsModal';
import { API_ENDPOINTS, apiService } from '@/services/api';
import s from '@/styles/admin-portal.module.css';

const initials = (f, l) => `${(f||'')[0]||''}${(l||'')[0]||''}`.toUpperCase() || '?';

export default function StudentsPage() {
  const { status } = useSession();
  const { hasPermission } = usePermissions();
  const { students, loading, error: reduxError, fetchStudents, deleteStudent, createStudentLogin: createLoginAction } = useStudents();
  const { users, fetchUsers } = useUsers();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [showCreds, setShowCreds] = useState(false);
  const [creds, setCreds] = useState(null);
  const [credsName, setCredsName] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [loginDetails, setLoginDetails] = useState(null);
  const [notice, setNotice] = useState('');
  const [noticeErr, setNoticeErr] = useState('');

  useEffect(() => {
    if (status === 'authenticated') { fetchStudents(); fetchUsers(); }
  }, [status, fetchStudents, fetchUsers]);

  const filtered = students.filter(st => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [st.first_name, st.last_name, st.student_id, st.email, st.phone, st.schema_display_name]
      .filter(Boolean).join(' ').toLowerCase().includes(q);
  });

  const allSelected = filtered.length > 0 && filtered.every(st => selected.includes(st.id));
  const toggleAll = () => setSelected(allSelected ? [] : filtered.map(st => st.id));
  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try { setDeleteLoading(id); deleteStudent(id); }
    catch { alert('Failed to delete student'); }
    finally { setDeleteLoading(null); }
  };

  const handleCreateLogin = async (student) => {
    if (!student.email) { alert('Student needs an email address.'); return; }
    if (student.user_id) { alert('Student already has a login account.'); return; }
    if (!window.confirm(`Create login for ${student.first_name} ${student.last_name}?`)) return;
    try {
      const res = createLoginAction(student.id, false);
      if (res.payload?.userAccount?.created) {
        const c = res.payload.userAccount;
        localStorage.setItem(`student_creds_${student.id}`, JSON.stringify({ username: c.username, password: c.password, email: c.email, createdAt: new Date().toISOString() }));
        setCreds(c); setCredsName(`${student.first_name} ${student.last_name}`);
        setShowCreds(true); fetchStudents();
      }
    } catch (e) { alert(e.message || 'Failed to create login'); }
  };

  const handleViewLogin = (student) => {
    if (!student.user_id) { alert('No user account yet.'); return; }
    const user = users.find(u => u.id === student.user_id);
    if (!user) { alert('User account not found.'); return; }
    let pwd = null;
    try { const s = localStorage.getItem(`student_creds_${student.id}`); if (s) pwd = JSON.parse(s).password; } catch {}
    setLoginDetails({ student, user: { ...user, temp_password: pwd || user.temp_password } });
    setShowLogin(true);
  };

  const handleSendLogins = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Send login details to ${selected.length} student(s)?`)) return;
    try {
      setNoticeErr(''); setNotice('');
      const res = await apiService.post(API_ENDPOINTS.STUDENTS.SEND_LOGINS_BULK, { student_ids: selected });
      setNotice(`Sent: ${res.data?.sent || 0}, Failed: ${res.data?.failed || 0}`);
      setTimeout(() => setNotice(''), 5000);
    } catch (e) { setNoticeErr(e.message || 'Failed to send'); setTimeout(() => setNoticeErr(''), 5000); }
  };

  const handleDownloadCreds = () => {
    if (!loginDetails) return;
    const { student: st, user: u } = loginDetails;
    const txt = `STUDENT LOGIN CREDENTIALS\n\nName: ${st.first_name} ${st.last_name}\nStudent ID: ${st.student_id}\nSchool Level: ${st.schema_display_name || 'N/A'}\n\nUsername: ${u.username}\nPassword: ${u.temp_password || '[Contact admin to reset]'}\nStatus: ${u.is_active ? 'Active' : 'Inactive'}\n\nGenerated: ${new Date().toLocaleString()}`;
    const blob = new Blob([txt], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${st.student_id}_credentials.txt`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const counts = {
    total:     students.length,
    active:    students.filter(st => st?.status === 'active' || st?.is_active).length,
    withLogin: students.filter(st => st?.user_id).length,
    selected:  selected.length,
  };

  if (status === 'loading') return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;

  const STATS = [
    { label: 'Total Students', value: counts.total,     icon: 'fas fa-user-graduate', color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Active',         value: counts.active,    icon: 'fas fa-check-circle',  color: '#059669', bg: '#d1fae5' },
    { label: 'With Login',     value: counts.withLogin, icon: 'fas fa-user-lock',     color: '#0891b2', bg: '#e0f2fe' },
    { label: 'Selected',       value: counts.selected,  icon: 'fas fa-check-square',  color: '#2563eb', bg: '#eff6ff' },
  ];

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      <CredentialsModal isOpen={showCreds} onClose={() => setShowCreds(false)} credentials={creds} employeeName={credsName} />

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#f5f3ff', color: '#7c3aed' }}><i className="fas fa-user-graduate" /></span>
            Students
          </h1>
          <p className={s.pageSub}>Manage student records and portal access</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/students/schemas" className={`${s.btn} ${s.btnOutline}`}><i className="fas fa-list" />Schemas</Link>
          {hasPermission('student.create') && (
            <Link href="/admin/dashboard/students/add" className={`${s.btn} ${s.btnPrimary}`}><i className="fas fa-plus" />Add Student</Link>
          )}
        </div>
      </div>

      {notice    && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}</div>}
      {noticeErr && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{noticeErr}</div>}
      {reduxError && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{reduxError}</div>}

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

      {/* Main card */}
      <div className={s.card} style={{ marginBottom: 0 }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', padding: '0.875rem 1.25rem', borderBottom: '1px solid #f0f4f8' }}>
          <span className={s.cardTitle}><i className="fas fa-list" style={{ color: '#7c3aed' }} />Student List <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '0.8rem' }}>({filtered.length})</span></span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className={s.searchWrap} style={{ maxWidth: 220 }}>
              <i className={`fas fa-search ${s.searchIcon}`} />
              <input className={s.searchInput} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={fetchStudents} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} disabled={loading}><i className="fas fa-sync" /></button>
          </div>
        </div>

        {/* Bulk bar */}
        {selected.length > 0 && (
          <div className={s.bulkBar}>
            <span className={s.bulkBarInfo}><i className="fas fa-check-square" />{selected.length} selected</span>
            <div className={s.bulkBarActions}>
              <button onClick={() => setSelected([])} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}>Deselect</button>
              <button onClick={handleSendLogins} className={`${s.btn} ${s.btnBlue} ${s.btnSm}`}><i className="fas fa-paper-plane" />Send Login Emails</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>
        ) : filtered.length === 0 ? (
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#f5f3ff', color: '#7c3aed' }}><i className="fas fa-user-graduate" /></div>
            <div className={s.emptyTitle}>No Students Found</div>
            <p className={s.emptySub}>{search ? 'No students match your search.' : 'Add your first student to get started.'}</p>
            {!search && hasPermission('student.create') && <Link href="/admin/dashboard/students/add" className={`${s.btn} ${s.btnPrimary}`}><i className="fas fa-plus" />Add Student</Link>}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '1.25rem', width: 40 }}>
                      <input type="checkbox" className={s.checkbox} checked={allSelected} onChange={toggleAll} />
                    </th>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Level</th>
                    <th>Login</th>
                    <th style={{ paddingRight: '1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(st => (
                    <tr key={st.id}>
                      <td style={{ paddingLeft: '1.25rem' }}>
                        <input type="checkbox" className={s.checkbox} checked={selected.includes(st.id)} onChange={() => toggle(st.id)} />
                      </td>
                      <td><span className={s.tdMono}>{st.student_id}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={s.tdAvatar} style={{ background: '#f5f3ff', color: '#7c3aed' }}>{initials(st.first_name, st.last_name)}</span>
                          <span className={s.tdName}>{st.first_name} {st.last_name}</span>
                        </div>
                      </td>
                      <td><span className={s.tdEmail}>{st.email || '—'}</span></td>
                      <td><span style={{ fontSize: '0.85rem', color: '#374151' }}>{st.phone || '—'}</span></td>
                      <td><span className={`${s.badge} ${s.badgeInfo}`}>{st.schema_display_name || st.schema_name || '—'}</span></td>
                      <td>
                        {st.user_id
                          ? <button onClick={() => handleViewLogin(st)} className={`${s.badge} ${s.badgePaid}`} style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><i className="fas fa-check-circle" style={{ fontSize: '0.65rem' }} />Active</button>
                          : <span className={`${s.badge} ${s.badgeInactive}`}><i className="fas fa-times-circle" style={{ fontSize: '0.65rem' }} /> None</span>
                        }
                      </td>
                      <td className={s.actionsCell} style={{ paddingRight: '1.25rem' }}>
                        <div className={s.actionBtns}>
                          {!st.user_id && st.email && hasPermission('user.create') && (
                            <button className={`${s.btnIcon} ${s.btnIconGreen}`} title="Create Login" onClick={() => handleCreateLogin(st)}><i className="fas fa-user-plus" /></button>
                          )}
                          <Link href={`/admin/dashboard/students/${st.id}`} className={s.btnIcon} title="View"><i className="fas fa-eye" /></Link>
                          {hasPermission('student.update') && <Link href={`/admin/dashboard/students/${st.id}/edit`} className={s.btnIcon} title="Edit"><i className="fas fa-edit" /></Link>}
                          {hasPermission('student.delete') && (
                            <button className={`${s.btnIcon} ${s.btnIconDanger}`} title="Delete" onClick={() => handleDelete(st.id)} disabled={deleteLoading === st.id}>
                              {deleteLoading === st.id ? <span className="spinner-border spinner-border-sm" /> : <i className="fas fa-trash" />}
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
              {filtered.map(st => (
                <div key={st.id} className={s.mobileCard}>
                  <div className={s.mobileCardHead}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" className={s.checkbox} checked={selected.includes(st.id)} onChange={() => toggle(st.id)} />
                      <span className={s.tdAvatar} style={{ background: '#f5f3ff', color: '#7c3aed' }}>{initials(st.first_name, st.last_name)}</span>
                      <div>
                        <div className={s.tdName}>{st.first_name} {st.last_name}</div>
                        <span className={s.tdMono} style={{ fontSize: '0.72rem' }}>{st.student_id}</span>
                      </div>
                    </div>
                    {st.user_id
                      ? <span className={`${s.badge} ${s.badgePaid}`}><i className="fas fa-check-circle" style={{ fontSize: '0.65rem' }} /> Login</span>
                      : <span className={`${s.badge} ${s.badgeInactive}`}>No Login</span>
                    }
                  </div>
                  <div className={s.mobileCardBody}>
                    <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Email</span><span className={s.mobileCardVal}>{st.email || '—'}</span></div>
                    <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Phone</span><span className={s.mobileCardVal}>{st.phone || '—'}</span></div>
                    <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Level</span><span className={`${s.badge} ${s.badgeInfo}`}>{st.schema_display_name || '—'}</span></div>
                  </div>
                  <div className={s.mobileCardFoot}>
                    <Link href={`/admin/dashboard/students/${st.id}`} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}><i className="fas fa-eye" />View</Link>
                    {hasPermission('student.update') && <Link href={`/admin/dashboard/students/${st.id}/edit`} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}><i className="fas fa-edit" />Edit</Link>}
                    {!st.user_id && st.email && hasPermission('user.create') && <button onClick={() => handleCreateLogin(st)} className={`${s.btn} ${s.btnGreen} ${s.btnSm}`}><i className="fas fa-user-plus" />Login</button>}
                    {hasPermission('student.delete') && <button onClick={() => handleDelete(st.id)} disabled={deleteLoading === st.id} className={`${s.btn} ${s.btnDanger} ${s.btnSm}`}><i className="fas fa-trash" />Delete</button>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {filtered.length > 0 && <div className={s.cardFooter}><span>Showing <strong>{filtered.length}</strong> of <strong>{students.length}</strong> students</span></div>}
      </div>

      {/* Login Details Modal */}
      {showLogin && loginDetails && (
        <div className={s.modalOverlay} onClick={() => setShowLogin(false)}>
          <div className={`${s.modal} ${s.modalLg}`} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <div className={s.modalTitle}><span className={s.iconBox} style={{ background: '#f5f3ff', color: '#7c3aed' }}><i className="fas fa-user-lock" /></span>Student Login Details</div>
              <button className={s.modalClose} onClick={() => setShowLogin(false)}>×</button>
            </div>
            <div className={s.modalBody}>
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px', marginBottom: '0.625rem' }}>Student</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[['Name', `${loginDetails.student.first_name} ${loginDetails.student.last_name}`], ['Student ID', loginDetails.student.student_id], ['Email', loginDetails.student.email], ['Level', loginDetails.student.schema_display_name || 'N/A']].map(([k, v]) => (
                    <div key={k}><div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '2px' }}>{k}</div><div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>{v}</div></div>
                  ))}
                </div>
              </div>
              <div style={{ border: '1.5px solid #bbf7d0', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ background: '#059669', padding: '0.625rem 1rem' }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}><i className="fas fa-key me-2" />Credentials</span>
                </div>
                <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  {[['Username', loginDetails.user.username], ['Email', loginDetails.user.email]].map(([lbl, val]) => (
                    <div key={lbl}>
                      <div className={s.formLabel}>{lbl}</div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input readOnly value={val} className={s.formInput} style={{ flex: 1 }} />
                        <button onClick={() => navigator.clipboard.writeText(val)} className={s.btnIcon} title="Copy"><i className="fas fa-copy" /></button>
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
                      : <div className={`${s.alert} ${s.alertWarning}`} style={{ margin: 0, padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}><i className="fas fa-exclamation-triangle" />Not available</div>
                    }
                  </div>
                  <div>
                    <div className={s.formLabel}>Status</div>
                    <span className={`${s.badge} ${loginDetails.user.is_active ? s.badgeActive : s.badgeInactive}`}>{loginDetails.user.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={s.modalFooter}>
              <button onClick={() => navigator.clipboard.writeText(`${loginDetails.student.first_name} ${loginDetails.student.last_name}\nUsername: ${loginDetails.user.username}\nPassword: ${loginDetails.user.temp_password || '[N/A]'}`)} className={`${s.btn} ${s.btnOutline}`}><i className="fas fa-copy" />Copy</button>
              <button onClick={handleDownloadCreds} className={`${s.btn} ${s.btnGreen}`}><i className="fas fa-download" />Download</button>
              <button onClick={() => setShowLogin(false)} className={`${s.btn} ${s.btnPrimary}`}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
