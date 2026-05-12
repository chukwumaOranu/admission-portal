'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useApplications, usePayments, useEmployees, useExams } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

const money = (v) => `₦${parseFloat(v || 0).toLocaleString()}`;

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const { applications, loading: appsLoading, fetchApplications } = useApplications();
  const { payments, loading: paymentsLoading, fetchPayments } = usePayments();
  const { employees, loading: empLoading, fetchEmployees } = useEmployees();
  const { entryDates, loading: examsLoading, fetchEntryDates } = useExams();
  const loadedRef = useRef(false);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true;
      fetchApplications(); fetchPayments(); fetchEmployees(); fetchEntryDates();
    }
  }, [status, session?.user?.id, fetchApplications, fetchPayments, fetchEmployees, fetchEntryDates]);

  const loading = status === 'loading' || appsLoading || paymentsLoading || empLoading || examsLoading;

  const totalRevenue = payments.filter(p => p.payment_status === 'success' || p.payment_status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const approvalRate = applications.length ? Math.round((applications.filter(a => a.status === 'approved').length / applications.length) * 100) : 0;
  const paymentRate  = payments.length ? Math.round((payments.filter(p => p.payment_status === 'success' || p.payment_status === 'paid').length / payments.length) * 100) : 0;

  if (loading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  const SECTIONS = [
    {
      title: 'Applications', icon: 'fas fa-file-alt', color: '#2563eb', bg: '#eff6ff',
      stats: [
        { label: 'Total',        value: applications.length,                                              icon: 'fas fa-file-alt',    color: '#2563eb' },
        { label: 'Pending',      value: applications.filter(a => a.status === 'submitted' || a.status === 'pending').length, icon: 'fas fa-clock',       color: '#d97706' },
        { label: 'Approved',     value: applications.filter(a => a.status === 'approved').length,         icon: 'fas fa-check-circle',color: '#059669' },
        { label: 'Rejected',     value: applications.filter(a => a.status === 'rejected').length,         icon: 'fas fa-times-circle',color: '#dc2626' },
      ],
      link: '/admin/dashboard/applications', linkLabel: 'Manage Applications',
      extra: <div style={{ display: 'flex', gap: '1.5rem', padding: '0.875rem 1.25rem', borderTop: '1px solid #f0f4f8', fontSize: '0.82rem', color: '#6b7280' }}><span>Approval rate: <strong style={{ color: '#059669' }}>{approvalRate}%</strong></span></div>,
    },
    {
      title: 'Payments', icon: 'fas fa-credit-card', color: '#059669', bg: '#d1fae5',
      stats: [
        { label: 'Total',        value: payments.length,                                                   icon: 'fas fa-credit-card',  color: '#059669' },
        { label: 'Successful',   value: payments.filter(p => p.payment_status === 'success' || p.payment_status === 'paid').length, icon: 'fas fa-check-double', color: '#059669' },
        { label: 'Pending',      value: payments.filter(p => p.payment_status === 'pending').length,       icon: 'fas fa-hourglass-half',color: '#d97706' },
        { label: 'Failed',       value: payments.filter(p => p.payment_status === 'failed').length,        icon: 'fas fa-times',        color: '#dc2626' },
      ],
      link: '/admin/dashboard/payments', linkLabel: 'View Payments',
      extra: <div style={{ display: 'flex', gap: '1.5rem', padding: '0.875rem 1.25rem', borderTop: '1px solid #f0f4f8', fontSize: '0.82rem', color: '#6b7280' }}><span>Success rate: <strong style={{ color: '#059669' }}>{paymentRate}%</strong></span><span>Total revenue: <strong style={{ color: '#059669' }}>{money(totalRevenue)}</strong></span></div>,
    },
    {
      title: 'Employees', icon: 'fas fa-users', color: '#0891b2', bg: '#e0f2fe',
      stats: [
        { label: 'Total',        value: employees.filter(Boolean).length,                              icon: 'fas fa-users',        color: '#0891b2' },
        { label: 'Active',       value: employees.filter(e => e?.status === 'active').length,          icon: 'fas fa-user-check',   color: '#059669' },
        { label: 'Inactive',     value: employees.filter(e => e?.status !== 'active').length,          icon: 'fas fa-user-slash',   color: '#64748b' },
        { label: 'With Login',   value: employees.filter(e => e?.user_id).length,                     icon: 'fas fa-user-lock',    color: '#7c3aed' },
      ],
      link: '/admin/dashboard/employees', linkLabel: 'Manage Employees',
    },
    {
      title: 'Exams', icon: 'fas fa-clipboard-check', color: '#d97706', bg: '#fef3c7',
      stats: [
        { label: 'Total Dates',  value: entryDates.length,                                             icon: 'fas fa-calendar',     color: '#d97706' },
        { label: 'Upcoming',     value: entryDates.filter(e => new Date(e.exam_date) > new Date()).length, icon: 'fas fa-clock',     color: '#0891b2' },
        { label: 'Completed',    value: entryDates.filter(e => new Date(e.exam_date) < new Date()).length, icon: 'fas fa-check',     color: '#059669' },
        { label: 'Reg. Open',    value: entryDates.filter(e => e.registration_open).length,            icon: 'fas fa-door-open',    color: '#7c3aed' },
      ],
      link: '/admin/dashboard/exams/entry-dates', linkLabel: 'Manage Exams',
    },
  ];

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-chart-line" /></span>
            Analytics Dashboard
          </h1>
          <p className={s.pageSub}>Comprehensive insights across all portal modules</p>
        </div>
        <div className={s.pageActions}>
          <button onClick={() => { fetchApplications(); fetchPayments(); fetchEmployees(); fetchEntryDates(); }} className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-sync" />Refresh
          </button>
        </div>
      </div>

      {/* Overview strip */}
      <div className={s.statsGrid} style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Applications',  value: applications.length,                                     icon: 'fas fa-file-alt',    color: '#2563eb' },
          { label: 'Revenue',       value: money(totalRevenue),                                     icon: 'fas fa-credit-card', color: '#059669', isText: true },
          { label: 'Employees',     value: employees.filter(Boolean).length,                        icon: 'fas fa-users',       color: '#0891b2' },
          { label: 'Exam Dates',    value: entryDates.length,                                       icon: 'fas fa-calendar',    color: '#d97706' },
        ].map(st => (
          <div key={st.label} className={s.statCard} style={{ '--accent': st.color, cursor: 'default' }}>
            <div className={s.statInfo}>
              <div className={s.statLabel}>{st.label}</div>
              <div className={s.statNumber} style={{ color: st.color, fontSize: st.isText ? '1.1rem' : undefined }}>{st.value}</div>
            </div>
            <div className={s.statIcon} style={{ background: `${st.color}18`, color: st.color }}><i className={st.icon} /></div>
          </div>
        ))}
      </div>

      {/* Section cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {SECTIONS.map(section => (
          <div key={section.title} className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader} style={{ justifyContent: 'space-between' }}>
              <span className={s.cardTitle}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: section.bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: section.color, flexShrink: 0 }}>
                  <i className={section.icon} style={{ fontSize: '0.75rem' }} />
                </span>
                {section.title}
              </span>
              <Link href={section.link} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}>
                <i className="fas fa-arrow-right" />{section.linkLabel}
              </Link>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                {section.stats.map(st => (
                  <div key={st.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                      <i className={st.icon} style={{ color: st.color, fontSize: '0.7rem' }} />
                      {st.label}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: st.color, lineHeight: 1 }}>{st.value.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
            {section.extra}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className={s.card} style={{ marginTop: '1.25rem', marginBottom: 0 }}>
        <div className={s.cardHeader}>
          <span className={s.cardTitle}><i className="fas fa-bolt" style={{ color: '#d97706' }} />Quick Actions</span>
        </div>
        <div className={s.cardBody} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Review Applications', href: '/admin/dashboard/applications/review',   icon: 'fas fa-clipboard-check', color: '#2563eb' },
            { label: 'Verify Payments',     href: '/admin/dashboard/payments',              icon: 'fas fa-credit-card',     color: '#059669' },
            { label: 'Assign Exams',        href: '/admin/dashboard/exams/assign',          icon: 'fas fa-calendar-check',  color: '#d97706' },
            { label: 'Admission Results',   href: '/admin/dashboard/applications/admission',icon: 'fas fa-graduation-cap',  color: '#7c3aed' },
          ].map(a => (
            <Link key={a.label} href={a.href} className={`${s.btn} ${s.btnOutline}`} style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
              <i className={a.icon} style={{ color: a.color }} />{a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
