'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePayments, useApplications } from '@/hooks/useRedux';
import s from '@/styles/student-portal.module.css';

export default function VerifyPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();
  const { verifyPayment } = usePayments();
  const { fetchApplications } = useApplications();

  const [verifying, setVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [error, setError] = useState('');
  const [applicationId, setApplicationId] = useState(null);

  const reference = searchParams.get('reference');

  const handleVerify = useCallback(async () => {
    try {
      setVerifying(true);
      const response = await verifyPayment(reference);
      setPaymentStatus(response);
      const applicantId = response?.payload?.applicant_id || response?.applicant_id;
      if (applicantId) setApplicationId(applicantId);
      const isSuccess = response?.payload?.payment_status === 'success' || response?.payment_status === 'success';
      if (isSuccess) {
        fetchApplications();
        setTimeout(() => { router.push('/admin/dashboard/student-portal/applications?payment_success=true'); }, 2500);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  }, [verifyPayment, reference, fetchApplications, router]);

  useEffect(() => {
    if (status === 'authenticated' && reference) handleVerify();
  }, [status, reference, handleVerify]);

  if (verifying) {
    return (
      <div className={s.wrap} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className={s.centeredCard} style={{ width: '100%' }}>
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.8rem', color: '#2563eb' }}>
              <i className="fas fa-sync fa-spin" />
            </div>
            <h4 style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Verifying Payment…</h4>
            <p style={{ color: '#6b7280', margin: 0 }}>Please wait while we confirm your payment with Paystack</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !paymentStatus) {
    return (
      <div className={s.wrap} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className={s.centeredCard} style={{ width: '100%' }}>
          <div className={s.failBanner}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}><i className="fas fa-times-circle" /></div>
            <h3 style={{ fontWeight: 700, margin: '0 0 0.4rem' }}>Verification Failed</h3>
            <p style={{ margin: 0, opacity: 0.85 }}>Unable to verify your payment</p>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{error || 'Please contact support if the problem persists.'}</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Link href="/admin/dashboard/student-portal/payments" className={s.btnPrimary}><i className="fas fa-credit-card" />View Payments</Link>
              <Link href="/admin/dashboard/student-portal/help" className={s.btnOutline}><i className="fas fa-headset" />Support</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = paymentStatus?.payload?.payment_status === 'success' || paymentStatus?.payment_status === 'success';
  const amountPaid = parseFloat(paymentStatus?.payload?.amount_paid || paymentStatus?.amount_paid || 0);
  const txRef = paymentStatus?.payload?.transaction?.transaction_reference || reference;
  const paidAt = paymentStatus?.payload?.paid_at;

  return (
    <div className={s.wrap} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
      <div className={s.centeredCard} style={{ width: '100%' }}>
        {isSuccess ? (
          <>
            <div className={s.successBanner}>
              <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}><i className="fas fa-check-circle" /></div>
              <h3 style={{ fontWeight: 700, margin: '0 0 0.4rem' }}>Payment Successful!</h3>
              <p style={{ margin: 0, opacity: 0.85 }}>Your application fee has been received</p>
            </div>
            <div style={{ padding: '2rem' }}>
              {/* Details grid */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 600, color: '#065f46', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <i className="fas fa-receipt" />Payment Details
                </div>
                <div className="row g-2">
                  {[
                    ['Amount Paid', <strong style={{ fontSize: '1.1rem' }}>₦{amountPaid.toLocaleString()}</strong>],
                    ['Reference', <code style={{ fontSize: '0.8rem', color: '#2563eb' }}>{txRef}</code>],
                    ['Payment Date', paidAt ? new Date(paidAt).toLocaleString() : new Date().toLocaleString()],
                    ['Status', <span className={`${s.badge} ${s.badgeApproved}`}><i className="fas fa-check-circle" />Confirmed</span>],
                  ].map(([label, value]) => (
                    <div key={label} className="col-6">
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.2rem' }}>{label}</div>
                      <div>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next steps */}
              <div className={`${s.alertInfo} mb-4`}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}><i className="fas fa-arrow-right me-2" />What's Next?</div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
                  <li>Your application is now under review</li>
                  <li>You'll receive an email once it's reviewed</li>
                  <li>An exam date will be assigned if approved</li>
                </ul>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link href={`/admin/dashboard/student-portal/payments/receipt?reference=${reference}`} className={s.btnGreen} style={{ justifyContent: 'center' }}>
                  <i className="fas fa-receipt" />View Receipt
                </Link>
                <Link href="/admin/dashboard/student-portal/applications?payment_success=true" className={s.btnPrimary} style={{ justifyContent: 'center' }}>
                  <i className="fas fa-list" />My Applications
                </Link>
                <Link href="/admin/dashboard/student-portal" className={s.btnOutline} style={{ justifyContent: 'center' }}>
                  <i className="fas fa-home" />Dashboard
                </Link>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={s.failBanner}>
              <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}><i className="fas fa-times-circle" /></div>
              <h3 style={{ fontWeight: 700, margin: '0 0 0.4rem' }}>Payment Failed</h3>
              <p style={{ margin: 0, opacity: 0.85 }}>Your payment could not be processed</p>
            </div>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>The payment was not successful. Please try again or contact support if the issue persists.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button className={s.btnGreen} style={{ justifyContent: 'center' }}
                  onClick={() => router.push(applicationId ? `/admin/dashboard/student-portal/payments/pay/${applicationId}` : '/admin/dashboard/student-portal/applications')}>
                  <i className="fas fa-redo" />Try Again
                </button>
                <Link href="/admin/dashboard/student-portal/help" className={s.btnOutline} style={{ justifyContent: 'center' }}>
                  <i className="fas fa-headset" />Contact Support
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
