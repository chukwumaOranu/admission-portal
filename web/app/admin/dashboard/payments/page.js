'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePayments } from '@/hooks/useRedux';
import { usePermissions } from '@/hooks/usePermissions';
import apiService from '@/services/api';

const PaymentsPage = () => {
  const { data: session, status } = useSession();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  
  // Redux state - Simple!
  const {
    payments,
    loading,
    error,
    fetchPayments,
    verifyPayment,
    fetchPaymentStats,
    clearError
  } = usePayments();

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [verificationReference, setVerificationReference] = useState('');
  const [filters, setFilters] = useState({
    payment_status: null,
    payment_method: null,
    date_from: null,
    date_to: null,
    search: ''
  });
  const [message, setMessage] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  
  // Filter payments based on current filters
  const filteredPayments = payments.filter(payment => {
    // Status filter
    if (filters.payment_status && payment.payment_status !== filters.payment_status) {
      return false;
    }
    
    // Payment method filter
    if (filters.payment_method && payment.payment_method !== filters.payment_method) {
      return false;
    }
    
    // Date range filters
    if (filters.date_from) {
      const paymentDate = new Date(payment.created_at);
      const fromDate = new Date(filters.date_from);
      if (paymentDate < fromDate) return false;
    }
    
    if (filters.date_to) {
      const paymentDate = new Date(payment.created_at);
      const toDate = new Date(filters.date_to);
      toDate.setHours(23, 59, 59, 999); // End of day
      if (paymentDate > toDate) return false;
    }
    
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableFields = [
        payment.transaction_reference,
        payment.application_number,
        payment.first_name,
        payment.last_name,
        payment.email
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (!searchableFields.includes(searchTerm)) {
        return false;
      }
    }
    
    return true;
  });

  // Calculate status summary from filtered payments
  const statusSummary = {
    pending: filteredPayments.filter(p => p.payment_status === 'pending').length,
    success: filteredPayments.filter(p => p.payment_status === 'success').length,
    failed: filteredPayments.filter(p => p.payment_status === 'failed').length,
    cancelled: filteredPayments.filter(p => p.payment_status === 'cancelled').length,
    total: filteredPayments.length
  };

  useEffect(() => {
    // Only fetch payments when user is authenticated
    if (status === 'authenticated') {
      fetchPayments();
      fetchPaymentStats();
    }
  }, [status, fetchPayments, fetchPaymentStats]);

  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    try {
      setVerifyLoading(true);
      await verifyPayment(verificationReference);
      setMessage('Payment verified successfully!');
      setShowVerifyModal(false);
      setVerificationReference('');
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error verifying payment:', error);
      setMessage('Failed to verify payment. Please try again.');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowViewModal(true);
  };

  const handleDownloadInvoice = async (transactionReference) => {
    try {
      setDownloadingInvoice(transactionReference);
      
      // Use authenticated API service to download invoice
      const response = await apiService.get(`/payments/invoice/${transactionReference}`, {
        responseType: 'blob' // Important for PDF downloads
      });
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${transactionReference}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setMessage('Invoice downloaded successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      setMessage('Failed to download invoice. Please try again.');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning';
      case 'success': return 'bg-success';
      case 'failed': return 'bg-danger';
      case 'cancelled': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'card': return 'fas fa-credit-card';
      case 'bank_transfer': return 'fas fa-university';
      case 'mobile_money': return 'fas fa-mobile-alt';
      default: return 'fas fa-money-bill';
    }
  };

  // Show loading state while authentication and permissions are being resolved
  if (status === 'loading' || permissionsLoading) {
    return (
      <div className="container-fluid">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading payment data...</p>
        </div>
      </div>
    );
  }

  // Check permissions only after loading is complete
  if (status === 'unauthenticated') {
    return (
      <div className="container-fluid">
        <div className="alert alert-warning">
          <h4>Authentication Required</h4>
          <p>Please log in to view payments.</p>
        </div>
      </div>
    );
  }

  if (!hasPermission('payment.read')) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <h4>Access Denied</h4>
          <p>You don&apos;t have permission to view payments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Payment Transactions</h2>
          <p className="text-muted">Manage payment transactions and verification</p>
        </div>
        <div className="btn-group">
          <button
            className="btn btn-outline-primary"
            onClick={() => setShowVerifyModal(true)}
          >
            <i className="fas fa-check-circle"></i> Verify Payment
          </button>
          <button className="btn btn-outline-secondary">
            <i className="fas fa-download"></i> Export
          </button>
        </div>
      </div>

      {/* Payment Statistics */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4>{statusSummary.pending}</h4>
                  <p className="mb-0">Pending</p>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-clock fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4>{statusSummary.success}</h4>
                  <p className="mb-0">Successful</p>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-check-circle fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4>{statusSummary.failed}</h4>
                  <p className="mb-0">Failed</p>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-times-circle fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-secondary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4>{statusSummary.cancelled}</h4>
                  <p className="mb-0">Cancelled</p>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-ban fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <label htmlFor="payment_status_filter" className="form-label">Payment Status</label>
              <select
                className="form-select"
                id="payment_status_filter"
                value={filters.payment_status || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, payment_status: e.target.value || null }))}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="payment_method_filter" className="form-label">Payment Method</label>
              <select
                className="form-select"
                id="payment_method_filter"
                value={filters.payment_method || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, payment_method: e.target.value || null }))}
              >
                <option value="">All Methods</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="date_from_filter" className="form-label">Date From</label>
              <input
                type="date"
                className="form-control"
                id="date_from_filter"
                value={filters.date_from || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value || null }))}
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="date_to_filter" className="form-label">Date To</label>
              <input
                type="date"
                className="form-control"
                id="date_to_filter"
                value={filters.date_to || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value || null }))}
              />
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-md-6">
              <label htmlFor="search_filter" className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                id="search_filter"
                placeholder="Search by reference or applicant..."
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setFilters({
                  payment_status: null,
                  payment_method: null,
                  date_from: null,
                  date_to: null,
                  search: ''
                })}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={clearError}></button>
        </div>
      )}

      {message && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
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
                    <th>Reference</th>
                    <th>Applicant</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Paid At</th>
                    <th>Created</th>
                    <th className="mobile-action-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <strong>{payment.transaction_reference}</strong>
                        <div className="mobile-inline-actions d-md-none">
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleViewPayment(payment)}
                          >
                            <i className="fas fa-eye me-1"></i>
                            Receipt
                          </button>
                          {payment.payment_status === 'pending' && hasPermission('payment.update') && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={async () => {
                                try {
                                  setVerifyLoading(true);
                                  await verifyPayment(payment.transaction_reference);
                                  setMessage('Payment verified successfully!');
                                  setTimeout(() => setMessage(''), 3000);
                                } catch (error) {
                                  console.error('Error verifying payment:', error);
                                  setMessage('Failed to verify payment. Please try again.');
                                  setTimeout(() => setMessage(''), 5000);
                                } finally {
                                  setVerifyLoading(false);
                                }
                              }}
                              disabled={verifyLoading}
                            >
                              <i className="fas fa-check me-1"></i>
                              Verify
                            </button>
                          )}
                        </div>
                      </td>
                      <td>Applicant #{payment.applicant_id}</td>
                      <td>₦{payment.amount}</td>
                      <td>
                        <i className={`${getPaymentMethodIcon(payment.payment_method)} me-1`}></i>
                        {payment.payment_method}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(payment.payment_status)}`}>
                          {payment.payment_status}
                        </span>
                      </td>
                      <td>
                        {payment.paid_at 
                          ? new Date(payment.paid_at).toLocaleString()
                          : '-'
                        }
                      </td>
                      <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                      <td className="mobile-action-column">
                        <div className="btn-group" role="group">
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleViewPayment(payment)}
                          >
                            <i className="fas fa-eye"></i> View Receipt
                          </button>
                          {payment.payment_status === 'pending' && hasPermission('payment.update') && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={async () => {
                                try {
                                  setVerifyLoading(true);
                                  await verifyPayment(payment.transaction_reference);
                                  setMessage('Payment verified successfully!');
                                  setTimeout(() => setMessage(''), 3000);
                                } catch (error) {
                                  console.error('Error verifying payment:', error);
                                  setMessage('Failed to verify payment. Please try again.');
                                  setTimeout(() => setMessage(''), 5000);
                                } finally {
                                  setVerifyLoading(false);
                                }
                              }}
                              disabled={verifyLoading}
                            >
                              <i className="fas fa-check"></i> Verify
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

      {/* Verify Payment Modal */}
      {showVerifyModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleVerifyPayment}>
                <div className="modal-header">
                  <h5 className="modal-title">Verify Payment</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowVerifyModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="verification_reference" className="form-label">Transaction Reference</label>
                    <input
                      type="text"
                      className="form-control"
                      id="verification_reference"
                      value={verificationReference}
                      onChange={(e) => setVerificationReference(e.target.value)}
                      placeholder="Enter transaction reference to verify"
                      required
                    />
                  </div>
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    This will verify the payment status with Paystack and update the transaction record.
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowVerifyModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={verifyLoading}>
                    {verifyLoading ? 'Verifying...' : 'Verify Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Payment Modal */}
      {showViewModal && selectedPayment && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Payment Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowViewModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="text-muted mb-3">Transaction Information</h6>
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <td><strong>Reference:</strong></td>
                          <td><code>{selectedPayment.transaction_reference}</code></td>
                        </tr>
                        <tr>
                          <td><strong>Amount:</strong></td>
                          <td><span className="text-success fw-bold">₦{parseFloat(selectedPayment.amount).toLocaleString()}</span></td>
                        </tr>
                        <tr>
                          <td><strong>Status:</strong></td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(selectedPayment.payment_status)}`}>
                              {selectedPayment.payment_status}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Method:</strong></td>
                          <td>
                            <i className={`${getPaymentMethodIcon(selectedPayment.payment_method)} me-1`}></i>
                            {selectedPayment.payment_method}
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Created:</strong></td>
                          <td>{new Date(selectedPayment.created_at).toLocaleString()}</td>
                        </tr>
                        {selectedPayment.paid_at && (
                          <tr>
                            <td><strong>Paid At:</strong></td>
                            <td>{new Date(selectedPayment.paid_at).toLocaleString()}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-muted mb-3">Applicant Information</h6>
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <td><strong>Applicant ID:</strong></td>
                          <td>#{selectedPayment.applicant_id}</td>
                        </tr>
                        {selectedPayment.application_number && (
                          <tr>
                            <td><strong>Application #:</strong></td>
                            <td>{selectedPayment.application_number}</td>
                          </tr>
                        )}
                        {selectedPayment.first_name && (
                          <tr>
                            <td><strong>Name:</strong></td>
                            <td>{selectedPayment.first_name} {selectedPayment.last_name}</td>
                          </tr>
                        )}
                        {selectedPayment.email && (
                          <tr>
                            <td><strong>Email:</strong></td>
                            <td>{selectedPayment.email}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {selectedPayment.payment_status === 'success' && (
                  <div className="mt-4">
                    <h6 className="text-muted mb-3">Payment Actions</h6>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-outline-success btn-sm"
                        onClick={() => handleDownloadInvoice(selectedPayment.transaction_reference)}
                        disabled={downloadingInvoice === selectedPayment.transaction_reference}
                      >
                        {downloadingInvoice === selectedPayment.transaction_reference ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            Downloading...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-download me-1"></i>
                            Download Invoice
                          </>
                        )}
                      </button>
                    </div>
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
    </div>
  );
};

export default PaymentsPage;
