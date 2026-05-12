'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';
import s from '@/styles/admin-portal.module.css';

export default function EditApplicationSchemaPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { schemas, loading: reduxLoading, fetchApplicationSchemas, updateApplicationSchema } = useApplications();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [notice, setNotice]   = useState('');
  const loadedRef = useRef(false);

  const [formData, setFormData] = useState({
    schema_name: '', display_name: '', description: '', application_fee: 0, is_active: true,
  });

  const fetchSchema = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const res = await apiService.get(API_ENDPOINTS.APPLICATIONS.SCHEMAS.GET_BY_ID(params.id));
      const sc = res.data?.schema || res.data?.data?.schema || res.data;
      if (!sc) { setError('Schema not found'); return; }
      setFormData({
        schema_name:      sc.schema_name || '',
        display_name:     sc.display_name || '',
        description:      sc.description || '',
        application_fee:  sc.application_fee || 0,
        is_active:        Boolean(sc.is_active),
      });
    } catch { setError('Failed to load schema'); }
    finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true;
      if (schemas.length === 0) fetchApplicationSchemas();
    }
  }, [status, session?.user?.id, schemas.length, fetchApplicationSchemas]);

  useEffect(() => {
    if (params.id && schemas.length > 0) {
      const found = schemas.find(sc => sc.id === parseInt(params.id, 10));
      if (found) {
        setFormData({
          schema_name:     found.schema_name || '',
          display_name:    found.display_name || '',
          description:     found.description || '',
          application_fee: found.application_fee || 0,
          is_active:       Boolean(found.is_active),
        });
        setLoading(false);
      } else if (!reduxLoading) { fetchSchema(); }
    } else if (params.id && !reduxLoading) { fetchSchema(); }
  }, [params.id, schemas, reduxLoading, fetchSchema]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setNotice('');
    updateApplicationSchema(params.id, formData);
    setNotice('Schema updated successfully!');
    setTimeout(() => router.push(`/admin/dashboard/applications/schemas/${params.id}`), 1500);
    setSaving(false);
  };

  if (status === 'loading' || permLoading || loading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('application_schema.update')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to edit application schemas.</div>
        <Link href={`/admin/dashboard/applications/schemas/${params.id}`} className={`${s.btn} ${s.btnOutline}`} style={{ marginTop: '0.75rem' }}><i className="fas fa-arrow-left" />Back</Link>
      </div>
    );
  }

  if (error && !formData.schema_name) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}</div>
        <Link href="/admin/dashboard/applications/schemas" className={`${s.btn} ${s.btnOutline}`} style={{ marginTop: '0.75rem' }}><i className="fas fa-arrow-left" />Back to Schemas</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-edit" /></span>
            Edit Application Schema
          </h1>
          <p className={s.pageSub}>Update schema information</p>
        </div>
        <div className={s.pageActions}>
          <Link href={`/admin/dashboard/applications/schemas/${params.id}`} className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Back
          </Link>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <i className="fas fa-file-alt" style={{ fontSize: '0.75rem' }} />
                </span>
                Schema Details
              </span>
            </div>
            <div className={s.cardBody} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className={s.formLabel}>Schema Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="text" className={s.formInput} name="schema_name" value={formData.schema_name} onChange={handleChange} required placeholder="e.g., primary_admission_2025" disabled={saving} />
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>Lowercase, underscores only</p>
                </div>
                <div>
                  <label className={s.formLabel}>Display Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="text" className={s.formInput} name="display_name" value={formData.display_name} onChange={handleChange} required placeholder="e.g., Primary Admission 2025" disabled={saving} />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className={s.formLabel}>Description</label>
                <textarea className={s.formInput} name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Describe this application program…" style={{ resize: 'vertical' }} disabled={saving} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className={s.formLabel}>Application Fee (₦) <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="number" className={s.formInput} name="application_fee" value={formData.application_fee} onChange={handleChange} required min="0" step="100" disabled={saving} />
                </div>
                <div>
                  <label className={s.formLabel}>Status</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', cursor: 'pointer', fontSize: '0.875rem', color: '#374151' }}>
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} style={{ width: 15, height: 15, accentColor: '#059669' }} disabled={saving} />
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </label>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>{formData.is_active ? 'Students can apply with this schema' : 'Hidden from students'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm" />Updating…</> : <><i className="fas fa-save" />Update Schema</>}
                </button>
                <Link href={`/admin/dashboard/applications/schemas/${params.id}`} className={`${s.btn} ${s.btnOutline}`}>
                  <i className="fas fa-times" />Cancel
                </Link>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                    <i className="fas fa-lightbulb" style={{ fontSize: '0.75rem' }} />
                  </span>
                  Notes
                </span>
              </div>
              <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
                <ul style={{ fontSize: '0.82rem', color: '#374151', paddingLeft: '1.1rem', lineHeight: 1.9, margin: 0 }}>
                  <li>Changing schema name may affect existing applications</li>
                  <li>Deactivating hides the schema from students</li>
                  <li>Fee changes won&apos;t affect submitted applications</li>
                </ul>
              </div>
            </div>
            <div className={`${s.alert} ${s.alertInfo}`} style={{ margin: 0 }}>
              <i className="fas fa-cogs" />
              <span style={{ fontSize: '0.78rem' }}>To add or edit form fields, use the <Link href={`/admin/dashboard/applications/schemas/${params.id}/fields`} style={{ color: '#0891b2' }}>Manage Fields</Link> page.</span>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
