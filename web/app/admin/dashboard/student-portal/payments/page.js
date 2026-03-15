'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePayments } from '@/hooks/useRedux';

export default function StudentPayments() {
  const { loading, error, payments, fetchMyPayments } = usePayments();

  useEffect(() => {
    fetchMyPayments();
  }, [fetchMyPayments]);

  const getStatusBadge = (status) => {
    const badges = {
      'paid': { color: 'success', icon: 'check-circle', text: 'Paid' },
      'success': { color: 'success', icon: 'check-circle', text: 'Successful' },
      'pending': { color: 'warning', icon: 'clock', text: 'Pending' },
      'failed': { color: 'danger', icon: 'times-circle', text: 'Failed' },
      'cancelled': { color: 'secondary', icon: 'ban', text: 'Cancelled' },
      'refunded': { color: 'info', icon: 'undo', text: 'Refunded' }
    };
    
    const badge = badges[status] || badges['pending'];
    
    return (
      <span className={`badge bg-${badge.color}`}>
        <i className={`fas fa-${badge.icon} me-1`}></i>
        {badge.text}
      </span>
    );
  };

  const totalPaid = payments
    .filter(p => p.payment_status === 'paid' || p.payment_status === 'success')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-success" role="status">
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
            <i className="fas fa-credit-card text-success me-2"></i>
            Payment History
          </h2>
          <p className="text-muted mb-0">View all your payment transactions</p>
        </div>
        <Link href="/admin/dashboard/student-portal/payments/history" className="btn btn-outline-primary">
          <i className="fas fa-history me-2"></i>
          View Full History
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Total Payments</p>
                  <h4 className="mb-0">{payments.length}</h4>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <i className="fas fa-receipt text-primary fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Total Paid</p>
                  <h4 className="mb-0 text-success">₦{totalPaid.toLocaleString()}</h4>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <i className="fas fa-check-circle text-success fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Successful</p>
                  <h4 className="mb-0">{payments.filter(p => p.payment_status === 'paid' || p.payment_status === 'success').length}</h4>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <i className="fas fa-chart-line text-success fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Payments List */}
      {payments.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="fas fa-receipt text-muted" style={{ fontSize: '4rem' }}></i>
            <h5 className="mt-3 text-muted">No Payment History</h5>
            <p className="text-muted">You haven&apos;t made any payments yet</p>
            <Link href="/admin/dashboard/student-portal/applications/browse" className="btn btn-primary mt-3">
              <i className="fas fa-search me-2"></i>
              Browse Programs
            </Link>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-light">
            <h6 className="mb-0">
              <i className="fas fa-list me-2"></i>
              Transaction History
            </h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Reference</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                          <code className="small">{payment.transaction_reference || payment.payment_reference}</code>
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">{payment.payment_type || 'Application Fee'}</div>
                          <small className="text-muted">
                            {payment.application_number || (payment.application_id && `APP${payment.application_id}`)}
                          </small>
                        </div>
                      </td>
                      <td>
                        <strong className="text-success">
                          ₦{parseFloat(payment.amount || 0).toLocaleString()}
                        </strong>
                      </td>
                      <td>
                        <div className="small">
                          {new Date(payment.payment_date || payment.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {new Date(payment.payment_date || payment.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td>{getStatusBadge(payment.payment_status)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => window.print()}
                        >
                          <i className="fas fa-download me-1"></i>
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Info */}
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-header bg-light">
          <h6 className="mb-0">
            <i className="fas fa-info-circle me-2"></i>
            Payment Information
          </h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h6 className="mb-3">Accepted Payment Methods</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  Debit/Credit Cards (Visa, Mastercard, Verve)
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  Bank Transfer
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  USSD Banking
                </li>
              </ul>
            </div>
            <div className="col-md-6">
              <h6 className="mb-3">Need Help?</h6>
              <p className="small text-muted mb-2">
                If you have any questions about payments or need a receipt, please contact our support team.
              </p>
              <Link href="/admin/dashboard/student-portal/help/contact" className="btn btn-sm btn-outline-primary">
                <i className="fas fa-headset me-2"></i>
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
