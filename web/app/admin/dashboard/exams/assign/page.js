'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useApplications } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';

export default function AssignExamsPage() {
  const { status } = useSession();
  const { applications, fetchApplications } = useApplications();
  const { hasPermission } = usePermissions();

  const [entryDates, setEntryDates] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [selectedApps, setSelectedApps] = useState([]);
  const [selectedEntryDateId, setSelectedEntryDateId] = useState('');
  const [autoAssign, setAutoAssign] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const canReadCalendar = hasPermission('exam_calendar.read');
  const canManageAssignments = hasPermission('exam_assignment.manage');

  const eligibleApplications = useMemo(
    () => applications.filter((app) => app.status === 'approved' && app.payment_status === 'paid'),
    [applications]
  );

  const loadExamData = useCallback(async () => {
    if (!canReadCalendar) return;
    try {
      const [datesRes, calendarRes] = await Promise.all([
        apiService.get(API_ENDPOINTS.EXAMS.ENTRY_DATES.AVAILABLE_LIST),
        apiService.get(API_ENDPOINTS.EXAMS.ENTRY_DATES.CALENDAR_AVAILABILITY)
      ]);
      setEntryDates(datesRes.data || []);
      setCalendar(calendarRes.data || []);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load exam date data');
    }
  }, [canReadCalendar]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchApplications();
      loadExamData();
    }
  }, [status, fetchApplications, loadExamData]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedApps(eligibleApplications.map((app) => app.id));
    } else {
      setSelectedApps([]);
    }
  };

  const toggleApp = (appId) => {
    setSelectedApps((prev) => (prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]));
  };

  const assignExamDates = async () => {
    if (!canManageAssignments) return;
    if (selectedApps.length === 0) {
      setError('Select at least one application');
      return;
    }
    if (!autoAssign && !selectedEntryDateId) {
      setError('Select an exam date or enable auto-assignment');
      return;
    }

    try {
      setBusy(true);
      setError('');
      setNotice('');

      const response = await apiService.post(API_ENDPOINTS.APPLICATIONS.ASSIGN_EXAM, {
        applicant_ids: selectedApps,
        exam_date_id: selectedEntryDateId || null,
        auto_assign_next_available: autoAssign
      });

      const assigned = response.data?.total_assigned || 0;
      const failed = response.data?.total_failed || 0;
      setNotice(`Exam assignment completed. Assigned: ${assigned}, Failed: ${failed}`);
      setSelectedApps([]);
      await Promise.all([fetchApplications(), loadExamData()]);
    } catch (assignError) {
      setError(assignError.message || 'Failed to assign exam dates');
    } finally {
      setBusy(false);
    }
  };

  if (status === 'loading') {
    return <div className="p-4">Loading...</div>;
  }

  if (!canReadCalendar) {
    return (
      <div className="container-fluid">
        <div className="alert alert-warning mt-4">You do not have permission to view exam calendar assignments.</div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-calendar-check text-primary me-2"></i>
            Exam Date Calendar Assignment
          </h2>
          <p className="text-muted mb-0">Assign approved & paid applications to exam dates with capacity control</p>
        </div>
        <Link href="/admin/dashboard/exams/entry-dates" className="btn btn-outline-secondary">
          Manage Exam Dates
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5>Assignment Options</h5>
              <div className="form-check my-3">
                <input
                  id="autoAssign"
                  className="form-check-input"
                  type="checkbox"
                  checked={autoAssign}
                  onChange={(e) => setAutoAssign(e.target.checked)}
                />
                <label htmlFor="autoAssign" className="form-check-label">
                  Auto-assign next available date when full
                </label>
              </div>
              <label className="form-label">Preferred exam date slot</label>
              <select
                className="form-select"
                disabled={autoAssign}
                value={selectedEntryDateId}
                onChange={(e) => setSelectedEntryDateId(e.target.value)}
              >
                <option value="">Select exam slot</option>
                {entryDates.map((entryDate) => (
                  <option key={entryDate.id} value={entryDate.id}>
                    {new Date(entryDate.exam_date).toLocaleDateString()} {entryDate.exam_time} - {entryDate.exam_venue} (
                    {entryDate.current_registrations}/{entryDate.max_capacity})
                  </option>
                ))}
              </select>
              <button className="btn btn-primary w-100 mt-3" disabled={busy || !canManageAssignments} onClick={assignExamDates}>
                Assign to Selected ({selectedApps.length})
              </button>
            </div>
          </div>

          <div className="card border-0 shadow-sm mt-4">
            <div className="card-body">
              <h5 className="mb-3">Calendar Capacity</h5>
              <ul className="list-group list-group-flush">
                {calendar.map((day) => (
                  <li key={day.exam_date} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">{new Date(day.exam_date).toLocaleDateString()}</div>
                      <small className="text-muted">{day.open_slots} open slots</small>
                    </div>
                    <span className="badge bg-light text-dark">
                      {day.used_capacity}/{day.total_capacity}
                    </span>
                  </li>
                ))}
                {calendar.length === 0 && <li className="list-group-item px-0 text-muted">No active exam dates</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Eligible Applications ({eligibleApplications.length})</h5>
                <div className="form-check">
                  <input
                    id="selectAllEligible"
                    type="checkbox"
                    className="form-check-input"
                    checked={selectedApps.length === eligibleApplications.length && eligibleApplications.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <label htmlFor="selectAllEligible" className="form-check-label">Select all</label>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Application #</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Current Exam Date</th>
                      <th>Venue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligibleApplications.map((app) => (
                      <tr key={app.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedApps.includes(app.id)}
                            onChange={() => toggleApp(app.id)}
                          />
                        </td>
                        <td>{app.application_number}</td>
                        <td>{app.applicant_name}</td>
                        <td>{app.applicant_email}</td>
                        <td>{app.exam_date ? new Date(app.exam_date).toLocaleDateString() : '-'}</td>
                        <td>{app.exam_venue || '-'}</td>
                      </tr>
                    ))}
                    {eligibleApplications.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center text-muted py-4">
                          No approved + paid applications available for assignment
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
