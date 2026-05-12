'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePayments } from '@/hooks/useRedux';
import apiService from '@/services/api';
import s from '@/styles/student-portal.module.css';

const STATUS_CFG = {
  success:   { cls: s.badgeApproved,  icon: 'fa-check-circle', text: 'Successful' },
  pending:   { cls: s.badgePending,   icon: 'fa-clock',        text: 'Pending' },
  failed:    { cls: s.badgeFailed,    icon: 'fa-times-circle', text: 'Failed' },
  cancelled: { cls: s.badgeCancelled, icon: 'fa-ban',          text: 'Cancelled' },
};

function PayBadge({ status }) {
  const b = STATUS_CFG[status] || STATUS_CFG.pending;
  return <span className={`${s.badge} ${b.cls}`}><i className={`fas ${b.icon}`} />{b.text}</span>;
}

const fmt = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function PaymentReceiptPage() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { payments } = usePayments();

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const reference = searchParams.get('reference');

  const loadPaymentData = useCallback(async () => {
    try {
      setLoading(true);
      const existing = payments.find((p) => p.transaction_reference === reference);
      if (existing) { setPayment(existing); return; }
      const res = await apiService.get(`/payments/transactions/reference/${reference}`);
      if (res.data.success) setPayment(res.data.data);
      else setError('Payment not found');
    } catch { setError('Failed to load payment details'); }
    finally { setLoading(false); }
  }, [payments, reference]);

  useEffect(() => {
    if (status === 'authenticated' && reference) loadPaymentData();
  }, [status, reference, loadPaymentData]);

  const handleDownload = async () => {
    try {
      setDownloadingInvoice(true);
      const res = await apiService.get(`/payments/invoice/${reference}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url; link.download = `payment-receipt-${reference}.pdf`;
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert('Failed to download receipt.'); }
    finally { setDownloadingInvoice(false); }
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      const res = await apiService.get(`/payments/invoice/${reference}/preview`);
      if (res.data.success) { setPreviewData(res.data.data); setShowPreview(true); }
      else alert('Failed to generate receipt preview');
    } catch { alert('Failed to generate receipt preview'); }
    finally { setLoading(false); }
  };

  if (loading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status"><span className="visually-hidden">Loading…</span></div></div>;
  }

  if (error || !payment) {
    return (
      <div className={s.wrap} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className={s.centeredCard} style={{ width: '100%' }}>
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', color: '#d97706', marginBottom: '1rem' }}><i className="fas fa-exclamation-triangle" /></div>
            <h4 style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Receipt Not Found</h4>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{error || 'Unable to find this payment receipt.'}</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Link href="/admin/dashboard/student-portal/payments/history" className={s.btnPrimary}><i className="fas fa-history" />Payment History</Link>
              <Link href="/admin/dashboard/student-portal/payments" className={s.btnOutline}><i className="fas fa-arrow-left" />Back</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.wrap}>
      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#f0fdf4', color: '#059669' }}><i className="fas fa-receipt" /></span>
            Payment Receipt
          </h1>
          <p className={s.pageSub}>Reference: <code style={{ color: '#2563eb', fontSize: '0.85rem' }}>{reference}</code></p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href="/admin/dashboard/student-portal/payments/history" className={s.btnOutline}><i className="fas fa-history" />History</Link>
          <button className={s.btnOutline} onClick={handlePreview} disabled={loading}><i className="fas fa-eye" />Preview</button>
          <button className={s.btnGreen} onClick={handleDownload} disabled={downloadingInvoice}>
            {downloadingInvoice ? <><span className="spinner-border spinner-border-sm" />Downloading…</> : <><i className="fas fa-download" />Download PDF</>}
          </button>
        </div>
      </div>

      {/* Receipt card */}
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className={s.card}>
            <div className={s.navyBanner}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}><i className="fas fa-receipt" /></div>
              <h3 style={{ fontWeight: 700, margin: '0 0 0.3rem' }}>Payment Receipt</h3>
              <p style={{ margin: 0, opacity: 0.75, fontSize: '0.9rem' }}>DeepFlux Academy</p>
            </div>

            <div style={{ padding: '2rem' }}>
              {/* Status */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <PayBadge status={payment.payment_status} />
              </div>

              {/* Details */}
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e5eaf2' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fas fa-info-circle" style={{ color: '#2563eb' }} />Payment Information
                    </div>
                    {[
                      ['Amount', <strong style={{ color: '#059669', fontSize: '1.1rem' }}>₦{parseFloat(payment.amount || 0).toLocaleString()}</strong>],
                      ['Reference', <code style={{ fontSize: '0.75rem', color: '#2563eb' }}>{payment.transaction_reference}</code>],
                      ['Method', <span className={`${s.badge} ${s.badgeDraft}`}><i className="fas fa-credit-card" />{payment.payment_method || 'Card'}</span>],
                      ['Date', fmt(payment.created_at)],
                    ].map(([label, value]) => (
                      <div key={label} className={s.infoRow}>
                        <span className={s.infoLabel}>{label}</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-md-6">
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e5eaf2' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <i className="fas fa-user" style={{ color: '#2563eb' }} />Applicant Information
                    </div>
                    {[
                      ['Name', `${payment.applicant?.first_name || ''} ${payment.applicant?.last_name || ''}`.trim() || '—'],
                      ['Email', payment.applicant?.email || '—'],
                      ['Phone', payment.applicant?.phone || '—'],
                      ['Application ID', <code style={{ fontSize: '0.75rem', color: '#2563eb' }}>{payment.applicant_id}</code>],
                    ].map(([label, value]) => (
                      <div key={label} className={s.infoRow}>
                        <span className={s.infoLabel}>{label}</span>
                        <span style={{ fontWeight: 500 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {payment.paystack_reference && (
                <div className={`${s.alertInfo} mb-4`}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}><i className="fas fa-shield-alt me-2" />Payment Gateway</div>
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
                    <div>
                      <div style={{ color: '#6b7280', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Paystack Ref</div>
                      <code style={{ color: '#2563eb' }}>{payment.paystack_reference}</code>
                    </div>
                    <div>
                      <div style={{ color: '#6b7280', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Gateway</div>
                      <span className={`${s.badge} ${s.badgeInfo}`}>Paystack</span>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className={s.btnGreen} onClick={handleDownload} disabled={downloadingInvoice}>
                  {downloadingInvoice ? <><span className="spinner-border spinner-border-sm" />Downloading…</> : <><i className="fas fa-download" />Download PDF</>}
                </button>
                <button className={s.btnOutline} onClick={handlePreview} disabled={loading}><i className="fas fa-eye" />Preview</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && previewData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
          <div style={{ background: '#fff', borderRadius: '14px', width: '90%', maxWidth: '900px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5eaf2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}><i className="fas fa-file-pdf me-2" style={{ color: '#dc2626' }} />Receipt Preview</span>
              <button className={s.btnOutline} style={{ padding: '0.3rem 0.75rem' }} onClick={() => { setShowPreview(false); setPreviewData(null); }}>
                <i className="fas fa-times" />Close
              </button>
            </div>
            <iframe src={previewData.pdf} width="100%" height="600px" style={{ border: 'none', display: 'block' }} title="Receipt Preview" />
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5eaf2', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className={s.btnOutline} onClick={() => { setShowPreview(false); setPreviewData(null); }}>Close</button>
              <button className={s.btnGreen} onClick={handleDownload} disabled={downloadingInvoice}>
                {downloadingInvoice ? <><span className="spinner-border spinner-border-sm" />Downloading…</> : <><i className="fas fa-download" />Download PDF</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
