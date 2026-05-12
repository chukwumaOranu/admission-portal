'use client';

import { useEffect } from 'react';
import { useSettings } from '@/hooks/useRedux';
import s from '@/styles/student-portal.module.css';

const QUICK_LINKS = [
  { icon: 'fas fa-question-circle', label: 'Frequently Asked Questions',  color: '#2563eb' },
  { icon: 'fas fa-file-alt',        label: 'How to Apply',                 color: '#059669' },
  { icon: 'fas fa-credit-card',     label: 'Payment Instructions',         color: '#d97706' },
  { icon: 'fas fa-download',        label: 'Download Forms',                color: '#0891b2' },
];

export default function StudentHelp() {
  const { schoolSettings, loading, fetchSchoolSettings } = useSettings();

  useEffect(() => { fetchSchoolSettings(); }, [fetchSchoolSettings]);

  const contacts = [
    schoolSettings?.school_email    && { icon: 'fas fa-envelope',       color: '#2563eb', label: 'Email',   value: schoolSettings.school_email,   href: `mailto:${schoolSettings.school_email}` },
    schoolSettings?.school_phone    && { icon: 'fas fa-phone',          color: '#059669', label: 'Phone',   value: schoolSettings.school_phone,   href: `tel:${schoolSettings.school_phone}` },
    schoolSettings?.school_address  && { icon: 'fas fa-map-marker-alt', color: '#dc2626', label: 'Address', value: schoolSettings.school_address,  href: null },
    schoolSettings?.school_website  && { icon: 'fas fa-globe',          color: '#0891b2', label: 'Website', value: schoolSettings.school_website, href: schoolSettings.school_website, external: true },
  ].filter(Boolean);

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-headset" /></span>
            Help & Support
          </h1>
          <p className={s.pageSub}>Get assistance with applications, payments, and more</p>
        </div>
      </div>

      <div className="row g-4">
        {/* Contact */}
        <div className="col-md-6">
          <div className={s.card} style={{ height: '100%' }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-headset me-2" style={{ color: '#2563eb' }} />Contact Support</span>
            </div>
            <div className={s.cardBody}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="spinner-border spinner-border-sm" style={{ color: '#1e3a5f' }} role="status" />
                </div>
              ) : contacts.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Contact details are not available. Please check back later.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {contacts.map((c) => (
                    <div key={c.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                      <div className={s.iconBox} style={{ background: `${c.color}15`, color: c.color, flexShrink: 0 }}><i className={c.icon} /></div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.2rem' }}>{c.label}</div>
                        {c.href ? (
                          <a href={c.href} target={c.external ? '_blank' : undefined} rel={c.external ? 'noopener noreferrer' : undefined}
                            style={{ color: c.color, fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none' }}>
                            {c.value}
                          </a>
                        ) : (
                          <div style={{ fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>{c.value}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="col-md-6">
          <div className={s.card} style={{ height: '100%' }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-book-open me-2" style={{ color: '#059669' }} />Quick Links</span>
            </div>
            <div className={s.cardBody} style={{ padding: '0.5rem 0' }}>
              {QUICK_LINKS.map((link) => (
                <button key={link.label}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', width: '100%', background: 'none', border: 'none', padding: '0.875rem 1.5rem', cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left', borderBottom: '1px solid #f3f4f6' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <div className={s.iconBox} style={{ background: `${link.color}15`, color: link.color, flexShrink: 0 }}><i className={link.icon} /></div>
                  <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.9rem' }}>{link.label}</span>
                  <i className="fas fa-chevron-right" style={{ color: '#d1d5db', fontSize: '0.75rem', marginLeft: 'auto' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Help card */}
      <div className={s.helpCard} style={{ marginTop: '1.5rem' }}>
        <i className="fas fa-life-ring" style={{ fontSize: '2rem', color: '#2563eb', display: 'block', marginBottom: '0.75rem' }} />
        <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.4rem' }}>Still need help?</div>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
          Our support team is available Monday – Friday, 8am – 5pm. We typically respond within one business day.
        </p>
        <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'center' }}>
          {schoolSettings?.school_email && (
            <a href={`mailto:${schoolSettings.school_email}`} className={s.btnPrimary}><i className="fas fa-envelope" />Send Email</a>
          )}
          {schoolSettings?.school_phone && (
            <a href={`tel:${schoolSettings.school_phone}`} className={s.btnOutline}><i className="fas fa-phone" />Call Us</a>
          )}
        </div>
      </div>
    </div>
  );
}
