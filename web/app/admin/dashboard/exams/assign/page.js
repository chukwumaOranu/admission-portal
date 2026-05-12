'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useApplications } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';
import s from '@/styles/admin-portal.module.css';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const initials = (name) => (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export default function AssignExamsPage() {
  const { data: session, status } = useSession();
  const { applications, fetchApplications } = useApplications();
  const { hasPermission } = usePermissions();

  const [entryDates, setEntryDates]         = useState([]);
  const [calendar, setCalendar]             = useState([]);
  const [selectedApps, setSelectedApps]     = useState([]);
  const [selectedEntryDateId, setSelected]  = useState('');
  const [autoAssign, setAutoAssign]         = useState(true);
  const [busy, setBusy]                     = useState(false);
  const [error, setError]                   = useState('');
  const [notice, setNotice]                 = useState('');
  const loadedRef = useRef(false);

  const canReadCalendar    = hasPermission('exam_calendar.read');
  const canManageAssign    = hasPermission('exam_assignment.manage');

  const eligible = useMemo(
    () => applications.filter(a => a.status === 'approved' && a.payment_status === 'paid'),
    [applications]
  );

  const loadExamData = useCallback(async () => {
    if (!canReadCalendar) return;
    try {
      const [datesRes, calRes] = await Promise.all([
        apiService.get(API_ENDPOINTS.EXAMS.ENTRY_DATES.AVAILABLE_LIST),
        apiService.get(API_ENDPOINTS.EXAMS.ENTRY_DATES.CALENDAR_AVAILABILITY),
      ]);
      setEntryDates(datesRes.data || []);
      setCalendar(calRes.data || []);
    } catch (e) { setError(e.message || 'Failed to load exam data'); }
  }, [canReadCalendar]);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true;
      fetchApplications();
      loadExamData();
    }
  }, [status, session?.user?.id, fetchApplications, loadExamData]);

  const toggleAll = (checked) => setSelectedApps(checked ? eligible.map(a => a.id) : []);
  const toggle = (id) => setSelectedApps(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleAssign = async () => {
    if (!canManageAssign) return;
    if (!selectedApps.length) { setError('Select at least one application.'); return; }
    if (!autoAssign && !selectedEntryDateId) { setError('Select an exam date or enable auto-assignment.'); return; }
    try {
      setBusy(true); setError(''); setNotice('');
      const res = await apiService.post(API_ENDPOINTS.APPLICATIONS.ASSIGN_EXAM, {
        applicant_ids: selectedApps,
        exam_date_id: selectedEntryDateId || null,
        auto_assign_next_available: autoAssign,
      });
      const assigned = res.data?.total_assigned || 0;
      const failed   = res.data?.total_failed   || 0;
      setNotice(`Assignment complete — Assigned: ${assigned}, Failed: ${failed}`);
      setSelectedApps([]);
      await Promise.all([fetchApplications(), loadExamData()]);
    } catch (e) { setError(e.message || 'Failed to assign exam dates'); }
    finally { setBusy(false); }
  };

  if (status === 'loading') return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;

  if (!canReadCalendar) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to view exam assignments.</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#fef3c7', color: '#d97706' }}><i className="fas fa-calendar-check" /></span>
            Assign Exam Dates
          </h1>
          <p className={s.pageSub}>Assign approved &amp; paid applicants to examination slots</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/exams/entry-dates" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-calendar-alt" />Manage Entry Dates
          </Link>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')}  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}<button onClick={() => setNotice('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#059669' }}><i className="fas fa-times" /></button></div>}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Assignment options */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-cog" style={{ color: '#d97706' }} />Assignment Options</span>
            </div>
            <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                <input type="checkbox" checked={autoAssign} onChange={e => setAutoAssign(e.target.checked)} style={{ width: 16, height: 16 }} />
                Auto-assign next available date
              </label>
              <div>
                <label className={s.formLabel}>Preferred exam slot</label>
                <select className={s.formSelect} disabled={autoAssign} value={selectedEntryDateId} onChange={e => setSelected(e.target.value)}>
                  <option value="">Any available slot</option>
                  {entryDates.map(ed => (
                    <option key={ed.id} value={ed.id}>
                      {fmtDate(ed.exam_date)} {ed.exam_time} — {ed.exam_venue} ({ed.current_registrations}/{ed.max_capacity})
                    </option>
                  ))}
                </select>
              </div>
              <button
                className={`${s.btn} ${s.btnPrimary}`}
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={busy || !canManageAssign || !selectedApps.length}
                onClick={handleAssign}
              >
                {busy
                  ? <><span className="spinner-border spinner-border-sm" />Assigning…</>
                  : <><i className="fas fa-check" />Assign {selectedApps.length} Applicant{selectedApps.length !== 1 ? 's' : ''}</>}
              </button>
            </div>
          </div>

          {/* Calendar capacity */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-chart-bar" style={{ color: '#2563eb' }} />Calendar Capacity</span>
            </div>
            <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.875rem' }}>
              {calendar.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: '#9ca3af', textAlign: 'center', padding: '0.5rem 0' }}>No active exam dates</p>
              ) : calendar.map(day => {
                const pct = day.total_capacity ? Math.round(day.used_capacity / day.total_capacity * 100) : 0;
                return (
                  <div key={day.exam_date}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{fmtDate(day.exam_date)}</span>
                      <span style={{ color: '#6b7280' }}>{day.used_capacity}/{day.total_capacity}</span>
                    </div>
                    <div style={{ height: 5, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? '#dc2626' : pct >= 60 ? '#d97706' : '#059669', borderRadius: 999 }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.15rem' }}>{day.open_slots} open slot{day.open_slots !== 1 ? 's' : ''}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: eligible applications */}
        <div className={s.card} style={{ marginBottom: 0 }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className={s.cardTitle} style={{ margin: 0 }}>
              <i className="fas fa-file-alt" style={{ color: '#2563eb' }} />Eligible Applications
              <span className={`${s.badge} ${s.badgeInfo}`} style={{ marginLeft: '0.5rem' }}>{eligible.length}</span>
            </span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#6b7280', cursor: 'pointer' }}>
              <input type="checkbox" className={s.checkbox}
                checked={selectedApps.length === eligible.length && eligible.length > 0}
                onChange={e => toggleAll(e.target.checked)}
              />
              Select all
            </label>
          </div>

          {selectedApps.length > 0 && (
            <div className={s.bulkBar}>
              <span className={s.bulkBarInfo}><i className="fas fa-check-square" />{selectedApps.length} selected</span>
              <button onClick={() => setSelectedApps([])} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}>Deselect all</button>
            </div>
          )}

          {/* Desktop table */}
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th style={{ width: 40, paddingLeft: '1.25rem' }}></th>
                  <th>App #</th>
                  <th>Applicant</th>
                  <th>Email</th>
                  <th>Exam Date</th>
                  <th style={{ paddingRight: '1.25rem' }}>Venue</th>
                </tr>
              </thead>
              <tbody>
                {eligible.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', fontSize: '0.875rem' }}>No approved + paid applications available.</td></tr>
                ) : eligible.map(app => (
                  <tr key={app.id}>
                    <td style={{ paddingLeft: '1.25rem' }}>
                      <input type="checkbox" className={s.checkbox} checked={selectedApps.includes(app.id)} onChange={() => toggle(app.id)} />
                    </td>
                    <td><span className={s.tdMono}>{app.application_number || `APP-${app.id}`}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={s.tdAvatar}>{initials(app.applicant_name)}</span>
                        <span className={s.tdName}>{app.applicant_name || '—'}</span>
                      </div>
                    </td>
                    <td><span className={s.tdSub}>{app.applicant_email || '—'}</span></td>
                    <td><span className={s.tdSub}>{app.exam_date ? fmtDate(app.exam_date) : <span style={{ color: '#9ca3af' }}>Not assigned</span>}</span></td>
                    <td style={{ paddingRight: '1.25rem' }}><span className={s.tdSub}>{app.exam_venue || '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className={s.mobileList}>
            {eligible.map(app => (
              <div key={app.id} className={s.mobileCard}>
                <div className={s.mobileCardHead}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" className={s.checkbox} checked={selectedApps.includes(app.id)} onChange={() => toggle(app.id)} />
                    <span className={s.tdAvatar}>{initials(app.applicant_name)}</span>
                    <div>
                      <div className={s.tdName}>{app.applicant_name || '—'}</div>
                      <div className={s.tdEmail}>{app.applicant_email || '—'}</div>
                    </div>
                  </div>
                  <span className={s.tdMono} style={{ fontSize: '0.75rem' }}>{app.application_number || `APP-${app.id}`}</span>
                </div>
                <div className={s.mobileCardBody}>
                  <div className={s.mobileCardRow}>
                    <span className={s.mobileCardKey}>Exam Date</span>
                    <span className={s.mobileCardVal}>{app.exam_date ? fmtDate(app.exam_date) : 'Not assigned'}</span>
                  </div>
                  <div className={s.mobileCardRow}>
                    <span className={s.mobileCardKey}>Venue</span>
                    <span className={s.mobileCardVal}>{app.exam_venue || '—'}</span>
                  </div>
                </div>
              </div>
            ))}
            {eligible.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '0.875rem' }}>No eligible applications.</div>
            )}
          </div>

          {eligible.length > 0 && (
            <div className={s.cardFooter}>
              <span>Showing <strong>{eligible.length}</strong> eligible application{eligible.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 991px) {
          div[style*="grid-template-columns: 320px 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
