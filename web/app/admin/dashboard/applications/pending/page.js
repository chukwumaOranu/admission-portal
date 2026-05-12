'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const daysSince = (d) => d ? Math.floor((Date.now() - new Date(d)) / 86400000) : 0;
const initials = (name) => (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export default function PendingReviewsPage() {
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { applications: all, loading, error, fetchApplications, updateApplicationStatus } = useApplications();
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const loadedRef = useRef(false);

  const applications = all.filter(a => a.status === 'submitted' || a.status === 'pending');

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

  const overdue = applications.filter(a => daysSince(a.created_at) > 7).length;
  const recent  = applications.filter(a => daysSince(a.created_at) <= 3).length;

  const handleApprove = (id) => {
    if (!window.confirm('Approve this application?')) return;
    updateApplicationStatus(id, 'approved');
    setNotice('Application approved.');
  };

  const handleReject = (id) => {
    if (!window.confirm('Reject this application?')) return;
    updateApplicationStatus(id, 'rejected');
    setNotice('Application rejected.');
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
            <span className={s.iconBox} style={{ background: '#fef3c7', color: '#d97706' }}><i className="fas fa-clock" /></span>
            Pending Reviews
          </h1>
          <p className={s.pageSub}>Applications awaiting review and approval</p>
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
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}<button onClick={() => setNotice('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#059669' }}><i className="fas fa-times" /></button></div>}

      {/* Stats */}
      <div className={s.statsGrid} style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Pending Review', value: applications.length, icon: 'fas fa-clock',         color: '#d97706' },
          { label: 'Overdue >7d',   value: overdue,             icon: 'fas fa-hourglass-end',  color: '#dc2626' },
          { label: 'Recent <3d',    value: recent,              icon: 'fas fa-calendar-check', color: '#059669' },
          { label: 'Paid',          value: applications.filter(a => a.payment_status === 'paid').length, icon: 'fas fa-credit-card', color: '#0891b2' },
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

      {/* Table card */}
      <div className={s.card} style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', padding: '0.875rem 1.25rem', borderBottom: '1px solid #f0f4f8' }}>
          <span className={s.cardTitle}><i className="fas fa-list" style={{ color: '#d97706' }} />Pending ({filtered.length})</span>
          <div className={s.searchWrap} style={{ maxWidth: 240 }}>
            <i className={`fas fa-search ${s.searchIcon}`} />
            <input className={s.searchInput} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>
        ) : filtered.length === 0 ? (
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#d1fae5', color: '#059669' }}><i className="fas fa-check-circle" /></div>
            <div className={s.emptyTitle}>{search ? 'No matches' : 'All Caught Up!'}</div>
            <p className={s.emptySub}>{search ? 'No applications match your search.' : 'No applications are pending review.'}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '1.25rem' }}>App No.</th>
                    <th>Applicant</th>
                    <th>Program</th>
                    <th>Payment</th>
                    <th>Submitted</th>
                    <th>Waiting</th>
                    <th style={{ paddingRight: '1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(app => {
                    const days = daysSince(app.created_at);
                    return (
                      <tr key={app.id}>
                        <td style={{ paddingLeft: '1.25rem' }}><span className={s.tdMono}>{app.application_number || `APP-${app.id}`}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className={s.tdAvatar}>{initials(app.applicant_name)}</span>
                            <div>
                              <div className={s.tdName}>{app.applicant_name || 'Unknown'}</div>
                              <div className={s.tdEmail}>{app.applicant_email || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td><span style={{ fontSize: '0.85rem', color: '#374151' }}>{app.schema_display_name || app.schema_name || 'N/A'}</span></td>
                        <td>
                          <span className={`${s.badge} ${app.payment_status === 'paid' ? s.badgePaid : s.badgePending}`}>
                            {app.payment_status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td><span style={{ fontSize: '0.82rem', color: '#374151' }}>{fmt(app.created_at)}</span></td>
                        <td>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: days > 7 ? '#dc2626' : days > 3 ? '#d97706' : '#059669' }}>
                            {days}d
                          </span>
                        </td>
                        <td className={s.actionsCell} style={{ paddingRight: '1.25rem' }}>
                          <div className={s.actionBtns}>
                            <Link href={`/admin/dashboard/applications/${app.id}`} className={s.btnIcon} title="View">
                              <i className="fas fa-eye" />
                            </Link>
                            {hasPermission('application.update') && (
                              <>
                                <button onClick={() => handleApprove(app.id)} className={`${s.btnIcon} ${s.btnIconGreen}`} title="Approve">
                                  <i className="fas fa-check" />
                                </button>
                                <button onClick={() => handleReject(app.id)} className={`${s.btnIcon} ${s.btnIconDanger}`} title="Reject">
                                  <i className="fas fa-times" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className={s.mobileList}>
              {filtered.map(app => {
                const days = daysSince(app.created_at);
                return (
                  <div key={app.id} className={s.mobileCard}>
                    <div className={s.mobileCardHead}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={s.tdAvatar}>{initials(app.applicant_name)}</span>
                        <span className={s.tdName}>{app.applicant_name || 'Unknown'}</span>
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: days > 7 ? '#dc2626' : days > 3 ? '#d97706' : '#059669' }}>{days}d</span>
                    </div>
                    <div className={s.mobileCardBody}>
                      <div className={s.mobileCardRow}><span className={s.mobileCardKey}>App No.</span><span className={s.mobileCardVal}><span className={s.tdMono} style={{ fontSize: '0.72rem' }}>{app.application_number || `APP-${app.id}`}</span></span></div>
                      <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Program</span><span className={s.mobileCardVal}>{app.schema_display_name || app.schema_name || 'N/A'}</span></div>
                      <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Payment</span><span className={`${s.badge} ${app.payment_status === 'paid' ? s.badgePaid : s.badgePending}`}>{app.payment_status === 'paid' ? 'Paid' : 'Pending'}</span></div>
                      <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Submitted</span><span className={s.mobileCardVal}>{fmt(app.created_at)}</span></div>
                    </div>
                    <div className={s.mobileCardFoot}>
                      <Link href={`/admin/dashboard/applications/${app.id}`} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}><i className="fas fa-eye" />View</Link>
                      {hasPermission('application.update') && (
                        <>
                          <button onClick={() => handleApprove(app.id)} className={`${s.btn} ${s.btnGreen} ${s.btnSm}`}><i className="fas fa-check" />Approve</button>
                          <button onClick={() => handleReject(app.id)} className={`${s.btn} ${s.btnDanger} ${s.btnSm}`}><i className="fas fa-times" />Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {filtered.length > 0 && <div className={s.cardFooter}><span>Showing <strong>{filtered.length}</strong> of <strong>{applications.length}</strong> pending applications</span></div>}
      </div>
    </div>
  );
}
