'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { useApplications } from '@/hooks/useRedux';
import apiService from '@/services/api';
import s from '@/styles/student-portal.module.css';

const STATUS_CFG = {
  pending:  { cls: s.badgePending,  icon: 'fa-clock',        text: 'Pending Review' },
  approved: { cls: s.badgeApproved, icon: 'fa-check-circle', text: 'Approved' },
  rejected: { cls: s.badgeRejected, icon: 'fa-times-circle', text: 'Rejected' },
  draft:    { cls: s.badgeDraft,    icon: 'fa-edit',         text: 'Draft' },
};
const PAY_CFG = {
  paid:    { cls: s.badgePaid,    icon: 'fa-check-circle', text: 'Paid' },
  pending: { cls: s.badgePending, icon: 'fa-clock',        text: 'Pending' },
  failed:  { cls: s.badgeFailed,  icon: 'fa-times-circle', text: 'Failed' },
};

function StatusBadge({ status }) {
  const b = STATUS_CFG[status] || STATUS_CFG.pending;
  return <span className={`${s.badge} ${b.cls}`}><i className={`fas ${b.icon}`} />{b.text}</span>;
}
function PayBadge({ status }) {
  const b = PAY_CFG[status] || PAY_CFG.pending;
  return <span className={`${s.badge} ${b.cls}`}><i className={`fas ${b.icon}`} />{b.text}</span>;
}

