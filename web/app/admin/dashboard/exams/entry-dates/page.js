'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useExams } from '@/hooks/useRedux';
import { usePermissions } from '@/hooks/usePermissions';

const EntryDatesPage = () => {
  const { data: session, status } = useSession();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  
  // ✅ Redux - Simple unified hook
  const { 
    entryDates, 
    loading, 
    error, 
    fetchEntryDates, 
    createEntryDate, 
    updateEntryDate, 
    deleteEntryDate, 
    clearError 
  } = useExams();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEntryDate, setSelectedEntryDate] = useState(null);
  const [notice, setNotice] = useState('');
  const [newEntryDate, setNewEntryDate] = useState({
    exam_title: '',
    exam_description: '',
    exam_date: '',
    exam_time: '',
    exam_duration: 120,
    exam_venue: '',
    exam_address: '',
    max_capacity: 100,
    registration_deadline: '',
    instructions: '',
    requirements: '',
    is_active: true
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEntryDates();
    }
  }, [status, fetchEntryDates]);

  const handleCreateEntryDate = async (e) => {
    e.preventDefault();
    try {
      setNotice('');
      clearError();
      await createEntryDate(newEntryDate).unwrap();
      await fetchEntryDates();
      setShowCreateModal(false);
      setNewEntryDate({
        exam_title: '',
        exam_description: '',
        exam_date: '',
        exam_time: '',
        exam_duration: 120,
        exam_venue: '',
        exam_address: '',
        max_capacity: 100,
        registration_deadline: '',
        instructions: '',
        requirements: '',
        is_active: true
      });
      setNotice('Entry date created successfully.');
    } catch (error) {
      console.error('Error creating entry date:', error);
      setNotice('');
    }
  };

  const handleEditEntryDate = async (e) => {
    e.preventDefault();
    try {
      setNotice('');
      clearError();
      await updateEntryDate(selectedEntryDate.id, selectedEntryDate).unwrap();
      await fetchEntryDates();
      setShowEditModal(false);
      setSelectedEntryDate(null);
      setNotice('Entry date updated successfully.');
    } catch (error) {
      console.error('Error updating entry date:', error);
      setNotice('');
    }
  };

  const handleDeleteEntryDate = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry date?')) {
      try {
        setNotice('');
        clearError();
        await deleteEntryDate(id).unwrap();
        await fetchEntryDates();
        setNotice('Entry date deleted successfully.');
      } catch (error) {
        console.error('Error deleting entry date:', error);
        setNotice('');
      }
    }
  };

  const openEditModal = (entryDate) => {
    setSelectedEntryDate({ ...entryDate });
    setShowEditModal(true);
  };

  const openViewModal = (entryDate) => {
    setSelectedEntryDate({ ...entryDate });
    setShowViewModal(true);
  };

  const isRegistrationOpen = (entryDate) => {
    const now = new Date();
    const deadline = new Date(entryDate.registration_deadline);
    return now <= deadline && entryDate.is_active;
  };

  // Show loading state while permissions are being loaded
  if (permissionsLoading || status === 'loading') {
    return (
      <div className="container-fluid">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission('entry_date.read')) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <h4>Access Denied</h4>
          <p>You don&apos;t have permission to view entry dates.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Entry Exam Dates</h2>
          <p className="text-muted">Manage examination dates and venues</p>
        </div>
        {hasPermission('entry_date.create') && (
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Add Entry Date'}
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={clearError}></button>
        </div>
      )}
      {notice && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {notice}
          <button type="button" className="btn-close" onClick={() => setNotice('')}></button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && (!entryDates || entryDates.length === 0) && (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="fas fa-calendar-alt text-muted" style={{ fontSize: '4rem' }}></i>
            <h5 className="mt-3 text-muted">No Entry Dates Found</h5>
            <p className="text-muted">You haven&apos;t created any exam entry dates yet.</p>
            {hasPermission('entry_date.create') && (
              <button
                className="btn btn-primary mt-3"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="fas fa-plus me-2"></i>
                Create First Entry Date
              </button>
            )}
          </div>
        </div>
      )}

      {/* Entry Dates List */}
      {!loading && entryDates && entryDates.length > 0 && (
        <div className="row">
        {(entryDates || []).filter(entryDate => entryDate && entryDate.id).map((entryDate) => (
          <div key={entryDate.id} className="col-md-6 col-lg-4 mb-4">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">{entryDate.exam_title || 'Untitled Exam'}</h5>
                <span className={`badge ${entryDate.is_active ? 'bg-success' : 'bg-secondary'}`}>
                  {entryDate.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="card-body">
                <p className="card-text">{entryDate.exam_description || 'No description provided'}</p>
                <div className="mb-2">
                  <strong>Date:</strong> {entryDate.exam_date ? new Date(entryDate.exam_date).toLocaleDateString() : 'Not set'}
                </div>
                <div className="mb-2">
                  <strong>Time:</strong> {entryDate.exam_time || 'Not set'}
                </div>
                <div className="mb-2">
                  <strong>Duration:</strong> {entryDate.exam_duration || 0} minutes
                </div>
                <div className="mb-2">
                  <strong>Venue:</strong> {entryDate.exam_venue || 'Not set'}
                </div>
                <div className="mb-2">
                  <strong>Capacity:</strong> {entryDate.current_registrations || 0}/{entryDate.max_capacity || 0}
                </div>
                <div className="mb-2">
                  <strong>Deadline:</strong> {entryDate.registration_deadline ? new Date(entryDate.registration_deadline).toLocaleDateString() : 'Not set'}
                </div>
                <div className="mb-3">
                  <div className="progress">
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${(entryDate.current_registrations / entryDate.max_capacity) * 100}%` }}
                    ></div>
                  </div>
                </div>
                {isRegistrationOpen(entryDate) && (
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    Registration is open
                  </div>
                )}
              </div>
              <div className="card-footer">
                <div className="btn-group w-100" role="group">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => openViewModal(entryDate)}>
                    <i className="fas fa-eye"></i> View
                  </button>
                  {hasPermission('entry_date.update') && (
                    <button
                      className="btn btn-sm btn-outline-warning"
                      onClick={() => openEditModal(entryDate)}
                    >
                      <i className="fas fa-edit"></i> Edit
                    </button>
                  )}
                  {hasPermission('entry_date.delete') && (
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteEntryDate(entryDate.id)}
                      disabled={loading}
                    >
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Create Entry Date Modal */}
      {showViewModal && selectedEntryDate && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Exam Entry Date Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowViewModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-8">
                    <h5 className="mb-1">{selectedEntryDate.exam_title || 'Untitled Exam'}</h5>
                    <p className="text-muted mb-3">{selectedEntryDate.exam_description || 'No description provided'}</p>
                  </div>
                  <div className="col-md-4 text-md-end">
                    <span className={`badge ${selectedEntryDate.is_active ? 'bg-success' : 'bg-secondary'}`}>
                      {selectedEntryDate.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <div><strong>Date:</strong> {selectedEntryDate.exam_date ? new Date(selectedEntryDate.exam_date).toLocaleDateString() : 'Not set'}</div>
                  </div>
                  <div className="col-md-6">
                    <div><strong>Time:</strong> {selectedEntryDate.exam_time || 'Not set'}</div>
                  </div>
                  <div className="col-md-6">
                    <div><strong>Venue:</strong> {selectedEntryDate.exam_venue || 'Not set'}</div>
                  </div>
                  <div className="col-md-6">
                    <div><strong>Duration:</strong> {selectedEntryDate.exam_duration || 0} minutes</div>
                  </div>
                  <div className="col-md-6">
                    <div><strong>Registration Deadline:</strong> {selectedEntryDate.registration_deadline ? new Date(selectedEntryDate.registration_deadline).toLocaleDateString() : 'Not set'}</div>
                  </div>
                  <div className="col-md-6">
                    <div><strong>Capacity:</strong> {selectedEntryDate.current_registrations || 0}/{selectedEntryDate.max_capacity || 0}</div>
                  </div>
                </div>

                {selectedEntryDate.exam_address && (
                  <div className="mt-3">
                    <strong>Address:</strong>
                    <p className="mb-0 text-muted">{selectedEntryDate.exam_address}</p>
                  </div>
                )}

                {selectedEntryDate.instructions && (
                  <div className="mt-3">
                    <strong>Instructions:</strong>
                    <p className="mb-0 text-muted">{selectedEntryDate.instructions}</p>
                  </div>
                )}

                {selectedEntryDate.requirements && (
                  <div className="mt-3">
                    <strong>Requirements:</strong>
                    <p className="mb-0 text-muted">{selectedEntryDate.requirements}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Entry Date Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleCreateEntryDate}>
                <div className="modal-header">
                  <h5 className="modal-title">Add Entry Exam Date</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCreateModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="exam_title" className="form-label">Exam Title</label>
                        <input
                          type="text"
                          className="form-control"
                          id="exam_title"
                          value={newEntryDate.exam_title}
                          onChange={(e) => setNewEntryDate({ ...newEntryDate, exam_title: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="exam_venue" className="form-label">Exam Venue</label>
                        <input
                          type="text"
                          className="form-control"
                          id="exam_venue"
                          value={newEntryDate.exam_venue}
                          onChange={(e) => setNewEntryDate({ ...newEntryDate, exam_venue: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="exam_description" className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      id="exam_description"
                      rows="3"
                      value={newEntryDate.exam_description}
                      onChange={(e) => setNewEntryDate({ ...newEntryDate, exam_description: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="exam_date" className="form-label">Exam Date</label>
                        <input
                          type="date"
                          className="form-control"
                          id="exam_date"
                          value={newEntryDate.exam_date}
                          onChange={(e) => setNewEntryDate({ ...newEntryDate, exam_date: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="exam_time" className="form-label">Exam Time</label>
                        <input
                          type="time"
                          className="form-control"
                          id="exam_time"
                          value={newEntryDate.exam_time}
                          onChange={(e) => setNewEntryDate({ ...newEntryDate, exam_time: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="exam_duration" className="form-label">Duration (minutes)</label>
                        <input
                          type="number"
                          className="form-control"
                          id="exam_duration"
                          value={newEntryDate.exam_duration}
                          onChange={(e) => setNewEntryDate({ ...newEntryDate, exam_duration: parseInt(e.target.value) })}
                          min="30"
                          max="300"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="max_capacity" className="form-label">Max Capacity</label>
                        <input
                          type="number"
                          className="form-control"
                          id="max_capacity"
                          value={newEntryDate.max_capacity}
                          onChange={(e) => setNewEntryDate({ ...newEntryDate, max_capacity: parseInt(e.target.value) })}
                          min="1"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="registration_deadline" className="form-label">Registration Deadline</label>
                        <input
                          type="date"
                          className="form-control"
                          id="registration_deadline"
                          value={newEntryDate.registration_deadline}
                          onChange={(e) => setNewEntryDate({ ...newEntryDate, registration_deadline: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="exam_address" className="form-label">Exam Address</label>
                    <textarea
                      className="form-control"
                      id="exam_address"
                      rows="2"
                      value={newEntryDate.exam_address}
                      onChange={(e) => setNewEntryDate({ ...newEntryDate, exam_address: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="instructions" className="form-label">Instructions</label>
                    <textarea
                      className="form-control"
                      id="instructions"
                      rows="3"
                      value={newEntryDate.instructions}
                      onChange={(e) => setNewEntryDate({ ...newEntryDate, instructions: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="requirements" className="form-label">Requirements</label>
                    <textarea
                      className="form-control"
                      id="requirements"
                      rows="3"
                      value={newEntryDate.requirements}
                      onChange={(e) => setNewEntryDate({ ...newEntryDate, requirements: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="is_active"
                      checked={newEntryDate.is_active}
                      onChange={(e) => setNewEntryDate({ ...newEntryDate, is_active: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="is_active">
                      Active
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Entry Date'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Entry Date Modal */}
      {showEditModal && selectedEntryDate && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleEditEntryDate}>
                <div className="modal-header">
                  <h5 className="modal-title">Edit Entry Exam Date</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowEditModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="edit_exam_title" className="form-label">Exam Title</label>
                        <input
                          type="text"
                          className="form-control"
                          id="edit_exam_title"
                          value={selectedEntryDate.exam_title}
                          onChange={(e) => setSelectedEntryDate({ ...selectedEntryDate, exam_title: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="edit_exam_venue" className="form-label">Exam Venue</label>
                        <input
                          type="text"
                          className="form-control"
                          id="edit_exam_venue"
                          value={selectedEntryDate.exam_venue}
                          onChange={(e) => setSelectedEntryDate({ ...selectedEntryDate, exam_venue: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="edit_exam_description" className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      id="edit_exam_description"
                      rows="3"
                      value={selectedEntryDate.exam_description}
                      onChange={(e) => setSelectedEntryDate({ ...selectedEntryDate, exam_description: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="edit_exam_date" className="form-label">Exam Date</label>
                        <input
                          type="date"
                          className="form-control"
                          id="edit_exam_date"
                          value={selectedEntryDate.exam_date}
                          onChange={(e) => setSelectedEntryDate({ ...selectedEntryDate, exam_date: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="edit_exam_time" className="form-label">Exam Time</label>
                        <input
                          type="time"
                          className="form-control"
                          id="edit_exam_time"
                          value={selectedEntryDate.exam_time}
                          onChange={(e) => setSelectedEntryDate({ ...selectedEntryDate, exam_time: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="edit_exam_duration" className="form-label">Duration (minutes)</label>
                        <input
                          type="number"
                          className="form-control"
                          id="edit_exam_duration"
                          value={selectedEntryDate.exam_duration}
                          onChange={(e) => setSelectedEntryDate({ ...selectedEntryDate, exam_duration: parseInt(e.target.value) })}
                          min="30"
                          max="300"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="edit_max_capacity" className="form-label">Max Capacity</label>
                        <input
                          type="number"
                          className="form-control"
                          id="edit_max_capacity"
                          value={selectedEntryDate.max_capacity}
                          onChange={(e) => setSelectedEntryDate({ ...selectedEntryDate, max_capacity: parseInt(e.target.value) })}
                          min="1"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="edit_registration_deadline" className="form-label">Registration Deadline</label>
                        <input
                          type="date"
                          className="form-control"
                          id="edit_registration_deadline"
                          value={selectedEntryDate.registration_deadline}
                          onChange={(e) => setSelectedEntryDate({ ...selectedEntryDate, registration_deadline: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="edit_is_active"
                      checked={selectedEntryDate.is_active}
                      onChange={(e) => setSelectedEntryDate({ ...selectedEntryDate, is_active: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="edit_is_active">
                      Active
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Entry Date'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryDatesPage;
