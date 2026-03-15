'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePayments } from '@/hooks/useRedux';
import apiService from '@/services/api';

export default function PaymentHistoryPage() {
  const { payments, loading, error, fetchMyPayments } = usePayments();
  
  // State for invoice download
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  
  useEffect(() => {
    fetchMyPayments();
  }, [fetchMyPayments]);

  const getStatusBadge = (status) => {
    const badges = {
      'success': { color: 'success', icon: 'check-circle', text: 'Successful' },
      'pending': { color: 'warning', icon: 'clock', text: 'Pending' },
      'failed': { color: 'danger', icon: 'times-circle', text: 'Failed' },
      'cancelled': { color: 'secondary', icon: 'ban', text: 'Cancelled' }
    };
    
    const badge = badges[status] || badges['pending'];
    
    return (
      <span className={`badge bg-${badge.color}`}>
        <i className={`fas fa-${badge.icon} me-1`}></i>
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadInvoice = async (transactionReference) => {
    try {
      setDownloadingInvoice(transactionReference);
      
      // Generate invoice using the new API
      const response = await apiService.get(
        `/payments/invoice/${transactionReference}`,
        { responseType: 'blob' }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-invoice-${transactionReference}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again.');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <strong>Error loading payment history:</strong> {error}
          <br />
          <small className="text-muted">
            Please check the browser console for more details or contact support if the problem persists.
          </small>
        </div>
        <div className="text-center mt-4">
          <button 
            className="btn btn-outline-primary"
            onClick={() => fetchMyPayments()}
          >
            <i className="fas fa-refresh me-2"></i>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">Payment History</h2>
              <p className="text-muted mb-0">View all your payment transactions</p>
            </div>
            <Link href="/admin/dashboard/student-portal/payments" className="btn btn-outline-primary">
              <i className="fas fa-arrow-left me-2"></i>
              Back to Payments
            </Link>
          </div>
        </div>
      </div>

      {/* Payment Stats */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body text-center">
              <i className="fas fa-check-circle fs-2 mb-2"></i>
              <h4 className="mb-1">{payments.filter(p => p.payment_status === 'success').length}</h4>
              <small>Successful</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body text-center">
              <i className="fas fa-clock fs-2 mb-2"></i>
              <h4 className="mb-1">{payments.filter(p => p.payment_status === 'pending').length}</h4>
              <small>Pending</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body text-center">
              <i className="fas fa-times-circle fs-2 mb-2"></i>
              <h4 className="mb-1">{payments.filter(p => p.payment_status === 'failed').length}</h4>
              <small>Failed</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body text-center">
              <i className="fas fa-naira-sign fs-2 mb-2"></i>
              <h4 className="mb-1">
                ₦{payments
                  .filter(p => p.payment_status === 'success')
                  .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
                  .toLocaleString()}
              </h4>
              <small>Total Paid</small>
            </div>
          </div>
        </div>
      </div>

      {/* Payment List */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-history me-2"></i>
                Payment Transactions
              </h5>
            </div>
            <div className="card-body p-0">
              {payments.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-receipt fs-1 text-muted mb-3"></i>
                  <h5 className="text-muted">No Payment History</h5>
                  <p className="text-muted">You haven&apos;t made any payments yet.</p>
                  <Link href="/admin/dashboard/student-portal/applications" className="btn btn-primary">
                    <i className="fas fa-plus me-2"></i>
                    Submit Application
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Reference</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Payment Method</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>
                            <code className="text-primary">{payment.transaction_reference}</code>
                          </td>
                          <td>
                            <strong className="text-success">
                              ₦{parseFloat(payment.amount || 0).toLocaleString()}
                            </strong>
                          </td>
                          <td>
                            {getStatusBadge(payment.payment_status)}
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">
                              <i className="fas fa-credit-card me-1"></i>
                              {payment.payment_method || 'Card'}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {formatDate(payment.created_at)}
                            </small>
                          </td>
                          <td>
                            {payment.payment_status === 'success' ? (
                              <div className="d-flex gap-1">
                                <Link 
                                  href={`/admin/dashboard/student-portal/payments/receipt?reference=${payment.transaction_reference}`}
                                  className="btn btn-sm btn-outline-success"
                                >
                                  <i className="fas fa-receipt me-1"></i>
                                  View Receipt
                                </Link>
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleDownloadInvoice(payment.transaction_reference)}
                                  disabled={downloadingInvoice === payment.transaction_reference}
                                >
                                  {downloadingInvoice === payment.transaction_reference ? (
                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                  ) : (
                                    <i className="fas fa-download"></i>
                                  )}
                                </button>
                              </div>
                            ) : payment.payment_status === 'failed' ? (
                              <Link 
                                href={`/admin/dashboard/student-portal/payments/pay/${payment.applicant_id}`}
                                className="btn btn-sm btn-outline-primary"
                              >
                                <i className="fas fa-redo me-1"></i>
                                Retry Payment
                              </Link>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
