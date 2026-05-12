'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { API_ENDPOINTS, apiService } from '@/services/api';

const API_URL   = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const IMAGE_URL = API_URL.replace('/api', '') || 'http://localhost:5000';

const STAT_CONFIG = [
  { key: 'applications', label: 'Applications', sub: 'Total submitted', icon: 'fas fa-file-alt',        color: '#2563eb', href: '/admin/dashboard/student-portal/applications' },
  { key: 'payments',     label: 'Payments',     sub: 'Completed',       icon: 'fas fa-credit-card',     color: '#059669', href: '/admin/dashboard/student-portal/payments' },
  { key: 'exams',        label: 'Exams',        sub: 'Scheduled',       icon: 'fas fa-clipboard-check', color: '#d97706', href: '/admin/dashboard/student-portal/exams' },
  { key: 'results',      label: 'Results',      sub: 'Approved',        icon: 'fas fa-poll',            color: '#7c3aed', href: '/admin/dashboard/student-portal/results' },
];

const QUICK_ACTIONS = [
  { label: 'Browse Programs', desc: 'View available admissions',  icon: 'fas fa-search',      color: '#2563eb', href: '/admin/dashboard/student-portal/applications/browse' },
  { label: 'My Applications', desc: 'Track status',               icon: 'fas fa-list-check',  color: '#059669', href: '/admin/dashboard/student-portal/applications' },
  { label: 'Exam Card',       desc: 'Download your card',         icon: 'fas fa-id-card',     color: '#d97706', href: '/admin/dashboard/student-portal/exams' },
  { label: 'Payment History', desc: 'View all receipts',          icon: 'fas fa-receipt',     color: '#059669', href: '/admin/dashboard/student-portal/payments/history' },
  { label: 'Results',         desc: 'Admission status',           icon: 'fas fa-chart-bar',   color: '#7c3aed', href: '/admin/dashboard/student-portal/results' },
  { label: 'Edit Profile',    desc: 'Update your info',           icon: 'fas fa-user-edit',   color: '#0891b2', href: '/admin/dashboard/student-portal/profile/edit' },
];

