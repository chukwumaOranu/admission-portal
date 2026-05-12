'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';
import { apiService } from '@/services/api';
import s from '@/styles/admin-portal.module.css';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const initials = (name) => (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export default function UnderReviewPage() {
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { applications: all, loading, error, fetchApplications } = useApplications();

  const [selected, setSelected]   = useState([]);
  const [busy, setBusy]           = useState(false);
  const [search, setSearch]       = useState('');
  const [notice, setNotice]       = useState('');
  const loadedRef = useRef(false);

  const applications = all.filter(a => a.status === 'submitted');

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchApplications();
    }
  }, [status, session?.user?.id, fetchApplications]);

  const filtered = applications.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [a.applicant_name, a.applicant_email, a.application_number].filter(Boolean).join(' ').toLowerCase().includes(q);
  });

  const allSelected = filtered.length > 0 && filtered.every(a => selected.includes(a.id));
  const toggleAll = () => setSelected(allSelected ? [] : filtered.map(a => a.id));
  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleBulkApprove = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Approve ${selected.length} application(s)?`)) return;
    try {
      setBusy(true);
      await Promise.all(selected.map(id => apiService.put(`/applications/${id}/status`, { status: 'approved' })));
      setNotice(`${selected.length} application(s) approved.`);
      setSelected([]); fetchApplications();
    } catch { setNotice('Failed to approve some applications. Please try again.'); }
    finally { setBusy(false); }
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
            <span className={s.iconBox} style={{ background: '#e0f2fe', color: '#0891b2' }}><i className="fas fa-eye" /></span>
            Under Review
          </h1>
          <p className={s.pageSub}>Submitted applications ready for assessment — {applications.length} total</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/applications" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Applications
          </Link>
          <button onClick={fetchApplications} className={`${s.btn} ${s.btnOutline}`} disabled={loading}>
            <i className="fas fa-sync" />Refresh
          </button>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}</div>}
      {notice && <div className={`${s.alert} ${notice.includes('Failed') ? s.alertDanger : s.alertSuccess}`}><i className={`fas fa-${notice.includes('Failed') ? 'exclamation-triangle' : 'check-circle'}`} />{notice}<button onClick={() => setNotice('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}><i className="fas fa-times" /></button></div>}

      {/* Stats */}
      <div className={s.statsGrid} style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Submitted',  value: applications.length, icon: 'fas fa-eye',          color: '#0891b2' },
          { label: 'Paid',       value: applications.filter(a => a.payment_status === 'paid').length, icon: 'fas fa-check-circle', color: '#059669' },
          { label: 'Unpaid',     value: applications.filter(a => a.payment_status !== 'paid').length, icon: 'fas fa-times-circle', color: '#d97706' },
          { label: 'Selected',   value: selected.length, icon: 'fas fa-check-square', color: '#7c3aed' },
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

      <div className={s.card} style={{ marginBottom: 0 }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', padding: '0.875rem 1.25rem', borderBottom: '1px solid #f0f4f8' }}>
          <span className={s.cardTitle}><i className="fas fa-list" style={{ color: '#0891b2' }} />Submitted ({filtered.length})</span>
          <div className={s.searchWrap} style={{ maxWidth: 240 }}>
            <i className={`fas fa-search ${s.searchIcon}`} />
            <input className={s.searchInput} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Bulk bar */}
        {selected.length > 0 && (
          <div className={s.bulkBar}>
            <span className={s.bulkBarInfo}><i className="fas fa-check-square" />{selected.length} selected</span>
            <div className={s.bulkBarActions}>
              <button onClick={() => setSelected([])} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}>Deselect all</button>
              {hasPermission('application.update') && (
                <button onClick={handleBulkApprove} className={`${s.btn} ${s.btnGreen} ${s.btnSm}`} disabled={busy}>
                  {busy ? <><span className="spinner-border spinner-border-sm" />Processing…</> : <><i className="fas fa-check" />Approve {selected.length}</>}
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>
        ) : filtered.length === 0 ? (
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#d1fae5', color: '#059669' }}><i className="fas fa-inbox" /></div>
            <div className={s.emptyTitle}>{search ? 'No matches' : 'No Submitted Applications'}</div>
            <p className={s.emptySub}>{search ? 'No applications match your search.' : 'No applications have been submitted for review.'}</p>
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
                    <th>App No.</th>
                    <th>Applicant</th>
                    <th>Program</th>
                    <th>Payment</th>
                    <th>Submitted</th>
                    <th style={{ paddingRight: '1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(app => (
                    <tr key={app.id}>
                      <td style={{ paddingLeft: '1.25rem' }}>
                        <input type="checkbox" className={s.checkbox} checked={selected.includes(app.id)} onChange={() => toggle(app.id)} />
                      </td>
                      <td><span className={s.tdMono}>{app.application_number || `APP-${app.id}`}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={s.tdAvatar}>{initials(app.applicant_name)}</span>
                          <div>
                            <div className={s.tdName}>{app.applicant_name || 'Unknown'}</div>
                            <div className={s.tdEmail}>{app.applicant_email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`${s.badge} ${s.badgeInfo}`}>{app.schema_display_name || app.schema_name || 'N/A'}</span></td>
                      <td><span className={`${s.badge} ${app.payment_status === 'paid' ? s.badgePaid : s.badgePending}`}>{app.payment_status === 'paid' ? 'Paid' : 'Pending'}</span></td>
                      <td><span style={{ fontSize: '0.82rem', color: '#374151' }}>{fmt(app.created_at)}</span></td>
                      <td className={s.actionsCell} style={{ paddingRight: '1.25rem' }}>
                        <div className={s.actionBtns}>
                          <Link href={`/admin/dashboard/applications/${app.id}`} className={s.btnIcon} title="View">
                            <i className="fas fa-eye" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className={s.mobileList}>
              {filtered.map(app => (
                <div key={app.id} className={s.mobileCard}>
                  <div className={s.mobileCardHead}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" className={s.checkbox} checked={selected.includes(app.id)} onChange={() => toggle(app.id)} />
                      <span className={s.tdAvatar}>{initials(app.applicant_name)}</span>
                      <span className={s.tdName}>{app.applicant_name || 'Unknown'}</span>
                    </div>
                    <span className={`${s.badge} ${app.payment_status === 'paid' ? s.badgePaid : s.badgePending}`}>{app.payment_status === 'paid' ? 'Paid' : 'Pending'}</span>
                  </div>
                  <div className={s.mobileCardBody}>
                    <div className={s.mobileCardRow}><span className={s.mobileCardKey}>App No.</span><span className={s.mobileCardVal}><span className={s.tdMono} style={{ fontSize: '0.72rem' }}>{app.application_number || `APP-${app.id}`}</span></span></div>
                    <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Program</span><span className={s.mobileCardVal}>{app.schema_display_name || app.schema_name || 'N/A'}</span></div>
                    <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Submitted</span><span className={s.mobileCardVal}>{fmt(app.created_at)}</span></div>
                  </div>
                  <div className={s.mobileCardFoot}>
                    <Link href={`/admin/dashboard/applications/${app.id}`} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}><i className="fas fa-eye" />View</Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {filtered.length > 0 && <div className={s.cardFooter}><span>Showing <strong>{filtered.length}</strong> of <strong>{applications.length}</strong> submitted applications</span></div>}
      </div>
    </div>
  );
}
