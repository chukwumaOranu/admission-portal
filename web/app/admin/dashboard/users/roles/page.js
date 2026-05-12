'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { API_ENDPOINTS, apiService } from '@/services/api';
import s from '@/styles/admin-portal.module.css';

const initials = (name) => (name || '?').split(/[\s_]/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

export default function UserRolesPage() {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [selected, setSelected] = useState([]);
  const [bulkRole, setBulkRole] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);

  const loadedRef = useRef(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        apiService.get(API_ENDPOINTS.USERS.GET_ALL),
        apiService.get(API_ENDPOINTS.ROLES.GET_ALL),
      ]);
      setUsers(usersRes.data?.users || []);
      setRoles(rolesRes.data?.roles || []);
    } catch { setError('Failed to fetch data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchData();
    }
  }, [status, session?.user?.id, session?.accessToken]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  const allSelected = filtered.length > 0 && filtered.every(u => selected.includes(u.id));
  const toggleAll = () => setSelected(allSelected ? [] : filtered.map(u => u.id));
  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) { alert('Select both a user and a role.'); return; }
    setAssigning(true);
    try {
      await apiService.post(API_ENDPOINTS.USER_ROLES.ASSIGN, { user_id: parseInt(selectedUser), role_id: parseInt(selectedRole) });
      setSelectedUser(''); setSelectedRole(''); fetchData();
    } catch (e) { alert(e.message || 'Failed to assign role'); }
    finally { setAssigning(false); }
  };

  const handleBulkAssign = async () => {
    if (!selected.length) { alert('Select at least one user.'); return; }
    if (!bulkRole) { alert('Select a role to assign.'); return; }
    if (!window.confirm(`Assign role to ${selected.length} user(s)?`)) return;
    setBulkAssigning(true);
    let ok = 0, fail = 0;
    for (const userId of selected) {
      try { await apiService.post(API_ENDPOINTS.USER_ROLES.ASSIGN, { user_id: userId, role_id: parseInt(bulkRole) }); ok++; }
      catch { fail++; }
    }
    alert(`Done! Success: ${ok}  Failed: ${fail}`);
    setSelected([]); setBulkRole(''); fetchData();
    setBulkAssigning(false);
  };

  const handleRemoveRole = async (userId, roleId) => {
    if (!window.confirm('Remove this role from the user?')) return;
    try {
      await apiService.post(API_ENDPOINTS.USER_ROLES.REMOVE, { user_id: userId, role_id: roleId });
      fetchData();
    } catch { alert('Failed to remove role'); }
  };

  const getUserRole = (userId) => {
    const u = users.find(x => x.id === userId);
    if (!u || !u.role_id) return null;
    return roles.find(r => r.id === u.role_id) || null;
  };

  if (status === 'loading') return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;

  if (!hasPermission('role.assign')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to assign roles.</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-user-tag" /></span>
            User Role Assignment
          </h1>
          <p className={s.pageSub}>Assign and manage roles for system users</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/users" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Back to Users
          </Link>
        </div>
      </div>

      {error && (
        <div className={`${s.alert} ${s.alertDanger}`}>
          <i className="fas fa-exclamation-triangle" />{error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button>
        </div>
      )}

      {/* Assignment panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* Single assign */}
        <div className={s.card} style={{ marginBottom: 0 }}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}><i className="fas fa-user-tag" style={{ color: '#2563eb' }} />Assign to Single User</span>
          </div>
          <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className={s.formLabel}>Select User</label>
              <select className={s.formSelect} value={selectedUser} onChange={e => setSelectedUser(e.target.value)} disabled={loading}>
                <option value="">Choose a user…</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.username} ({u.email}){u.role_name ? ` — ${u.role_name}` : ' — No role'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={s.formLabel}>Select Role</label>
              <select className={s.formSelect} value={selectedRole} onChange={e => setSelectedRole(e.target.value)} disabled={loading}>
                <option value="">Choose a role…</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}{r.description ? ` — ${r.description}` : ''}</option>
                ))}
              </select>
            </div>
            <button className={`${s.btn} ${s.btnPrimary}`} onClick={handleAssignRole} disabled={!selectedUser || !selectedRole || assigning} style={{ width: '100%', justifyContent: 'center' }}>
              {assigning ? <><span className="spinner-border spinner-border-sm" />Assigning…</> : <><i className="fas fa-check" />Assign Role</>}
            </button>
          </div>
        </div>

        {/* Bulk assign */}
        <div className={s.card} style={{ marginBottom: 0 }}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}><i className="fas fa-users-cog" style={{ color: '#059669' }} />Bulk Assignment</span>
            {selected.length > 0 && <span className={`${s.badge} ${s.badgeInfo}`}>{selected.length} selected</span>}
          </div>
          <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={`${s.alert} ${s.alertInfo}`} style={{ padding: '0.6rem 0.875rem', fontSize: '0.83rem' }}>
              <i className="fas fa-info-circle" />Select users from the table below, then choose a role to bulk-assign.
            </div>
            {selected.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {selected.map(id => {
                  const u = users.find(x => x.id === id);
                  return u ? (
                    <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#eff6ff', color: '#2563eb', borderRadius: 999, padding: '0.2rem 0.6rem', fontSize: '0.78rem', fontWeight: 600 }}>
                      {u.username}
                      <button type="button" onClick={() => toggle(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', padding: 0, lineHeight: 1 }}><i className="fas fa-times" style={{ fontSize: '0.65rem' }} /></button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
            <div>
              <label className={s.formLabel}>Role to Assign</label>
              <select className={s.formSelect} value={bulkRole} onChange={e => setBulkRole(e.target.value)} disabled={loading || !selected.length}>
                <option value="">Choose a role…</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <button className={`${s.btn} ${s.btnGreen}`} onClick={handleBulkAssign} disabled={!selected.length || !bulkRole || bulkAssigning} style={{ width: '100%', justifyContent: 'center' }}>
              {bulkAssigning ? <><span className="spinner-border spinner-border-sm" />Assigning…</> : <><i className="fas fa-users-cog" />Assign to {selected.length} User{selected.length !== 1 ? 's' : ''}</>}
            </button>
          </div>
        </div>
      </div>

      {/* User list */}
      <div className={s.card} style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', borderBottom: '1px solid #f0f4f8' }}>
          <span className={s.cardTitle} style={{ margin: 0 }}><i className="fas fa-list" style={{ color: '#2563eb' }} />Users & Roles</span>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className={s.searchWrap} style={{ maxWidth: 220 }}>
              <i className={`fas fa-search ${s.searchIcon}`} />
              <input className={s.searchInput} placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={fetchData} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} disabled={loading}>
              <i className="fas fa-sync" />Refresh
            </button>
          </div>
        </div>

        {selected.length > 0 && (
          <div className={s.bulkBar}>
            <span className={s.bulkBarInfo}><i className="fas fa-check-square" />{selected.length} selected</span>
            <button onClick={() => setSelected([])} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}>Deselect all</button>
          </div>
        )}

        {loading ? (
          <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>
        ) : filtered.length === 0 ? (
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-users" /></div>
            <div className={s.emptyTitle}>No Users Found</div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th style={{ width: 40, paddingLeft: '1.25rem' }}>
                      <input type="checkbox" className={s.checkbox} checked={allSelected} onChange={toggleAll} />
                    </th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Current Role</th>
                    <th>Status</th>
                    <th style={{ paddingRight: '1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const role = getUserRole(u.id);
                    return (
                      <tr key={u.id}>
                        <td style={{ paddingLeft: '1.25rem' }}>
                          <input type="checkbox" className={s.checkbox} checked={selected.includes(u.id)} onChange={() => toggle(u.id)} />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className={s.tdAvatar}>{initials(u.username)}</span>
                            <div className={s.tdName}>{u.username}</div>
                          </div>
                        </td>
                        <td><span className={s.tdSub}>{u.email || '—'}</span></td>
                        <td>
                          {role
                            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span className={`${s.badge} ${s.badgeInfo}`}>{role.name}</span>
                                <button onClick={() => handleRemoveRole(u.id, u.role_id)} title="Remove role" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0 0.2rem', fontSize: '0.78rem' }}><i className="fas fa-times-circle" /></button>
                              </span>
                            : <span className={`${s.badge} ${s.badgePending}`}>No role</span>}
                        </td>
                        <td>
                          <span className={`${s.badge} ${u.is_active ? s.badgeApproved : s.badgeRejected}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className={s.actionsCell} style={{ paddingRight: '1.25rem' }}>
                          <button
                            className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}
                            onClick={() => { setSelectedUser(String(u.id)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          >
                            <i className="fas fa-user-tag" />Assign
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className={s.mobileList}>
              {filtered.map(u => {
                const role = getUserRole(u.id);
                return (
                  <div key={u.id} className={s.mobileCard}>
                    <div className={s.mobileCardHead}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" className={s.checkbox} checked={selected.includes(u.id)} onChange={() => toggle(u.id)} />
                        <span className={s.tdAvatar}>{initials(u.username)}</span>
                        <div>
                          <div className={s.tdName}>{u.username}</div>
                          <div className={s.tdEmail}>{u.email || '—'}</div>
                        </div>
                      </div>
                      <span className={`${s.badge} ${u.is_active ? s.badgeApproved : s.badgeRejected}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className={s.mobileCardBody}>
                      <div className={s.mobileCardRow}>
                        <span className={s.mobileCardKey}>Role</span>
                        <span className={s.mobileCardVal}>
                          {role
                            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span className={`${s.badge} ${s.badgeInfo}`}>{role.name}</span>
                                <button onClick={() => handleRemoveRole(u.id, u.role_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 0 }}><i className="fas fa-times-circle" /></button>
                              </span>
                            : <span className={`${s.badge} ${s.badgePending}`}>No role</span>}
                        </span>
                      </div>
                    </div>
                    <div className={s.mobileCardFoot}>
                      <button className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} onClick={() => { setSelectedUser(String(u.id)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                        <i className="fas fa-user-tag" />Assign Role
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {filtered.length > 0 && (
          <div className={s.cardFooter}>
            <span>Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> users</span>
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 767px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
