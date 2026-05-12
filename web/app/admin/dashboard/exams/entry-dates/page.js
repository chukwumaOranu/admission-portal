'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useExams } from '@/hooks/useRedux';
import { usePermissions } from '@/hooks/usePermissions';
import s from '@/styles/admin-portal.module.css';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const BLANK = {
  exam_title: '', exam_description: '', exam_date: '', exam_time: '',
  exam_duration: 120, exam_venue: '', exam_address: '', max_capacity: 100,
  registration_deadline: '', instructions: '', requirements: '', is_active: true,
};

export default function EntryDatesPage() {
  const { data: session, status } = useSession();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const { entryDates, loading, error, fetchEntryDates, createEntryDate, updateEntryDate, deleteEntryDate, clearError } = useExams();

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit]     = useState(false);
  const [showView, setShowView]     = useState(false);
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState(BLANK);
  const [notice, setNotice]         = useState('');
  const loadedRef = useRef(false);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchEntryDates();
    }
  }, [status, session?.user?.id, fetchEntryDates]);

  const field = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const eField = (key, val) => setSelected(p => ({ ...p, [key]: val }));

  const handleCreate = async (e) => {
    e.preventDefault(); clearError(); setNotice('');
    try {
      createEntryDate(form);
      await fetchEntryDates();
      setShowCreate(false); setForm(BLANK);
      setNotice('Entry date created successfully.');
    } catch { /* error shown from redux */ }
  };

  const handleEdit = async (e) => {
    e.preventDefault(); clearError(); setNotice('');
    try {
      updateEntryDate(selected.id, selected);
      await fetchEntryDates();
      setShowEdit(false); setSelected(null);
      setNotice('Entry date updated successfully.');
    } catch { /* error shown from redux */ }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry date?')) return;
    clearError(); setNotice('');
    try {
      deleteEntryDate(id);
      await fetchEntryDates();
      setNotice('Entry date deleted.');
    } catch { /* error shown from redux */ }
  };

  const isRegOpen = (ed) => ed.is_active && new Date() <= new Date(ed.registration_deadline);

  const stats = {
    total:    entryDates.length,
    active:   entryDates.filter(e => e.is_active).length,
    upcoming: entryDates.filter(e => new Date(e.exam_date) > new Date()).length,
    open:     entryDates.filter(e => isRegOpen(e)).length,
  };

  if (permissionsLoading || status === 'loading') {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('entry_date.read')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to view entry dates.</div>
      </div>
    );
  }

  const FormFields = ({ data, onChange }) => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label className={s.formLabel}>Exam Title *</label>
          <input className={s.formInput} type="text" value={data.exam_title} onChange={e => onChange('exam_title', e.target.value)} required />
        </div>
        <div>
          <label className={s.formLabel}>Venue *</label>
          <input className={s.formInput} type="text" value={data.exam_venue} onChange={e => onChange('exam_venue', e.target.value)} required />
        </div>
      </div>
      <div>
        <label className={s.formLabel}>Description</label>
        <textarea className={s.formInput} rows={2} value={data.exam_description} onChange={e => onChange('exam_description', e.target.value)} style={{ resize: 'vertical' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div>
          <label className={s.formLabel}>Exam Date *</label>
          <input className={s.formInput} type="date" value={data.exam_date} onChange={e => onChange('exam_date', e.target.value)} required />
        </div>
        <div>
          <label className={s.formLabel}>Time *</label>
          <input className={s.formInput} type="time" value={data.exam_time} onChange={e => onChange('exam_time', e.target.value)} required />
        </div>
        <div>
          <label className={s.formLabel}>Duration (min)</label>
          <input className={s.formInput} type="number" min={30} max={300} value={data.exam_duration} onChange={e => onChange('exam_duration', parseInt(e.target.value))} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label className={s.formLabel}>Max Capacity</label>
          <input className={s.formInput} type="number" min={1} value={data.max_capacity} onChange={e => onChange('max_capacity', parseInt(e.target.value))} />
        </div>
        <div>
          <label className={s.formLabel}>Registration Deadline *</label>
          <input className={s.formInput} type="date" value={data.registration_deadline} onChange={e => onChange('registration_deadline', e.target.value)} required />
        </div>
      </div>
      <div>
        <label className={s.formLabel}>Address</label>
        <textarea className={s.formInput} rows={2} value={data.exam_address} onChange={e => onChange('exam_address', e.target.value)} style={{ resize: 'vertical' }} />
      </div>
      <div>
        <label className={s.formLabel}>Instructions</label>
        <textarea className={s.formInput} rows={2} value={data.instructions} onChange={e => onChange('instructions', e.target.value)} style={{ resize: 'vertical' }} />
      </div>
      <div>
        <label className={s.formLabel}>Requirements</label>
        <textarea className={s.formInput} rows={2} value={data.requirements} onChange={e => onChange('requirements', e.target.value)} style={{ resize: 'vertical' }} />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
        <input type="checkbox" checked={data.is_active} onChange={e => onChange('is_active', e.target.checked)} style={{ width: 16, height: 16 }} />
        Active
      </label>
    </>
  );

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#fef3c7', color: '#d97706' }}><i className="fas fa-calendar-alt" /></span>
            Entry Exam Dates
          </h1>
          <p className={s.pageSub}>Manage examination dates, venues, and registration</p>
        </div>
        {hasPermission('entry_date.create') && (
          <div className={s.pageActions}>
            <button onClick={() => setShowCreate(true)} className={`${s.btn} ${s.btnPrimary}`}>
              <i className="fas fa-plus" />Add Entry Date
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className={`${s.alert} ${s.alertDanger}`}>
          <i className="fas fa-exclamation-triangle" />{error}
          <button onClick={clearError} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button>
        </div>
      )}
      {notice && (
        <div className={`${s.alert} ${s.alertSuccess}`}>
          <i className="fas fa-check-circle" />{notice}
          <button onClick={() => setNotice('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#059669' }}><i className="fas fa-times" /></button>
        </div>
      )}

      {/* Stat cards */}
      <div className={s.statsGrid} style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total',    value: stats.total,    icon: 'fas fa-calendar-alt',   color: '#d97706' },
          { label: 'Active',   value: stats.active,   icon: 'fas fa-check-circle',   color: '#059669' },
          { label: 'Upcoming', value: stats.upcoming, icon: 'fas fa-calendar-check', color: '#2563eb' },
          { label: 'Reg Open', value: stats.open,     icon: 'fas fa-door-open',      color: '#0891b2' },
        ].map(st => (
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

      {/* Content */}
      {loading ? (
        <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>
      ) : !entryDates.length ? (
        <div className={s.card}>
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#fef3c7', color: '#d97706' }}><i className="fas fa-calendar-alt" /></div>
            <div className={s.emptyTitle}>No Entry Dates Yet</div>
            <p className={s.emptySub}>Create the first exam entry date to get started.</p>
            {hasPermission('entry_date.create') && (
              <button onClick={() => setShowCreate(true)} className={`${s.btn} ${s.btnPrimary}`}><i className="fas fa-plus" />Add Entry Date</button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {entryDates.filter(ed => ed && ed.id).map(ed => {
            const pct = ed.max_capacity ? Math.min(100, Math.round((ed.current_registrations || 0) / ed.max_capacity * 100)) : 0;
            const regOpen = isRegOpen(ed);
            return (
              <div key={ed.id} className={s.card} style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e3a5f', marginBottom: '0.2rem' }}>{ed.exam_title || 'Untitled'}</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{ed.exam_venue || 'No venue'}</div>
                  </div>
                  <span className={`${s.badge} ${ed.is_active ? s.badgeActive : s.badgeInactive}`}>
                    {ed.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ padding: '0.875rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {ed.exam_description && <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{ed.exam_description}</p>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 1rem', fontSize: '0.82rem' }}>
                    <div><span style={{ color: '#9ca3af' }}>Date:</span> <strong style={{ color: '#374151' }}>{fmtDate(ed.exam_date)}</strong></div>
                    <div><span style={{ color: '#9ca3af' }}>Time:</span> <strong style={{ color: '#374151' }}>{ed.exam_time || '—'}</strong></div>
                    <div><span style={{ color: '#9ca3af' }}>Duration:</span> <strong style={{ color: '#374151' }}>{ed.exam_duration} min</strong></div>
                    <div><span style={{ color: '#9ca3af' }}>Deadline:</span> <strong style={{ color: '#374151' }}>{fmtDate(ed.registration_deadline)}</strong></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#6b7280', marginBottom: '0.3rem' }}>
                      <span>Capacity</span>
                      <span><strong>{ed.current_registrations || 0}</strong> / {ed.max_capacity}</span>
                    </div>
                    <div style={{ height: 6, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? '#dc2626' : pct >= 60 ? '#d97706' : '#059669', borderRadius: 999, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                  {regOpen && (
                    <div style={{ fontSize: '0.78rem', color: '#0891b2', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <i className="fas fa-door-open" />Registration Open
                    </div>
                  )}
                </div>
                <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #f0f4f8', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => { setSelected({ ...ed }); setShowView(true); }} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} style={{ flex: 1 }}>
                    <i className="fas fa-eye" />View
                  </button>
                  {hasPermission('entry_date.update') && (
                    <button onClick={() => { setSelected({ ...ed }); setShowEdit(true); }} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} style={{ flex: 1 }}>
                      <i className="fas fa-edit" />Edit
                    </button>
                  )}
                  {hasPermission('entry_date.delete') && (
                    <button onClick={() => handleDelete(ed.id)} className={`${s.btn} ${s.btnDanger} ${s.btnSm}`} style={{ flex: 1 }}>
                      <i className="fas fa-trash" />Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Modal */}
      {showView && selected && (
        <div className={s.modalOverlay} onClick={() => setShowView(false)}>
          <div className={s.modalBox} style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className={s.modalHead}>
              <span className={s.modalTitle}><i className="fas fa-calendar-alt" style={{ color: '#d97706' }} />{selected.exam_title}</span>
              <button className={s.modalClose} onClick={() => setShowView(false)}><i className="fas fa-times" /></button>
            </div>
            <div className={s.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className={`${s.badge} ${selected.is_active ? s.badgeActive : s.badgeInactive}`}>{selected.is_active ? 'Active' : 'Inactive'}</span>
                {isRegOpen(selected) && <span className={`${s.badge} ${s.badgeInfo}`}>Registration Open</span>}
              </div>
              {selected.exam_description && <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>{selected.exam_description}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', fontSize: '0.875rem' }}>
                {[
                  ['Date', fmtDate(selected.exam_date)], ['Time', selected.exam_time || '—'],
                  ['Venue', selected.exam_venue || '—'], ['Duration', `${selected.exam_duration} min`],
                  ['Capacity', `${selected.current_registrations || 0} / ${selected.max_capacity}`],
                  ['Deadline', fmtDate(selected.registration_deadline)],
                ].map(([k, v]) => (
                  <div key={k}><span style={{ color: '#9ca3af' }}>{k}:</span> <strong style={{ color: '#374151' }}>{v}</strong></div>
                ))}
              </div>
              {selected.exam_address && <div style={{ fontSize: '0.875rem' }}><span style={{ color: '#9ca3af' }}>Address:</span> <span style={{ color: '#374151' }}>{selected.exam_address}</span></div>}
              {selected.instructions && <div style={{ fontSize: '0.875rem' }}><span style={{ color: '#9ca3af' }}>Instructions:</span> <span style={{ color: '#374151' }}>{selected.instructions}</span></div>}
              {selected.requirements && <div style={{ fontSize: '0.875rem' }}><span style={{ color: '#9ca3af' }}>Requirements:</span> <span style={{ color: '#374151' }}>{selected.requirements}</span></div>}
            </div>
            <div className={s.modalFoot}>
              <button onClick={() => setShowView(false)} className={`${s.btn} ${s.btnOutline}`}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className={s.modalOverlay} onClick={() => setShowCreate(false)}>
          <div className={s.modalBox} style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleCreate}>
              <div className={s.modalHead}>
                <span className={s.modalTitle}><i className="fas fa-plus" style={{ color: '#d97706' }} />Add Entry Date</span>
                <button type="button" className={s.modalClose} onClick={() => setShowCreate(false)}><i className="fas fa-times" /></button>
              </div>
              <div className={s.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '65vh', overflowY: 'auto' }}>
                <FormFields data={form} onChange={field} />
              </div>
              <div className={s.modalFoot}>
                <button type="button" onClick={() => setShowCreate(false)} className={`${s.btn} ${s.btnOutline}`}>Cancel</button>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm" />Creating…</> : <><i className="fas fa-plus" />Create</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && selected && (
        <div className={s.modalOverlay} onClick={() => setShowEdit(false)}>
          <div className={s.modalBox} style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleEdit}>
              <div className={s.modalHead}>
                <span className={s.modalTitle}><i className="fas fa-edit" style={{ color: '#d97706' }} />Edit Entry Date</span>
                <button type="button" className={s.modalClose} onClick={() => setShowEdit(false)}><i className="fas fa-times" /></button>
              </div>
              <div className={s.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '65vh', overflowY: 'auto' }}>
                <FormFields data={selected} onChange={eField} />
              </div>
              <div className={s.modalFoot}>
                <button type="button" onClick={() => setShowEdit(false)} className={`${s.btn} ${s.btnOutline}`}>Cancel</button>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm" />Saving…</> : <><i className="fas fa-save" />Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
