'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications, usePayments, useExams } from '@/hooks/useRedux';
import s from '@/styles/student-portal.module.css';

const StatGroup = ({ title, icon, color, bg, stats }) => (
  <div className={s.card} style={{ marginBottom: '1.25rem' }}>
    <div className={s.cardHeader}>
      <span className={s.cardTitle}>
        <span style={{ width: 28, height: 28, borderRadius: 6, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color }}>
          <i className={icon} style={{ fontSize: '0.75rem' }} />
        </span>
        {title}
      </span>
    </div>
    <div className={s.cardBody} style={{ padding: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        {stats.map(({ label, value, sub, icon: ic, accent }) => (
          <div key={label} className={s.statCard} style={{ '--accent': accent || color }}>
            <div className={s.statLeft}>
              <div className={s.statIcon} style={{ background: `${accent || color}18`, color: accent || color }}>
                <i className={ic} />
              </div>
              <div>
                <div className={s.statLabel}>{label}</div>
                <div className={s.statNumber} style={{ color: accent || color }}>{value.toLocaleString()}</div>
                <div className={s.statSub}>{sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function StudentAnalytics() {
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { applications, loading: appsLoading, fetchMyApplications } = useApplications();
  const { payments, loading: paymentsLoading, fetchPayments } = usePayments();
  const { entryDates, loading: examsLoading, fetchEntryDates } = useExams();
  const loadedRef = useRef(false);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true;
      fetchMyApplications(); fetchPayments(); fetchEntryDates();
    }
  }, [status, session?.user?.id, fetchMyApplications, fetchPayments, fetchEntryDates]);

  const loading = appsLoading || paymentsLoading || examsLoading || permLoading || status === 'loading';

  if (loading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('student_analytics.read')) {
    return (
      <div className={s.wrap}>
        <div className={s.alertDanger}><i className="fas fa-lock" style={{ marginRight: 8 }} />You don&apos;t have permission to view analytics.</div>
      </div>
    );
  }

  const appStats = {
    total:    applications.length,
    pending:  applications.filter(a => a.status === 'pending' || a.status === 'submitted').length,
    approved: applications.filter(a => a.status === 'approved' || a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected' || a.status === 'declined').length,
  };
  const payStats = {
    total:      payments.length,
    successful: payments.filter(p => p.payment_status === 'success' || p.payment_status === 'paid').length,
    failed:     payments.filter(p => p.payment_status === 'failed').length,
    pending:    payments.filter(p => p.payment_status === 'pending').length,
  };
  const examStats = {
    total:    entryDates.length,
    upcoming: entryDates.filter(e => new Date(e.exam_date) > new Date()).length,
    done:     entryDates.filter(e => new Date(e.exam_date) < new Date()).length,
  };

  return (
    <div className={s.wrap}>

      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-chart-line" /></span>
            My Analytics
          </h1>
          <p className={s.pageSub}>Overview of your applications, payments and exams</p>
        </div>
      </div>

      <StatGroup
        title="Applications"
        icon="fas fa-file-alt"
        color="#2563eb"
        bg="#eff6ff"
        stats={[
          { label: 'Total',    value: appStats.total,    sub: 'All time',        icon: 'fas fa-file-alt',    accent: '#2563eb' },
          { label: 'Pending',  value: appStats.pending,  sub: 'Awaiting review', icon: 'fas fa-clock',       accent: '#d97706' },
          { label: 'Approved', value: appStats.approved, sub: 'Accepted',        icon: 'fas fa-check-circle',accent: '#059669' },
          { label: 'Rejected', value: appStats.rejected, sub: 'Not approved',    icon: 'fas fa-times-circle',accent: '#dc2626' },
        ]}
      />

      <StatGroup
        title="Payments"
        icon="fas fa-credit-card"
        color="#059669"
        bg="#d1fae5"
        stats={[
          { label: 'Total',      value: payStats.total,      sub: 'All transactions',   icon: 'fas fa-credit-card',   accent: '#059669' },
          { label: 'Successful', value: payStats.successful, sub: 'Completed',          icon: 'fas fa-check-double',  accent: '#059669' },
          { label: 'Failed',     value: payStats.failed,     sub: 'Failed transactions',icon: 'fas fa-times',         accent: '#dc2626' },
          { label: 'Pending',    value: payStats.pending,    sub: 'In progress',        icon: 'fas fa-hourglass-half',accent: '#d97706' },
        ]}
      />

      <StatGroup
        title="Exams"
        icon="fas fa-clipboard-check"
        color="#d97706"
        bg="#fef3c7"
        stats={[
          { label: 'Total Dates', value: examStats.total,    sub: 'All scheduled',icon: 'fas fa-calendar',         accent: '#d97706' },
          { label: 'Upcoming',    value: examStats.upcoming, sub: 'Not yet taken', icon: 'fas fa-clock',           accent: '#0891b2' },
          { label: 'Completed',   value: examStats.done,     sub: 'Past exams',   icon: 'fas fa-check-circle',    accent: '#059669' },
        ]}
      />

    </div>
  );
}
