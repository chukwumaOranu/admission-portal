'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';
import apiService, { API_URL } from '@/services/api';
import s from '@/styles/admin-portal.module.css';

const fmtDt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_BADGE = {
  pending:     { cls: s.badgePending,  label: 'Pending' },
  submitted:   { cls: s.badgeSubmitted, label: 'Submitted' },
  approved:    { cls: s.badgeApproved, label: 'Approved' },
  rejected:    { cls: s.badgeRejected, label: 'Rejected' },
  'under review': { cls: s.badgeReview, label: 'Under Review' },
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { applications, fetchApplications, updateApplicationStatus, deleteApplication } = useApplications();

  const [app, setApp]       = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError]   = useState('');
  const loadedRef = useRef(false);

  const loadDetail = useCallback(async () => {
    const existing = applications.find(a => a.id == params.id);
    if (existing) { setApp(existing); setLoadingApp(false); return; }
    try {
      const res = await apiService.get(`/applications/${params.id}`);
      setApp(res.data?.data ?? res.data);
    } catch { setError('Failed to load application details'); }
    finally { setLoadingApp(false); }
  }, [applications, params.id]);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchApplications();
    }
  }, [status, session?.user?.id, fetchApplications]);

  useEffect(() => {
    if (status === 'authenticated' && params.id) loadDetail();
  }, [status, params.id, loadDetail]);

  const handleStatusChange = (newStatus) => {
    if (!window.confirm(`${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} this application?`)) return;
    updateApplicationStatus(params.id, newStatus);
    setNotice(`Application ${newStatus}.`);
    setTimeout(() => loadDetail(), 800);
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this application? This cannot be undone.')) return;
    deleteApplication(params.id);
    setNotice('Application deleted.');
    setTimeout(() => router.push('/admin/dashboard/applications'), 1500);
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(`${API_URL}/applications/${params.id}/download`, {
        headers: { 'Authorization': `Bearer ${session?.accessToken}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `application_${params.id}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setNotice('PDF downloaded.');
    } catch { setError('Failed to download application PDF.'); }
  };

  if (status === 'loading' || permLoading || loadingApp) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (error || !app) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error || 'Application not found.'}</div>
        <Link href="/admin/dashboard/applications" className={`${s.btn} ${s.btnOutline}`}><i className="fas fa-arrow-left" />Back to Applications</Link>
      </div>
    );
  }

  const statusCfg = STATUS_BADGE[app.status] ?? { cls: s.badgeInfo, label: app.status };

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-file-alt" /></span>
            Application Details
          </h1>
          <p className={s.pageSub}>{app.applicant_name || 'Unknown Applicant'} — {app.schema_display_name || app.schema_name || 'N/A'}</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/applications" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Applications
          </Link>
          {hasPermission('application.update') && (
            <Link href={`/admin/dashboard/applications/${params.id}/edit`} className={`${s.btn} ${s.btnPrimary}`}>
              <i className="fas fa-edit" />Edit
            </Link>
          )}
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}<button onClick={() => setNotice('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#059669' }}><i className="fas fa-times" /></button></div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

        {/* Main info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader} style={{ justifyContent: 'space-between' }}>
              <span className={s.cardTitle}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <i className="fas fa-id-card" style={{ fontSize: '0.75rem' }} />
                </span>
                Application Information
              </span>
              <span className={`${s.badge} ${statusCfg.cls}`}>{statusCfg.label}</span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                {[
                  { label: 'App Number',     value: <code style={{ background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.82rem', color: '#2563eb' }}>{app.application_number || `APP-${app.id}`}</code> },
                  { label: 'Program',        value: app.schema_display_name || app.schema_name || 'N/A' },
                  { label: 'Applicant',      value: app.applicant_name || 'Unknown' },
                  { label: 'Email',          value: app.applicant_email || '—' },
                  { label: 'Phone',          value: app.phone || '—' },
                  { label: 'Date of Birth',  value: app.date_of_birth ? new Date(app.date_of_birth).toLocaleDateString() : '—' },
                  { label: 'App Fee',        value: app.application_fee ? `₦${parseFloat(app.application_fee).toLocaleString()}` : '—' },
                  { label: 'Payment',        value: <span className={`${s.badge} ${app.payment_status === 'paid' ? s.badgePaid : s.badgePending}`}>{app.payment_status || 'pending'}</span> },
                ].map(row => (
                  <div key={row.label} className={s.infoRow} style={{ gridColumn: 'span 1' }}>
                    <span className={s.infoLabel}>{row.label}</span>
                    <span className={s.infoValue}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {(app.address || app.notes || app.custom_data) && (
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#fef3c7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                    <i className="fas fa-info" style={{ fontSize: '0.75rem' }} />
                  </span>
                  Additional Information
                </span>
              </div>
              <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
                {app.address && (
                  <div className={s.infoRow}>
                    <span className={s.infoLabel}>Address</span>
                    <span className={s.infoValue}>{app.address}</span>
                  </div>
                )}
                {app.notes && (
                  <div className={s.infoRow}>
                    <span className={s.infoLabel}>Notes</span>
                    <span className={s.infoValue}>{app.notes}</span>
                  </div>
                )}
                {app.custom_data && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div className={s.infoLabel} style={{ marginBottom: '0.35rem' }}>Custom Data</div>
                    <pre style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 6, fontSize: '0.75rem', color: '#374151', overflowX: 'auto', margin: 0, border: '1px solid #e5e7eb' }}>
                      {JSON.stringify(app.custom_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-clock" style={{ color: '#0891b2' }} />Timeline</span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              {[
                { label: 'Submitted',    value: fmtDt(app.created_at) },
                { label: 'Last Updated', value: fmtDt(app.updated_at) },
                { label: 'Reviewed',     value: fmtDt(app.reviewed_at) },
                { label: 'Reviewed By',  value: app.reviewed_by_username || '—' },
              ].map(row => (
                <div key={row.label} className={s.infoRow}>
                  <span className={s.infoLabel}>{row.label}</span>
                  <span className={s.infoValue}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-bolt" style={{ color: '#d97706' }} />Actions</span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {hasPermission('application.update') && (app.status === 'pending' || app.status === 'submitted') && (
                <>
                  <button onClick={() => handleStatusChange('approved')} className={`${s.btn} ${s.btnGreen}`} style={{ justifyContent: 'flex-start' }}>
                    <i className="fas fa-check" />Approve Application
                  </button>
                  <button onClick={() => handleStatusChange('rejected')} className={`${s.btn} ${s.btnDanger}`} style={{ justifyContent: 'flex-start' }}>
                    <i className="fas fa-times" />Reject Application
                  </button>
                </>
              )}
              <button onClick={handleDownload} className={`${s.btn} ${s.btnOutline}`} style={{ justifyContent: 'flex-start' }}>
                <i className="fas fa-download" />Download PDF
              </button>
              {hasPermission('application.update') && (
                <Link href={`/admin/dashboard/applications/${params.id}/edit`} className={`${s.btn} ${s.btnPrimary}`} style={{ justifyContent: 'flex-start' }}>
                  <i className="fas fa-edit" />Edit Application
                </Link>
              )}
              {hasPermission('application.delete') && (
                <button onClick={handleDelete} className={`${s.btn} ${s.btnDanger}`} style={{ justifyContent: 'flex-start' }}>
                  <i className="fas fa-trash" />Delete Application
                </button>
              )}
              <Link href="/admin/dashboard/applications" className={`${s.btn} ${s.btnOutline}`} style={{ justifyContent: 'flex-start' }}>
                <i className="fas fa-arrow-left" />Back to List
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
