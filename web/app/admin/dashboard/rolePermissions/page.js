'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRoles, usePermissionsData, useRolePermissions } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

export default function RolePermissionsPage() {
  const { data: session, status } = useSession();
  const { loading: permLoading } = usePermissions();
  const { roles, fetchRoles } = useRoles();
  const { permissions, fetchPermissions } = usePermissionsData();
  const { rolePermissions, loading, error, fetchAllRolePermissions, assignPermissionsToRole, removePermissionFromRole } = useRolePermissions();

  const [selectedRole, setSelectedRole]   = useState('');
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [busy, setBusy]                   = useState(false);
  const [notice, setNotice]               = useState('');
  const loadedRef = useRef(false);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true;
      fetchRoles(); fetchPermissions(); fetchAllRolePermissions();
    }
  }, [status, session?.user?.id, fetchRoles, fetchPermissions, fetchAllRolePermissions]);

  const togglePerm = (id) => setSelectedPerms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleAssign = async () => {
    if (!selectedRole || !selectedPerms.length) { setNotice('Select a role and at least one permission.'); return; }
    try {
      setBusy(true); setNotice('');
      assignPermissionsToRole({ roleId: selectedRole, permissionIds: selectedPerms });
      setNotice('Permissions assigned successfully.');
      setSelectedRole(''); setSelectedPerms([]);
      fetchAllRolePermissions();
    } catch { setNotice('Failed to assign permissions.'); }
    finally { setBusy(false); }
  };

  const handleRemove = (roleId, permId) => {
    if (!window.confirm('Remove this permission from the role?')) return;
    removePermissionFromRole({ roleId, permissionId: permId });
    fetchAllRolePermissions();
  };

  const getRolePerms = (roleId) => rolePermissions.filter(rp => rp.role_id === roleId);

  if (status === 'loading' || permLoading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#ede9fe', color: '#7c3aed' }}><i className="fas fa-link" /></span>
            Role Permissions
          </h1>
          <p className={s.pageSub}>Assign permissions to roles and manage access controls</p>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}</div>}
      {notice && <div className={`${s.alert} ${notice.includes('fail') || notice.includes('Select') ? s.alertDanger : s.alertSuccess}`}><i className={`fas fa-${notice.includes('fail') || notice.includes('Select') ? 'exclamation-triangle' : 'check-circle'}`} />{notice}<button onClick={() => setNotice('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}><i className="fas fa-times" /></button></div>}

      {/* Assign form */}
      <div className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardTitle}><i className="fas fa-plus-circle" style={{ color: '#7c3aed' }} />Assign Permissions to Role</span>
        </div>
        <div className={s.cardBody}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '1rem', alignItems: 'flex-start' }}>
            <div>
              <label className={s.formLabel}>Role</label>
              <select className={s.formSelect} value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                <option value="">Choose a role…</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className={s.formLabel}>Permissions</label>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.5rem', maxHeight: 200, overflowY: 'auto', background: '#fff' }}>
                {permissions.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: '#9ca3af', margin: 0 }}>No permissions available.</p>
                ) : permissions.map(perm => (
                  <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.25rem', cursor: 'pointer', borderBottom: '1px solid #f9fafb', fontSize: '0.82rem', color: '#374151' }}>
                    <input type="checkbox" checked={selectedPerms.includes(perm.id)} onChange={() => togglePerm(perm.id)} style={{ width: 14, height: 14 }} />
                    <span style={{ fontWeight: 600 }}>{perm.name}</span>
                    {perm.description && <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>— {perm.description}</span>}
                  </label>
                ))}
              </div>
              {selectedPerms.length > 0 && <p style={{ fontSize: '0.75rem', color: '#7c3aed', marginTop: '0.25rem', marginBottom: 0 }}>{selectedPerms.length} selected</p>}
            </div>
            <div style={{ paddingTop: '1.5rem' }}>
              <button onClick={handleAssign} className={`${s.btn} ${s.btnPrimary}`} disabled={busy || !selectedRole || !selectedPerms.length}>
                {busy ? <><span className="spinner-border spinner-border-sm" />Assigning…</> : <><i className="fas fa-link" />Assign</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Role permission matrix */}
      <div className={s.card} style={{ marginBottom: 0 }}>
        <div className={s.cardHeader}>
          <span className={s.cardTitle}><i className="fas fa-th-list" style={{ color: '#2563eb' }} />Current Assignments</span>
        </div>
        {loading ? (
          <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>
        ) : (
          <div className={s.cardBody} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {roles.map(role => {
              const rolePerms = getRolePerms(role.id);
              return (
                <div key={role.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fas fa-shield-alt" style={{ color: '#d97706', fontSize: '0.82rem' }} />
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e3a5f' }}>{role.name}</span>
                    </div>
                    <span className={`${s.badge} ${s.badgeInfo}`}>{rolePerms.length}</span>
                  </div>
                  <div style={{ padding: '0.75rem 1rem', minHeight: 60 }}>
                    {rolePerms.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0, fontStyle: 'italic' }}>No permissions assigned</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {rolePerms.map(rp => {
                          const perm = permissions.find(p => p.id === rp.permission_id);
                          return (
                            <span key={rp.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#ede9fe', color: '#7c3aed', borderRadius: 999, padding: '0.15rem 0.5rem', fontSize: '0.72rem', fontWeight: 600 }}>
                              {perm?.name || 'Unknown'}
                              <button onClick={() => handleRemove(role.id, rp.permission_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: 0, lineHeight: 1, fontSize: '0.6rem', display: 'flex', alignItems: 'center' }} title="Remove">
                                <i className="fas fa-times" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 2fr auto"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
