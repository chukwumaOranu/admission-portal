'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePayments } from '@/hooks/useRedux';
import s from '@/styles/student-portal.module.css';

const STATUS_CFG = {
  paid:      { cls: s.badgePaid,     icon: 'fa-check-circle', text: 'Paid' },
  success:   { cls: s.badgeApproved, icon: 'fa-check-circle', text: 'Successful' },
  pending:   { cls: s.badgePending,  icon: 'fa-clock',        text: 'Pending' },
  failed:    { cls: s.badgeFailed,   icon: 'fa-times-circle', text: 'Failed' },
  cancelled: { cls: s.badgeCancelled,icon: 'fa-ban',          text: 'Cancelled' },
  refunded:  { cls: s.badgeInfo,     icon: 'fa-undo',         text: 'Refunded' },
};

function PayBadge({ status }) {
  const b = STATUS_CFG[status] || STATUS_CFG.pending;
  return <span className={`${s.badge} ${b.cls}`}><i className={`fas ${b.icon}`} />{b.text}</span>;
}

export default function StudentPayments() {
  const { loading, error, payments, fetchMyPayments } = usePayments();

  useEffect(() => { fetchMyPayments(); }, [fetchMyPayments]);

  const successful = payments.filter((p) => p.payment_status === 'paid' || p.payment_status === 'success');
  const totalPaid = successful.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const STATS = [
    { label: 'Total Transactions', value: payments.length,    icon: 'fas fa-receipt',      color: '#2563eb' },
    { label: 'Total Paid',         value: `₦${totalPaid.toLocaleString()}`, icon: 'fas fa-naira-sign', color: '#059669' },
    { label: 'Successful',         value: successful.length,  icon: 'fas fa-check-circle', color: '#059669' },
    { label: 'Pending',            value: payments.filter((p) => p.payment_status === 'pending').length, icon: 'fas fa-clock', color: '#d97706' },
  ];

  if (loading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status"><span className="visually-hidden">Loading…</span></div></div>;
  }

  return (
    <div className={s.wrap}>
      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#f0fdf4', color: '#059669' }}><i className="fas fa-credit-card" /></span>
            Payments
          </h1>
          <p className={s.pageSub}>Overview of your payment transactions</p>
        </div>
        <Link href="/admin/dashboard/student-portal/payments/history" className={s.btnOutline}>
          <i className="fas fa-history" />Full History
        </Link>
      </div>

      {error && <div className={`${s.alertDanger} mb-4`}><i className="fas fa-exclamation-triangle me-2" />{error}</div>}

      {/* Stats */}
      <div className="row g-3 mb-4">
        {STATS.map((st) => (
          <div key={st.label} className="col-md-3 col-6">
            <div className={s.statCard} style={{ '--accent': st.color }}>
              <div className={s.statLeft}>
                <div className={s.statIcon} style={{ background: `${st.color}15`, color: st.color }}>
                  <i className={st.icon} />
                </div>
                <div>
                  <div className={s.statLabel}>{st.label}</div>
                  <div className={s.statNumber} style={{ color: st.color, fontSize: '1.4rem' }}>{st.value}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions */}
      {payments.length === 0 ? (
        <div className={s.card}>
          <div className={s.emptyState}>
            <div className={s.emptyIcon}><i className="fas fa-receipt" /></div>
            <h5 className={s.emptyTitle}>No Payments Yet</h5>
            <p className={s.emptySub}>Your payment history will appear here after you make your first payment.</p>
            <Link href="/admin/dashboard/student-portal/applications/browse" className={s.btnPrimary}><i className="fas fa-search" />Browse Programs</Link>
          </div>
        </div>
      ) : (
        <div className={s.card}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}><i className="fas fa-list me-2" style={{ color: '#2563eb' }} />Recent Transactions</span>
            <Link href="/admin/dashboard/student-portal/payments/history" className={s.cardLink}>View all <i className="fas fa-arrow-right ms-1" /></Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 10).map((p) => (
                  <tr key={p.id}>
                    <td><code style={{ fontSize: '0.75rem', color: '#2563eb' }}>{p.transaction_reference || p.payment_reference}</code></td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.payment_type || 'Application Fee'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{p.application_number || (p.application_id && `APP${p.application_id}`)}</div>
                    </td>
                    <td><strong style={{ color: '#059669' }}>₦{parseFloat(p.amount || 0).toLocaleString()}</strong></td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>{new Date(p.payment_date || p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{new Date(p.payment_date || p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td><PayBadge status={p.payment_status} /></td>
                    <td>
                      <button className={`${s.btnOutline} ${s.btnSm}`} onClick={() => window.print()}>
                        <i className="fas fa-download" />Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info strip */}
      <div className={s.card} style={{ marginTop: '1.5rem' }}>
        <div className={s.cardBody}>
          <div className="row g-4">
            <div className="col-md-6">
              <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#1e293b' }}>Accepted Payment Methods</div>
              {['Debit/Credit Cards (Visa, Mastercard, Verve)', 'Bank Transfer', 'USSD Banking'].map((m) => (
                <div key={m} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                  <i className="fas fa-check-circle" style={{ color: '#059669' }} />{m}
                </div>
              ))}
            </div>
            <div className="col-md-6">
              <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#1e293b' }}>Need Help?</div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>Questions about a payment or need a receipt? Contact our support team.</p>
              <Link href="/admin/dashboard/student-portal/help" className={`${s.btnOutline} ${s.btnSm}`}><i className="fas fa-headset" />Contact Support</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
