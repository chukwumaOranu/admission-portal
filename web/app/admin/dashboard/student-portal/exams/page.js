'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useApplications } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';
import api from '@/services/api';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDateKey = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    return value.includes('T') ? value.split('T')[0] : value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthLabel = (date) =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export default function StudentExams() {
  const { status } = useSession();
  const { applications, loading: applicationsLoading, fetchMyApplications } = useApplications();
  const [downloadingCard, setDownloadingCard] = useState(null);
  const [entryDates, setEntryDates] = useState([]);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [selectedExamDateId, setSelectedExamDateId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const paidApplications = useMemo(
    () => applications.filter((app) => app.payment_status === 'paid'),
    [applications]
  );

  const examsWithDates = useMemo(
    () => paidApplications.filter((app) => app.exam_date_id && app.exam_date),
    [paidApplications]
  );

  const groupedEntryDates = useMemo(() => {
    const grouped = {};
    for (const entryDate of entryDates) {
      const key = toDateKey(entryDate.exam_date);
      if (!key) continue;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entryDate);
    }

    Object.values(grouped).forEach((items) =>
      items.sort((a, b) => String(a.exam_time || '').localeCompare(String(b.exam_time || '')))
    );

    return grouped;
  }, [entryDates]);

  const selectedDaySlots = useMemo(
    () => groupedEntryDates[selectedCalendarDate] || [],
    [groupedEntryDates, selectedCalendarDate]
  );

  const monthGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const cells = [];
    for (let i = 0; i < startOffset; i += 1) {
      cells.push({ key: `empty-${i}`, empty: true });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const dateKey = toDateKey(date);
      const slots = groupedEntryDates[dateKey] || [];
      const remainingSlots = slots.reduce(
        (sum, slot) => sum + Math.max(0, Number(slot.max_capacity || 0) - Number(slot.current_registrations || 0)),
        0
      );
      cells.push({
        key: dateKey,
        day,
        dateKey,
        hasAvailability: slots.length > 0,
        slotCount: slots.length,
        remainingSlots
      });
    }

    return cells;
  }, [currentMonth, groupedEntryDates]);

  const changeMonth = (direction) => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + direction);
    next.setDate(1);
    setCurrentMonth(next);
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMyApplications();
      apiService
        .get(API_ENDPOINTS.EXAMS.ENTRY_DATES.AVAILABLE_LIST)
        .then((res) => setEntryDates(res.data || []))
        .catch((err) => setError(err.message || 'Failed to load available exam dates'));
    }
  }, [status, fetchMyApplications]);

  useEffect(() => {
    if (entryDates.length === 0) return;
    if (!selectedCalendarDate) {
      const firstDate = toDateKey(entryDates[0].exam_date);
      setSelectedCalendarDate(firstDate);
      const firstDateSlots = entryDates.filter((d) => toDateKey(d.exam_date) === firstDate);
      if (firstDateSlots.length > 0) {
        setSelectedExamDateId(String(firstDateSlots[0].id));
      }
    }
  }, [entryDates, selectedCalendarDate]);

  const assignExamDate = async () => {
    if (!selectedApplicationId || !selectedExamDateId) {
      setError('Select an application and an exam date');
      return;
    }

    try {
      setAssigning(true);
      setError('');
      setNotice('');

      const response = await apiService.put(
        API_ENDPOINTS.APPLICATIONS.SELECT_EXAM_DATE(selectedApplicationId),
        { exam_date_id: Number(selectedExamDateId) }
      );

      setNotice(response.message || 'Exam date selected successfully');
      setSelectedExamDateId('');
      await fetchMyApplications();
      const refreshed = await apiService.get(API_ENDPOINTS.EXAMS.ENTRY_DATES.AVAILABLE_LIST);
      const nextDates = refreshed.data || [];
      setEntryDates(nextDates);
      if (selectedCalendarDate && !(nextDates || []).some((slot) => toDateKey(slot.exam_date) === selectedCalendarDate)) {
        setSelectedCalendarDate('');
      }
    } catch (err) {
      setError(err.message || 'Failed to assign exam date');
    } finally {
      setAssigning(false);
    }
  };

  const handleDownloadExamCard = async (applicationId, format = 'pdf') => {
    try {
      setDownloadingCard(applicationId);

      const application = examsWithDates.find((app) => app.id === applicationId);
      if (!application) return;

      const response = await api.get(`/exams/cards/generate/${application.id}?format=${format}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exam-card-${application.application_id || application.id}.${format === 'pdf' ? 'pdf' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message || 'Failed to download exam card. Please try again.');
    } finally {
      setDownloadingCard(null);
    }
  };

  if (applicationsLoading || status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-clipboard-check text-primary me-2"></i>
            Exam Management
          </h2>
          <p className="text-muted mb-0">Exam dates are assigned by admin based on daily capacity</p>
        </div>
        <Link href="/admin/dashboard/student-portal/applications" className="btn btn-outline-primary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to Applications
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="alert alert-info">
        <i className="fas fa-info-circle me-2"></i>
        Exam dates are configured by admin in calendar settings. You can only select dates with available slots.
      </div>

      {paidApplications.length > 0 && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="fas fa-calendar-alt me-2"></i>
              Select Exam Date
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Paid Application</label>
                <select
                  className="form-select"
                  value={selectedApplicationId}
                  onChange={(e) => setSelectedApplicationId(e.target.value)}
                >
                  <option value="">Choose application</option>
                  {paidApplications
                    .filter((app) => !app.exam_date_id)
                    .map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.application_number || `APP${app.id}`} - {app.schema_display_name || app.schema_name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="col-md-6 d-flex align-items-end">
                <div className="small text-muted">
                  Pick a date on the calendar, then pick a time/venue slot for that date.
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="mb-0">
                  <i className="fas fa-calendar me-2"></i>
                  Calendar Availability
                </h6>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => changeMonth(-1)}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <span className="fw-semibold">{getMonthLabel(currentMonth)}</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => changeMonth(1)}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>

              <div className="border rounded p-3">
                <div className="row g-2 mb-2">
                  {WEEKDAY_LABELS.map((label) => (
                    <div key={label} className="col text-center small fw-semibold text-muted">
                      {label}
                    </div>
                  ))}
                </div>

                <div className="row g-2">
                  {monthGrid.map((cell) => (
                    <div key={cell.key} className="col" style={{ minWidth: '14.28%', maxWidth: '14.28%' }}>
                      {cell.empty ? (
                        <div style={{ height: '76px' }}></div>
                      ) : (
                        <button
                          type="button"
                          className={`btn w-100 text-start p-2 ${
                            cell.hasAvailability
                              ? selectedCalendarDate === cell.dateKey
                                ? 'btn-primary'
                                : 'btn-outline-primary'
                              : 'btn-light'
                          }`}
                          disabled={!cell.hasAvailability}
                          onClick={() => {
                            setSelectedCalendarDate(cell.dateKey);
                            const slots = groupedEntryDates[cell.dateKey] || [];
                            if (!slots.some((slot) => String(slot.id) === selectedExamDateId)) {
                              setSelectedExamDateId(slots.length > 0 ? String(slots[0].id) : '');
                            }
                          }}
                          style={{ height: '76px' }}
                        >
                          <div className="fw-semibold">{cell.day}</div>
                          {cell.hasAvailability ? (
                            <small className={selectedCalendarDate === cell.dateKey ? 'text-white' : 'text-muted'}>
                              {cell.slotCount} slot(s), {cell.remainingSlots} left
                            </small>
                          ) : (
                            <small className="text-muted">No slot</small>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {selectedCalendarDate && (
              <div className="mt-4">
                <h6 className="mb-3">
                  Available Slots: {new Date(selectedCalendarDate).toLocaleDateString()}
                </h6>
                {selectedDaySlots.length === 0 ? (
                  <div className="alert alert-warning mb-0">No slot available for the selected date.</div>
                ) : (
                  <div className="row g-3">
                    {selectedDaySlots.map((slot) => (
                      <div key={slot.id} className="col-md-6">
                        <label
                          className={`card h-100 border ${
                            String(slot.id) === String(selectedExamDateId) ? 'border-primary shadow-sm' : ''
                          }`}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="card-body">
                            <div className="form-check">
                              <input
                                type="radio"
                                className="form-check-input"
                                name="selected_exam_slot"
                                checked={String(slot.id) === String(selectedExamDateId)}
                                onChange={() => setSelectedExamDateId(String(slot.id))}
                              />
                              <span className="form-check-label fw-semibold ms-2">
                                {slot.exam_time} - {slot.exam_venue}
                              </span>
                            </div>
                            <div className="small text-muted mt-2">
                              Capacity: {slot.current_registrations}/{slot.max_capacity}
                            </div>
                            {slot.exam_title && <div className="small mt-1">{slot.exam_title}</div>}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button className="btn btn-primary mt-4" onClick={assignExamDate} disabled={assigning || !selectedExamDateId}>
              {assigning ? 'Assigning...' : 'Confirm Exam Date'}
            </button>

            {selectedExamDateId && (
              <div className="small text-muted mt-2">
                If this slot fills up before confirmation, system will reject and you can choose another available date.
              </div>
            )}
          </div>
        </div>
      )}

      {examsWithDates.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">
              <i className="fas fa-check-circle me-2"></i>
              Your Scheduled Exams ({examsWithDates.length})
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              {examsWithDates.map((exam) => (
                <div key={exam.id} className="col-md-6 mb-4">
                  <div className="card h-100">
                    <div className="card-header bg-light">
                      <h6 className="mb-1">{exam.schema_display_name || exam.schema_name}</h6>
                      <small className="text-muted">
                        <i className="fas fa-hashtag me-1"></i>
                        {exam.application_id || `APP${exam.id}`}
                      </small>
                    </div>
                    <div className="card-body">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted small">Exam Date:</span>
                        <span className="small fw-bold">{new Date(exam.exam_date).toLocaleDateString()}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted small">Exam Time:</span>
                        <span className="small">{exam.exam_time || 'TBA'}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted small">Venue:</span>
                        <span className="small">{exam.exam_venue || 'TBA'}</span>
                      </div>
                      <div className="alert alert-info small mb-0">
                        Arrive 30 minutes before exam time with valid ID and exam card.
                      </div>
                    </div>
                    <div className="card-footer bg-white">
                      <button
                        className="btn btn-primary w-100"
                        onClick={() => handleDownloadExamCard(exam.id, 'pdf')}
                        disabled={downloadingCard === exam.id}
                      >
                        {downloadingCard === exam.id ? 'Generating...' : 'Download Exam Card (PDF)'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {paidApplications.length === 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="fas fa-credit-card text-muted mb-3" style={{ fontSize: '3rem' }}></i>
            <h5>No Paid Applications Yet</h5>
            <p className="text-muted">Complete your application payment before exam assignment can be done.</p>
            <Link href="/admin/dashboard/student-portal/applications" className="btn btn-primary">
              Go to Applications
            </Link>
          </div>
        </div>
      )}

      {paidApplications.length > 0 && examsWithDates.length === 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="fas fa-hourglass-half text-warning mb-3" style={{ fontSize: '3rem' }}></i>
            <h5>Exam Date Pending Assignment</h5>
            <p className="text-muted">Select an available exam date slot above.</p>
          </div>
        </div>
      )}
    </div>
  );
}
