'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePayments } from '@/hooks/useRedux';
import { usePermissions } from '@/hooks/usePermissions';
import apiService from '@/services/api';
import s from '@/styles/admin-portal.module.css';

const STATUS_MAP = {
  pending:   { label: 'Pending',   cls: s.badgePending,   color: '#d97706' },
  success:   { label: 'Success',   cls: s.badgePaid,      color: '#059669' },
  failed:    { label: 'Failed',    cls: s.badgeFailed,    color: '#dc2626' },
  cancelled: { label: 'Cancelled', cls: s.badgeInactive,  color: '#64748b' },
};
const METHOD_ICON = { card: 'fas fa-credit-card', bank_transfer: 'fas fa-university', mobile_money: 'fas fa-mobile-alt' };
const fmt   = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtTs = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const money = (v) => `₦${parseFloat(v || 0).toLocaleString()}`;

export default function PaymentsPage() {
  const { status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { payments, loading, error, fetchPayments, verifyPayment, fetchPaymentStats, clearError } = usePayments();

  const [filters, setFilters] = useState({ status: '', method: '', from: '', to: '', search: '' });
  const [showVerify, setShowVerify] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState(null);
  const [verifyRef, setVerifyRef] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [dlLoading, setDlLoading] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (status === 'authenticated') { fetchPayments(); fetchPaymentStats(); }
  }, [status, fetchPayments, fetchPaymentStats]);

  const set = (k, v) => setFilters(p => ({ ...p, [k]: v }));
  const clearFilters = () => setFilters({ status: '', method: '', from: '', to: '', search: '' });

  const filtered = payments.filter(p => {
    if (filters.status && p.payment_status !== filters.status) return false;
    if (filters.method && p.payment_method !== filters.method) return false;
    if (filters.from && new Date(p.created_at) < new Date(filters.from)) return false;
    if (filters.to) { const t = new Date(filters.to); t.setHours(23,59,59,999); if (new Date(p.created_at) > t) return false; }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = [p.transaction_reference, p.application_number, p.first_name, p.last_name, p.email].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const counts = {
    pending:   filtered.filter(p => p.payment_status === 'pending').length,
    success:   filtered.filter(p => p.payment_status === 'success').length,
    failed:    filtered.filter(p => p.payment_status === 'failed').length,
    cancelled: filtered.filter(p => p.payment_status === 'cancelled').length,
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      setVerifyLoading(true);
      verifyPayment(verifyRef);
      setNotice('Payment verified successfully!');
      setShowVerify(false); setVerifyRef('');
      setTimeout(() => setNotice(''), 4000);
    } catch { setNotice('Verification failed. Check the reference and try again.'); setTimeout(() => setNotice(''), 5000); }
    finally { setVerifyLoading(false); }
  };

  const handleQuickVerify = async (ref) => {
    try {
      setVerifyLoading(true);
      verifyPayment(ref);
      setNotice('Payment verified!'); setTimeout(() => setNotice(''), 4000);
    } catch { setNotice('Verification failed.'); setTimeout(() => setNotice(''), 4000); }
    finally { setVerifyLoading(false); }
  };

  const handleDownloadInvoice = async (ref) => {
    try {
      setDlLoading(ref);
      const res = await apiService.get(`/payments/invoice/${ref}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `invoice-${ref}.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      setNotice('Invoice downloaded!'); setTimeout(() => setNotice(''), 3000);
    } catch { setNotice('Failed to download invoice.'); setTimeout(() => setNotice(''), 4000); }
    finally { setDlLoading(null); }
  };

  if (status === 'loading' || permLoading) return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;

  const STATS = [
    { label: 'Pending',   value: counts.pending,   icon: 'fas fa-clock',        color: '#d97706', bg: '#fef3c7' },
    { label: 'Successful',value: counts.success,   icon: 'fas fa-check-circle', color: '#059669', bg: '#d1fae5' },
    { label: 'Failed',    value: counts.failed,    icon: 'fas fa-times-circle', color: '#dc2626', bg: '#fee2e2' },
    { label: 'Cancelled', value: counts.cancelled, icon: 'fas fa-ban',          color: '#64748b', bg: '#f1f5f9' },
  ];

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#d1fae5', color: '#059669' }}><i className="fas fa-credit-card" /></span>
            Payment Transactions
          </h1>
          <p className={s.pageSub}>Monitor and verify payment records</p>
        </div>
        <div className={s.pageActions}>
          <button onClick={() => setShowVerify(true)} className={`${s.btn} ${s.btnGreen}`}>
            <i className="fas fa-check-circle" />Verify Payment
          </button>
        </div>
      </div>

      {notice && <div className={`${s.alert} ${notice.includes('fail') || notice.includes('Failed') ? s.alertDanger : s.alertSuccess}`}><i className={`fas fa-${notice.includes('fail') || notice.includes('Failed') ? 'exclamation-triangle' : 'check-circle'}`} />{notice}</div>}
      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={clearError} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>×</button></div>}

      {/* Stat cards */}
      <div className={s.statsGrid} style={{ marginBottom: '1.5rem' }}>
        {STATS.map(st => (
          <div key={st.label} className={s.statCard} style={{ '--accent': st.color, cursor: 'default' }}>
            <div className={s.statInfo}>
              <div className={s.statLabel}>{st.label}</div>
              <div className={s.statNumber} style={{ color: st.color }}>{st.value}</div>
            </div>
            <div className={s.statIcon} style={{ background: st.bg, color: st.color }}><i className={st.icon} /></div>
          </div>
        ))}
      </div>

      {/* Filter card */}
      <div className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardTitle}><i className="fas fa-filter" style={{ color: '#2563eb' }} />Filters</span>
          <button onClick={clearFilters} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}><i className="fas fa-times" />Clear</button>
        </div>
        <div className={s.cardBody} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.875rem' }}>
          <div>
            <label className={s.formLabel}>Status</label>
            <select className={s.formSelect} value={filters.status} onChange={e => set('status', e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className={s.formLabel}>Method</label>
            <select className={s.formSelect} value={filters.method} onChange={e => set('method', e.target.value)}>
              <option value="">All Methods</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
            </select>
          </div>
          <div>
            <label className={s.formLabel}>From</label>
            <input type="date" className={s.formInput} value={filters.from} onChange={e => set('from', e.target.value)} />
          </div>
          <div>
            <label className={s.formLabel}>To</label>
            <input type="date" className={s.formInput} value={filters.to} onChange={e => set('to', e.target.value)} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className={s.formLabel}>Search</label>
            <div className={s.searchWrap}>
              <i className={`fas fa-search ${s.searchIcon}`} />
              <input className={s.searchInput} placeholder="Reference, name, email…" value={filters.search} onChange={e => set('search', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className={s.card} style={{ marginBottom: 0 }}>
        <div className={s.cardHeader}>
          <span className={s.cardTitle}><i className="fas fa-list" style={{ color: '#2563eb' }} />Transactions <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '0.8rem' }}>({filtered.length})</span></span>
        </div>

        {loading ? (
          <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>
        ) : filtered.length === 0 ? (
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#d1fae5', color: '#059669' }}><i className="fas fa-credit-card" /></div>
            <div className={s.emptyTitle}>No Payments Found</div>
            <p className={s.emptySub}>No payments match the current filters.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '1.25rem' }}>Reference</th>
                    <th>Applicant</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Paid At</th>
                    <th>Created</th>
                    <th style={{ paddingRight: '1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const st = STATUS_MAP[p.payment_status] || STATUS_MAP.cancelled;
                    return (
                      <tr key={p.id}>
                        <td style={{ paddingLeft: '1.25rem' }}>
                          <span className={s.tdMono} style={{ fontSize: '0.75rem' }}>{p.transaction_reference || '—'}</span>
                        </td>
                        <td>
                          <div className={s.tdName}>{p.first_name ? `${p.first_name} ${p.last_name}` : `Applicant #${p.applicant_id}`}</div>
                          {p.email && <div className={s.tdEmail}>{p.email}</div>}
                        </td>
                        <td><strong style={{ color: '#059669' }}>{money(p.amount)}</strong></td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#475569' }}>
                            <i className={METHOD_ICON[p.payment_method] || 'fas fa-money-bill'} style={{ color: '#94a3b8' }} />
                            {p.payment_method || '—'}
                          </span>
                        </td>
                        <td><span className={`${s.badge} ${st.cls}`}>{st.label}</span></td>
                        <td><span style={{ fontSize: '0.8rem', color: '#374151' }}>{fmtTs(p.paid_at)}</span></td>
                        <td><span style={{ fontSize: '0.8rem', color: '#374151' }}>{fmt(p.created_at)}</span></td>
                        <td className={s.actionsCell} style={{ paddingRight: '1.25rem' }}>
                          <div className={s.actionBtns}>
                            <button className={s.btnIcon} title="View Details" onClick={() => { setSelected(p); setShowView(true); }}>
                              <i className="fas fa-eye" />
                            </button>
                            {p.payment_status === 'success' && (
                              <button className={`${s.btnIcon} ${s.btnIconGreen}`} title="Download Invoice" onClick={() => handleDownloadInvoice(p.transaction_reference)} disabled={dlLoading === p.transaction_reference}>
                                {dlLoading === p.transaction_reference ? <span className="spinner-border spinner-border-sm" /> : <i className="fas fa-download" />}
                              </button>
                            )}
                            {p.payment_status === 'pending' && hasPermission('payment.update') && (
                              <button className={`${s.btnIcon}`} title="Verify" onClick={() => handleQuickVerify(p.transaction_reference)} disabled={verifyLoading} style={{ color: '#059669', borderColor: '#6ee7b7' }}>
                                <i className="fas fa-check" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className={s.mobileList}>
              {filtered.map(p => {
                const st = STATUS_MAP[p.payment_status] || STATUS_MAP.cancelled;
                return (
                  <div key={p.id} className={s.mobileCard}>
                    <div className={s.mobileCardHead}>
                      <span className={s.tdMono} style={{ fontSize: '0.72rem' }}>{p.transaction_reference || '—'}</span>
                      <span className={`${s.badge} ${st.cls}`}>{st.label}</span>
                    </div>
                    <div className={s.tdName} style={{ marginBottom: '0.5rem' }}>{p.first_name ? `${p.first_name} ${p.last_name}` : `Applicant #${p.applicant_id}`}</div>
                    <div className={s.mobileCardBody}>
                      <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Amount</span><strong style={{ color: '#059669' }}>{money(p.amount)}</strong></div>
                      <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Method</span><span className={s.mobileCardVal}>{p.payment_method || '—'}</span></div>
                      <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Paid At</span><span className={s.mobileCardVal}>{fmtTs(p.paid_at)}</span></div>
                    </div>
                    <div className={s.mobileCardFoot}>
                      <button onClick={() => { setSelected(p); setShowView(true); }} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}><i className="fas fa-eye" />View</button>
                      {p.payment_status === 'success' && <button onClick={() => handleDownloadInvoice(p.transaction_reference)} className={`${s.btn} ${s.btnGreen} ${s.btnSm}`} disabled={dlLoading === p.transaction_reference}><i className="fas fa-download" />Invoice</button>}
                      {p.payment_status === 'pending' && hasPermission('payment.update') && <button onClick={() => handleQuickVerify(p.transaction_reference)} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} disabled={verifyLoading}><i className="fas fa-check" />Verify</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {filtered.length > 0 && <div className={s.cardFooter}><span>Showing <strong>{filtered.length}</strong> of <strong>{payments.length}</strong> payments</span></div>}
      </div>

      {/* Verify Modal */}
      {showVerify && (
        <div className={s.modalOverlay} onClick={() => setShowVerify(false)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <div className={s.modalTitle}><span className={s.iconBox} style={{ background: '#d1fae5', color: '#059669' }}><i className="fas fa-check-circle" /></span>Verify Payment</div>
              <button className={s.modalClose} onClick={() => setShowVerify(false)}>×</button>
            </div>
            <form onSubmit={handleVerify}>
              <div className={s.modalBody}>
                <div className={`${s.alert} ${s.alertInfo}`} style={{ marginBottom: '1rem' }}>
                  <i className="fas fa-info-circle" />Enter the Paystack transaction reference to verify its status.
                </div>
                <label className={s.formLabel}>Transaction Reference</label>
                <input className={s.formInput} placeholder="e.g. PAY_abcdef123456" value={verifyRef} onChange={e => setVerifyRef(e.target.value)} required />
              </div>
              <div className={s.modalFooter}>
                <button type="button" onClick={() => setShowVerify(false)} className={`${s.btn} ${s.btnOutline}`}>Cancel</button>
                <button type="submit" disabled={verifyLoading} className={`${s.btn} ${s.btnGreen}`}>
                  {verifyLoading ? <><span className="spinner-border spinner-border-sm" /> Verifying…</> : <><i className="fas fa-check" />Verify</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showView && selected && (
        <div className={s.modalOverlay} onClick={() => setShowView(false)}>
          <div className={`${s.modal} ${s.modalLg}`} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <div className={s.modalTitle}><span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-receipt" /></span>Payment Details</div>
              <button className={s.modalClose} onClick={() => setShowView(false)}>×</button>
            </div>
            <div className={s.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Transaction</div>
                  {[
                    { k: 'Reference', v: <span className={s.tdMono}>{selected.transaction_reference}</span> },
                    { k: 'Amount',    v: <strong style={{ color: '#059669', fontSize: '1.1rem' }}>{money(selected.amount)}</strong> },
                    { k: 'Status',    v: <span className={`${s.badge} ${(STATUS_MAP[selected.payment_status] || STATUS_MAP.cancelled).cls}`}>{(STATUS_MAP[selected.payment_status] || STATUS_MAP.cancelled).label}</span> },
                    { k: 'Method',    v: selected.payment_method || '—' },
                    { k: 'Created',   v: fmtTs(selected.created_at) },
                    { k: 'Paid At',   v: fmtTs(selected.paid_at) },
                  ].map(r => (
                    <div key={r.k} className={s.infoRow}><span className={s.infoLabel}>{r.k}</span><span className={s.infoValue}>{r.v}</span></div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Applicant</div>
                  {[
                    { k: 'Name',       v: selected.first_name ? `${selected.first_name} ${selected.last_name}` : `#${selected.applicant_id}` },
                    { k: 'Email',      v: selected.email || '—' },
                    { k: 'App Number', v: selected.application_number || '—' },
                  ].map(r => (
                    <div key={r.k} className={s.infoRow}><span className={s.infoLabel}>{r.k}</span><span className={s.infoValue}>{r.v}</span></div>
                  ))}
                </div>
              </div>
            </div>
            <div className={s.modalFooter}>
              {selected.payment_status === 'success' && (
                <button onClick={() => handleDownloadInvoice(selected.transaction_reference)} className={`${s.btn} ${s.btnGreen}`} disabled={dlLoading === selected.transaction_reference}>
                  <i className="fas fa-download" />Download Invoice
                </button>
              )}
              <button onClick={() => setShowView(false)} className={`${s.btn} ${s.btnOutline}`}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
