'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { API_ENDPOINTS, API_URL, apiService } from '@/services/api';
import { useApplications } from '@/hooks/useRedux';
import { usePermissions } from '@/hooks/usePermissions';
import s from '@/styles/admin-portal.module.css';

const initials = (name) => (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export default function AdmissionManagementPage() {
  const { data: session, status } = useSession();
  const { applications, fetchApplications } = useApplications();
  const { hasPermission } = usePermissions();

  const [subjects, setSubjects]                   = useState([]);
  const [benchmark, setBenchmark]                 = useState(180);
  const [subjectForm, setSubjectForm]             = useState({ subject_name: '', max_score: 100 });
  const [selectedApplicantId, setSelApp]          = useState('');
  const [scoreEntries, setScoreEntries]           = useState({});
  const [result, setResult]                       = useState(null);
  const [successfulCandidates, setSuccessful]     = useState([]);
  const [selectedSuccessful, setSelSuccessful]    = useState([]);
  const [busy, setBusy]                           = useState(false);
  const [error, setError]                         = useState('');
  const [notice, setNotice]                       = useState('');
  const loadedRef = useRef(false);

  const canReadAdmission    = hasPermission('admission_result.read');
  const canManageSubjects   = hasPermission('admission_subject.create') || hasPermission('admission_subject.update');
  const canUpdateBenchmark  = hasPermission('admission_benchmark.update');
  const canEnterScores      = hasPermission('admission_score.create');
  const canSendLetters      = hasPermission('admission_letter.send');
  const canDownloadLetter   = hasPermission('admission_letter.generate');

  const eligible = useMemo(
    () => applications.filter(a => a.status === 'approved' && a.payment_status === 'paid'),
    [applications]
  );

  const loadAdmissionData = async () => {
    try {
      setError('');
      const [subjectsRes, benchRes, successRes] = await Promise.all([
        apiService.get(API_ENDPOINTS.APPLICATIONS.ADMISSION.SUBJECTS),
        apiService.get(API_ENDPOINTS.APPLICATIONS.ADMISSION.BENCHMARK),
        apiService.get(API_ENDPOINTS.APPLICATIONS.ADMISSION.SUCCESSFUL),
      ]);
      setSubjects(subjectsRes.data || []);
      setBenchmark(Number(benchRes.data?.benchmark_score || 180));
      setSuccessful(successRes.data || []);
    } catch (e) { setError(e.message || 'Failed to load admission data'); }
  };

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true;
      fetchApplications();
      loadAdmissionData();
    }
  }, [status, session?.user?.id, fetchApplications]);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!canManageSubjects) return;
    try {
      setBusy(true); setError('');
      await apiService.post(API_ENDPOINTS.APPLICATIONS.ADMISSION.SUBJECTS, { subject_name: subjectForm.subject_name, max_score: Number(subjectForm.max_score || 100) });
      setSubjectForm({ subject_name: '', max_score: 100 });
      setNotice('Subject created.');
      await loadAdmissionData();
    } catch (e) { setError(e.message || 'Failed to create subject'); }
    finally { setBusy(false); }
  };

  const handleSaveBenchmark = async () => {
    if (!canUpdateBenchmark) return;
    try {
      setBusy(true); setError('');
      await apiService.put(API_ENDPOINTS.APPLICATIONS.ADMISSION.BENCHMARK, { benchmark_score: Number(benchmark) });
      setNotice('Benchmark updated.');
      await loadAdmissionData();
    } catch (e) { setError(e.message || 'Failed to update benchmark'); }
    finally { setBusy(false); }
  };

  const loadResult = async (applicantId) => {
    try {
      const res = await apiService.get(API_ENDPOINTS.APPLICATIONS.ADMISSION.RESULT(applicantId));
      setResult(res.data || null);
      const entries = {};
      (res.data?.subjects || []).forEach(row => { entries[row.subject_id] = row.score; });
      setScoreEntries(entries);
    } catch { setResult(null); setScoreEntries({}); }
  };

  const handleSelectApplicant = async (e) => {
    const id = e.target.value;
    setSelApp(id); setResult(null); setScoreEntries({});
    if (id) await loadResult(id);
  };

  const handleSaveScores = async () => {
    if (!canEnterScores || !selectedApplicantId) { setError('Select an applicant first.'); return; }
    try {
      setBusy(true); setError('');
      const payload = subjects.map(sub => ({ subject_id: sub.id, score: Number(scoreEntries[sub.id] || 0) }));
      const res = await apiService.post(API_ENDPOINTS.APPLICATIONS.ADMISSION.SCORES(selectedApplicantId), { scores: payload });
      setResult(res.data || null);
      setNotice('Scores saved.');
      await loadAdmissionData();
    } catch (e) { setError(e.message || 'Failed to save scores'); }
    finally { setBusy(false); }
  };

  const handleSendLetters = async () => {
    if (!canSendLetters || !selectedSuccessful.length) { setError('Select at least one candidate.'); return; }
    try {
      setBusy(true); setError('');
      const res = await apiService.post(API_ENDPOINTS.APPLICATIONS.ADMISSION.LETTER_SEND, { applicant_ids: selectedSuccessful });
      setNotice(`Letters processed — Sent: ${res.data?.sent || 0}, Failed: ${res.data?.failed || 0}`);
      await loadAdmissionData();
    } catch (e) { setError(e.message || 'Failed to send letters'); }
    finally { setBusy(false); }
  };

  const toggleSuccessful = (id) => setSelSuccessful(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const allSuccessful = successfulCandidates.length > 0 && successfulCandidates.every(c => selectedSuccessful.includes(c.applicant_id));
  const toggleAllSuccessful = () => setSelSuccessful(allSuccessful ? [] : successfulCandidates.map(c => c.applicant_id));

  if (status === 'loading') return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;

  if (!canReadAdmission) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to view admission management.</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#d1fae5', color: '#059669' }}><i className="fas fa-graduation-cap" /></span>
            Admission Results
          </h1>
          <p className={s.pageSub}>Manage subjects, scores, benchmark and admission letters</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/applications" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Applications
          </Link>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}<button onClick={() => setNotice('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#059669' }}><i className="fas fa-times" /></button></div>}

      {/* Stats */}
      <div className={s.statsGrid} style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Subjects',    value: subjects.length,               icon: 'fas fa-book',             color: '#2563eb' },
          { label: 'Eligible',    value: eligible.length,               icon: 'fas fa-file-alt',         color: '#d97706' },
          { label: 'Successful',  value: successfulCandidates.length,   icon: 'fas fa-check-circle',     color: '#059669' },
          { label: 'Benchmark',   value: benchmark,                     icon: 'fas fa-chart-bar',        color: '#7c3aed' },
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

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Benchmark */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-chart-bar" style={{ color: '#7c3aed' }} />Benchmark Score</span>
            </div>
            <div className={s.cardBody} style={{ display: 'flex', gap: '0.5rem' }}>
              <input className={s.formInput} type="number" value={benchmark} onChange={e => setBenchmark(e.target.value)} style={{ flex: 1 }} />
              <button className={`${s.btn} ${s.btnPrimary}`} disabled={busy || !canUpdateBenchmark} onClick={handleSaveBenchmark}>Save</button>
            </div>
            {!canUpdateBenchmark && <p style={{ padding: '0 1rem 0.875rem', fontSize: '0.78rem', color: '#9ca3af', margin: 0 }}>Read-only access</p>}
          </div>

          {/* Subjects */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-book" style={{ color: '#2563eb' }} />Subjects</span>
            </div>
            <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {canManageSubjects && (
                <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input className={s.formInput} placeholder="Subject name" value={subjectForm.subject_name} onChange={e => setSubjectForm(p => ({ ...p, subject_name: e.target.value }))} required />
                  <input className={s.formInput} type="number" placeholder="Max score" value={subjectForm.max_score} onChange={e => setSubjectForm(p => ({ ...p, max_score: e.target.value }))} />
                  <button className={`${s.btn} ${s.btnGreen}`} disabled={busy} type="submit" style={{ justifyContent: 'center' }}>
                    <i className="fas fa-plus" />Add Subject
                  </button>
                </form>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {subjects.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: '#9ca3af', textAlign: 'center', padding: '0.5rem 0', margin: 0 }}>No subjects yet</p>
                ) : subjects.map(sub => (
                  <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.75rem', background: '#f9fafb', borderRadius: 6, fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 500, color: '#374151' }}>{sub.subject_name}</span>
                    <span className={`${s.badge} ${s.badgeInfo}`}>/{sub.max_score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Score entry */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-pencil-alt" style={{ color: '#d97706' }} />Score Entry</span>
            </div>
            <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className={s.formLabel}>Applicant (Approved &amp; Paid)</label>
                <select className={s.formSelect} value={selectedApplicantId} onChange={handleSelectApplicant}>
                  <option value="">Select applicant…</option>
                  {eligible.map(app => (
                    <option key={app.id} value={app.id}>{app.application_number} — {app.applicant_name}</option>
                  ))}
                </select>
              </div>

              {selectedApplicantId && subjects.length > 0 && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {subjects.map(sub => (
                      <div key={sub.id}>
                        <label className={s.formLabel}>{sub.subject_name} <span style={{ color: '#9ca3af' }}>/ {sub.max_score}</span></label>
                        <input className={s.formInput} type="number" min={0} max={sub.max_score} value={scoreEntries[sub.id] ?? ''} onChange={e => setScoreEntries(p => ({ ...p, [sub.id]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                  <button className={`${s.btn} ${s.btnPrimary}`} disabled={busy || !canEnterScores} onClick={handleSaveScores}>
                    {busy ? <><span className="spinner-border spinner-border-sm" />Saving…</> : <><i className="fas fa-save" />Save Scores</>}
                  </button>
                </>
              )}

              {result && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', padding: '0.875rem', background: result.is_successful ? '#f0fdf4' : '#fef2f2', borderRadius: 8, border: `1px solid ${result.is_successful ? '#bbf7d0' : '#fecaca'}` }}>
                  {[['Total Score', result.total_score], ['Average', Number(result.average_score).toFixed(2)], ['Benchmark', result.benchmark_score]].map(([k, v]) => (
                    <div key={k} style={{ textAlign: 'center', minWidth: 80 }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{k}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e3a5f' }}>{v}</div>
                    </div>
                  ))}
                  <div style={{ textAlign: 'center', minWidth: 100 }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Result</div>
                    <span className={`${s.badge} ${result.is_successful ? s.badgeApproved : s.badgeRejected}`} style={{ fontSize: '0.82rem' }}>
                      {result.is_successful ? 'Successful' : 'Not Successful'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Successful candidates */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span className={s.cardTitle} style={{ margin: 0 }}>
                <i className="fas fa-check-circle" style={{ color: '#059669' }} />Successful Candidates
                <span className={`${s.badge} ${s.badgeApproved}`} style={{ marginLeft: '0.5rem' }}>{successfulCandidates.length}</span>
              </span>
              <button className={`${s.btn} ${s.btnGreen}`} disabled={busy || !canSendLetters || !selectedSuccessful.length} onClick={handleSendLetters}>
                {busy ? <><span className="spinner-border spinner-border-sm" />Sending…</> : <><i className="fas fa-envelope" />Send Letters ({selectedSuccessful.length})</>}
              </button>
            </div>

            {selectedSuccessful.length > 0 && (
              <div className={s.bulkBar}>
                <span className={s.bulkBarInfo}><i className="fas fa-check-square" />{selectedSuccessful.length} selected</span>
                <button onClick={() => setSelSuccessful([])} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}>Deselect all</button>
              </div>
            )}

            {/* Desktop table */}
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th style={{ width: 40, paddingLeft: '1.25rem' }}>
                      <input type="checkbox" className={s.checkbox} checked={allSuccessful} onChange={toggleAllSuccessful} />
                    </th>
                    <th>App #</th>
                    <th>Candidate</th>
                    <th>Total Score</th>
                    <th style={{ paddingRight: '1.25rem' }}>Letter</th>
                  </tr>
                </thead>
                <tbody>
                  {successfulCandidates.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', fontSize: '0.875rem' }}>No successful candidates yet. Enter scores and save.</td></tr>
                  ) : successfulCandidates.map(c => (
                    <tr key={c.applicant_id}>
                      <td style={{ paddingLeft: '1.25rem' }}>
                        <input type="checkbox" className={s.checkbox} checked={selectedSuccessful.includes(c.applicant_id)} onChange={() => toggleSuccessful(c.applicant_id)} />
                      </td>
                      <td><span className={s.tdMono}>{c.application_number}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={s.tdAvatar}>{initials(`${c.first_name} ${c.last_name}`)}</span>
                          <div>
                            <div className={s.tdName}>{c.first_name} {c.last_name}</div>
                            <div className={s.tdEmail}>{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#059669', fontSize: '0.95rem' }}>{c.total_score}</span>
                      </td>
                      <td style={{ paddingRight: '1.25rem' }}>
                        {canDownloadLetter ? (
                          <a className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} href={`${API_URL}${API_ENDPOINTS.APPLICATIONS.ADMISSION.LETTER_DOWNLOAD(c.applicant_id)}`} target="_blank" rel="noreferrer">
                            <i className="fas fa-file-pdf" />PDF
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>No access</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className={s.mobileList}>
              {successfulCandidates.map(c => (
                <div key={c.applicant_id} className={s.mobileCard}>
                  <div className={s.mobileCardHead}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" className={s.checkbox} checked={selectedSuccessful.includes(c.applicant_id)} onChange={() => toggleSuccessful(c.applicant_id)} />
                      <span className={s.tdAvatar}>{initials(`${c.first_name} ${c.last_name}`)}</span>
                      <div>
                        <div className={s.tdName}>{c.first_name} {c.last_name}</div>
                        <div className={s.tdEmail}>{c.email}</div>
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, color: '#059669' }}>{c.total_score}</span>
                  </div>
                  <div className={s.mobileCardBody}>
                    <div className={s.mobileCardRow}>
                      <span className={s.mobileCardKey}>App #</span>
                      <span className={s.mobileCardVal}>{c.application_number}</span>
                    </div>
                  </div>
                  {canDownloadLetter && (
                    <div className={s.mobileCardFoot}>
                      <a className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} href={`${API_URL}${API_ENDPOINTS.APPLICATIONS.ADMISSION.LETTER_DOWNLOAD(c.applicant_id)}`} target="_blank" rel="noreferrer">
                        <i className="fas fa-file-pdf" />Download PDF
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {successfulCandidates.length > 0 && (
              <div className={s.cardFooter}>
                <span><strong>{successfulCandidates.length}</strong> successful candidate{successfulCandidates.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 991px) {
          div[style*="grid-template-columns: 300px 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
