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

export default function RejectedApplicationsPage() {
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { applications: all, loading, error, fetchApplications, updateApplicationStatus, sendRejectionLetter } = useApplications();
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const loadedRef = useRef(false);

  const applications = all.filter(a => a.status === 'rejected');

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

  const thisWeek  = applications.filter(a => daysSince(a.updated_at || a.created_at) <= 7).length;
  const appeals   = applications.filter(a => a.appeal_reason).length;

  const handleSendLetter = (id) => {
    sendRejectionLetter(id);
    setNotice('Rejection letter queued for sending.');
  };

  const handleReconsider = (id) => {
    if (!window.confirm('Move this application back to pending review?')) return;
    updateApplicationStatus(id, 'pending');
    setNotice('Application moved back to pending review.');
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
            <span className={s.iconBox} style={{ background: '#fee2e2', color: '#dc2626' }}><i className="fas fa-times-circle" /></span>
            Rejected Applications
          </h1>
          <p className={s.pageSub}>Review rejected applications and handle appeals</p>
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
          { label: 'Total Rejected', value: applications.length, icon: 'fas fa-times-circle',   color: '#dc2626' },
          { label: 'This Week',      value: thisWeek,            icon: 'fas fa-calendar-week',  color: '#d97706' },
          { label: 'With Appeals',   value: appeals,             icon: 'fas fa-gavel',          color: '#7c3aed' },
          { label: 'Letters Sent',   value: applications.filter(a => a.rejection_letter_sent).length, icon: 'fas fa-paper-plane', color: '#0891b2' },
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
          <span className={s.cardTitle}><i className="fas fa-list" style={{ color: '#dc2626' }} />Rejected ({filtered.length})</span>
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
            <div className={s.emptyTitle}>{search ? 'No matches' : 'No Rejected Applications'}</div>
            <p className={s.emptySub}>{search ? 'No applications match your search.' : 'No applications have been rejected.'}</p>
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
                    <th>Rejected</th>
                    <th>Reason</th>
                    <th>Appeal</th>
                    <th style={{ paddingRight: '1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(app => (
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
                      <td><span style={{ fontSize: '0.82rem', color: '#374151' }}>{fmt(app.updated_at || app.created_at)}</span></td>
                      <td><span style={{ fontSize: '0.8rem', color: '#6b7280', maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.rejection_reason || <em style={{ color: '#d1d5db' }}>None</em>}</span></td>
                      <td>
                        {app.appeal_reason
                          ? <span className={`${s.badge}`} style={{ background: '#ede9fe', color: '#7c3aed' }}><i className="fas fa-gavel" style={{ fontSize: '0.65rem' }} /> Yes</span>
                          : <span style={{ fontSize: '0.8rem', color: '#d1d5db' }}>—</span>
                        }
                      </td>
                      <td className={s.actionsCell} style={{ paddingRight: '1.25rem' }}>
                        <div className={s.actionBtns}>
                          <Link href={`/admin/dashboard/applications/${app.id}`} className={s.btnIcon} title="View">
                            <i className="fas fa-eye" />
                          </Link>
                          <button onClick={() => handleSendLetter(app.id)} className={s.btnIcon} title="Send Rejection Letter" style={{ color: '#dc2626', borderColor: '#fca5a5' }}>
                            <i className="fas fa-envelope" />
                          </button>
                          {hasPermission('application.update') && (
                            <button onClick={() => handleReconsider(app.id)} className={s.btnIcon} title="Reconsider" style={{ color: '#d97706', borderColor: '#fde68a' }}>
                              <i className="fas fa-undo" />
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
              {filtered.map(app => (
                <div key={app.id} className={s.mobileCard}>
                  <div className={s.mobileCardHead}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={s.tdAvatar}>{initials(app.applicant_name)}</span>
                      <span className={s.tdName}>{app.applicant_name || 'Unknown'}</span>
                    </div>
                    {app.appeal_reason && <span className={s.badge} style={{ background: '#ede9fe', color: '#7c3aed' }}><i className="fas fa-gavel" style={{ fontSize: '0.65rem' }} /> Appeal</span>}
                  </div>
                  <div className={s.mobileCardBody}>
                    <div className={s.mobileCardRow}><span className={s.mobileCardKey}>App No.</span><span className={s.mobileCardVal}><span className={s.tdMono} style={{ fontSize: '0.72rem' }}>{app.application_number || `APP-${app.id}`}</span></span></div>
                    <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Program</span><span className={s.mobileCardVal}>{app.schema_display_name || app.schema_name || 'N/A'}</span></div>
                    <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Rejected</span><span className={s.mobileCardVal}>{fmt(app.updated_at || app.created_at)}</span></div>
                    {app.rejection_reason && <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Reason</span><span className={s.mobileCardVal}>{app.rejection_reason}</span></div>}
                  </div>
                  <div className={s.mobileCardFoot}>
                    <Link href={`/admin/dashboard/applications/${app.id}`} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}><i className="fas fa-eye" />View</Link>
                    <button onClick={() => handleSendLetter(app.id)} className={`${s.btn} ${s.btnDanger} ${s.btnSm}`}><i className="fas fa-envelope" />Letter</button>
                    {hasPermission('application.update') && <button onClick={() => handleReconsider(app.id)} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}><i className="fas fa-undo" />Reconsider</button>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {filtered.length > 0 && <div className={s.cardFooter}><span>Showing <strong>{filtered.length}</strong> of <strong>{applications.length}</strong> rejected applications</span></div>}
      </div>
    </div>
  );
}
