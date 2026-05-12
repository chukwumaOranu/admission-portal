'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

const EMPTY_SCHEMA = { schema_name: '', display_name: '', description: '', application_fee: 0, is_active: true };

export default function ApplicationSchemasPage() {
  const { data: session, status } = useSession();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const { schemas, loading, error: reduxError, fetchApplicationSchemas, createApplicationSchema, deleteApplicationSchema, updateApplicationSchema } = useApplications();

  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(EMPTY_SCHEMA);
  const [busy, setBusy]             = useState(false);
  const [notice, setNotice]         = useState('');
  const [error, setError]           = useState('');
  const loadedRef = useRef(false);

  const canCreate = hasPermission('application_schema.create');
  const canUpdate = hasPermission('application_schema.update');
  const canDelete = hasPermission('application_schema.delete');

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchApplicationSchemas();
    }
  }, [status, session?.user?.id, fetchApplicationSchemas]);

  const setField = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const openCreate = () => { setForm(EMPTY_SCHEMA); setError(''); setNotice(''); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!canCreate) { setError('No permission to create schemas'); return; }
    try {
      setBusy(true); setError(''); setNotice('');
      createApplicationSchema(form);
      setNotice('Application schema created successfully.');
      closeModal();
      fetchApplicationSchemas();
    } catch (err) { setError(err.message || 'Failed to create schema'); }
    finally { setBusy(false); }
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this application schema?')) return;
    deleteApplicationSchema(id);
    setNotice('Schema deleted.');
  };

  const handleToggle = (schema) => {
    updateApplicationSchema({ id: schema.id, is_active: !schema.is_active });
    setNotice(`Schema ${!schema.is_active ? 'activated' : 'deactivated'}.`);
  };

  if (status === 'loading' || permissionsLoading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('application_schema.read')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to view application schemas.</div>
      </div>
    );
  }

  const active   = schemas.filter(s => s.is_active).length;
  const inactive = schemas.filter(s => !s.is_active).length;
  const withFee  = schemas.filter(s => parseFloat(s.application_fee || 0) > 0).length;

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#ede9fe', color: '#7c3aed' }}><i className="fas fa-cogs" /></span>
            Application Schemas
          </h1>
          <p className={s.pageSub}>Define and manage application types for different admission programmes</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/applications" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Applications
          </Link>
          {canCreate && (
            <button onClick={openCreate} className={`${s.btn} ${s.btnPrimary}`}>
              <i className="fas fa-plus" />New Schema
            </button>
          )}
        </div>
      </div>

      {(error || reduxError) && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error || reduxError}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}<button onClick={() => setNotice('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#059669' }}><i className="fas fa-times" /></button></div>}

      {/* Stats */}
      <div className={s.statsGrid} style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total',    value: schemas.length, icon: 'fas fa-cogs',        color: '#7c3aed' },
          { label: 'Active',   value: active,         icon: 'fas fa-check-circle', color: '#059669' },
          { label: 'Inactive', value: inactive,       icon: 'fas fa-times-circle', color: '#dc2626' },
          { label: 'With Fee', value: withFee,        icon: 'fas fa-money-bill',   color: '#d97706' },
        ].map(st => (
          <div key={st.label} className={s.statCard} style={{ '--accent': st.color }}>
            <div className={s.statInfo}>
              <div className={s.statLabel}>{st.label}</div>
              <div className={s.statNumber} style={{ color: st.color }}>{st.value}</div>
            </div>
            <div className={s.statIcon} style={{ background: `${st.color}18`, color: st.color }}>
              <i className={st.icon} />
            </div>
          </div>
        ))}
      </div>

      {/* Schema cards */}
      {loading ? (
        <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>
      ) : schemas.length === 0 ? (
        <div className={s.card}>
          <div className={s.emptyState}>
            <div className={s.emptyIcon} style={{ background: '#ede9fe', color: '#7c3aed' }}><i className="fas fa-cogs" /></div>
            <div className={s.emptyTitle}>No Schemas Yet</div>
            <p className={s.emptySub}>Create your first application schema to define an admission type.</p>
            {canCreate && (
              <button onClick={openCreate} className={`${s.btn} ${s.btnPrimary}`}><i className="fas fa-plus" />New Schema</button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {schemas.map(schema => (
            <div key={schema.id} className={s.card} style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
              {/* Card header */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', flexShrink: 0 }}>
                    <i className="fas fa-cog" style={{ fontSize: '0.78rem' }} />
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
                  <i className="fas fa-tag" style={{ color: '#7c3aed', width: 14 }} />
                  <code style={{ background: '#f1f5f9', padding: '0.1rem 0.35rem', borderRadius: 4, fontSize: '0.78rem', color: '#374151' }}>{schema.schema_name}</code>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#6b7280' }}>
                  <i className="fas fa-money-bill" style={{ color: '#059669', width: 14 }} />
                  <span>₦{parseFloat(schema.application_fee || 0).toLocaleString()} application fee</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#6b7280' }}>
                  <i className="fas fa-calendar" style={{ color: '#0891b2', width: 14 }} />
                  <span>Created {new Date(schema.created_at).toLocaleDateString()}</span>
                </div>
                {schema.description && (
                  <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: '0.25rem 0 0', lineHeight: 1.5, borderTop: '1px solid #f0f4f8', paddingTop: '0.5rem' }}>
                    {schema.description}
                  </p>
                )}
              </div>

              {/* Card footer */}
              <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #f0f4f8', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <Link href={`/admin/dashboard/applications/schemas/${schema.id}/fields`} className={`${s.btn} ${s.btnGreen} ${s.btnSm}`} style={{ flex: 1, justifyContent: 'center' }}>
                  <i className="fas fa-list-ul" />Fields
                </Link>
                <Link href={`/admin/dashboard/applications/schemas/${schema.id}`} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}>
                  <i className="fas fa-eye" />View
                </Link>
                {canUpdate && (
                  <>
                    <Link href={`/admin/dashboard/applications/schemas/${schema.id}/edit`} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`}>
                      <i className="fas fa-edit" />Edit
                    </Link>
                    <button onClick={() => handleToggle(schema)} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} title={schema.is_active ? 'Deactivate' : 'Activate'}>
                      <i className={`fas fa-${schema.is_active ? 'pause' : 'play'}`} />
                    </button>
                  </>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(schema.id)} className={`${s.btnIcon} ${s.btnIconDanger}`} title="Delete">
                    <i className="fas fa-trash" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className={s.modalOverlay} onClick={closeModal}>
          <div className={s.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className={s.modalHeader}>
              <span className={s.modalTitle}><i className="fas fa-plus" style={{ color: '#7c3aed' }} />New Application Schema</span>
              <button className={s.modalClose} onClick={closeModal}><i className="fas fa-times" /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className={s.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label className={s.formLabel}>Schema Name *</label>
                    <input className={s.formInput} type="text" value={form.schema_name} onChange={e => setField('schema_name', e.target.value)} placeholder="undergraduate_application" required />
                  </div>
                  <div>
                    <label className={s.formLabel}>Display Name *</label>
                    <input className={s.formInput} type="text" value={form.display_name} onChange={e => setField('display_name', e.target.value)} placeholder="Undergraduate Application" required />
                  </div>
                </div>
                <div>
                  <label className={s.formLabel}>Description</label>
                  <textarea className={s.formInput} rows={3} value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Describe this application type..." style={{ resize: 'vertical' }} />
                </div>
                <div>
                  <label className={s.formLabel}>Application Fee (₦)</label>
                  <input className={s.formInput} type="number" value={form.application_fee} onChange={e => setField('application_fee', parseFloat(e.target.value) || 0)} min={0} step={0.01} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setField('is_active', e.target.checked)} style={{ width: 15, height: 15 }} />
                  Active (available for applications)
                </label>
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={`${s.btn} ${s.btnOutline}`} onClick={closeModal}>Cancel</button>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={busy}>
                  {busy ? <><span className="spinner-border spinner-border-sm" />Creating…</> : <><i className="fas fa-plus" />Create Schema</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
