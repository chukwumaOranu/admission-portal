'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useApplications } from '@/hooks/useRedux';
import s from '@/styles/student-portal.module.css';

export default function BrowseProgramsPage() {
  const { status } = useSession();
  const { schemas: allSchemas, applications: userApplications, loading, error, fetchApplicationSchemas, fetchMyApplications } = useApplications();

  const schemas = allSchemas.filter((sc) => sc.is_active);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchApplicationSchemas();
      fetchMyApplications();
    }
  }, [status, fetchApplicationSchemas, fetchMyApplications]);

  const hasApplied = (schemaId) => userApplications.some((a) => a.schema_id === schemaId);
  const getApp = (schemaId) => userApplications.find((a) => a.schema_id === schemaId);

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
              <i className="fas fa-search" />
            </span>
            Browse Programs
          </h1>
          <p className={s.pageSub}>Select a program to begin your application</p>
        </div>
        <Link href="/admin/dashboard/student-portal/applications" className={s.btnOutline}>
          <i className="fas fa-arrow-left" />My Applications
        </Link>
      </div>

      {error && <div className={`${s.alertDanger} mb-4`}><i className="fas fa-exclamation-triangle me-2" />{error}</div>}

      {/* How-to banner */}
      <div className={`${s.alertInfo} mb-4`} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <i className="fas fa-info-circle mt-1" style={{ flexShrink: 0 }} />
        <div>
          <strong>How to apply:</strong> Review the program details and fee below, then click <strong>Apply Now</strong>. You will be prompted to complete the form and pay the application fee via Paystack.
        </div>
      </div>

      {/* Programs */}
      {schemas.length === 0 ? (
        <div className={s.card}>
          <div className={s.emptyState}>
            <div className={s.emptyIcon}><i className="fas fa-graduation-cap" /></div>
            <h5 className={s.emptyTitle}>No Programs Available</h5>
            <p className={s.emptySub}>No admission programs are currently open. Check back later or contact the school.</p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {schemas.map((schema) => {
            const applied = hasApplied(schema.id);
            const app = getApp(schema.id);
            return (
              <div key={schema.id} className="col-md-6 col-lg-4">
                <div className={s.programCard}>
                  <div className={s.programCardBanner}>
                    <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                      <i className="fas fa-graduation-cap me-1" />Admission Program
                    </div>
                    <h5 style={{ color: '#fff', fontWeight: 700, margin: 0, fontSize: '1.05rem' }}>
                      {schema.display_name || schema.schema_name}
                    </h5>
                  </div>

                  <div className={s.programCardBody}>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                      {schema.description || 'No description available.'}
                    </p>

                    <div className={s.feePill}>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Application Fee</span>
                      <strong style={{ color: '#059669', fontSize: '1.1rem' }}>
                        ₦{parseFloat(schema.application_fee || 0).toLocaleString()}
                      </strong>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span><i className="fas fa-calendar text-warning me-2" />Opened: {new Date(schema.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span><i className="fas fa-check-circle text-success me-2" />Currently accepting applications</span>
                    </div>
                  </div>

                  <div className={s.programCardFoot}>
                    {applied ? (
                      <div>
                        <div style={{ marginBottom: '0.6rem' }}>
                          <span className={`${s.badge} ${app?.status === 'approved' ? s.badgeApproved : app?.status === 'rejected' ? s.badgeRejected : s.badgePending}`}>
                            {app?.status === 'approved' ? 'Approved' : app?.status === 'rejected' ? 'Rejected' : app?.status || 'Pending'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link href={`/admin/dashboard/student-portal/applications/${app.id}`} className={`${s.btnOutline} ${s.btnSm}`} style={{ flex: 1, justifyContent: 'center' }}>
                            <i className="fas fa-eye" />View
                          </Link>
                          {app?.payment_status !== 'paid' && (
                            <Link href={`/admin/dashboard/student-portal/payments/pay/${app.id}`} className={`${s.btnGreen} ${s.btnSm}`} style={{ flex: 1, justifyContent: 'center' }}>
                              <i className="fas fa-credit-card" />Pay
                            </Link>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Link href={`/admin/dashboard/student-portal/applications/new?schema=${schema.id}`} className={s.btnGreen} style={{ width: '100%', justifyContent: 'center' }}>
                        <i className="fas fa-paper-plane" />Apply Now
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info strip */}
      <div className={s.card} style={{ marginTop: '2rem' }}>
        <div className={s.cardBody}>
          <div className="row g-4">
            {[
              { icon: 'fas fa-file-alt', color: '#2563eb', title: 'Application Process', desc: 'Fill the form, upload documents, and submit for review.' },
              { icon: 'fas fa-credit-card', color: '#059669', title: 'Payment', desc: 'Pay the fee securely via Paystack — card, bank transfer, or USSD.' },
              { icon: 'fas fa-clock', color: '#d97706', title: 'Processing Time', desc: 'Applications are reviewed within 5–7 business days.' },
            ].map((item) => (
              <div key={item.title} className="col-md-4">
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div className={s.iconBox} style={{ background: `${item.color}15`, color: item.color, flexShrink: 0 }}>
                    <i className={item.icon} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b', marginBottom: '0.2rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{item.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
