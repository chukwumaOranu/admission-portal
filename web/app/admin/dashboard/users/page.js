'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useUsers, useRoles } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const initials = (name) => (name || '?').split(/[\s_]/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

export default function UsersPage() {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  const { users, loading, error, fetchUsers, deleteUser, clearError } = useUsers();
  const { roles, fetchRoles } = useRoles();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selected, setSelected] = useState([]);
  const loadedRef = useRef(false);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true;
      fetchUsers();
      fetchRoles();
    }
  }, [status, session?.user?.id, fetchUsers, fetchRoles]);

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchRole = roleFilter === 'all' ? true
        : roleFilter === 'no_role' ? !u.role_id
        : u.role_id === parseInt(roleFilter);
      const q = search.toLowerCase();
      const matchSearch = !q || (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [users, roleFilter, search]);

  const allSelected = filtered.length > 0 && filtered.every(u => selected.includes(u.id));
  const toggleAll = () => setSelected(allSelected ? [] : filtered.map(u => u.id));
  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleDelete = async (id) => {
    const u = users.find(x => x.id === id);
    if (!u || !window.confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    try { deleteUser(id); setSelected(p => p.filter(x => x !== id)); }
    catch { alert('Failed to delete user'); }
  };

  const handleExportCSV = () => {
    const rows = users.filter(u => selected.includes(u.id));
    if (!rows.length) return;
    const headers = ['ID', 'Username', 'Email', 'Role', 'Status', 'Created'];
    const csv = [
      headers.join(','),
      ...rows.map(u => [u.id, u.username, u.email, u.role_name || 'No role', u.is_active ? 'Active' : 'Inactive', new Date(u.created_at).toLocaleDateString()].map(c => `"${c}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `users_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const stats = useMemo(() => ({
    total:    users.length,
    active:   users.filter(u => u.is_active).length,
    withRole: users.filter(u => u.role_id).length,
    noRole:   users.filter(u => !u.role_id).length,
  }), [users]);

  const STAT_CARDS = [
    { label: 'Total Users',    value: stats.total,    icon: 'fas fa-users',       color: '#2563eb' },
    { label: 'Active',         value: stats.active,   icon: 'fas fa-check-circle',color: '#059669' },
    { label: 'With Role',      value: stats.withRole, icon: 'fas fa-user-tag',    color: '#0891b2' },
    { label: 'No Role',        value: stats.noRole,   icon: 'fas fa-user-slash',  color: '#d97706' },
  ];

  if (status === 'loading') return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;

  if (!hasPermission('user.read')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to view users.</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-users" /></span>
            User Management
          </h1>
          <p className={s.pageSub}>Manage system accounts and access roles</p>
        </div>
        <div className={s.pageActions}>
          {selected.length > 0 && (
            <button onClick={handleExportCSV} className={`${s.btn} ${s.btnGreen}`}>
              <i className="fas fa-file-csv" />Export ({selected.length})
            </button>
          )}
          {hasPermission('user.create') && (
            <Link href="/admin/dashboard/users/add" className={`${s.btn} ${s.btnPrimary}`}>
              <i className="fas fa-plus" />Add User
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className={`${s.alert} ${s.alertDanger}`}>
          <i className="fas fa-exclamation-triangle" />{error}
          <button onClick={clearError} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button>
        </div>
      )}

      {/* Stat cards */}
      <div className={s.statsGrid} style={{ marginBottom: '1.5rem' }}>
        {STAT_CARDS.map(st => (
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

      {/* Main card */}
      <div className={s.card} style={{ marginBottom: 0 }}>

        {/* Filter + search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', padding: '0.875rem 1.25rem', borderBottom: '1px solid #f0f4f8', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => setRoleFilter('all')} className={`${s.filterPill} ${roleFilter === 'all' ? s.filterPillActive : ''}`}>
              All <span className={s.filterCount}>{users.length}</span>
            </button>
            <button onClick={() => setRoleFilter('no_role')} className={`${s.filterPill} ${roleFilter === 'no_role' ? s.filterPillActive : ''}`}>
              No Role <span className={s.filterCount}>{stats.noRole}</span>
            </button>
            {roles.map(r => (
              <button key={r.id} onClick={() => setRoleFilter(String(r.id))} className={`${s.filterPill} ${roleFilter === String(r.id) ? s.filterPillActive : ''}`}>
                {r.name} <span className={s.filterCount}>{users.filter(u => u.role_id === r.id).length}</span>
              </button>
            ))}
          </div>
          <div className={s.searchWrap} style={{ maxWidth: 240 }}>
            <i className={`fas fa-search ${s.searchIcon}`} />
            <input className={s.searchInput} placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Bulk bar */}
        {selected.length > 0 && (
          <div className={s.bulkBar}>
            <span className={s.bulkBarInfo}><i className="fas fa-check-square" />{selected.length} selected</span>
            <div className={s.bulkBarActions}>
              <button onClick={() => setSelected([])} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}>Deselect all</button>
              <button onClick={handleExportCSV} className={`${s.btn} ${s.btnGreen} ${s.btnSm}`}>
                <i className="fas fa-file-csv" />Export CSV
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>
        ) : filtered.length === 0 ? (
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-users" /></div>
            <div className={s.emptyTitle}>No Users Found</div>
            <p className={s.emptySub}>{roleFilter === 'all' ? 'No users have been added yet.' : 'No users match this filter.'}</p>
            {hasPermission('user.create') && roleFilter === 'all' && (
              <Link href="/admin/dashboard/users/add" className={`${s.btn} ${s.btnPrimary}`}><i className="fas fa-plus" />Add User</Link>
            )}
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
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th style={{ paddingRight: '1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id}>
                      <td style={{ paddingLeft: '1.25rem' }}>
                        <input type="checkbox" className={s.checkbox} checked={selected.includes(u.id)} onChange={() => toggle(u.id)} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={s.tdAvatar}>{initials(u.username)}</span>
                          <div>
                            <div className={s.tdName}>{u.username}</div>
                            <div className={s.tdEmail}>ID #{u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={s.tdSub}>{u.email || '—'}</span></td>
                      <td>
                        {u.role_name
                          ? <span className={`${s.badge} ${s.badgeInfo}`}>{u.role_name}</span>
                          : <span className={`${s.badge} ${s.badgePending}`}>No Role</span>}
                      </td>
                      <td>
                        <span className={`${s.badge} ${u.is_active ? s.badgeApproved : s.badgeRejected}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td><span className={s.tdSub} style={{ fontSize: '0.82rem', color: '#374151' }}>{fmt(u.created_at)}</span></td>
                      <td className={s.actionsCell} style={{ paddingRight: '1.25rem' }}>
                        <div className={s.actionBtns}>
                          <Link href={`/admin/dashboard/users/${u.id}`} className={s.btnIcon} title="View">
                            <i className="fas fa-eye" />
                          </Link>
                          {hasPermission('user.update') && (
                            <Link href={`/admin/dashboard/users/${u.id}/edit`} className={s.btnIcon} title="Edit">
                              <i className="fas fa-edit" />
                            </Link>
                          )}
                          {hasPermission('user.delete') && (
                            <button className={`${s.btnIcon} ${s.btnIconDanger}`} onClick={() => handleDelete(u.id)} title="Delete">
                              <i className="fas fa-trash" />
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
              {filtered.map(u => (
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
                        {u.role_name
                          ? <span className={`${s.badge} ${s.badgeInfo}`}>{u.role_name}</span>
                          : <span className={`${s.badge} ${s.badgePending}`}>No Role</span>}
                      </span>
                    </div>
                    <div className={s.mobileCardRow}>
                      <span className={s.mobileCardKey}>Created</span>
                      <span className={s.mobileCardVal}>{fmt(u.created_at)}</span>
                    </div>
                  </div>
                  <div className={s.mobileCardFoot}>
                    <Link href={`/admin/dashboard/users/${u.id}`} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}>
                      <i className="fas fa-eye" />View
                    </Link>
                    {hasPermission('user.update') && (
                      <Link href={`/admin/dashboard/users/${u.id}/edit`} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}>
                        <i className="fas fa-edit" />Edit
                      </Link>
                    )}
                    {hasPermission('user.delete') && (
                      <button onClick={() => handleDelete(u.id)} className={`${s.btn} ${s.btnDanger} ${s.btnSm}`}>
                        <i className="fas fa-trash" />Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {filtered.length > 0 && (
          <div className={s.cardFooter}>
            <span>Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> users</span>
          </div>
        )}
      </div>
    </div>
  );
}
