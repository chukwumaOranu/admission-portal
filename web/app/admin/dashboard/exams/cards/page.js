'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useExams, useApplications } from '@/hooks/useRedux';
import { usePermissions } from '@/hooks/usePermissions';
import apiService from '@/services/api';
import s from '@/styles/admin-portal.module.css';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function ExamCardsPage() {
  const { data: session, status } = useSession();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const { examCards, entryDates, loading, error, fetchExamCards, fetchEntryDates, createExamCard, deleteExamCard, updateExamCard, clearError } = useExams();
  const { applications, fetchApplications } = useApplications();

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [newCard, setNewCard]       = useState({ applicant_id: '', entry_date_id: '' });
  const loadedRef = useRef(false);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true;
      fetchExamCards(); fetchEntryDates(); fetchApplications();
    }
  }, [status, session?.user?.id, fetchExamCards, fetchEntryDates, fetchApplications]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      createExamCard(newCard);
      setShowCreate(false); setNewCard({ applicant_id: '', entry_date_id: '' });
    } catch { alert('Failed to generate exam card'); }
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this exam card?')) return;
    deleteExamCard(id);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editing) return;
    try {
      updateExamCard({ id: editing.id, entry_date_id: editing.entry_date_id });
      setShowEdit(false); setEditing(null);
    } catch { alert('Failed to update exam card'); }
  };

  const handleDownload = async (card) => {
    try {
      setDownloading(card.id);
      const res = await apiService.get(`/exams/cards/generate/${card.applicant_id}?format=pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `exam-card-${card.card_number}.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch { alert('Failed to download exam card'); }
    finally { setDownloading(null); }
  };

  const getApplicant = (id) => {
    const app = applications.find(a => a.id === id);
    return app ? (app.applicant_name || `${app.first_name || ''} ${app.last_name || ''}`.trim() || `#${id}`) : `Applicant #${id}`;
  };

  const getExamDate = (id) => {
    const ed = entryDates.find(d => d.id === id);
    return ed ? fmtDate(ed.exam_date) : `#${id}`;
  };

  if (permissionsLoading || status === 'loading') {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('exam_card.read')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to view exam cards.</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#fef3c7', color: '#d97706' }}><i className="fas fa-id-card" /></span>
            Exam Cards
          </h1>
          <p className={s.pageSub}>Generate, manage and download student exam cards</p>
        </div>
        {hasPermission('exam_card.create') && (
          <div className={s.pageActions}>
            <button onClick={() => setShowCreate(true)} className={`${s.btn} ${s.btnPrimary}`}>
              <i className="fas fa-plus" />Generate Card
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

      {/* Stat cards */}
      <div className={s.statsGrid} style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Cards',   value: examCards.length,                                             icon: 'fas fa-id-card',       color: '#d97706' },
          { label: 'Entry Dates',   value: entryDates.length,                                            icon: 'fas fa-calendar-alt',  color: '#2563eb' },
          { label: 'Applicants',    value: new Set(examCards.map(c => c.applicant_id)).size,             icon: 'fas fa-user-graduate', color: '#7c3aed' },
          { label: 'Active Slots',  value: entryDates.filter(d => d.is_active).length,                  icon: 'fas fa-check-circle',  color: '#059669' },
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

      {/* Main card */}
      <div className={s.card} style={{ marginBottom: 0 }}>
        {loading ? (
          <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>
        ) : !examCards.length ? (
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#fef3c7', color: '#d97706' }}><i className="fas fa-id-card" /></div>
            <div className={s.emptyTitle}>No Exam Cards</div>
            <p className={s.emptySub}>Generate exam cards for approved applicants.</p>
            {hasPermission('exam_card.create') && (
              <button onClick={() => setShowCreate(true)} className={`${s.btn} ${s.btnPrimary}`}><i className="fas fa-plus" />Generate Card</button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '1.25rem' }}>Card Number</th>
                    <th>Applicant</th>
                    <th>Exam Date</th>
                    <th>Generated</th>
                    <th style={{ paddingRight: '1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {examCards.map(card => (
                    <tr key={card.id}>
                      <td style={{ paddingLeft: '1.25rem' }}>
                        <span className={s.tdMono}>{card.card_number}</span>
                      </td>
                      <td><span className={s.tdName}>{getApplicant(card.applicant_id)}</span></td>
                      <td><span className={s.tdSub}>{getExamDate(card.entry_date_id)}</span></td>
                      <td><span className={s.tdSub} style={{ fontSize: '0.82rem', color: '#374151' }}>{fmtDate(card.generated_at)}</span></td>
                      <td className={s.actionsCell} style={{ paddingRight: '1.25rem' }}>
                        <div className={s.actionBtns}>
                          <button className={s.btnIcon} onClick={() => handleDownload(card)} title="Download PDF" disabled={downloading === card.id}>
                            {downloading === card.id ? <span className="spinner-border spinner-border-sm" /> : <i className="fas fa-download" />}
                          </button>
                          {hasPermission('exam_card.update') && (
                            <button className={s.btnIcon} onClick={() => { setEditing({ ...card }); setShowEdit(true); }} title="Edit">
                              <i className="fas fa-edit" />
                            </button>
                          )}
                          {hasPermission('exam_card.delete') && (
                            <button className={`${s.btnIcon} ${s.btnIconDanger}`} onClick={() => handleDelete(card.id)} title="Delete">
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
              {examCards.map(card => (
                <div key={card.id} className={s.mobileCard}>
                  <div className={s.mobileCardHead}>
                    <span className={s.tdMono}>{card.card_number}</span>
                    <span className={s.tdSub} style={{ fontSize: '0.78rem' }}>{fmtDate(card.generated_at)}</span>
                  </div>
                  <div className={s.mobileCardBody}>
                    <div className={s.mobileCardRow}>
                      <span className={s.mobileCardKey}>Applicant</span>
                      <span className={s.mobileCardVal}>{getApplicant(card.applicant_id)}</span>
                    </div>
                    <div className={s.mobileCardRow}>
                      <span className={s.mobileCardKey}>Exam Date</span>
                      <span className={s.mobileCardVal}>{getExamDate(card.entry_date_id)}</span>
                    </div>
                  </div>
                  <div className={s.mobileCardFoot}>
                    <button onClick={() => handleDownload(card)} className={`${s.btn} ${s.btnGreen} ${s.btnSm}`} disabled={downloading === card.id}>
                      {downloading === card.id ? <span className="spinner-border spinner-border-sm" /> : <i className="fas fa-download" />}
                      Download
                    </button>
                    {hasPermission('exam_card.delete') && (
                      <button onClick={() => handleDelete(card.id)} className={`${s.btn} ${s.btnDanger} ${s.btnSm}`}>
                        <i className="fas fa-trash" />Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {examCards.length > 0 && (
          <div className={s.cardFooter}>
            <span>Showing <strong>{examCards.length}</strong> exam card{examCards.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      {showCreate && (
        <div className={s.modalOverlay} onClick={() => setShowCreate(false)}>
          <div className={s.modalBox} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleCreate}>
              <div className={s.modalHead}>
                <span className={s.modalTitle}><i className="fas fa-id-card" style={{ color: '#d97706' }} />Generate Exam Card</span>
                <button type="button" className={s.modalClose} onClick={() => setShowCreate(false)}><i className="fas fa-times" /></button>
              </div>
              <div className={s.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className={s.formLabel}>Applicant</label>
                  <select className={s.formSelect} value={newCard.applicant_id} onChange={e => setNewCard(p => ({ ...p, applicant_id: e.target.value }))} required>
                    <option value="">Choose applicant…</option>
                    {applications.map(a => (
                      <option key={a.id} value={a.id}>{a.applicant_name || `${a.first_name || ''} ${a.last_name || ''}`.trim()} — {a.applicant_email || a.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={s.formLabel}>Exam Date</label>
                  <select className={s.formSelect} value={newCard.entry_date_id} onChange={e => setNewCard(p => ({ ...p, entry_date_id: e.target.value }))} required>
                    <option value="">Choose exam date…</option>
                    {entryDates.map(d => (
                      <option key={d.id} value={d.id}>{fmtDate(d.exam_date)} — {d.exam_title}</option>
                    ))}
                  </select>
                </div>
                <div className={`${s.alert} ${s.alertInfo}`} style={{ fontSize: '0.82rem', padding: '0.6rem 0.875rem' }}>
                  <i className="fas fa-info-circle" />Generates an exam card with QR code for this applicant and exam date.
                </div>
              </div>
              <div className={s.modalFoot}>
                <button type="button" onClick={() => setShowCreate(false)} className={`${s.btn} ${s.btnOutline}`}>Cancel</button>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm" />Generating…</> : <><i className="fas fa-plus" />Generate</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && editing && (
        <div className={s.modalOverlay} onClick={() => setShowEdit(false)}>
          <div className={s.modalBox} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleUpdate}>
              <div className={s.modalHead}>
                <span className={s.modalTitle}><i className="fas fa-edit" style={{ color: '#d97706' }} />Edit Exam Card</span>
                <button type="button" className={s.modalClose} onClick={() => { setShowEdit(false); setEditing(null); }}><i className="fas fa-times" /></button>
              </div>
              <div className={s.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className={s.formLabel}>Applicant</label>
                  <input className={s.formInput} type="text" value={getApplicant(editing.applicant_id)} disabled />
                </div>
                <div>
                  <label className={s.formLabel}>Exam Date</label>
                  <select className={s.formSelect} value={editing.entry_date_id} onChange={e => setEditing(p => ({ ...p, entry_date_id: e.target.value }))} required>
                    <option value="">Choose exam date…</option>
                    {entryDates.map(d => (
                      <option key={d.id} value={d.id}>{fmtDate(d.exam_date)} — {d.exam_title}</option>
                    ))}
                  </select>
                </div>
                <div className={`${s.alert} ${s.alertInfo}`} style={{ fontSize: '0.82rem', padding: '0.6rem 0.875rem' }}>
                  <i className="fas fa-info-circle" />This updates the exam date assignment for this card.
                </div>
              </div>
              <div className={s.modalFoot}>
                <button type="button" onClick={() => { setShowEdit(false); setEditing(null); }} className={`${s.btn} ${s.btnOutline}`}>Cancel</button>
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
