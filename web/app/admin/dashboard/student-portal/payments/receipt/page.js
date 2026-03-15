'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePayments } from '@/hooks/useRedux';
import apiService from '@/services/api';

export default function PaymentReceiptPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const { payments, fetchPaymentsByApplicant } = usePayments();
  
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [applicant, setApplicant] = useState(null);
  const [error, setError] = useState('');
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const reference = searchParams.get('reference');

  const loadPaymentData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Find payment in Redux store first
      const existingPayment = payments.find(p => p.transaction_reference === reference);
      
      if (existingPayment) {
        setPayment(existingPayment);
        setLoading(false);
        return;
      }

      // If not found in store, fetch from API
      const response = await apiService.get(`/payments/transactions/reference/${reference}`);
      
      if (response.data.success) {
        setPayment(response.data.data);
      } else {
        setError('Payment not found');
      }
      
    } catch (err) {
      console.error('Error loading payment:', err);
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  }, [payments, reference]);

  useEffect(() => {
    if (status === 'authenticated' && reference) {
      loadPaymentData();
    }
  }, [status, reference, loadPaymentData]);

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      
      const response = await apiService.get(
        `/payments/invoice/${reference}`,
        { responseType: 'blob' }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-receipt-${reference}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download receipt. Please try again.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const handlePreviewInvoice = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.get(`/payments/invoice/${reference}/preview`);
      
      if (response.data.success) {
        setPreviewData(response.data.data);
        setShowPreview(true);
      } else {
        alert('Failed to generate receipt preview');
      }
      
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Failed to generate receipt preview');
    } finally {
      setLoading(false);
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewData(null);
  };

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card border-0 shadow-lg mt-5">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary mb-3" style={{ width: '4rem', height: '4rem' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h4 className="mb-2">Loading Receipt...</h4>
                <p className="text-muted">Please wait while we fetch your payment details</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card border-0 shadow-lg mt-5">
              <div className="card-body text-center py-5">
                <i className="fas fa-exclamation-triangle text-warning mb-3" style={{ fontSize: '5rem' }}></i>
                <h4 className="mb-2 text-warning">Receipt Not Found</h4>
                <p className="text-muted mb-4">
                  {error || 'Unable to find the payment receipt. Please check the reference number.'}
                </p>
                <div className="d-flex gap-2 justify-content-center">
                  <Link href="/admin/dashboard/student-portal/payments/history" className="btn btn-primary">
                    <i className="fas fa-history me-2"></i>
                    Payment History
                  </Link>
                  <Link href="/admin/dashboard/student-portal/payments" className="btn btn-outline-secondary">
                    <i className="fas fa-arrow-left me-2"></i>
                    Back to Payments
                  </Link>
                </div>
              </div>
            </div>
          </div>
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
              <h2 className="mb-1">Payment Receipt</h2>
              <p className="text-muted mb-0">Transaction Reference: <code>{reference}</code></p>
            </div>
            <div className="d-flex gap-2">
              <Link href="/admin/dashboard/student-portal/payments/history" className="btn btn-outline-secondary">
                <i className="fas fa-history me-2"></i>
                Payment History
              </Link>
              <button 
                className="btn btn-outline-primary"
                onClick={handlePreviewInvoice}
                disabled={loading}
              >
                <i className="fas fa-eye me-2"></i>
                Preview Receipt
              </button>
              <button 
                className="btn btn-success"
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice}
              >
                {downloadingInvoice ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Downloading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-download me-2"></i>
                    Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Details */}
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card border-0 shadow-lg">
            {/* Receipt Header */}
            <div className="card-header bg-gradient-primary text-white text-center py-4">
              <i className="fas fa-receipt mb-3" style={{ fontSize: '4rem' }}></i>
              <h3 className="mb-2">Payment Receipt</h3>
              <p className="mb-0 opacity-75">DeepFlux Academy</p>
            </div>
            
            <div className="card-body p-4">
              {/* Payment Status */}
              <div className="text-center mb-4">
                {getStatusBadge(payment.payment_status)}
              </div>

              {/* Payment Details */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="card-title text-primary">
                        <i className="fas fa-info-circle me-2"></i>
                        Payment Information
                      </h6>
                      <div className="mb-2">
                        <small className="text-muted d-block">Amount:</small>
                        <strong className="fs-5 text-success">
                          ₦{parseFloat(payment.amount || 0).toLocaleString()}
                        </strong>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted d-block">Reference:</small>
                        <code className="text-primary">{payment.transaction_reference}</code>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted d-block">Payment Method:</small>
                        <span className="badge bg-light text-dark">
                          <i className="fas fa-credit-card me-1"></i>
                          {payment.payment_method || 'Card Payment'}
                        </span>
                      </div>
                      <div className="mb-0">
                        <small className="text-muted d-block">Date:</small>
                        <span>{formatDate(payment.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="card-title text-primary">
                        <i className="fas fa-user me-2"></i>
                        Applicant Information
                      </h6>
                      <div className="mb-2">
                        <small className="text-muted d-block">Name:</small>
                        <strong>{payment.applicant?.first_name} {payment.applicant?.last_name}</strong>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted d-block">Email:</small>
                        <span>{payment.applicant?.email}</span>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted d-block">Phone:</small>
                        <span>{payment.applicant?.phone || 'Not provided'}</span>
                      </div>
                      <div className="mb-0">
                        <small className="text-muted d-block">Application ID:</small>
                        <code>{payment.applicant_id}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Payment Details */}
              {payment.paystack_reference && (
                <div className="alert alert-info mb-4">
                  <h6 className="mb-2">
                    <i className="fas fa-shield-alt me-2"></i>
                    Payment Gateway Information
                  </h6>
                  <div className="row">
                    <div className="col-md-6">
                      <small className="text-muted d-block">Paystack Reference:</small>
                      <code>{payment.paystack_reference}</code>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted d-block">Gateway:</small>
                      <span className="badge bg-primary">Paystack</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                <button 
                  className="btn btn-success btn-lg"
                  onClick={handleDownloadInvoice}
                  disabled={downloadingInvoice}
                >
                  {downloadingInvoice ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-download me-2"></i>
                      Download PDF Receipt
                    </>
                  )}
                </button>
                
                <button 
                  className="btn btn-outline-primary btn-lg"
                  onClick={handlePreviewInvoice}
                  disabled={loading}
                >
                  <i className="fas fa-eye me-2"></i>
                  Preview Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && previewData && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-file-pdf me-2"></i>
                  Receipt Preview
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={closePreview}
                ></button>
              </div>
              <div className="modal-body p-0">
                <iframe
                  src={previewData.pdf}
                  width="100%"
                  height="600px"
                  style={{ border: 'none' }}
                  title="Receipt Preview"
                />
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closePreview}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={handleDownloadInvoice}
                  disabled={downloadingInvoice}
                >
                  {downloadingInvoice ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-download me-2"></i>
                      Download PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .bg-gradient-primary {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
        }
        .modal.show {
          display: block !important;
        }
      `}</style>
    </div>
  );
}
