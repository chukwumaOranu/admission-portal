'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications, usePayments, useExams } from '@/hooks/useRedux';
import s from '@/styles/student-portal.module.css';

const fmtDate = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const REPORT_META = [
  { key: 'applications', title: 'Application Summary',     desc: 'Overview of your submitted applications',       icon: 'fas fa-file-alt',      color: '#2563eb', bg: '#eff6ff' },
  { key: 'payments',     title: 'Payment Transactions',    desc: 'Detailed view of all payment activity',         icon: 'fas fa-credit-card',   color: '#059669', bg: '#d1fae5' },
  { key: 'exams',        title: 'Exam Schedule',           desc: 'Upcoming and completed exam entry dates',       icon: 'fas fa-clipboard-check',color: '#d97706', bg: '#fef3c7' },
  { key: 'profile',      title: 'Profile Summary',         desc: 'Your personal and contact information',         icon: 'fas fa-user-circle',   color: '#7c3aed', bg: '#f5f3ff' },
];

export default function StudentReports() {
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

  if (!hasPermission('student_report.read')) {
    return (
      <div className={s.wrap}>
        <div className={s.alertDanger}><i className="fas fa-lock" style={{ marginRight: 8 }} />You don&apos;t have permission to view reports.</div>
      </div>
    );
  }

  const counts = { applications: applications.length, payments: payments.length, exams: entryDates.length, profile: 1 };
  const today = fmtDate();

  return (
    <div className={s.wrap}>

      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-chart-bar" /></span>
            My Reports
          </h1>
          <p className={s.pageSub}>Summary of your activity and information</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
        {REPORT_META.map(({ key, title, desc, icon, color, bg }) => (
          <div key={key} className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardBody} style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                  <i className={icon} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{desc}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: 8, marginTop: 'auto' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem', color }}>{counts[key]}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Records</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>{today}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Updated</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
