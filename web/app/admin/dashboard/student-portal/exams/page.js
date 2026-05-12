'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useApplications } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';
import api from '@/services/api';
import s from '@/styles/student-portal.module.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDateKey = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.includes('T') ? value.split('T')[0] : value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const monthLabel = (d) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export default function StudentExams() {
  const { status } = useSession();
  const { applications, loading: appsLoading, fetchMyApplications } = useApplications();
  const [downloadingCard, setDownloadingCard] = useState(null);
  const [entryDates, setEntryDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [selectedAppId, setSelectedAppId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const paidApps = useMemo(() => applications.filter((a) => a.payment_status === 'paid'), [applications]);
  const scheduledExams = useMemo(() => paidApps.filter((a) => a.exam_date_id && a.exam_date), [paidApps]);

  const grouped = useMemo(() => {
    const g = {};
    for (const d of entryDates) {
      const k = toDateKey(d.exam_date);
      if (!k) continue;
      if (!g[k]) g[k] = [];
      g[k].push(d);
    }
    Object.values(g).forEach((arr) => arr.sort((a, b) => String(a.exam_time || '').localeCompare(String(b.exam_time || ''))));
    return g;
  }, [entryDates]);

  const daySlots = useMemo(() => grouped[selectedDate] || [], [grouped, selectedDate]);

  const grid = useMemo(() => {
    const year = currentMonth.getFullYear(), month = currentMonth.getMonth();
    const offset = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const cells = Array.from({ length: offset }, (_, i) => ({ key: `e${i}`, empty: true }));
    for (let d = 1; d <= days; d++) {
      const dk = toDateKey(new Date(year, month, d));
      const slots = grouped[dk] || [];
      const remaining = slots.reduce((sum, sl) => sum + Math.max(0, Number(sl.max_capacity || 0) - Number(sl.current_registrations || 0)), 0);
      cells.push({ key: dk, day: d, dateKey: dk, hasSlots: slots.length > 0, slotCount: slots.length, remaining });
    }
    return cells;
  }, [currentMonth, grouped]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchMyApplications();
    apiService.get(API_ENDPOINTS.EXAMS.ENTRY_DATES.AVAILABLE_LIST)
      .then((r) => setEntryDates(r.data || []))
      .catch((e) => setError(e.message || 'Failed to load exam dates'));
  }, [status, fetchMyApplications]);

  useEffect(() => {
    if (entryDates.length === 0 || selectedDate) return;
    const first = toDateKey(entryDates[0].exam_date);
    setSelectedDate(first);
    const firstSlots = entryDates.filter((d) => toDateKey(d.exam_date) === first);
    if (firstSlots.length) setSelectedSlotId(String(firstSlots[0].id));
  }, [entryDates, selectedDate]);

  const assignExamDate = async () => {
    if (!selectedAppId || !selectedSlotId) { setError('Select an application and an exam slot'); return; }
    try {
      setAssigning(true); setError(''); setNotice('');
      const res = await apiService.put(API_ENDPOINTS.APPLICATIONS.SELECT_EXAM_DATE(selectedAppId), { exam_date_id: Number(selectedSlotId) });
      setNotice(res.message || 'Exam date selected successfully');
      setSelectedSlotId('');
      fetchMyApplications();
      const refreshed = await apiService.get(API_ENDPOINTS.EXAMS.ENTRY_DATES.AVAILABLE_LIST);
      const next = refreshed.data || [];
      setEntryDates(next);
      if (selectedDate && !next.some((sl) => toDateKey(sl.exam_date) === selectedDate)) setSelectedDate('');
    } catch (e) { setError(e.message || 'Failed to assign exam date'); }
    finally { setAssigning(false); }
  };

  const downloadCard = async (appId, format = 'pdf') => {
    try {
      setDownloadingCard(appId);
      const exam = scheduledExams.find((a) => a.id === appId);
      if (!exam) return;
      const res = await api.get(`/exams/cards/generate/${exam.id}?format=${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url; link.download = `exam-card-${exam.application_id || exam.id}.${format === 'pdf' ? 'pdf' : 'jpg'}`;
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { alert(e.message || 'Failed to download exam card.'); }
    finally { setDownloadingCard(null); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  if (appsLoading || status === 'loading') {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status"><span className="visually-hidden">Loading…</span></div></div>;
  }

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#fffbeb', color: '#d97706' }}><i className="fas fa-clipboard-check" /></span>
            Exam Management
          </h1>
          <p className={s.pageSub}>Select your exam date and download your exam card</p>
        </div>
        <Link href="/admin/dashboard/student-portal/applications" className={s.btnOutline}><i className="fas fa-arrow-left" />Applications</Link>
      </div>

      {error  && <div className={`${s.alertDanger} mb-3`}><i className="fas fa-exclamation-triangle me-2" />{error}</div>}
      {notice && <div className={`${s.alertSuccess} mb-3`}><i className="fas fa-check-circle me-2" />{notice}</div>}

      <div className={`${s.alertInfo} mb-4`}>
        <i className="fas fa-info-circle me-2" />Exam dates are configured by the admin. Select a date with available slots below.
      </div>

      {/* No paid applications */}
      {paidApps.length === 0 && (
        <div className={s.card}>
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#fef3c7', color: '#d97706' }}><i className="fas fa-credit-card" /></div>
            <h5 className={s.emptyTitle}>No Paid Applications</h5>
            <p className={s.emptySub}>Complete your application payment before selecting an exam date.</p>
            <Link href="/admin/dashboard/student-portal/applications" className={s.btnPrimary}><i className="fas fa-file-alt" />Go to Applications</Link>
          </div>
        </div>
      )}

      {/* Date selector */}
      {paidApps.length > 0 && (
        <div className={s.card} style={{ marginBottom: '1.5rem' }}>
          <div className={s.cardHeader}><span className={s.cardTitle}><i className="fas fa-calendar-alt me-2" style={{ color: '#d97706' }} />Select Exam Date</span></div>
          <div className={s.cardBody}>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Application</label>
                <select className="form-select" value={selectedAppId} onChange={(e) => setSelectedAppId(e.target.value)} style={{ borderRadius: '8px' }}>
                  <option value="">Choose application…</option>
                  {paidApps.filter((a) => !a.exam_date_id).map((a) => (
                    <option key={a.id} value={a.id}>{a.application_number || `APP${a.id}`} — {a.schema_display_name || a.schema_name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 d-flex align-items-end">
                <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>Pick a highlighted date on the calendar, then select a time slot.</p>
              </div>
            </div>

            {/* Calendar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 700, color: '#1e293b' }}>{monthLabel(currentMonth)}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className={s.btnOutline} style={{ padding: '0.3rem 0.75rem' }}><i className="fas fa-chevron-left" /></button>
                <button onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className={s.btnOutline} style={{ padding: '0.3rem 0.75rem' }}><i className="fas fa-chevron-right" /></button>
              </div>
            </div>

            <div style={{ border: '1px solid #e5eaf2', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', background: '#f8fafc', borderBottom: '1px solid #e5eaf2' }}>
                {WEEKDAYS.map((d) => <div key={d} style={{ textAlign: 'center', padding: '0.5rem 0', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>{d}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', padding: '4px', background: '#f8fafc' }}>
                {grid.map((cell) => cell.empty ? (
                  <div key={cell.key} style={{ height: 72 }} />
                ) : (
                  <button key={cell.key} type="button" disabled={!cell.hasSlots}
                    onClick={() => {
                      setSelectedDate(cell.dateKey);
                      const slots = grouped[cell.dateKey] || [];
                      if (!slots.some((sl) => String(sl.id) === selectedSlotId)) setSelectedSlotId(slots.length ? String(slots[0].id) : '');
                    }}
                    style={{
                      height: 72, borderRadius: '8px', border: 'none', cursor: cell.hasSlots ? 'pointer' : 'default',
                      background: selectedDate === cell.dateKey ? '#1e3a5f' : cell.hasSlots ? '#eff6ff' : '#fff',
                      color: selectedDate === cell.dateKey ? '#fff' : cell.hasSlots ? '#1e3a5f' : '#d1d5db',
                      padding: '0.4rem', textAlign: 'left', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{cell.day}</div>
                    {cell.hasSlots && (
                      <div style={{ fontSize: '0.65rem', lineHeight: 1.3, opacity: 0.85 }}>
                        {cell.slotCount} slot{cell.slotCount !== 1 ? 's' : ''}<br />{cell.remaining} left
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Slot selector */}
            {selectedDate && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem' }}>
                  Available Slots — {new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                {daySlots.length === 0 ? (
                  <div className={s.alertWarning}>No slots available for this date.</div>
                ) : (
                  <div className="row g-3">
                    {daySlots.map((slot) => (
                      <div key={slot.id} className="col-md-6">
                        <label style={{
                          display: 'block', border: `2px solid ${String(slot.id) === String(selectedSlotId) ? '#1e3a5f' : '#e5eaf2'}`,
                          borderRadius: '10px', padding: '1rem', cursor: 'pointer',
                          background: String(slot.id) === String(selectedSlotId) ? '#eff6ff' : '#fafbfc', transition: 'all 0.15s',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <input type="radio" name="exam_slot" checked={String(slot.id) === String(selectedSlotId)} onChange={() => setSelectedSlotId(String(slot.id))} style={{ accentColor: '#1e3a5f' }} />
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{slot.exam_time} — {slot.exam_venue}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Capacity: {slot.current_registrations}/{slot.max_capacity}</div>
                          {slot.exam_title && <div style={{ fontSize: '0.8rem', color: '#374151', marginTop: '0.2rem' }}>{slot.exam_title}</div>}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button className={s.btnPrimary} style={{ padding: '0.65rem 1.5rem' }} onClick={assignExamDate} disabled={assigning || !selectedSlotId}>
                {assigning ? <><span className="spinner-border spinner-border-sm" />Confirming…</> : <><i className="fas fa-check" />Confirm Exam Date</>}
              </button>
              {selectedSlotId && <small style={{ color: '#9ca3af' }}>If this slot fills up before confirmation, you can choose another.</small>}
            </div>
          </div>
        </div>
      )}

      {/* Scheduled exams */}
      {scheduledExams.length > 0 && (
        <div className={s.card}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}><i className="fas fa-check-circle me-2" style={{ color: '#059669' }} />Scheduled Exams ({scheduledExams.length})</span>
          </div>
          <div className={s.cardBody}>
            <div className="row g-3">
              {scheduledExams.map((exam) => (
                <div key={exam.id} className="col-md-6">
                  <div style={{ border: '1px solid #e5eaf2', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ background: '#f8fafc', padding: '0.875rem 1.25rem', borderBottom: '1px solid #e5eaf2' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{exam.schema_display_name || exam.schema_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}><i className="fas fa-hashtag me-1" />{exam.application_id || `APP${exam.id}`}</div>
                    </div>
                    <div style={{ padding: '1.25rem' }}>
                      {[
                        ['Exam Date',  fmt(exam.exam_date)],
                        ['Time',       exam.exam_time || 'TBA'],
                        ['Venue',      exam.exam_venue || 'TBA'],
                      ].map(([label, value]) => (
                        <div key={label} className={s.infoRow}>
                          <span className={s.infoLabel}>{label}</span>
                          <span className={s.infoValue}>{value}</span>
                        </div>
                      ))}
                      <div className={`${s.alertInfo} mt-3`} style={{ fontSize: '0.78rem' }}>
                        <i className="fas fa-info-circle me-1" />Arrive 30 minutes before exam time with a valid ID and your exam card.
                      </div>
                    </div>
                    <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #f0f4f8', background: '#fafbfc' }}>
                      <button className={s.btnPrimary} style={{ width: '100%', justifyContent: 'center' }} onClick={() => downloadCard(exam.id, 'pdf')} disabled={downloadingCard === exam.id}>
                        {downloadingCard === exam.id ? <><span className="spinner-border spinner-border-sm" />Generating…</> : <><i className="fas fa-file-pdf" />Download Exam Card (PDF)</>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pending assignment */}
      {paidApps.length > 0 && scheduledExams.length === 0 && (
        <div className={s.card} style={{ marginTop: '1.5rem' }}>
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#fffbeb', color: '#d97706' }}><i className="fas fa-hourglass-half" /></div>
            <h5 className={s.emptyTitle}>Exam Date Pending</h5>
            <p className={s.emptySub}>Use the calendar above to select an available exam date slot.</p>
          </div>
        </div>
      )}
    </div>
  );
}
