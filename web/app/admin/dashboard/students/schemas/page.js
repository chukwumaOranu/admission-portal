'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudents } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

export default function StudentSchemasPage() {
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { schemas: studentSchemas, loading, error, fetchStudentSchemas } = useStudents();
  const loadedRef = useRef(false);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchStudentSchemas();
    }
  }, [status, session?.user?.id, fetchStudentSchemas]);

  if (status === 'loading' || permLoading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('student_schema.read')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to view student schemas.</div>
      </div>
    );
  }

  const active   = studentSchemas.filter(s => s.is_active).length;
  const inactive = studentSchemas.filter(s => !s.is_active).length;

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#ede9fe', color: '#7c3aed' }}><i className="fas fa-th-list" /></span>
            Student Schemas
          </h1>
          <p className={s.pageSub}>Define student types and their custom profile fields</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/students" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Students
          </Link>
          {hasPermission('student_schema.create') && (
            <Link href="/admin/dashboard/students/schemas/add" className={`${s.btn} ${s.btnPrimary}`}>
              <i className="fas fa-plus" />Add Schema
            </Link>
          )}
        </div>
      </div>

      {error && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}</div>}

      {/* Info banner */}
      <div className={`${s.alert} ${s.alertInfo}`} style={{ marginBottom: '1.5rem' }}>
        <i className="fas fa-info-circle" />
        <span>Student schemas define types (e.g., Undergraduate, Postgraduate). Each schema can have custom fields specific to that student type.</span>
      </div>

      {/* Stats */}
      <div className={s.statsGrid} style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total',    value: studentSchemas.length, icon: 'fas fa-th-list',      color: '#7c3aed' },
          { label: 'Active',   value: active,                icon: 'fas fa-check-circle', color: '#059669' },
          { label: 'Inactive', value: inactive,              icon: 'fas fa-pause-circle', color: '#64748b' },
        ].map(st => (
          <div key={st.label} className={s.statCard} style={{ '--accent': st.color, cursor: 'default' }}>
            <div className={s.statInfo}>
              <div className={s.statLabel}>{st.label}</div>
              <div className={s.statNumber} style={{ color: st.color }}>{st.value}</div>
            </div>
            <div className={s.statIcon} style={{ background: `${st.color}18`, color: st.color }}><i className={st.icon} /></div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>
      ) : studentSchemas.length === 0 ? (
        <div className={s.card}>
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#ede9fe', color: '#7c3aed' }}><i className="fas fa-th-list" /></div>
            <div className={s.emptyTitle}>No Schemas Found</div>
            <p className={s.emptySub}>Add your first student schema to define student types and fields.</p>
            {hasPermission('student_schema.create') && (
              <Link href="/admin/dashboard/students/schemas/add" className={`${s.btn} ${s.btnPrimary}`}><i className="fas fa-plus" />Add Schema</Link>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.25rem' }}>
          {studentSchemas.map(schema => (
            <div key={schema.id} className={s.card} style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', flexShrink: 0 }}>
                    <i className="fas fa-graduation-cap" style={{ fontSize: '0.75rem' }} />
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e3a5f' }}>{schema.display_name || schema.schema_name}</span>
                </div>
                <span className={`${s.badge} ${schema.is_active ? s.badgeActive : s.badgeInactive}`}>
                  {schema.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: '0.875rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#6b7280' }}>
                  <i className="fas fa-tag" style={{ color: '#7c3aed', width: 14 }} />
                  <code style={{ background: '#f1f5f9', padding: '0.1rem 0.35rem', borderRadius: 4, fontSize: '0.78rem', color: '#374151' }}>{schema.schema_name}</code>
                </div>
                {schema.description && (
                  <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: '0.25rem 0 0', lineHeight: 1.5 }}>{schema.description}</p>
                )}
                {schema.created_by_username && (
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    <i className="fas fa-user" style={{ marginRight: '0.3rem' }} />by {schema.created_by_username}
                  </div>
                )}
                <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                  <i className="fas fa-calendar" style={{ marginRight: '0.3rem' }} />
                  {schema.created_at ? new Date(schema.created_at).toLocaleDateString() : '—'}
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #f0f4f8', display: 'flex', gap: '0.4rem' }}>
                <Link href={`/admin/dashboard/students/schemas/${schema.id}`} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}>
                  <i className="fas fa-eye" />View
                </Link>
                {hasPermission('student_schema.update') && (
                  <>
                    <Link href={`/admin/dashboard/students/schemas/${schema.id}/edit`} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} style={{ flex: 1, justifyContent: 'center' }}>
                      <i className="fas fa-edit" />Edit
                    </Link>
                    <Link href={`/admin/dashboard/students/schemas/${schema.id}/fields`} className={`${s.btn} ${s.btnGreen} ${s.btnSm}`}>
                      <i className="fas fa-list-ul" />Fields
                    </Link>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
