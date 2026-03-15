'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useExams, useApplications } from '@/hooks/useRedux';
import { usePermissions } from '@/hooks/usePermissions';
import apiService from '@/services/api';

const ExamCardsPage = () => {
  const { status } = useSession();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  
  // ✅ Redux - Simple unified hook
  const { 
    examCards, 
    entryDates,
    loading, 
    error, 
    fetchExamCards, 
    fetchEntryDates,
    createExamCard, 
    deleteExamCard, 
    updateExamCard,
    clearError 
  } = useExams();

  const { applications, fetchApplications } = useApplications();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [downloadingCard, setDownloadingCard] = useState(null);
  const [newExamCard, setNewExamCard] = useState({
    applicant_id: '',
    entry_date_id: ''
  });

  useEffect(() => {
    if (status === 'authenticated') {
      console.log('🔄 Exam Cards Page: Fetching data...');
      fetchExamCards();
      fetchEntryDates();
      fetchApplications();
    }
  }, [status, fetchExamCards, fetchEntryDates, fetchApplications]);

  // Debug exam cards data
  useEffect(() => {
    console.log('📊 Exam Cards Data:', {
      examCards: examCards,
      loading: loading,
      error: error,
      count: examCards?.length || 0
    });
  }, [examCards, loading, error]);

  const handleCreateExamCard = async (e) => {
    e.preventDefault();
    try {
      await createExamCard(newExamCard);
      setShowCreateModal(false);
      setNewExamCard({ applicant_id: '', entry_date_id: '' });
    } catch (error) {
      console.error('Error creating exam card:', error);
    }
  };


  const handleDeleteExamCard = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam card?')) {
      try {
        await deleteExamCard(id);
      } catch (error) {
        console.error('Error deleting exam card:', error);
      }
    }
  };

  const handleDownloadExamCard = async (examCard) => {
    try {
      setDownloadingCard(examCard.id);
      
      // Use the generation endpoint to download exam card PDF
      const response = await apiService.get(`/exams/cards/generate/${examCard.applicant_id}?format=pdf`, {
        responseType: 'blob' // Important for PDF downloads
      });
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exam-card-${examCard.card_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading exam card:', error);
      alert('Failed to download exam card. Please try again.');
    } finally {
      setDownloadingCard(null);
    }
  };

  // Edit exam card functions
  const handleEditExamCard = (examCard) => {
    setEditingCard(examCard);
    setShowEditModal(true);
  };

  const handleUpdateExamCard = async (e) => {
    e.preventDefault();
    if (!editingCard) return;

    try {
      await updateExamCard({
        id: editingCard.id,
        entry_date_id: editingCard.entry_date_id
      });
      setShowEditModal(false);
      setEditingCard(null);
      alert('Exam card updated successfully!');
    } catch (error) {
      console.error('Error updating exam card:', error);
      alert('Failed to update exam card. Please try again.');
    }
  };

  const getApplicantInfo = (applicantId) => {
    const applicant = applications.find(app => app.id === applicantId);
    return applicant ? `${applicant.first_name} ${applicant.last_name}` : `Applicant #${applicantId}`;
  };

  const getEntryDateInfo = (entryDateId) => {
    const entryDate = entryDates.find(date => date.id === entryDateId);
    return entryDate ? new Date(entryDate.exam_date).toLocaleDateString() : `Entry Date #${entryDateId}`;
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

  if (!hasPermission('exam_card.read')) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <h4>Access Denied</h4>
          <p>You don&apos;t have permission to view exam cards.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Exam Cards</h2>
          <p className="text-muted">Manage student exam cards and printing</p>
        </div>
        <div className="btn-group">
          {hasPermission('exam_card.create') && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Generate Exam Card'}
            </button>
          )}
          <button className="btn btn-outline-secondary">
            <i className="fas fa-download"></i> Export
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={clearError}></button>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Card Number</th>
                    <th>Applicant</th>
                    <th>Exam Date</th>
                    <th>Generated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {examCards.map((examCard) => (
                    <tr key={examCard.id}>
                      <td>
                        <strong>{examCard.card_number}</strong>
                      </td>
                      <td>{getApplicantInfo(examCard.applicant_id)}</td>
                      <td>{getEntryDateInfo(examCard.entry_date_id)}</td>
                      <td>{new Date(examCard.generated_at).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group" role="group">
                          <button 
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleDownloadExamCard(examCard)}
                            disabled={downloadingCard === examCard.id}
                          >
                            {downloadingCard === examCard.id ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-download me-1"></i>
                                Download PDF
                              </>
                            )}
                          </button>
                          {hasPermission('exam_card.update') && (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEditExamCard(examCard)}
                              disabled={loading}
                            >
                              <i className="fas fa-edit"></i> Edit
                            </button>
                          )}
                          {hasPermission('exam_card.delete') && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteExamCard(examCard.id)}
                              disabled={loading}
                            >
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Exam Card Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleCreateExamCard}>
                <div className="modal-header">
                  <h5 className="modal-title">Generate Exam Card</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCreateModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="applicant_id" className="form-label">Select Applicant</label>
                    <select
                      className="form-select"
                      id="applicant_id"
                      value={newExamCard.applicant_id}
                      onChange={(e) => setNewExamCard({ ...newExamCard, applicant_id: e.target.value })}
                      required
                    >
                      <option value="">Choose an applicant...</option>
                      {applications.map((app) => (
                        <option key={app.id} value={app.id}>
                          {app.first_name} {app.last_name} - {app.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="entry_date_id" className="form-label">Select Exam Date</label>
                    <select
                      className="form-select"
                      id="entry_date_id"
                      value={newExamCard.entry_date_id}
                      onChange={(e) => setNewExamCard({ ...newExamCard, entry_date_id: e.target.value })}
                      required
                    >
                      <option value="">Choose an exam date...</option>
                      {entryDates.map((date) => (
                        <option key={date.id} value={date.id}>
                          {new Date(date.exam_date).toLocaleDateString()} - {date.exam_type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    This will generate an exam card with QR code for the specified applicant and exam date.
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
                    {loading ? 'Generating...' : 'Generate Exam Card'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Exam Card Modal */}
      {showEditModal && editingCard && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleUpdateExamCard}>
                <div className="modal-header">
                  <h5 className="modal-title">Edit Exam Card</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingCard(null);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Applicant</label>
                    <input
                      type="text"
                      className="form-control"
                      value={getApplicantInfo(editingCard.applicant_id)}
                      disabled
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="edit_entry_date_id" className="form-label">Exam Date</label>
                    <select
                      className="form-select"
                      id="edit_entry_date_id"
                      value={editingCard.entry_date_id}
                      onChange={(e) => setEditingCard({ ...editingCard, entry_date_id: e.target.value })}
                      required
                    >
                      <option value="">Choose an exam date...</option>
                      {entryDates.map((date) => (
                        <option key={date.id} value={date.id}>
                          {new Date(date.exam_date).toLocaleDateString()} - {date.exam_title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    This will update the exam date for this exam card.
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingCard(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Exam Card'}
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

export default ExamCardsPage;
