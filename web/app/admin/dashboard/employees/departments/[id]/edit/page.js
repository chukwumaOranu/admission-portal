'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { API_ENDPOINTS, apiService } from '@/services/api';
import s from '@/styles/admin-portal.module.css';

export default function EditDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [notice, setNotice]   = useState('');
  const [formData, setFormData] = useState({ name: '', description: '' });
  const loadedRef = useRef(false);

  const fetchDepartment = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const res = await apiService.get(API_ENDPOINTS.DEPARTMENTS.GET_BY_ID(params.id));
      setFormData({ name: res.data.name || '', description: res.data.description || '' });
    } catch { setError('Failed to load department details'); }
    finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && params.id && !loadedRef.current) {
      loadedRef.current = true; fetchDepartment();
    }
  }, [status, session?.user?.id, params.id, fetchDepartment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Department name is required'); return; }
    try {
      setSaving(true); setError(''); setNotice('');
      await apiService.put(API_ENDPOINTS.DEPARTMENTS.UPDATE(params.id), formData);
      setNotice('Department updated successfully!');
      setTimeout(() => router.push(`/admin/dashboard/employees/departments/${params.id}`), 1500);
    } catch (err) {
      setError(err.message || 'Failed to update department');
    } finally { setSaving(false); }
  };

  if (status === 'loading' || permLoading || loading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('department.update')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to edit departments.</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#e0f2fe', color: '#0891b2' }}><i className="fas fa-building" /></span>
            Edit Department
          </h1>
          <p className={s.pageSub}>Update department information</p>
        </div>
        <div className={s.pageActions}>
          <Link href={`/admin/dashboard/employees/departments/${params.id}`} className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Back
          </Link>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

        <div className={s.card} style={{ marginBottom: 0 }}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>
              <span style={{ width: 28, height: 28, borderRadius: 6, background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2' }}>
                <i className="fas fa-building" style={{ fontSize: '0.75rem' }} />
              </span>
              Department Information
            </span>
          </div>
          <div className={s.cardBody} style={{ padding: '1.25rem' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className={s.formLabel}>Department Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="text" className={s.formInput} name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Human Resources" required disabled={saving} />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className={s.formLabel}>Description</label>
                <textarea className={s.formInput} name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Brief description of the department's role and responsibilities" style={{ resize: 'vertical' }} disabled={saving} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm" />Saving…</> : <><i className="fas fa-save" />Save Changes</>}
                </button>
                <Link href={`/admin/dashboard/employees/departments/${params.id}`} className={`${s.btn} ${s.btnOutline}`}>
                  <i className="fas fa-times" />Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2' }}>
                  <i className="fas fa-lightbulb" style={{ fontSize: '0.75rem' }} />
                </span>
                Tips
              </span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              <ul style={{ fontSize: '0.82rem', color: '#374151', paddingLeft: '1.1rem', lineHeight: 1.9, margin: 0 }}>
                <li>Name should be clear and descriptive</li>
                <li>Update description to reflect current responsibilities</li>
                <li>Changes take effect immediately</li>
              </ul>
            </div>
          </div>
          <div className={`${s.alert} ${s.alertInfo}`} style={{ margin: 0 }}>
            <i className="fas fa-info-circle" />
            <span style={{ fontSize: '0.78rem' }}>Renaming does not affect the department code or existing employee assignments.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