export default function StudentPortalDashboard() {
  const { data: session, status } = useSession();
  const [loading, setLoading]       = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [stats, setStats]           = useState({ applications: 0, payments: 0, exams: 0, results: 0 });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, appsRes] = await Promise.all([
        apiService.get(API_ENDPOINTS.STUDENTS.GET_ME),
        apiService.get(API_ENDPOINTS.APPLICATIONS.GET_MY),
      ]);
      const profile = profileRes.data || profileRes;
      const apps = Array.isArray(appsRes.data?.data) ? appsRes.data.data : (Array.isArray(appsRes.data) ? appsRes.data : []);
      setStudentData(profile);
      setStats({
        applications: apps.length,
        payments:     apps.filter(a => a.payment_status === 'paid').length,
        exams:        apps.filter(a => a.exam_date_id || a.exam_date).length,
        results:      apps.filter(a => a.admission_status === 'approved').length,
      });
    } catch { /* silent — dashboard stats are non-critical */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && session?.accessToken) fetchDashboardData();
  }, [status, session?.user?.id, session?.accessToken, fetchDashboardData]);

  const profilePhotoUrl = useMemo(() => {
    if (!studentData?.profile_photo) return null;
    return `${IMAGE_URL}${studentData.profile_photo}`;
  }, [studentData?.profile_photo]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" />
      </div>
    );
  }

  const fullName = [studentData?.first_name, studentData?.last_name].filter(Boolean).join(' ');

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', margin: '-1rem', padding: '1.5rem' }}>

      {/* Welcome Banner */}
      <div className="sd-banner" style={{ marginBottom: '1.5rem' }}>
        <div className="sd-banner-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {profilePhotoUrl ? (
              <Image src={profilePhotoUrl} alt="Profile" width={64} height={64} unoptimized style={{ borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.5)' }} />
            ) : (
              <div className="sd-avatar">{studentData?.first_name?.[0]?.toUpperCase() || <i className="fas fa-user" />}</div>
            )}
            <div>
              <p className="sd-banner-greeting">Welcome back</p>
              <h2 className="sd-banner-name">{fullName || 'Student'}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                {studentData?.student_id && <span className="sd-chip"><i className="fas fa-id-badge" style={{ marginRight: 4 }} />{studentData.student_id}</span>}
                {studentData?.schema_display_name && <span className="sd-chip"><i className="fas fa-graduation-cap" style={{ marginRight: 4 }} />{studentData.schema_display_name}</span>}
                <span className="sd-chip sd-chip-green"><i className="fas fa-circle" style={{ fontSize: '0.5rem', verticalAlign: 'middle', marginRight: 4 }} />Active</span>
              </div>
            </div>
          </div>
          <Link href="/admin/dashboard/student-portal/applications/browse" className="sd-banner-btn">
            <i className="fas fa-search" style={{ marginRight: 8 }} />Browse Programs
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="sd-stats-row">
        {STAT_CONFIG.map((st) => (
          <Link key={st.key} href={st.href} style={{ textDecoration: 'none' }}>
            <div className="sd-stat-card" style={{ '--accent': st.color }}>
              <div className="sd-stat-left">
                <div className="sd-stat-icon" style={{ background: `${st.color}18`, color: st.color }}>
                  <i className={st.icon} />
                </div>
                <div>
                  <div className="sd-stat-label">{st.label}</div>
                  <div className="sd-stat-number" style={{ color: st.color }}>{stats[st.key]}</div>
                  <div className="sd-stat-sub">{st.sub}</div>
                </div>
              </div>
              <i className="fas fa-chevron-right sd-stat-arrow" style={{ color: st.color }} />
            </div>
          </Link>
        ))}
      </div>

      {/* Main Grid */}
      <div className="sd-main-grid">

        {/* Left: Quick Actions + Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="sd-card">
            <div className="sd-card-header">
              <span className="sd-card-title"><i className="fas fa-bolt" style={{ marginRight: 8, color: '#d97706' }} />Quick Actions</span>
            </div>
            <div className="sd-card-body">
              <div className="sd-actions-grid">
                {QUICK_ACTIONS.map((a) => (
                  <Link key={a.label} href={a.href} style={{ textDecoration: 'none' }}>
                    <div className="sd-action-card">
                      <div className="sd-action-icon" style={{ background: `${a.color}15`, color: a.color }}>
                        <i className={a.icon} />
                      </div>
                      <div className="sd-action-label">{a.label}</div>
                      <div className="sd-action-desc">{a.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="sd-card">
            <div className="sd-card-header">
              <span className="sd-card-title"><i className="fas fa-clock" style={{ marginRight: 8, color: '#2563eb' }} />Recent Activity</span>
              <Link href="/admin/dashboard/student-portal/applications" className="sd-card-link">View all <i className="fas fa-arrow-right" style={{ marginLeft: 4 }} /></Link>
            </div>
            <div className="sd-card-body">
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div className="sd-empty-icon" style={{ marginBottom: '0.75rem' }}><i className="fas fa-inbox" /></div>
                <h6 style={{ fontWeight: 600, marginBottom: 4 }}>No applications yet</h6>
                <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Start your journey by browsing available programs</p>
                <Link href="/admin/dashboard/student-portal/applications/browse" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#1e3a5f', color: '#fff', borderRadius: 8, padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                  <i className="fas fa-search" />Browse Programs
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Profile Card */}
          <div className="sd-card">
            <div className="sd-card-header">
              <span className="sd-card-title"><i className="fas fa-user-circle" style={{ marginRight: 8, color: '#2563eb' }} />Profile</span>
              <Link href="/admin/dashboard/student-portal/profile/edit" className="sd-card-link">Edit <i className="fas fa-pen" style={{ marginLeft: 4 }} /></Link>
            </div>
            <div className="sd-card-body">
              <div style={{ textAlign: 'center', marginBottom: '1rem', paddingTop: '0.5rem' }}>
                {profilePhotoUrl ? (
                  <Image src={profilePhotoUrl} alt="Profile" width={88} height={88} unoptimized style={{ borderRadius: '50%', objectFit: 'cover', border: '3px solid #e5eaf2', display: 'block', margin: '0 auto 0.5rem' }} />
                ) : (
                  <div className="sd-profile-avatar">{studentData?.first_name?.[0]?.toUpperCase() || <i className="fas fa-user" />}</div>
                )}
                <div style={{ fontWeight: 600 }}>{fullName}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{studentData?.email}</div>
              </div>
              <hr style={{ borderColor: '#e5eaf2', margin: '0.75rem 0' }} />
              <div className="sd-info-list">
                {[
                  { icon: 'fas fa-hashtag',     label: 'Student ID', value: studentData?.student_id },
                  { icon: 'fas fa-layer-group', label: 'Program',    value: studentData?.schema_display_name },
                  { icon: 'fas fa-calendar',    label: 'Joined',     value: studentData?.created_at ? new Date(studentData.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                  { icon: 'fas fa-circle',      label: 'Status',     value: <span style={{ background: '#d1fae5', color: '#065f46', fontSize: '0.78rem', fontWeight: 500, padding: '0.15rem 0.5rem', borderRadius: 10 }}>Active</span> },
                ].map(row => (
                  <div className="sd-info-row" key={row.label}>
                    <span className="sd-info-label"><i className={`${row.icon}`} style={{ color: '#2563eb', fontSize: '0.75rem', marginRight: 6 }} />{row.label}</span>
                    <span className="sd-info-value">{row.value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Help Card */}
          <div className="sd-help-card">
            <i className="fas fa-headset sd-help-icon" />
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Need help?</div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
              Our support team is ready to assist with applications, payments, or technical issues.
            </p>
            <Link href="/admin/dashboard/student-portal/help" style={{ display: 'block', background: '#1e3a5f', color: '#fff', borderRadius: 8, padding: '0.5rem', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
              Contact Support
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .sd-banner { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); border-radius: 16px; padding: 2px; }
        .sd-banner-inner { background: linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%); border-radius: 14px; padding: 1.75rem 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem; }
        .sd-avatar { width: 64px; height: 64px; border-radius: 50%; background: rgba(255,255,255,0.2); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; font-weight: 700; flex-shrink: 0; border: 3px solid rgba(255,255,255,0.35); }
        .sd-banner-greeting { color: rgba(255,255,255,0.65); font-size: 0.85rem; margin: 0; }
        .sd-banner-name { color: #fff; font-size: 1.5rem; font-weight: 700; margin: 0; }
        .sd-chip { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.9); border-radius: 20px; padding: 0.2rem 0.75rem; font-size: 0.78rem; font-weight: 500; }
        .sd-chip-green { background: rgba(16,185,129,0.25); color: #6ee7b7; }
        .sd-banner-btn { background: rgba(255,255,255,0.15); color: #fff !important; border: 1.5px solid rgba(255,255,255,0.4); border-radius: 10px; padding: 0.6rem 1.4rem; font-size: 0.9rem; font-weight: 600; text-decoration: none; white-space: nowrap; display: inline-block; }
        .sd-banner-btn:hover { background: rgba(255,255,255,0.25); }

        .sd-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; }
        .sd-stat-card { background: #fff; border-radius: 12px; padding: 1.25rem 1.25rem 1.25rem 0; border-left: 4px solid var(--accent); display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 4px rgba(0,0,0,0.06); transition: box-shadow 0.2s, transform 0.2s; }
        .sd-stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); transform: translateY(-2px); }
        .sd-stat-left { display: flex; align-items: center; gap: 1rem; padding-left: 1.25rem; }
        .sd-stat-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
        .sd-stat-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; }
        .sd-stat-number { font-size: 1.75rem; font-weight: 800; line-height: 1.1; }
        .sd-stat-sub { font-size: 0.75rem; color: #9ca3af; }
        .sd-stat-arrow { font-size: 0.75rem; opacity: 0.5; margin-right: 0.5rem; }

        .sd-main-grid { display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; }
        .sd-card { background: #fff; border-radius: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
        .sd-card-header { padding: 1rem 1.5rem; border-bottom: 1px solid #f0f4f8; display: flex; align-items: center; justify-content: space-between; }
        .sd-card-title { font-weight: 700; font-size: 0.95rem; color: #1e293b; }
        .sd-card-link { font-size: 0.8rem; color: #2563eb; text-decoration: none; font-weight: 500; }
        .sd-card-link:hover { text-decoration: underline; }
        .sd-card-body { padding: 1.5rem; }

        .sd-actions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
        .sd-action-card { background: #f8fafc; border: 1px solid #e5eaf2; border-radius: 12px; padding: 1.25rem 1rem; text-align: center; transition: all 0.2s; cursor: pointer; }
        .sd-action-card:hover { background: #fff; box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateY(-2px); border-color: transparent; }
        .sd-action-icon { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; margin: 0 auto 0.75rem; }
        .sd-action-label { font-weight: 600; font-size: 0.875rem; color: #1e293b; margin-bottom: 0.2rem; }
        .sd-action-desc { font-size: 0.75rem; color: #9ca3af; }

        .sd-empty-icon { width: 72px; height: 72px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; color: #2563eb; margin: 0 auto; }
        .sd-profile-avatar { width: 88px; height: 88px; border-radius: 50%; background: #1e3a5f; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; border: 3px solid #e5eaf2; margin: 0 auto 0.5rem; }
        .sd-info-list { display: flex; flex-direction: column; gap: 0.625rem; }
        .sd-info-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; }
        .sd-info-label { color: #6b7280; }
        .sd-info-value { font-weight: 500; color: #1e293b; text-align: right; }

        .sd-help-card { background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%); border: 1px solid #bfdbfe; border-radius: 14px; padding: 1.5rem; text-align: center; }
        .sd-help-icon { font-size: 2rem; color: #2563eb; margin-bottom: 0.75rem; display: block; }

        @media (max-width: 1024px) { .sd-main-grid { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .sd-stats-row { grid-template-columns: repeat(2, 1fr); } .sd-actions-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .sd-banner-inner { flex-direction: column; align-items: flex-start; } .sd-banner-btn { width: 100%; text-align: center; } .sd-stats-row { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </div>
  );
}
