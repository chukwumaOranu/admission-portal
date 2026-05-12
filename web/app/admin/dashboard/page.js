'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  useUsers,
  useEmployees,
  useApplications,
  usePayments,
  useExams,
  useSettings,
  useDepartments,
} from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

const QUICK_ACTIONS = [
  { label: 'Applications',    desc: 'Review & process',     icon: 'fas fa-file-alt',       color: '#2563eb',  bg: '#eff6ff',  href: '/admin/dashboard/applications' },
  { label: 'Employees',       desc: 'Staff management',     icon: 'fas fa-users-cog',      color: '#0891b2',  bg: '#e0f2fe',  href: '/admin/dashboard/employees' },
  { label: 'Payments',        desc: 'Monitor transactions', icon: 'fas fa-credit-card',    color: '#059669',  bg: '#d1fae5',  href: '/admin/dashboard/payments' },
  { label: 'Exams',           desc: 'Schedule & assign',    icon: 'fas fa-clipboard-check',color: '#d97706',  bg: '#fef3c7',  href: '/admin/dashboard/exams/entry-dates' },
  { label: 'Students',        desc: 'Manage records',       icon: 'fas fa-user-graduate',  color: '#7c3aed',  bg: '#f5f3ff',  href: '/admin/dashboard/students' },
  { label: 'Settings',        desc: 'Configure portal',     icon: 'fas fa-cog',            color: '#64748b',  bg: '#f1f5f9',  href: '/admin/dashboard/settings/school' },
];