export default function ViewApplication() {
  const { status } = useSession();
  const params = useParams();
  const { applications, loading, error, fetchMyApplications } = useApplications();
  const [application, setApplication] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [downloadingCard, setDownloadingCard] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') fetchMyApplications();
  }, [status, fetchMyApplications]);

  useEffect(() => {
    const fetch = async () => {
      if (!params.id) return;
      setLoadingApp(true);
      try {
        const fromStore = applications.find((a) => a.id === parseInt(params.id));
        if (fromStore) { setApplication(fromStore); }
        else {
          const res = await apiService.get(`/applications/${params.id}`);
          setApplication(res.data || res);
        }
      } catch (e) { console.error(e); }
      finally { setLoadingApp(false); }
    };
    if (status === 'authenticated' && params.id) fetch();
  }, [status, params.id, applications]);

  const handleDownload = async (format = 'pdf') => {
    try {
      setDownloadingCard(true);
      const res = await apiService.get(`/exams/cards/generate/${application.id}?format=${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `exam-card-${application.application_id || application.id}.${format === 'pdf' ? 'pdf' : 'jpg'}`;
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert('Failed to download exam card.'); }
    finally { setDownloadingCard(false); }
  };

  if (loading || loadingApp) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status"><span className="visually-hidden">Loading…</span></div></div>;
  }

  if (error) {
    return (
      <div className={s.wrap}>
        <div className={`${s.alertDanger} mb-3`}><i className="fas fa-exclamation-triangle me-2" />{error}</div>
        <Link href="/admin/dashboard/student-portal/applications" className={s.btnOutline}><i className="fas fa-arrow-left" />Back</Link>
      </div>
    );
  }

  if (!application) {
    return (
      <div className={s.wrap}>
        <div className={s.card}>
          <div className={s.emptyState}>
            <div className={s.emptyIcon}><i className="fas fa-exclamation-triangle" style={{ color: '#d97706' }} /></div>
            <h5 className={s.emptyTitle}>Application Not Found</h5>
            <p className={s.emptySub}>This application doesn't exist or you don't have permission to view it.</p>
            <Link href="/admin/dashboard/student-portal/applications" className={s.btnPrimary}><i className="fas fa-arrow-left" />Back to Applications</Link>
          </div>
        </div>
      </div>
    );
  }

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className={s.wrap}>
      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-file-alt" /></span>
            Application Details
          </h1>
          <p className={s.pageSub}>#{application.application_number || `APP${application.id}`}</p>
        </div>
        <Link href="/admin/dashboard/student-portal/applications" className={s.btnOutline}><i className="fas fa-arrow-left" />Back</Link>
      </div>

      {/* Status row */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className={s.card}>
            <div className={s.cardBody} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb', width: 44, height: 44 }}><i className="fas fa-file-alt" /></div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Application Status</div>
                <div style={{ marginTop: '0.3rem' }}><StatusBadge status={application.status} /></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className={s.card}>
            <div className={s.cardBody} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className={s.iconBox} style={{ background: '#f0fdf4', color: '#059669', width: 44, height: 44 }}><i className="fas fa-credit-card" /></div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Payment Status</div>
                <div style={{ marginTop: '0.3rem' }}><PayBadge status={application.payment_status} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Main */}
        <div className="col-lg-8">
          <div className={s.card} style={{ marginBottom: '1.25rem' }}>
            <div className={s.cardHeader}><span className={s.cardTitle}><i className="fas fa-info-circle me-2" style={{ color: '#2563eb' }} />Application Information</span></div>
            <div className={s.cardBody}>
              <div className="row g-3">
                {[
                  ['Program', application.schema_display_name || application.schema_name],
                  ['Applicant', `${application.first_name || ''} ${application.last_name || ''}`.trim()],
                  ['Email', application.email],
                  ['Phone', application.phone || '—'],
                  ['Application Fee', <span style={{ color: '#059669', fontWeight: 700 }}>₦{parseFloat(application.application_fee || 0).toLocaleString()}</span>],
                  ['Submitted', fmt(application.created_at)],
                  ['Last Updated', fmt(application.updated_at)],
                  ...(application.exam_date ? [['Exam Date', fmt(application.exam_date)]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="col-md-6">
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.3rem' }}>{label}</div>
                    <div style={{ fontWeight: 500, color: '#1e293b' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {application.review_notes && (
            <div className={s.card}>
              <div className={s.cardHeader}><span className={s.cardTitle}><i className="fas fa-sticky-note me-2" style={{ color: '#d97706' }} />Review Notes</span></div>
              <div className={s.cardBody}><p style={{ margin: 0, color: '#374151' }}>{application.review_notes}</p></div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          <div className={s.card} style={{ marginBottom: '1.25rem' }}>
            <div className={s.cardHeader}><span className={s.cardTitle}><i className="fas fa-bolt me-2" style={{ color: '#d97706' }} />Actions</span></div>
            <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {application.payment_status !== 'paid' && (
                <Link href={`/admin/dashboard/student-portal/payments/pay/${application.id}`} className={s.btnGreen} style={{ justifyContent: 'center' }}>
                  <i className="fas fa-credit-card" />Make Payment
                </Link>
              )}
              {application.status === 'approved' && application.exam_date && (
                <>
                  <Link href="/admin/dashboard/student-portal/exams" className={s.btnPrimary} style={{ background: '#0891b2', justifyContent: 'center' }}>
                    <i className="fas fa-clipboard-check" />View Exam Details
                  </Link>
                  <button className={s.btnPrimary} style={{ justifyContent: 'center' }} onClick={() => handleDownload('pdf')} disabled={downloadingCard}>
                    {downloadingCard ? <><span className="spinner-border spinner-border-sm" />Generating…</> : <><i className="fas fa-file-pdf" />Download Exam Card</>}
                  </button>
                </>
              )}
              <Link href="/admin/dashboard/student-portal/applications" className={s.btnOutline} style={{ justifyContent: 'center' }}>
                <i className="fas fa-list" />All Applications
              </Link>
            </div>
          </div>

          <div className={s.card}>
            <div className={s.cardHeader}><span className={s.cardTitle}><i className="fas fa-credit-card me-2" style={{ color: '#059669' }} />Payment</span></div>
            <div className={s.cardBody}>
              <div className={s.infoRow}>
                <span className={s.infoLabel}>Amount</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>₦{parseFloat(application.application_fee || 0).toLocaleString()}</span>
              </div>
              <div className={s.infoRow}>
                <span className={s.infoLabel}>Status</span>
                <PayBadge status={application.payment_status} />
              </div>
              {application.payment_status === 'paid' && (
                <div className={s.infoRow}>
                  <span className={s.infoLabel}>Reference</span>
                  <code style={{ fontSize: '0.75rem', color: '#2563eb' }}>{application.payment_reference || 'N/A'}</code>
                </div>
              )}
              <div style={{ marginTop: '1rem' }}>
                <Link href="/admin/dashboard/student-portal/payments/history" className={`${s.btnOutline} ${s.btnSm}`} style={{ width: '100%', justifyContent: 'center' }}>
                  <i className="fas fa-history" />Payment History
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
