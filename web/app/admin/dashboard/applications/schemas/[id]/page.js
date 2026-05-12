'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';
import s from '@/styles/admin-portal.module.css';

const fmtDt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function ViewApplicationSchemaPage() {
  const params = useParams();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { schemas, loading: reduxLoading, fetchApplicationSchemas } = useApplications();

  const [schema, setSchema] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const loadedRef = useRef(false);

  const fetchFields = useCallback(async () => {
    try {
      const res = await apiService.get(API_ENDPOINTS.APPLICATIONS.SCHEMAS.FIELDS.GET_ALL(params.id));
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setFields(data.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)));
    } catch { /* fields stay empty */ }
    finally { setLoading(false); }
  }, [params.id]);

  const fetchSchemaDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get(API_ENDPOINTS.APPLICATIONS.SCHEMAS.GET_BY_ID(params.id));
      const data = res.data?.schema ?? res.data?.data?.schema ?? res.data;
      setSchema(data);
      await fetchFields();
    } catch { setError('Failed to load schema details'); setLoading(false); }
  }, [params.id, fetchFields]);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true;
      if (schemas.length === 0) fetchApplicationSchemas();
    }
  }, [status, session?.user?.id, schemas.length, fetchApplicationSchemas]);

  useEffect(() => {
    if (!params.id) return;
    if (schemas.length > 0) {
      const found = schemas.find(s => s.id === parseInt(params.id));
      if (found) { setSchema(found); fetchFields(); return; }
    }
    if (!reduxLoading) fetchSchemaDetails();
  }, [params.id, schemas, reduxLoading, fetchSchemaDetails, fetchFields]);

  const required = fields.filter(f => f.is_required).length;

  if (status === 'loading' || permLoading || loading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (error || !schema) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error || 'Schema not found.'}</div>
        <Link href="/admin/dashboard/applications/schemas" className={`${s.btn} ${s.btnOutline}`}><i className="fas fa-arrow-left" />Back to Schemas</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-file-alt" /></span>
            Application Schema Details
          </h1>
          <p className={s.pageSub}>{schema.display_name || schema.schema_name}</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/applications/schemas" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Schemas
          </Link>
          <Link href={`/admin/dashboard/applications/schemas/${params.id}/fields`} className={`${s.btn} ${s.btnGreen}`}>
            <i className="fas fa-list-ul" />Fields
          </Link>
          {hasPermission('application_schema.update') && (
            <Link href={`/admin/dashboard/applications/schemas/${params.id}/edit`} className={`${s.btn} ${s.btnPrimary}`}>
              <i className="fas fa-edit" />Edit
            </Link>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Schema info */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <i className="fas fa-info-circle" style={{ fontSize: '0.75rem' }} />
                </span>
                Schema Information
              </span>
              <span className={`${s.badge} ${schema.is_active ? s.badgeActive : s.badgeInactive}`}>{schema.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              {[
                { label: 'Schema Name',    value: <code style={{ background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.82rem' }}>{schema.schema_name}</code> },
                { label: 'Display Name',   value: schema.display_name || '—' },
                { label: 'Description',    value: schema.description || 'No description' },
                { label: 'Application Fee', value: <strong style={{ color: '#059669' }}>₦{parseFloat(schema.application_fee || 0).toLocaleString()}</strong> },
                { label: 'Created By',     value: schema.created_by_username || 'System' },
                { label: 'Created',        value: fmtDt(schema.created_at) },
                { label: 'Updated',        value: fmtDt(schema.updated_at) },
              ].map(row => (
                <div key={row.label} className={s.infoRow}>
                  <span className={s.infoLabel}>{row.label}</span>
                  <span className={s.infoValue}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fields table */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader} style={{ justifyContent: 'space-between' }}>
              <span className={s.cardTitle}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: '#d1fae5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <i className="fas fa-list-ul" style={{ fontSize: '0.75rem' }} />
                </span>
                Form Fields ({fields.length})
              </span>
              <Link href={`/admin/dashboard/applications/schemas/${params.id}/fields`} className={`${s.btn} ${s.btnGreen} ${s.btnSm}`}>
                <i className="fas fa-cog" />Manage
              </Link>
            </div>

            {fields.length === 0 ? (
              <div className={s.emptyState}>
                <div className={s.emptyIcon} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-inbox" /></div>
                <div className={s.emptyTitle}>No Fields Added Yet</div>
                <p className={s.emptySub}>Add fields to define the application form structure.</p>
                <Link href={`/admin/dashboard/applications/schemas/${params.id}/fields`} className={`${s.btn} ${s.btnGreen}`}><i className="fas fa-plus" />Add Fields</Link>
              </div>
            ) : (
              <>
                <div className={s.tableWrap}>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Field Name</th>
                        <th>Label</th>
                        <th>Type</th>
                        <th style={{ paddingRight: '1.25rem' }}>Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, i) => (
                        <tr key={field.id}>
                          <td><span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>{i + 1}</span></td>
                          <td><code style={{ background: '#f1f5f9', padding: '0.1rem 0.35rem', borderRadius: 4, fontSize: '0.78rem', color: '#374151' }}>{field.field_name}</code></td>
                          <td><span style={{ fontSize: '0.82rem', color: '#374151' }}>{field.field_label}</span></td>
                          <td><span className={`${s.badge} ${s.badgeInfo}`}>{field.field_type}</span></td>
                          <td style={{ paddingRight: '1.25rem' }}>
                            {field.is_required
                              ? <span className={`${s.badge} ${s.badgeActive}`}>Required</span>
                              : <span className={`${s.badge} ${s.badgeInactive}`}>Optional</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={s.mobileList}>
                  {fields.map((field) => (
                    <div key={field.id} className={s.mobileCard}>
                      <div className={s.mobileCardHead}>
                        <span className={s.tdName}>{field.field_label}</span>
                        <span className={`${s.badge} ${s.badgeInfo}`}>{field.field_type}</span>
                      </div>
                      <div className={s.mobileCardBody}>
                        <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Name</span><span className={s.mobileCardVal}><code style={{ fontSize: '0.78rem' }}>{field.field_name}</code></span></div>
                        <div className={s.mobileCardRow}><span className={s.mobileCardKey}>Required</span><span className={s.mobileCardVal}>{field.is_required ? 'Yes' : 'No'}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-chart-bar" style={{ color: '#2563eb' }} />Statistics</span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              {[
                { label: 'Total Fields',    value: fields.length,             color: '#2563eb' },
                { label: 'Required Fields', value: required,                   color: '#dc2626' },
                { label: 'Optional Fields', value: fields.length - required,  color: '#059669' },
              ].map(st => (
                <div key={st.label} className={s.infoRow}>
                  <span className={s.infoLabel}>{st.label}</span>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: st.color }}>{st.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-bolt" style={{ color: '#d97706' }} />Quick Actions</span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link href={`/admin/dashboard/applications/schemas/${params.id}/fields`} className={`${s.btn} ${s.btnGreen}`} style={{ justifyContent: 'flex-start' }}>
                <i className="fas fa-list-ul" />Manage Fields
              </Link>
              {hasPermission('application_schema.update') && (
                <Link href={`/admin/dashboard/applications/schemas/${params.id}/edit`} className={`${s.btn} ${s.btnPrimary}`} style={{ justifyContent: 'flex-start' }}>
                  <i className="fas fa-edit" />Edit Schema
                </Link>
              )}
              <Link href="/admin/dashboard/applications/schemas" className={`${s.btn} ${s.btnOutline}`} style={{ justifyContent: 'flex-start' }}>
                <i className="fas fa-arrow-left" />Back to List
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
