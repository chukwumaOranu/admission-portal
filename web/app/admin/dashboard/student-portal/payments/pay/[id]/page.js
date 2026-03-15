'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useApplications, usePayments } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';

export default function PayApplicationFeePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const { applications, loading: applicationsLoading, fetchApplications } = useApplications();
  
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchApplication = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to find application in Redux store first
      const foundApplication = applications.find(app => app.id == params.id);
      if (foundApplication) {
        setApplication(foundApplication);
        return;
      }
      
      // If not found, fetch from API
      const response = await apiService.get(API_ENDPOINTS.APPLICATIONS.GET_BY_ID(params.id));
      setApplication(response.data);
    } catch (err) {
      console.error('Error fetching application:', err);
      setError('Failed to load application details');
    } finally {
      setLoading(false);
    }
  }, [applications, params.id]);

  useEffect(() => {
    if (status === 'authenticated' && params.id) {
      fetchApplication();
    }
  }, [status, params.id, fetchApplication]);

  const handlePayNow = async () => {
    setPaying(true);
    setError('');
    
    try {
      console.log('🔍 Application object:', application);
      console.log('🔍 Application fee:', application?.application_fee);
      console.log('🔍 Application email:', application?.applicant_email || application?.email);
      
      // Validate required fields
      if (!application?.application_fee || application.application_fee <= 0) {
        setError('Application fee is not available or invalid');
        return;
      }
      
      const applicantEmail = application?.applicant_email || application?.email;
      if (!applicantEmail) {
        setError('Application email is not available');
        return;
      }
      
      // Initialize payment with Paystack
      const paymentData = {
        applicant_id: params.id,
        amount: application.application_fee, // Don't convert to kobo here - backend will do it
        email: applicantEmail, // Use correct field name
        reference: `APP${params.id}_${Date.now()}`,
        // Optional Paystack split/subaccount routing for multi-school setups
        paystack_subaccount:
          application?.paystack_subaccount ||
          application?.school_paystack_subaccount ||
          application?.school_subaccount ||
          application?.school?.paystack_subaccount ||
          null,
        paystack_split_code:
          application?.paystack_split_code ||
          application?.school_paystack_split_code ||
          application?.school?.paystack_split_code ||
          null
      };
      
      console.log('💳 Initializing payment:', paymentData);
      
      // Use direct API call to get the actual data (Redux returns action object)
      const response = await apiService.post(API_ENDPOINTS.PAYMENTS.INITIALIZE, paymentData);
      console.log('✅ Payment initialized:', response);
      
      // apiService already returns response.data, so structure is: { success, message, data: { authorization_url, ... } }
      const authorizationUrl = response?.data?.authorization_url;
      
      console.log('🔍 Authorization URL:', authorizationUrl);
      
      // Redirect to Paystack payment page
      if (authorizationUrl) {
        console.log('🚀 Redirecting to Paystack:', authorizationUrl);
        
        // Option 1: Full page redirect (current behavior)
        // window.location.href = authorizationUrl;
        
        // Option 2: Open in new tab (alternative) - KEEPS USER IN DASHBOARD
        window.open(authorizationUrl, '_blank');
        
        // Show success message
        setError(''); // Clear any previous errors
        setSuccess('Payment page opened in new tab. Complete your payment and return to this page to verify.');
        
        // Clear success message after 10 seconds
        setTimeout(() => {
          setSuccess('');
        }, 10000);
        
        // Option 3: Inline modal (requires Paystack Inline implementation)
        // showPaystackModal(authorizationUrl);
        
      } else {
        console.log('❌ No authorization URL found in response:', paymentResult);
        setError('Failed to initialize payment. Please try again.');
        setPaying(false);
      }
      
    } catch (err) {
      console.error('❌ Payment error:', err);
      setError(err.response?.data?.message || 'Failed to initialize payment');
    } finally {
      setPaying(false);
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

  if (error && !application) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
        <Link href="/admin/dashboard/student-portal/applications" className="btn btn-primary">
          Back to Applications
        </Link>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container-fluid">
        <div className="alert alert-warning">
          Application not found
        </div>
        <Link href="/admin/dashboard/student-portal/applications" className="btn btn-primary">
          Back to Applications
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="mb-4">
        <h2 className="h4 mb-1">
          <i className="fas fa-credit-card text-success me-2"></i>
          Payment
        </h2>
        <p className="text-muted mb-0">Complete your application fee payment</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      <div className="row justify-content-center">
        <div className="col-lg-8">
          {/* Payment Card */}
          <div className="card border-0 shadow-lg">
            <div className="card-header bg-gradient-success text-white text-center py-4">
              <h3 className="mb-2">
                <i className="fas fa-money-bill-wave me-2"></i>
                Application Fee Payment
              </h3>
              <p className="mb-0 opacity-75">Secure payment powered by Paystack</p>
            </div>
            
            <div className="card-body p-4">
              {/* Application Details */}
              <div className="mb-4">
                <h5 className="mb-3">Application Details</h5>
                <div className="table-responsive">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td className="text-muted">Application ID:</td>
                        <td><strong>{application.application_number || `APP${params.id}`}</strong></td>
                      </tr>
                      <tr>
                        <td className="text-muted">Program:</td>
                        <td><strong>{application.schema_display_name || application.schema_name}</strong></td>
                      </tr>
                      <tr>
                        <td className="text-muted">Applicant:</td>
                        <td>{application.applicant_name}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Email:</td>
                        <td>{application.applicant_email}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <hr />

              {/* Payment Amount */}
              <div className="text-center py-4 bg-light rounded mb-4">
                <p className="text-muted mb-2">Amount to Pay</p>
                <h1 className="display-4 text-success mb-0">
                  ₦{parseFloat(application.application_fee || 0).toLocaleString()}
                </h1>
              </div>

              {/* Payment Methods */}
              <div className="mb-4">
                <h6 className="mb-3">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  Accepted Payment Methods
                </h6>
                <div className="row text-center">
                  <div className="col-4">
                    <div className="p-3 border rounded">
                      <i className="fas fa-credit-card text-primary fs-3 mb-2"></i>
                      <p className="small mb-0">Debit Card</p>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 border rounded">
                      <i className="fas fa-university text-success fs-3 mb-2"></i>
                      <p className="small mb-0">Bank Transfer</p>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 border rounded">
                      <i className="fas fa-mobile-alt text-warning fs-3 mb-2"></i>
                      <p className="small mb-0">USSD</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {success && (
                <div className="alert alert-success mb-4">
                  <div className="d-flex">
                    <i className="fas fa-check-circle fs-4 me-3"></i>
                    <div>
                      <h6 className="mb-2">Payment Page Opened</h6>
                      <p className="small mb-0">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="alert alert-danger mb-4">
                  <div className="d-flex">
                    <i className="fas fa-exclamation-triangle fs-4 me-3"></i>
                    <div>
                      <h6 className="mb-2">Payment Error</h6>
                      <p className="small mb-0">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="alert alert-info mb-4">
                <div className="d-flex">
                  <i className="fas fa-shield-alt fs-4 me-3"></i>
                  <div>
                    <h6 className="mb-2">Secure Payment</h6>
                    <p className="small mb-0">
                      Your payment is processed securely by Paystack. We do not store your card details.
                      All transactions are encrypted and PCI DSS compliant.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-grid gap-2">
                <button
                  className="btn btn-success btn-lg"
                  onClick={handlePayNow}
                  disabled={paying}
                >
                  {paying ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      Opening Payment Page...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-lock me-2"></i>
                      Pay ₦{parseFloat(application.application_fee || 0).toLocaleString()} Now
                    </>
                  )}
                </button>
                
                <Link
                  href="/admin/dashboard/student-portal/applications"
                  className="btn btn-outline-secondary"
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Back to Applications
                </Link>
              </div>

              {/* Help Text */}
              <div className="text-center mt-4">
                <small className="text-muted">
                  <i className="fas fa-question-circle me-1"></i>
                  Having trouble? <Link href="/admin/dashboard/student-portal/help/contact">Contact Support</Link>
                </small>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="card border-0 shadow-sm mt-4">
            <div className="card-header bg-light">
              <h6 className="card-title mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Payment Instructions
              </h6>
            </div>
            <div className="card-body">
              <ol className="small mb-0">
                <li className="mb-2">Click &quot;Pay Now&quot; button above</li>
                <li className="mb-2">You&apos;ll be redirected to Paystack secure payment page</li>
                <li className="mb-2">Choose your payment method (Card, Bank Transfer, or USSD)</li>
                <li className="mb-2">Complete the payment</li>
                <li className="mb-2">You&apos;ll be redirected back automatically</li>
                <li className="mb-0">Payment confirmation will be sent to your email</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-gradient-success {
          background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
        }

        .hover-card {
          transition: transform 0.3s;
        }

        .hover-card:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
