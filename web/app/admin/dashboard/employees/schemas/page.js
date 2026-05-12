'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { API_ENDPOINTS, apiService } from '@/services/api';
import s from '@/styles/admin-portal.module.css';

export default function EmployeeSchemasPage() {
  const { data: session, status } = useSession();
  const [schemas, setSchemas]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [notice, setNotice]     = useState('');
  const loadedRef = useRef(false);

  const fetchSchemas = async () => {
    try {
      setLoading(true); setError('');
      const res = await apiService.get(API_ENDPOINTS.EMPLOYEES.SCHEMAS.GET_ALL);
      setSchemas(res.data.schemas || []);
    } catch { setError('Failed to load employee schemas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchSchemas();
    }
  }, [status, session?.user?.id]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee schema?')) return;
    try {
      await apiService.delete(`${API_ENDPOINTS.EMPLOYEES.SCHEMAS.GET_ALL}/${id}`);
      setNotice('Schema deleted.'); fetchSchemas();
    } catch { setError('Failed to delete schema'); }
  };

  if (status === 'loading') {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  const active   = schemas.filter(s => s.is_active).length;
  const inactive = schemas.filter(s => !s.is_active).length;

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#e0f2fe', color: '#0891b2' }}><i className="fas fa-database" /></span>
            Employee Schemas
          </h1>
          <p className={s.pageSub}>Define data structures for employee records</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/employees" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Employees
          </Link>
          <Link href="/admin/dashboard/employees/schemas/add" className={`${s.btn} ${s.btnPrimary}`}>
            <i className="fas fa-plus" />Add Schema
          </Link>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}<button onClick={() => setNotice('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#059669' }}><i className="fas fa-times" /></button></div>}

      {/* Stats */}
      <div className={s.statsGrid} style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total',    value: schemas.length, icon: 'fas fa-database',     color: '#0891b2' },
          { label: 'Active',   value: active,         icon: 'fas fa-check-circle', color: '#059669' },
          { label: 'Inactive', value: inactive,       icon: 'fas fa-times-circle', color: '#dc2626' },
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
      ) : schemas.length === 0 ? (
        <div className={s.card}>
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#e0f2fe', color: '#0891b2' }}><i className="fas fa-database" /></div>
            <div className={s.emptyTitle}>No Schemas Yet</div>
            <p className={s.emptySub}>Create your first employee schema to define data structures.</p>
            <Link href="/admin/dashboard/employees/schemas/add" className={`${s.btn} ${s.btnPrimary}`}><i className="fas fa-plus" />Add Schema</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {schemas.map(schema => (
            <div key={schema.id} className={s.card} style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
              {/* Card header */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2', flexShrink: 0 }}>
                    <i className="fas fa-database" style={{ fontSize: '0.75rem' }} />
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e3a5f' }}>{schema.display_name || schema.schema_name}</span>
                </div>
                <span className={`${s.badge} ${schema.is_active ? s.badgeActive : s.badgeInactive}`}>
                  {schema.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Card body */}
              <div style={{ padding: '0.875rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#6b7280' }}>
                  <i className="fas fa-tag" style={{ color: '#0891b2', width: 14 }} />
                  <code style={{ background: '#f1f5f9', padding: '0.1rem 0.35rem', borderRadius: 4, fontSize: '0.78rem', color: '#374151' }}>{schema.schema_name}</code>
                </div>
                {schema.description && (
                  <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: '0.25rem 0 0', lineHeight: 1.5 }}>{schema.description}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#9ca3af', marginTop: 'auto', paddingTop: '0.25rem' }}>
                  <i className="fas fa-calendar" />
                  {schema.created_at ? new Date(schema.created_at).toLocaleDateString() : '—'}
                </div>
              </div>

              {/* Card footer */}
              <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #f0f4f8', display: 'flex', gap: '0.4rem' }}>
                <Link href={`/admin/dashboard/employees/schemas/edit/${schema.id}`} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} style={{ flex: 1, justifyContent: 'center' }}>
                  <i className="fas fa-edit" />Edit
                </Link>
                <button onClick={() => handleDelete(schema.id)} className={`${s.btnIcon} ${s.btnIconDanger}`} title="Delete">
                  <i className="fas fa-trash" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
