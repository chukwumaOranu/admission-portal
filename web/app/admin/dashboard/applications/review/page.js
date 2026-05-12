'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

const STATUS_MAP = {
  pending:      { label: 'Pending',      cls: s.badgePending },
  submitted:    { label: 'Submitted',    cls: s.badgeSubmitted },
  under_review: { label: 'Under Review', cls: s.badgeReview },
  approved:     { label: 'Approved',     cls: s.badgeApproved },
  rejected:     { label: 'Rejected',     cls: s.badgeRejected },
};
const PAY_MAP = {
  paid:    { label: 'Paid',    cls: s.badgePaid },
  pending: { label: 'Pending', cls: s.badgePending },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtLong = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const initials = (name) => (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const FILTERS = [
  { key: 'all',          label: 'All' },
  { key: 'submitted',    label: 'Submitted' },
  { key: 'pending',      label: 'Pending' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'approved',     label: 'Approved' },
  { key: 'rejected',     label: 'Rejected' },
];

export default function ReviewApplicationsPage() {
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { applications: all, loading, error, fetchApplications, updateApplicationStatus } = useApplications();

  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice]   = useState('');
  const loadedRef = useRef(false);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchApplications();
    }
  }, [status, session?.user?.id, fetchApplications]);

  const counts = FILTERS.reduce((acc, f) => {
    acc[f.key] = f.key === 'all' ? all.length : all.filter(a => a.status === f.key).length;
    return acc;
  }, {});

  const base = filter === 'all' ? all : all.filter(a => a.status === filter);
  const filtered = base.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [a.applicant_name, a.applicant_email, a.application_number].filter(Boolean).join(' ').toLowerCase().includes(q);
  });

  const handleApprove = (id) => {
    if (!window.confirm('Approve this application?')) return;
    updateApplicationStatus(id, 'approved');
    setNotice('Application approved.'); setShowModal(false);
  };

  const handleReject = (id) => {
    if (!window.confirm('Reject this application?')) return;
    updateApplicationStatus(id, 'rejected');
    setNotice('Application rejected.'); setShowModal(false);
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
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-clipboard-check" /></span>
            Review Applications
          </h1>
          <p className={s.pageSub}>Process student applications across all statuses</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/applications" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Applications
          </Link>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}</div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}<button onClick={() => setNotice('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#059669' }}><i className="fas fa-times" /></button></div>}

      {/* Main card */}
      <div className={s.card} style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', padding: '0.875rem 1.25rem', borderBottom: '1px solid #f0f4f8', gap: '0.75rem' }}>
          <div className={s.filterBar} style={{ padding: 0, borderBottom: 'none', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} className={`${s.filterPill} ${filter === f.key ? s.filterPillActive : ''}`}>
                {f.label}<span className={s.filterCount}>{counts[f.key] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className={s.searchWrap} style={{ maxWidth: 220 }}>
            <i className={`fas fa-search ${s.searchIcon}`} />
            <input className={s.searchInput} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>
        ) : filtered.length === 0 ? (
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-inbox" /></div>
            <div className={s.emptyTitle}>No Applications Found</div>
            <p className={s.emptySub}>{filter === 'all' ? 'No applications submitted yet.' : `No ${filter} applications.`}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '1.25rem' }}>App ID</th>
                    <th>Applicant</th>
                    <th>Program</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th style={{ paddingRight: '1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(app => {
                    const st = STATUS_MAP[app.status] || STATUS_MAP.pending;
                    const py = PAY_MAP[app.payment_status] || PAY_MAP.pending;
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
                        <td><span className={`${s.badge} ${py.cls}`}>{py.label}</span></td>
                        <td><span className={`${s.badge} ${st.cls}`}>{st.label}</span></td>
                        <td><span style={{ fontSize: '0.82rem', color: '#374151' }}>{fmt(app.created_at)}</span></td>
                        <td className={s.actionsCell} style={{ paddingRight: '1.25rem' }}>
                          <div className={s.actionBtns}>
                            <button onClick={() => { setSelected(app); setShowModal(true); }} className={s.btnIcon} title="View Details">
                              <i className="fas fa-eye" />
                            </button>
                            {app.status === 'submitted' || app.status === 'pending' || app.status === 'under_review' ? (
                              hasPermission('application.update') && (
                                <>
                                  <button onClick={() => handleApprove(app.id)} className={`${s.btnIcon} ${s.btnIconGreen}`} title="Approve"><i className="fas fa-check" /></button>
                                  <button onClick={() => handleReject(app.id)} className={`${s.btnIcon} ${s.btnIconDanger}`} title="Reject"><i className="fas fa-times" /></button>
                                </>
                              )
                            ) : null}
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
                const st = STATUS_MAP[app.status] || STATUS_MAP.pending;
                return (
                  <div key={app.id} className={s.mobileCard}>
                    <div className={s.mobileCardHead}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={s.tdAvatar}>{initials(app.applicant_name)}</span>
                        <span className={s.tdName}>{app.applicant_name || 'Unknown'}</span>
                      </div>
                      <span className={`${s.badge} ${st.cls}`}>{st.label}</span>
                    </div>
                    <div className={s.mobileCardBody}>
                      <div className={s.mobileCardRow}><span className={s.mobileCardKey}>App No.</span><span className={s.mobileCardVal}><span className={s.tdMono} style={{ fontSize: '0.72rem' }}>{app.application_number || `APP-${app.id}`}</span></span></div>
                      <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Program</span><span className={s.mobileCardVal}>{app.schema_display_name || app.schema_name || 'N/A'}</span></div>
                      <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Submitted</span><span className={s.mobileCardVal}>{fmt(app.created_at)}</span></div>
                    </div>
                    <div className={s.mobileCardFoot}>
                      <button onClick={() => { setSelected(app); setShowModal(true); }} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}><i className="fas fa-eye" />Details</button>
                      {(app.status === 'submitted' || app.status === 'pending') && hasPermission('application.update') && (
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
        {filtered.length > 0 && <div className={s.cardFooter}><span>Showing <strong>{filtered.length}</strong> of <strong>{all.length}</strong> applications</span></div>}
      </div>

      {/* Detail modal */}
      {showModal && selected && (
        <div className={s.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={`${s.modal} ${s.modalLg}`} onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className={s.modalHeader}>
              <span className={s.modalTitle}><i className="fas fa-file-alt" style={{ color: '#2563eb' }} />Application Details</span>
              <button className={s.modalClose} onClick={() => setShowModal(false)}><i className="fas fa-times" /></button>
            </div>
            <div className={s.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Applicant */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Applicant</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[['Full Name', selected.applicant_name], ['Email', selected.applicant_email], ['Phone', selected.applicant_phone || '—'], ['App ID', selected.application_number || `APP-${selected.id}`]].map(([k, v]) => (
                    <div key={k} className={s.infoRow}><span className={s.infoLabel}>{k}</span><span className={s.infoValue}>{v || '—'}</span></div>
                  ))}
                </div>
              </div>
              {/* Program */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Program</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[['Program', selected.schema_display_name || selected.schema_name], ['Fee', `₦${parseFloat(selected.application_fee || 0).toLocaleString()}`], ['Payment', selected.payment_status || 'pending'], ['Submitted', fmtLong(selected.created_at)]].map(([k, v]) => (
                    <div key={k} className={s.infoRow}><span className={s.infoLabel}>{k}</span><span className={s.infoValue}>{v || '—'}</span></div>
                  ))}
                </div>
              </div>
              {/* Status */}
              <div className={s.infoRow}>
                <span className={s.infoLabel}>Status</span>
                <span className={`${s.badge} ${(STATUS_MAP[selected.status] || STATUS_MAP.pending).cls}`}>{(STATUS_MAP[selected.status] || STATUS_MAP.pending).label}</span>
              </div>
              {/* Application data */}
              {selected.application_data && (() => {
                try {
                  const data = typeof selected.application_data === 'string' ? JSON.parse(selected.application_data) : selected.application_data;
                  return (
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Application Data</div>
                      <pre style={{ background: '#f9fafb', borderRadius: 8, padding: '0.75rem', fontSize: '0.78rem', overflowX: 'auto', margin: 0, color: '#374151' }}>{JSON.stringify(data, null, 2)}</pre>
                    </div>
                  );
                } catch { return null; }
              })()}
            </div>
            <div className={s.modalFooter}>
              {(selected.status === 'submitted' || selected.status === 'pending') && hasPermission('application.update') && (
                <>
                  <button onClick={() => handleApprove(selected.id)} className={`${s.btn} ${s.btnGreen}`}><i className="fas fa-check" />Approve</button>
                  <button onClick={() => handleReject(selected.id)} className={`${s.btn} ${s.btnDanger}`}><i className="fas fa-times" />Reject</button>
                </>
              )}
              <button onClick={() => setShowModal(false)} className={`${s.btn} ${s.btnOutline}`}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
