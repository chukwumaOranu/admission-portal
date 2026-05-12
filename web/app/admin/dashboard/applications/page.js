'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';
import { API_URL } from '@/services/api';
import s from '@/styles/admin-portal.module.css';

const STATUS_MAP = {
  draft:        { label: 'Draft',        cls: s.badgeDraft },
  submitted:    { label: 'Submitted',    cls: s.badgeSubmitted },
  under_review: { label: 'Under Review', cls: s.badgeReview },
  approved:     { label: 'Approved',     cls: s.badgeApproved },
  rejected:     { label: 'Rejected',     cls: s.badgeRejected },
};

const PAY_MAP = {
  paid:    { label: 'Paid',    cls: s.badgePaid },
  pending: { label: 'Pending', cls: s.badgePending },
  failed:  { label: 'Failed',  cls: s.badgeFailed },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const initials = (name) => (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export default function ApplicationsPage() {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  const { applications, loading, error, fetchApplications, deleteApplication, updateApplicationStatus } = useApplications();

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [downloading, setDownloading] = useState(null);
  const loadedRef = useRef(false);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true;
      fetchApplications();
    }
  }, [status, session?.user?.id, session?.accessToken, fetchApplications]);

  const counts = {
    all:          applications.length,
    draft:        applications.filter(a => a.status === 'draft').length,
    submitted:    applications.filter(a => a.status === 'submitted').length,
    under_review: applications.filter(a => a.status === 'under_review').length,
    approved:     applications.filter(a => a.status === 'approved').length,
  };

  const filtered = applications.filter(a => {
    const matchFilter = filter === 'all' || a.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || (a.applicant_name || '').toLowerCase().includes(q) || (a.applicant_email || '').toLowerCase().includes(q) || (a.application_number || '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const allSelected = filtered.length > 0 && filtered.every(a => selected.includes(a.id));
  const toggleAll = () => setSelected(allSelected ? [] : filtered.map(a => a.id));
  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this application?')) return;
    try { await deleteApplication(id); setSelected(p => p.filter(x => x !== id)); }
    catch (e) { alert('Failed to delete application'); }
  };

  const handleBulkApprove = async () => {
    if (!window.confirm(`Approve ${selected.length} application(s)?`)) return;
    try {
      Promise.all(selected.map(id => updateApplicationStatus(id, 'approved')));
      setSelected([]);
    } catch { alert('Failed to approve applications'); }
  };

  const handleDownload = async (id) => {
    try {
      setDownloading(id);
      const res = await fetch(`${API_URL}/applications/${id}/download`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `application_${id}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { alert('Failed to download'); }
    finally { setDownloading(null); }
  };

  const FILTERS = [
    { key: 'all',          label: 'All' },
    { key: 'draft',        label: 'Draft' },
    { key: 'submitted',    label: 'Submitted' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'approved',     label: 'Approved' },
  ];

  if (status === 'loading') return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-file-alt" /></span>
            Application Management
          </h1>
          <p className={s.pageSub}>Review and process student applications</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/applications/schemas" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-cogs" />Schemas
          </Link>
          <Link href="/admin/dashboard/applications/admission" className={`${s.btn} ${s.btnGreen}`}>
            <i className="fas fa-graduation-cap" />Admission Results
          </Link>
        </div>
      </div>

      {error && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}</div>}

      {/* Main card */}
      <div className={s.card} style={{ marginBottom: 0 }}>

        {/* Filter + search bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', padding: '0.875rem 1.25rem', borderBottom: '1px solid #f0f4f8', gap: '0.75rem' }}>
          <div className={s.filterBar} style={{ padding: 0, borderBottom: 'none', flex: 1, minWidth: 0 }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`${s.filterPill} ${filter === f.key ? s.filterPillActive : ''}`}>
                {f.label}
                <span className={s.filterCount}>{counts[f.key] ?? 0}</span>
              </button>
            ))}
          </div>
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
              <button onClick={handleBulkApprove} className={`${s.btn} ${s.btnGreen} ${s.btnSm}`}>
                <i className="fas fa-check" />Approve selected
              </button>
            </div>
          </div>
        )}

        {/* Desktop table */}
        {loading ? (
          <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>
        ) : filtered.length === 0 ? (
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-inbox" /></div>
            <div className={s.emptyTitle}>No Applications Found</div>
            <p className={s.emptySub}>{filter === 'all' ? 'No applications have been submitted yet.' : `No ${filter} applications.`}</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th style={{ width: 40, paddingLeft: '1.25rem' }}>
                      <input type="checkbox" className={s.checkbox} checked={allSelected} onChange={toggleAll} />
                    </th>
                    <th>App ID</th>
                    <th>Applicant</th>
                    <th>Program</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Submitted</th>
                    <th>Updated</th>
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
                      <td>
                        <span className={`${s.badge} ${s.badgeInfo}`}>{app.schema_display_name || app.schema_name || 'N/A'}</span>
                      </td>
                      <td>
                        <span className={`${s.badge} ${(STATUS_MAP[app.status] || STATUS_MAP.draft).cls}`}>
                          {(STATUS_MAP[app.status] || { label: app.status }).label}
                        </span>
                      </td>
                      <td>
                        <span className={`${s.badge} ${(PAY_MAP[app.payment_status] || PAY_MAP.pending).cls}`}>
                          {(PAY_MAP[app.payment_status] || { label: app.payment_status || 'pending' }).label}
                        </span>
                      </td>
                      <td><span className={s.tdSub} style={{ fontSize: '0.82rem', color: '#374151' }}>{fmt(app.created_at)}</span></td>
                      <td><span className={s.tdSub} style={{ fontSize: '0.82rem', color: '#374151' }}>{fmt(app.updated_at)}</span></td>
                      <td className={s.actionsCell} style={{ paddingRight: '1.25rem' }}>
                        <div className={s.actionBtns}>
                          <Link href={`/admin/dashboard/applications/${app.id}`} className={`${s.btnIcon}`} title="View">
                            <i className="fas fa-eye" />
                          </Link>
                          <button className={`${s.btnIcon}`} onClick={() => handleDownload(app.id)} title="Download" disabled={downloading === app.id}>
                            {downloading === app.id ? <span className="spinner-border spinner-border-sm" /> : <i className="fas fa-download" />}
                          </button>
                          {hasPermission('application.update') && app.status === 'draft' && (
                            <Link href={`/admin/dashboard/applications/${app.id}/edit`} className={`${s.btnIcon}`} title="Edit">
                              <i className="fas fa-edit" />
                            </Link>
                          )}
                          {hasPermission('application.delete') && (
                            <button className={`${s.btnIcon} ${s.btnIconDanger}`} onClick={() => handleDelete(app.id)} title="Delete">
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
              {filtered.map(app => (
                <div key={app.id} className={s.mobileCard}>
                  <div className={s.mobileCardHead}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" className={s.checkbox} checked={selected.includes(app.id)} onChange={() => toggle(app.id)} />
                      <span className={s.tdMono} style={{ fontSize: '0.78rem' }}>{app.application_number || `APP-${app.id}`}</span>
                    </div>
                    <span className={`${s.badge} ${(STATUS_MAP[app.status] || STATUS_MAP.draft).cls}`}>
                      {(STATUS_MAP[app.status] || { label: app.status }).label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    <span className={s.tdAvatar}>{initials(app.applicant_name)}</span>
                    <div>
                      <div className={s.tdName}>{app.applicant_name || 'Unknown'}</div>
                      <div className={s.tdEmail}>{app.applicant_email || '—'}</div>
                    </div>
                  </div>
                  <div className={s.mobileCardBody}>
                    <div className={s.mobileCardRow}>
                      <span className={s.mobileCardKey}>Program</span>
                      <span className={s.mobileCardVal}>{app.schema_display_name || app.schema_name || 'N/A'}</span>
                    </div>
                    <div className={s.mobileCardRow}>
                      <span className={s.mobileCardKey}>Payment</span>
                      <span className={`${s.badge} ${(PAY_MAP[app.payment_status] || PAY_MAP.pending).cls}`}>
                        {(PAY_MAP[app.payment_status] || { label: app.payment_status || 'pending' }).label}
                      </span>
                    </div>
                    <div className={s.mobileCardRow}>
                      <span className={s.mobileCardKey}>Submitted</span>
                      <span className={s.mobileCardVal}>{fmt(app.created_at)}</span>
                    </div>
                  </div>
                  <div className={s.mobileCardFoot}>
                    <Link href={`/admin/dashboard/applications/${app.id}`} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}>
                      <i className="fas fa-eye" />View
                    </Link>
                    <button onClick={() => handleDownload(app.id)} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} disabled={downloading === app.id}>
                      <i className="fas fa-download" />Download
                    </button>
                    {hasPermission('application.delete') && (
                      <button onClick={() => handleDelete(app.id)} className={`${s.btn} ${s.btnDanger} ${s.btnSm}`}>
                        <i className="fas fa-trash" />Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        {filtered.length > 0 && (
          <div className={s.cardFooter}>
            <span>Showing <strong>{filtered.length}</strong> of <strong>{applications.length}</strong> applications</span>
          </div>
        )}
      </div>
    </div>
  );
}
