'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useApplications } from '@/hooks/useRedux';
import s from '@/styles/student-portal.module.css';

const STATUS_BADGE = {
  pending:  { cls: s.badgePending,  icon: 'fa-clock',        text: 'Pending Review' },
  approved: { cls: s.badgeApproved, icon: 'fa-check-circle', text: 'Approved' },
  rejected: { cls: s.badgeRejected, icon: 'fa-times-circle', text: 'Rejected' },
  draft:    { cls: s.badgeDraft,    icon: 'fa-edit',         text: 'Draft' },
};

function StatusBadge({ status }) {
  const b = STATUS_BADGE[status] || STATUS_BADGE.pending;
  return (
    <span className={`${s.badge} ${b.cls}`}>
      <i className={`fas ${b.icon}`} />
      {b.text}
    </span>
  );
}

function PayBadge({ status }) {
  if (status === 'paid') return <span className={`${s.badge} ${s.badgePaid}`}><i className="fas fa-check" /> Paid</span>;
  return <span className={`${s.badge} ${s.badgePending}`}><i className="fas fa-clock" /> Unpaid</span>;
}

const FILTERS = ['all', 'pending', 'approved', 'rejected'];

export default function StudentApplications() {
  const { data: session, status } = useSession();
  const { applications, loading, error, fetchMyApplications, fetchApplicationSchemas } = useApplications();
  const [filter, setFilter] = useState('all');
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchMyApplications();
      fetchApplicationSchemas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.id, session?.accessToken]);

  useEffect(() => {
    const handleFocus = () => { if (status === 'authenticated') fetchMyApplications(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (searchParams.get('payment_success') === 'true' && status === 'authenticated') {
      fetchMyApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, status]);

  const filtered = filter === 'all' ? applications : applications.filter((a) => a.status === filter);
  const count = (f) => (f === 'all' ? applications.length : applications.filter((a) => a.status === f).length);

  if (loading) {
    return (
      <div className={s.spinnerWrap}>
        <div className="spinner-border" style={{ color: '#1e3a5f' }} role="status">
          <span className="visually-hidden">Loading...</span>
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
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}>
              <i className="fas fa-file-alt" />
            </span>
            My Applications
          </h1>
          <p className={s.pageSub}>Track and manage your admission applications</p>
        </div>
        <Link href="/admin/dashboard/student-portal/applications/browse" className={s.btnPrimary}>
          <i className="fas fa-search" />
          Browse Programs
        </Link>
      </div>

      {error && <div className={`${s.alertDanger} mb-4`}><i className="fas fa-exclamation-triangle me-2" />{error}</div>}

      {/* Empty state */}
      {applications.length === 0 && (
        <div className={s.card}>
          <div className={s.emptyState}>
            <div className={s.emptyIcon}><i className="fas fa-inbox" /></div>
            <h5 className={s.emptyTitle}>No Applications Yet</h5>
            <p className={s.emptySub}>Browse available programs and start your first application</p>
            <Link href="/admin/dashboard/student-portal/applications/browse" className={s.btnPrimary}>
              <i className="fas fa-search" />Browse Programs
            </Link>
          </div>
        </div>
      )}

      {/* Filter + list */}
      {applications.length > 0 && (
        <>
          <div className={`${s.filterBar} mb-4`}>
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`${s.filterPill} ${filter === f ? s.filterPillActive : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} ({count(f)})
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className={s.card}>
              <div className={s.emptyState}>
                <div className={s.emptyIcon}><i className="fas fa-filter" /></div>
                <p className={s.emptySub}>No {filter} applications</p>
              </div>
            </div>
          ) : (
            <div className="row g-3">
              {filtered.map((app) => (
                <div key={app.id} className="col-md-6">
                  <div className={s.appCard}>
                    <div className={s.appCardHead}>
                      <div>
                        <div className="fw-semibold" style={{ fontSize: '0.95rem', color: '#1e293b' }}>
                          {app.schema_display_name || app.schema_name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                          <i className="fas fa-hashtag me-1" />
                          {app.application_number || `APP${app.id}`}
                        </div>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>

                    <div className={s.appCardBody}>
                      <div className={s.infoRow}>
                        <span className={s.infoLabel}>Submitted</span>
                        <span className={s.infoValue}>{new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className={s.infoRow}>
                        <span className={s.infoLabel}>Application Fee</span>
                        <span className={s.infoValue} style={{ color: '#059669', fontWeight: 700 }}>
                          ₦{parseFloat(app.application_fee || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className={s.infoRow}>
                        <span className={s.infoLabel}>Payment</span>
                        <PayBadge status={app.payment_status} />
                      </div>

                      {app.status === 'pending' && app.payment_status !== 'paid' && (
                        <div className={`${s.alertWarning} mt-3`} style={{ fontSize: '0.8rem' }}>
                          <i className="fas fa-exclamation-triangle me-1" />
                          Payment required to complete your application
                        </div>
                      )}
                    </div>

                    <div className={s.appCardFoot}>
                      <Link href={`/admin/dashboard/student-portal/applications/${app.id}`} className={`${s.btnOutline} ${s.btnSm}`}>
                        <i className="fas fa-eye" />View
                      </Link>
                      {app.payment_status !== 'paid' && (
                        <Link href={`/admin/dashboard/student-portal/payments/pay/${app.id}`} className={`${s.btnGreen} ${s.btnSm}`}>
                          <i className="fas fa-credit-card" />Pay Now
                        </Link>
                      )}
                      {app.payment_status === 'paid' && !app.exam_date_id && (
                        <Link href={`/admin/dashboard/student-portal/exams?application_id=${app.id}`} className={`${s.btnPrimary} ${s.btnSm}`} style={{ background: '#0891b2' }}>
                          <i className="fas fa-calendar-alt" />Select Exam Date
                        </Link>
                      )}
                      {app.payment_status === 'paid' && app.exam_date_id && (
                        <span className={`${s.badge} ${s.badgeApproved}`}>
                          <i className="fas fa-check" />Exam Date Set
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
