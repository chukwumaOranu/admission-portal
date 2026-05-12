'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useApplications, usePayments, useEmployees, useExams, useUsers } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

const money = (v) => `₦${parseFloat(v || 0).toLocaleString()}`;

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const { applications, loading: appsLoading, fetchApplications } = useApplications();
  const { payments, loading: paymentsLoading, fetchPayments } = usePayments();
  const { employees, loading: empLoading, fetchEmployees } = useEmployees();
  const { entryDates, loading: examsLoading, fetchEntryDates } = useExams();
  const { users, loading: usersLoading, fetchUsers } = useUsers();
  const loadedRef = useRef(false);

  const loading = status === 'loading' || appsLoading || paymentsLoading || empLoading || examsLoading || usersLoading;

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true;
      fetchApplications(); fetchPayments(); fetchEmployees(); fetchEntryDates(); fetchUsers();
    }
  }, [status, session?.user?.id, fetchApplications, fetchPayments, fetchEmployees, fetchEntryDates, fetchUsers]);

  const totalRecords = applications.length + payments.length + employees.filter(Boolean).length + entryDates.length + users.length;
  const totalRevenue = payments.filter(p => p.payment_status === 'success' || p.payment_status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const REPORTS = [
    {
      id: 1, title: 'Application Summary', type: 'applications',
      description: 'Comprehensive overview of all applications including status breakdowns',
      icon: 'fas fa-file-alt', color: '#2563eb', bg: '#eff6ff',
      records: applications.length,
      breakdown: [
        { label: 'Pending',  val: applications.filter(a => a.status === 'submitted' || a.status === 'pending').length,   color: '#d97706' },
        { label: 'Approved', val: applications.filter(a => a.status === 'approved').length, color: '#059669' },
        { label: 'Rejected', val: applications.filter(a => a.status === 'rejected').length, color: '#dc2626' },
      ],
      link: '/admin/dashboard/applications',
    },
    {
      id: 2, title: 'Payment Transactions', type: 'payments',
      description: 'Detailed payment analysis with revenue and transaction statistics',
      icon: 'fas fa-credit-card', color: '#059669', bg: '#d1fae5',
      records: payments.length,
      breakdown: [
        { label: 'Successful', val: payments.filter(p => p.payment_status === 'success' || p.payment_status === 'paid').length, color: '#059669' },
        { label: 'Pending',    val: payments.filter(p => p.payment_status === 'pending').length, color: '#d97706' },
        { label: 'Failed',     val: payments.filter(p => p.payment_status === 'failed').length,  color: '#dc2626' },
      ],
      link: '/admin/dashboard/payments',
      extra: money(totalRevenue),
    },
    {
      id: 3, title: 'Employee Directory', type: 'employees',
      description: 'Complete employee information, status and portal access records',
      icon: 'fas fa-users', color: '#0891b2', bg: '#e0f2fe',
      records: employees.filter(Boolean).length,
      breakdown: [
        { label: 'Active',    val: employees.filter(e => e?.status === 'active').length,  color: '#059669' },
        { label: 'Inactive',  val: employees.filter(e => e?.status !== 'active').length,  color: '#64748b' },
        { label: 'With Login',val: employees.filter(e => e?.user_id).length,             color: '#7c3aed' },
      ],
      link: '/admin/dashboard/employees',
    },
    {
      id: 4, title: 'Exam Schedule', type: 'exams',
      description: 'Upcoming and completed exam schedules and capacity utilisation',
      icon: 'fas fa-clipboard-check', color: '#d97706', bg: '#fef3c7',
      records: entryDates.length,
      breakdown: [
        { label: 'Upcoming',   val: entryDates.filter(e => new Date(e.exam_date) > new Date()).length,  color: '#0891b2' },
        { label: 'Completed',  val: entryDates.filter(e => new Date(e.exam_date) < new Date()).length,  color: '#059669' },
        { label: 'Reg. Open',  val: entryDates.filter(e => e.registration_open).length,                color: '#7c3aed' },
      ],
      link: '/admin/dashboard/exams/entry-dates',
    },
    {
      id: 5, title: 'User Activity', type: 'users',
      description: 'System usage, user accounts and portal access statistics',
      icon: 'fas fa-user-clock', color: '#7c3aed', bg: '#ede9fe',
      records: users.length,
      breakdown: [
        { label: 'Active',    val: users.filter(u => u.is_active).length,  color: '#059669' },
        { label: 'Inactive',  val: users.filter(u => !u.is_active).length, color: '#64748b' },
        { label: 'With Role', val: users.filter(u => u.role_id).length,    color: '#0891b2' },
      ],
      link: '/admin/dashboard/users',
    },
  ];

  if (loading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-chart-bar" /></span>
            Reports Dashboard
          </h1>
          <p className={s.pageSub}>Generate and view system-wide reports and analytics</p>
        </div>
        <div className={s.pageActions}>
          <button onClick={() => { fetchApplications(); fetchPayments(); fetchEmployees(); fetchEntryDates(); fetchUsers(); }} className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-sync" />Refresh All
          </button>
        </div>
      </div>

      {/* Overview stats */}
      <div className={s.statsGrid} style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Report Types',   value: REPORTS.length,                   icon: 'fas fa-chart-bar',   color: '#2563eb' },
          { label: 'Total Records',  value: totalRecords,                      icon: 'fas fa-database',    color: '#0891b2' },
          { label: 'Total Revenue',  value: money(totalRevenue),               icon: 'fas fa-credit-card', color: '#059669', isText: true },
          { label: 'Last Updated',   value: 'Today',                           icon: 'fas fa-clock',       color: '#d97706', isText: true },
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

      {/* Report cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {REPORTS.map(report => (
          <div key={report.id} className={s.card} style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 34, height: 34, borderRadius: 8, background: report.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: report.color, flexShrink: 0 }}>
                  <i className={report.icon} style={{ fontSize: '0.85rem' }} />
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e3a5f' }}>{report.title}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{report.records.toLocaleString()} records</div>
                </div>
              </div>
              {report.extra && <span style={{ fontWeight: 700, color: report.color, fontSize: '0.875rem' }}>{report.extra}</span>}
            </div>

            {/* Body */}
            <div style={{ padding: '0.875rem 1.25rem', flex: 1 }}>
              <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: '0 0 0.75rem', lineHeight: 1.5 }}>{report.description}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {report.breakdown.map(b => (
                  <div key={b.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{b.label}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: b.color }}>{b.val.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #f0f4f8', display: 'flex', gap: '0.4rem' }}>
              <Link href={report.link} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} style={{ flex: 1, justifyContent: 'center' }}>
                <i className="fas fa-eye" />View {report.type}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