const SYSTEM_STATUS = [
  { label: 'Database',     sub: 'Connected',  dot: 'statusGreen', icon: 'fas fa-database' },
  { label: 'Paystack',     sub: 'Active',      dot: 'statusGreen', icon: 'fas fa-credit-card' },
  { label: 'File Storage', sub: 'Available',  dot: 'statusGreen', icon: 'fas fa-cloud' },
  { label: 'Security',     sub: 'Protected',  dot: 'statusGreen', icon: 'fas fa-shield-alt' },
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const { users,       loading: usersLoading,       fetchUsers }       = useUsers();
  const { employees,   loading: empLoading,          fetchEmployees }   = useEmployees();
  const { applications,loading: appsLoading,         fetchApplications} = useApplications();
  const { payments,    loading: paymentsLoading,     fetchPayments, fetchPaymentStats } = usePayments();
  const { entryDates,  loading: examsLoading,        fetchEntryDates }  = useExams();
  const { schoolSettings, loading: settingsLoading,  fetchSchoolSettings } = useSettings();
  const { departments, loading: deptLoading,         fetchDepartments } = useDepartments();

  const [activities, setActivities] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const loadedRef = useRef(false);

  const buildActivities = useCallback(() => {
    const list = [];
    if (session?.user?.username) list.push({ id: 1, msg: `${session.user.username} logged in`, time: 'Just now', icon: 'fas fa-user', color: '#059669', bg: '#d1fae5' });
    applications.slice(0, 2).forEach((a, i) => list.push({ id: `a${i}`, msg: `Application from ${a.applicant_name || 'Unknown'}`, time: 'Recently', icon: 'fas fa-file-alt', color: '#2563eb', bg: '#eff6ff' }));
    payments.slice(0, 2).forEach((p, i) => list.push({ id: `p${i}`, msg: `Payment ${p.payment_status}: ₦${parseFloat(p.amount || 0).toLocaleString()}`, time: 'Recently', icon: 'fas fa-credit-card', color: p.payment_status === 'success' ? '#059669' : '#d97706', bg: p.payment_status === 'success' ? '#d1fae5' : '#fef3c7' }));
    list.push({ id: 'sys', msg: 'System running normally', time: '5 min ago', icon: 'fas fa-cog', color: '#0891b2', bg: '#e0f2fe' });
    setActivities(list.slice(0, 6));
  }, [applications, payments, session?.user?.username]);

  const load = useCallback(async () => {
    try {
      setPageLoading(true);
      await Promise.all([fetchUsers(), fetchEmployees(), fetchApplications(), fetchPayments(), fetchPaymentStats(), fetchEntryDates(), fetchSchoolSettings(), fetchDepartments()]);
      buildActivities();
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); }
  }, [fetchUsers, fetchEmployees, fetchApplications, fetchPayments, fetchPaymentStats, fetchEntryDates, fetchSchoolSettings, fetchDepartments, buildActivities]);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; load();
    }
  }, [status, session?.user?.id, session?.accessToken, load]);
  useEffect(() => { if (applications.length > 0 || payments.length > 0) buildActivities(); }, [applications, payments, buildActivities]);

  const stats = useMemo(() => ({
    totalApps:       applications.length,
    pendingApps:     applications.filter(a => a.status === 'under_review' || a.status === 'submitted').length,
    approvedApps:    applications.filter(a => a.status === 'approved').length,
    successPayments: payments.filter(p => p.payment_status === 'success').length,
    totalUsers:      users.length,
    totalEmployees:  employees.length,
    totalDepts:      departments.length,
    upcomingExams:   entryDates.filter(d => new Date(d.exam_date) > new Date()).length,
  }), [applications, payments, users, employees, departments, entryDates]);

  const isLoading = pageLoading || usersLoading || empLoading || appsLoading || paymentsLoading || examsLoading || settingsLoading || deptLoading;

  if (status === 'loading' || isLoading) {
    return (
      <div className={s.spinnerWrap}>
        <div className="spinner-border" style={{ color: '#1e3a5f' }} role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  const STAT_ROWS = [
    [
      { label: 'Total Applications', value: stats.totalApps,       icon: 'fas fa-file-alt',       color: '#2563eb', href: '/admin/dashboard/applications' },
      { label: 'Pending Review',     value: stats.pendingApps,     icon: 'fas fa-clock',          color: '#d97706', href: '/admin/dashboard/applications/under-review' },
      { label: 'Approved',           value: stats.approvedApps,    icon: 'fas fa-check-circle',   color: '#059669', href: '/admin/dashboard/applications?status=approved' },
      { label: 'Paid Payments',      value: stats.successPayments, icon: 'fas fa-credit-card',    color: '#0891b2', href: '/admin/dashboard/payments' },
    ],
    [
      { label: 'System Users',       value: stats.totalUsers,      icon: 'fas fa-user-shield',    color: '#7c3aed', href: '/admin/dashboard/users' },
      { label: 'Employees',          value: stats.totalEmployees,  icon: 'fas fa-users-cog',      color: '#1e3a5f', href: '/admin/dashboard/employees' },
      { label: 'Departments',        value: stats.totalDepts,      icon: 'fas fa-building',       color: '#64748b', href: '/admin/dashboard/employees/departments' },
      { label: 'Upcoming Exams',     value: stats.upcomingExams,   icon: 'fas fa-calendar-check', color: '#d97706', href: '/admin/dashboard/exams/entry-dates' },
    ],
  ];

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Welcome banner */}
      <div className={s.banner}>
        <div>
          <div className={s.bannerTitle}>
            <i className="fas fa-graduation-cap me-2" />
            {schoolSettings?.school_name || 'Admission Portal'}
          </div>
          <div className={s.bannerSub}>
            Hello, <strong style={{ color: '#fff' }}>{session?.user?.username || 'Admin'}</strong> — welcome back
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span className={s.bannerBadge}><i className="fas fa-user-shield me-1" />{session?.user?.role}</span>
          <button onClick={load} className={s.bannerBadge} style={{ border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="fas fa-sync" style={{ fontSize: '0.75rem' }} />Refresh
          </button>
        </div>
      </div>

      {/* Stats rows */}
      {STAT_ROWS.map((row, ri) => (
        <div key={ri} className={s.statsGrid} style={{ marginBottom: ri === 0 ? '1rem' : '1.5rem' }}>
          {row.map((st) => (
            <Link key={st.label} href={st.href} className={s.statCard} style={{ '--accent': st.color }}>
              <div className={s.statInfo}>
                <div className={s.statLabel}>{st.label}</div>
                <div className={s.statNumber} style={{ color: st.color }}>{st.value}</div>
              </div>
              <div className={s.statIcon} style={{ background: `${st.color}18`, color: st.color }}>
                <i className={st.icon} />
              </div>
            </Link>
          ))}
        </div>
      ))}

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Quick Actions */}
        <div className={s.card} style={{ marginBottom: 0 }}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}><i className="fas fa-bolt" style={{ color: '#d97706' }} />Quick Actions</span>
          </div>
          <div className={s.cardBody}>
            <div className={s.quickGrid}>
              {QUICK_ACTIONS.map((a) => (
                <Link key={a.label} href={a.href} className={s.quickCard}>
                  <div className={s.quickIcon} style={{ background: a.bg, color: a.color }}>
                    <i className={a.icon} />
                  </div>
                  <div className={s.quickLabel}>{a.label}</div>
                  <div className={s.quickDesc}>{a.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Activity + Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Recent Activity */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-history" style={{ color: '#2563eb' }} />Activity</span>
              <button onClick={load} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: '0.78rem', fontWeight: 600 }}>
                <i className="fas fa-sync me-1" />Refresh
              </button>
            </div>
            <div className={s.cardBody}>
              <div className={s.activityFeed}>
                {activities.map((a) => (
                  <div key={a.id} className={s.activityItem}>
                    <div className={s.activityDot} style={{ background: a.bg, color: a.color }}>
                      <i className={a.icon} style={{ fontSize: '0.75rem' }} />
                    </div>
                    <div>
                      <div className={s.activityText}>{a.msg}</div>
                      <div className={s.activityTime}>{a.time}</div>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.82rem', padding: '1rem 0' }}>No recent activity</div>
                )}
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-server" style={{ color: '#059669' }} />System Status</span>
            </div>
            <div className={s.cardBody} style={{ padding: '0.875rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {SYSTEM_STATUS.map((st) => (
                  <div key={st.label} className={s.statusItem}>
                    <span className={`${s.statusDot} ${s[st.dot]}`} />
                    <div>
                      <div className={s.statusLabel}>{st.label}</div>
                      <div className={s.statusSub}>{st.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Responsive: stack sidebar on small screens */}
      <style jsx>{`
        @media (max-width: 992px) {
          div[style*="grid-template-columns: 1fr 320px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
