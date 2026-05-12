'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { id: 'overview',      label: 'Overview',      icon: 'fas fa-chart-pie',       href: '/admin/dashboard' },
  { id: 'applications',  label: 'Applications',  icon: 'fas fa-file-alt',        href: '/admin/dashboard/applications' },
  { id: 'payments',      label: 'Payments',       icon: 'fas fa-credit-card',     href: '/admin/dashboard/payments' },
  { id: 'exams',         label: 'Exams',          icon: 'fas fa-clipboard-check', href: '/admin/dashboard/exams/entry-dates' },
  { id: 'results',       label: 'Results',        icon: 'fas fa-poll',            href: '/admin/dashboard/applications/admission' },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();

  const isTabActive = (tab) => {
    if (tab.id === 'overview') return pathname === '/admin/dashboard';
    return pathname === tab.href || pathname.startsWith(tab.href.replace('/entry-dates', '') + '/') || pathname.startsWith(tab.href + '/');
  };

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* Page Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5eaf2', padding: '1.25rem 1.5rem 0', marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ width: 34, height: 34, borderRadius: '9px', background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-tachometer-alt" style={{ color: '#2563eb', fontSize: '0.9rem' }} />
              </span>
              Dashboard
            </h1>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: '#94a3b8', fontWeight: 400 }}>
              Welcome to DeepFlux Admissions Admin Portal
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.825rem', fontWeight: 600,
              background: '#fff', border: '1.5px solid #e2e8f0', color: '#475569', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; }}
            >
              <i className="fas fa-download" style={{ fontSize: '0.75rem' }} />
              Export
            </button>
            <Link href="/admin/dashboard/applications/new" style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.825rem', fontWeight: 600,
              background: '#1e3a5f', color: '#fff', textDecoration: 'none', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#2563eb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#1e3a5f'; }}
            >
              <i className="fas fa-plus" style={{ fontSize: '0.75rem' }} />
              Quick Add
            </Link>
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map((tab) => {
            const active = isTabActive(tab);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.45rem',
                  padding: '0.65rem 1.1rem', fontSize: '0.85rem', fontWeight: active ? 600 : 500,
                  color: active ? '#2563eb' : '#64748b', textDecoration: 'none',
                  borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
                  whiteSpace: 'nowrap', transition: 'color 0.15s', flexShrink: 0,
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = '#1e293b'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = '#64748b'; }}
              >
                <i className={tab.icon} style={{ fontSize: '0.8rem' }} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1.5rem' }}>
        {children}
      </div>
    </div>
  );
}
