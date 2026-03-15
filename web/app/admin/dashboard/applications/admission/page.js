'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { API_ENDPOINTS, API_URL, apiService } from '@/services/api';
import { useApplications } from '@/hooks/useRedux';
import { usePermissions } from '@/hooks/usePermissions';

export default function AdmissionManagementPage() {
  const { status } = useSession();
  const { applications, fetchApplications } = useApplications();
  const { hasPermission } = usePermissions();

  const [subjects, setSubjects] = useState([]);
  const [benchmark, setBenchmark] = useState(180);
  const [subjectForm, setSubjectForm] = useState({ subject_name: '', max_score: 100 });
  const [selectedApplicantId, setSelectedApplicantId] = useState('');
  const [scoreEntries, setScoreEntries] = useState({});
  const [result, setResult] = useState(null);
  const [successfulCandidates, setSuccessfulCandidates] = useState([]);
  const [selectedSuccessful, setSelectedSuccessful] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const canReadAdmission = hasPermission('admission_result.read');
  const canManageSubjects =
    hasPermission('admission_subject.create') || hasPermission('admission_subject.update');
  const canUpdateBenchmark = hasPermission('admission_benchmark.update');
  const canEnterScores = hasPermission('admission_score.create');
  const canSendLetters = hasPermission('admission_letter.send');
  const canDownloadLetter = hasPermission('admission_letter.generate');

  const eligibleApplications = useMemo(
    () => applications.filter((app) => app.status === 'approved' && app.payment_status === 'paid'),
    [applications]
  );

  const loadAdmissionData = async () => {
    try {
      setError('');
      const [subjectsRes, benchmarkRes, successfulRes] = await Promise.all([
        apiService.get(API_ENDPOINTS.APPLICATIONS.ADMISSION.SUBJECTS),
        apiService.get(API_ENDPOINTS.APPLICATIONS.ADMISSION.BENCHMARK),
        apiService.get(API_ENDPOINTS.APPLICATIONS.ADMISSION.SUCCESSFUL)
      ]);

      setSubjects(subjectsRes.data || []);
      setBenchmark(Number(benchmarkRes.data?.benchmark_score || 180));
      setSuccessfulCandidates(successfulRes.data || []);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load admission data');
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchApplications();
      loadAdmissionData();
    }
  }, [status, fetchApplications]);

  const handleCreateSubject = async (event) => {
    event.preventDefault();
    if (!canManageSubjects) return;
    try {
      setBusy(true);
      setError('');
      await apiService.post(API_ENDPOINTS.APPLICATIONS.ADMISSION.SUBJECTS, {
        subject_name: subjectForm.subject_name,
        max_score: Number(subjectForm.max_score || 100)
      });
      setSubjectForm({ subject_name: '', max_score: 100 });
      setNotice('Subject created successfully');
      await loadAdmissionData();
    } catch (createError) {
      setError(createError.message || 'Failed to create subject');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveBenchmark = async () => {
    if (!canUpdateBenchmark) return;
    try {
      setBusy(true);
      setError('');
      await apiService.put(API_ENDPOINTS.APPLICATIONS.ADMISSION.BENCHMARK, {
        benchmark_score: Number(benchmark)
      });
      setNotice('Benchmark updated successfully');
      await loadAdmissionData();
    } catch (saveError) {
      setError(saveError.message || 'Failed to update benchmark');
    } finally {
      setBusy(false);
    }
  };

  const handleLoadResult = async (applicantId) => {
    try {
      const resultRes = await apiService.get(API_ENDPOINTS.APPLICATIONS.ADMISSION.RESULT(applicantId));
      setResult(resultRes.data || null);
      const fromResult = {};
      (resultRes.data?.subjects || []).forEach((row) => {
        fromResult[row.subject_id] = row.score;
      });
      setScoreEntries(fromResult);
    } catch (_) {
      setResult(null);
      setScoreEntries({});
    }
  };

  const handleSelectApplicant = async (event) => {
    const nextId = event.target.value;
    setSelectedApplicantId(nextId);
    setResult(null);
    setScoreEntries({});
    if (nextId) await handleLoadResult(nextId);
  };

  const handleSaveScores = async () => {
    if (!canEnterScores) return;
    if (!selectedApplicantId) {
      setError('Select an applicant first');
      return;
    }

    try {
      setBusy(true);
      setError('');
      const payload = subjects.map((subject) => ({
        subject_id: subject.id,
        score: Number(scoreEntries[subject.id] || 0)
      }));
      const saveRes = await apiService.post(API_ENDPOINTS.APPLICATIONS.ADMISSION.SCORES(selectedApplicantId), {
        scores: payload
      });
      setResult(saveRes.data || null);
      setNotice('Scores saved and result aggregated');
      await loadAdmissionData();
    } catch (saveError) {
      setError(saveError.message || 'Failed to save scores');
    } finally {
      setBusy(false);
    }
  };

  const handleSendLetters = async () => {
    if (!canSendLetters) return;
    if (selectedSuccessful.length === 0) {
      setError('Select at least one successful candidate');
      return;
    }

    try {
      setBusy(true);
      setError('');
      const sendRes = await apiService.post(API_ENDPOINTS.APPLICATIONS.ADMISSION.LETTER_SEND, {
        applicant_ids: selectedSuccessful
      });
      const sent = sendRes.data?.sent || 0;
      const failed = sendRes.data?.failed || 0;
      setNotice(`Admission letters processed. Sent: ${sent}, Failed: ${failed}`);
      await loadAdmissionData();
    } catch (sendError) {
      setError(sendError.message || 'Failed to send admission letters');
    } finally {
      setBusy(false);
    }
  };

  const toggleSuccessfulSelection = (applicantId) => {
    setSelectedSuccessful((prev) =>
      prev.includes(applicantId) ? prev.filter((id) => id !== applicantId) : [...prev, applicantId]
    );
  };

  if (status === 'loading') {
    return <div className="p-4">Loading...</div>;
  }

  if (!canReadAdmission) {
    return (
      <div className="container-fluid">
        <div className="alert alert-warning mt-4">
          You do not have permission to view admission management.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-graduation-cap text-success me-2"></i>
            Admission Results & Letters
          </h2>
          <p className="text-muted mb-0">Manage subjects, scores, benchmark, successful candidates, and admission letters</p>
        </div>
        <Link href="/admin/dashboard/applications" className="btn btn-outline-secondary">
          Back to Applications
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Benchmark Score</h5>
              <div className="input-group">
                <input
                  type="number"
                  className="form-control"
                  value={benchmark}
                  onChange={(e) => setBenchmark(e.target.value)}
                />
                <button className="btn btn-primary" disabled={busy} onClick={handleSaveBenchmark}>
                  Save
                </button>
              </div>
              {!canUpdateBenchmark && (
                <small className="text-muted d-block mt-2">You have read-only access for benchmark settings.</small>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm mt-4">
            <div className="card-body">
              <h5 className="mb-3">Create Subject</h5>
              <form onSubmit={handleCreateSubject}>
                <div className="mb-2">
                  <input
                    className="form-control"
                    placeholder="Subject name"
                    value={subjectForm.subject_name}
                    onChange={(e) => setSubjectForm((prev) => ({ ...prev, subject_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Max score"
                    value={subjectForm.max_score}
                    onChange={(e) => setSubjectForm((prev) => ({ ...prev, max_score: e.target.value }))}
                  />
                </div>
                <button className="btn btn-success w-100" disabled={busy || !canManageSubjects} type="submit">
                  Add Subject
                </button>
              </form>
              <hr />
              <ul className="list-group list-group-flush">
                {subjects.map((subject) => (
                  <li key={subject.id} className="list-group-item px-0 d-flex justify-content-between">
                    <span>{subject.subject_name}</span>
                    <span className="badge bg-light text-dark">{subject.max_score}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Score Entry</h5>
              <div className="mb-3">
                <select className="form-select" value={selectedApplicantId} onChange={handleSelectApplicant}>
                  <option value="">Select approved & paid applicant</option>
                  {eligibleApplications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.application_number} - {app.applicant_name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedApplicantId && (
                <>
                  <div className="row g-2">
                    {subjects.map((subject) => (
                      <div className="col-md-6" key={subject.id}>
                        <label className="form-label small">{subject.subject_name} (/{subject.max_score})</label>
                        <input
                          type="number"
                          className="form-control"
                          min={0}
                          max={subject.max_score}
                          value={scoreEntries[subject.id] ?? ''}
                          onChange={(e) =>
                            setScoreEntries((prev) => ({ ...prev, [subject.id]: e.target.value }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-primary mt-3" disabled={busy || !canEnterScores} onClick={handleSaveScores}>
                    Save Scores
                  </button>
                </>
              )}

              {result && (
                <div className="alert alert-info mt-3 mb-0">
                  Total: <strong>{result.total_score}</strong> | Average: <strong>{Number(result.average_score).toFixed(2)}</strong> |
                  Benchmark: <strong>{result.benchmark_score}</strong> | Result:{' '}
                  <strong className={result.is_successful ? 'text-success' : 'text-danger'}>
                    {result.is_successful ? 'Successful' : 'Not Successful'}
                  </strong>
                </div>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Successful Candidates ({successfulCandidates.length})</h5>
                <button className="btn btn-success" disabled={busy || !canSendLetters} onClick={handleSendLetters}>
                  Send Admission Letters ({selectedSuccessful.length})
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Application #</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Total</th>
                      <th>Letter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {successfulCandidates.map((candidate) => (
                      <tr key={candidate.applicant_id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedSuccessful.includes(candidate.applicant_id)}
                            onChange={() => toggleSuccessfulSelection(candidate.applicant_id)}
                          />
                        </td>
                        <td>{candidate.application_number}</td>
                        <td>{candidate.first_name} {candidate.last_name}</td>
                        <td>{candidate.email}</td>
                        <td>{candidate.total_score}</td>
                        <td>
                          {canDownloadLetter ? (
                            <a
                              className="btn btn-sm btn-outline-primary"
                              href={`${API_URL}${API_ENDPOINTS.APPLICATIONS.ADMISSION.LETTER_DOWNLOAD(candidate.applicant_id)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              PDF
                            </a>
                          ) : (
                            <span className="text-muted small">No access</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {successfulCandidates.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center text-muted py-4">
                          No successful candidates yet. Enter scores and apply benchmark.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
