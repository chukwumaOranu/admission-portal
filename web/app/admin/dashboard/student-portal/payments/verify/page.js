'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePayments } from '@/hooks/useRedux';
import { useApplications } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';

export default function VerifyPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const { verifyPayment } = usePayments();
  const { fetchApplications } = useApplications();
  
  const [verifying, setVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [error, setError] = useState('');
  const [applicationId, setApplicationId] = useState(null);

  const reference = searchParams.get('reference');

  const handleVerifyPayment = useCallback(async () => {
    try {
      setVerifying(true);
      
      // Use Redux action instead of direct API call
      const response = await verifyPayment(reference);
      
      setPaymentStatus(response);
      
      // Extract application ID from response for "Try Again" functionality
      const applicantId = response?.payload?.applicant_id || response?.applicant_id;
      if (applicantId) {
        setApplicationId(applicantId);
      }
      
      // Refresh applications data if payment was successful
      const isSuccess = response?.payload?.payment_status === 'success' || response?.payment_status === 'success';
      if (isSuccess) {
        await fetchApplications();
        // Redirect to applications page after a short delay
        setTimeout(() => {
          router.push('/admin/dashboard/student-portal/applications?payment_success=true');
        }, 2000);
      }
      
    } catch (err) {
      console.error('❌ Payment verification error:', err);
      setError('Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  }, [verifyPayment, reference, fetchApplications, router]);

  useEffect(() => {
    if (status === 'authenticated' && reference) {
      handleVerifyPayment();
    }
  }, [status, reference, handleVerifyPayment]);

  if (verifying) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card border-0 shadow-lg mt-5">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-success mb-3" style={{ width: '4rem', height: '4rem' }}>
                  <span className="visually-hidden">Verifying...</span>
                </div>
                <h4 className="mb-2">Verifying Payment...</h4>
                <p className="text-muted">Please wait while we confirm your payment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !paymentStatus) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card border-0 shadow-lg mt-5">
              <div className="card-body text-center py-5">
                <i className="fas fa-times-circle text-danger mb-3" style={{ fontSize: '5rem' }}></i>
                <h4 className="mb-2 text-danger">Payment Verification Failed</h4>
                <p className="text-muted mb-4">
                  {error || 'Unable to verify your payment. Please contact support.'}
                </p>
                <div className="d-flex gap-2 justify-content-center">
                  <Link href="/admin/dashboard/student-portal/payments" className="btn btn-primary">
                    View Payments
                  </Link>
                  <Link href="/admin/dashboard/student-portal/help/contact" className="btn btn-outline-secondary">
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = paymentStatus?.payload?.payment_status === 'success' || paymentStatus?.payment_status === 'success';
  
  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card border-0 shadow-lg mt-5">
            {isSuccess ? (
              <>
                {/* Success */}
                <div className="card-header bg-gradient-success text-white text-center py-4">
                  <i className="fas fa-check-circle mb-3" style={{ fontSize: '5rem' }}></i>
                  <h3 className="mb-2">Payment Successful!</h3>
                  <p className="mb-0 opacity-75">Your application fee has been received</p>
                </div>
                
                <div className="card-body p-4">
                  {/* Payment Details */}
                  <div className="alert alert-success mb-4">
                    <h6 className="mb-3">
                      <i className="fas fa-receipt me-2"></i>
                      Payment Details
                    </h6>
                    <div className="row">
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Amount Paid:</small>
                        <strong className="fs-5">₦{parseFloat(paymentStatus?.payload?.amount_paid || paymentStatus?.amount_paid || 0).toLocaleString()}</strong>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Reference:</small>
                        <code>{paymentStatus?.payload?.transaction?.transaction_reference || reference}</code>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Payment Date:</small>
                        <span>{paymentStatus?.payload?.paid_at ? new Date(paymentStatus.payload.paid_at).toLocaleString() : new Date().toLocaleString()}</span>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Status:</small>
                        <span className="badge bg-success">Confirmed</span>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="alert alert-info mb-4">
                    <h6 className="mb-2">
                      <i className="fas fa-arrow-right me-2"></i>
                      What&apos;s Next?
                    </h6>
                    <ul className="small mb-0">
                      <li>Your application is now under review</li>
                      <li>You&apos;ll receive an email notification once reviewed</li>
                      <li>Check your application status regularly</li>
                      <li>Exam date will be assigned if approved</li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-grid gap-2">
                    <Link
                      href={`/admin/dashboard/student-portal/payments/receipt?reference=${reference}`}
                      className="btn btn-success btn-lg"
                    >
                      <i className="fas fa-receipt me-2"></i>
                      View Receipt
                    </Link>
                    
                    <Link
                      href="/admin/dashboard/student-portal/applications?payment_success=true"
                      className="btn btn-primary"
                    >
                      <i className="fas fa-list me-2"></i>
                      View My Applications
                    </Link>
                    
                    <Link
                      href="/admin/dashboard/student-portal"
                      className="btn btn-outline-secondary"
                    >
                      <i className="fas fa-home me-2"></i>
                      Go to Dashboard
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Failed */}
                <div className="card-header bg-danger text-white text-center py-4">
                  <i className="fas fa-times-circle mb-3" style={{ fontSize: '5rem' }}></i>
                  <h3 className="mb-2">Payment Failed</h3>
                  <p className="mb-0">Your payment could not be processed</p>
                </div>
                
                <div className="card-body p-4 text-center">
                  <p className="text-muted mb-4">
                    The payment was not successful. Please try again or contact support if the problem persists.
                  </p>
                  
                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-success btn-lg"
                      onClick={() => {
                        if (applicationId) {
                          router.push(`/admin/dashboard/student-portal/payments/pay/${applicationId}`);
                        } else {
                          router.push('/admin/dashboard/student-portal/applications');
                        }
                      }}
                    >
                      <i className="fas fa-redo me-2"></i>
                      Try Again
                    </button>
                    
                    <Link
                      href="/admin/dashboard/student-portal/help/contact"
                      className="btn btn-outline-secondary"
                    >
                      <i className="fas fa-headset me-2"></i>
                      Contact Support
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-gradient-success {
          background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
        }
      `}</style>
    </div>
  );
}
