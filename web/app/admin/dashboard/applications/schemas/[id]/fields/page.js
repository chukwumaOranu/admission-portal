'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';
import s from '@/styles/admin-portal.module.css';

const FIELD_TYPES = [
  { value: 'text',     label: 'Text Input',   icon: 'fa-font' },
  { value: 'textarea', label: 'Text Area',     icon: 'fa-align-left' },
  { value: 'number',   label: 'Number',        icon: 'fa-hashtag' },
  { value: 'email',    label: 'Email',         icon: 'fa-envelope' },
  { value: 'phone',    label: 'Phone',         icon: 'fa-phone' },
  { value: 'date',     label: 'Date',          icon: 'fa-calendar' },
  { value: 'select',   label: 'Dropdown',      icon: 'fa-list' },
  { value: 'radio',    label: 'Radio Buttons', icon: 'fa-dot-circle' },
  { value: 'checkbox', label: 'Checkbox',      icon: 'fa-check-square' },
  { value: 'file',     label: 'File Upload',   icon: 'fa-upload' },
];

const BLANK_FIELD = { field_name: '', field_type: 'text', field_label: '', placeholder: '', is_required: false, field_options: '', display_order: 0 };

export default function SchemaFieldsPage() {
  const params = useParams();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { schemas, loading: reduxLoading, fetchApplicationSchemas } = useApplications();
  const loadedRef = useRef(false);

  const [schema, setSchema]             = useState(null);
  const [fields, setFields]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [notice, setNotice]             = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData]         = useState(BLANK_FIELD);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true;
      if (schemas.length === 0) fetchApplicationSchemas();
    }
  }, [status, session?.user?.id, schemas.length, fetchApplicationSchemas]);

  const fetchFields = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get(API_ENDPOINTS.APPLICATIONS.SCHEMAS.FIELDS.GET_ALL(params.id));
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setFields(data.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
      setError('');
    } catch { setError('Failed to load fields'); }
    finally { setLoading(false); }
  }, [params.id]);

  const fetchSchemaAndFields = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get(API_ENDPOINTS.APPLICATIONS.SCHEMAS.GET_BY_ID(params.id));
      setSchema(res.data?.schema || res.data?.data || res.data);
      await fetchFields();
    } catch { setError('Failed to load schema details'); }
    finally { setLoading(false); }
  }, [params.id, fetchFields]);

  useEffect(() => {
    if (params.id && schemas.length > 0) {
      const found = schemas.find(sc => sc.id === parseInt(params.id, 10));
      if (found) { setSchema(found); fetchFields(); }
      else if (!reduxLoading) fetchSchemaAndFields();
    } else if (params.id && !reduxLoading && status === 'authenticated') { fetchSchemaAndFields(); }
  }, [params.id, schemas, reduxLoading, status, fetchSchemaAndFields, fetchFields]);

  const openAdd = () => {
    setEditingField(null);
    const nextOrder = fields.length > 0 ? Math.max(...fields.map(f => f.display_order || 0)) + 1 : 1;
    setFormData({ ...BLANK_FIELD, display_order: nextOrder });
    setShowModal(true);
  };

  const openEdit = (field) => {
    setEditingField(field);
    setFormData({
      field_name:    field.field_name || '',
      field_type:    field.field_type || 'text',
      field_label:   field.field_label || '',
      placeholder:   field.placeholder || '',
      is_required:   Boolean(field.is_required),
      field_options: field.field_options || field.options || '',
      display_order: field.display_order || 0,
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmitField = async (e) => {
    e.preventDefault();
    try {
      setSaving(true); setError(''); setNotice('');
      if (editingField) {
        await apiService.put(API_ENDPOINTS.APPLICATIONS.SCHEMAS.FIELDS.UPDATE(params.id, editingField.id), formData);
        setNotice('Field updated successfully!');
      } else {
        await apiService.post(API_ENDPOINTS.APPLICATIONS.SCHEMAS.FIELDS.CREATE(params.id), formData);
        setNotice('Field added successfully!');
      }
      setShowModal(false);
      await fetchFields();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save field');
    } finally { setSaving(false); }
  };

  const handleDeleteField = async (fieldId) => {
    try {
      setSaving(true); setError(''); setNotice('');
      await apiService.delete(API_ENDPOINTS.APPLICATIONS.SCHEMAS.FIELDS.DELETE(params.id, fieldId));
      setNotice('Field deleted.');
      setConfirmDelete(null);
      await fetchFields();
    } catch { setError('Failed to delete field'); }
    finally { setSaving(false); }
  };

  const handleMoveField = async (fieldId, direction) => {
    const idx = fields.findIndex(f => f.id === fieldId);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= fields.length) return;

    const updated = [...fields];
    const tmp = updated[idx].display_order;
    updated[idx].display_order = updated[newIdx].display_order;
    updated[newIdx].display_order = tmp;

    try {
      setSaving(true);
      await Promise.all([
        apiService.put(API_ENDPOINTS.APPLICATIONS.SCHEMAS.FIELDS.UPDATE(params.id, updated[idx].id),    { display_order: updated[idx].display_order }),
        apiService.put(API_ENDPOINTS.APPLICATIONS.SCHEMAS.FIELDS.UPDATE(params.id, updated[newIdx].id), { display_order: updated[newIdx].display_order }),
      ]);
      await fetchFields();
    } catch { setError('Failed to reorder fields'); }
    finally { setSaving(false); }
  };

  const typeLabel = (val) => FIELD_TYPES.find(t => t.value === val)?.label || val;
  const typeIcon  = (val) => FIELD_TYPES.find(t => t.value === val)?.icon || 'fa-question';

  if (status === 'loading' || permLoading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('application_schema.update')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to manage application schema fields.</div>
        <Link href="/admin/dashboard/applications/schemas" className={`${s.btn} ${s.btnOutline}`} style={{ marginTop: '0.75rem' }}><i className="fas fa-arrow-left" />Back</Link>
      </div>
    );
  }

  if (error && !schema) {
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
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-list-ul" /></span>
            Manage Form Fields
          </h1>
          <p className={s.pageSub}>{schema?.display_name || schema?.schema_name || '…'}</p>
        </div>
        <div className={s.pageActions}>
          <Link href={`/admin/dashboard/applications/schemas/${params.id}`} className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Back
          </Link>
          {hasPermission('application_field.create') && (
            <button className={`${s.btn} ${s.btnPrimary}`} onClick={openAdd}>
              <i className="fas fa-plus" />Add Field
            </button>
          )}
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}<button onClick={() => setNotice('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#059669' }}><i className="fas fa-times" /></button></div>}

      {/* Schema info banner */}
      {schema && (
        <div className={s.card} style={{ marginBottom: '1.25rem' }}>
          <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.82rem', color: '#374151', margin: 0, flex: 1 }}>{schema.description || 'No description provided.'}</p>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.82rem', color: '#374151' }}><strong>Fee:</strong> ₦{parseFloat(schema.application_fee || 0).toLocaleString()}</span>
                <span className={`${s.badge} ${schema.is_active ? s.badgeActive : s.badgeInactive}`}>{schema.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardTitle}>
            <i className="fas fa-list" style={{ color: '#2563eb' }} />
            Form Fields <span style={{ fontWeight: 400, color: '#6b7280' }}>({fields.length})</span>
          </span>
        </div>
        <div className={s.cardBody} style={{ padding: 0 }}>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" />
            </div>
          ) : fields.length === 0 ? (
            <div className={s.emptyState}>
              <div className={s.emptyIcon}><i className="fas fa-inbox" /></div>
              <div className={s.emptyTitle}>No fields yet</div>
              <div className={s.emptySub}>Add custom fields to build your application form.</div>
              {hasPermission('application_field.create') && (
                <button className={`${s.btn} ${s.btnPrimary}`} onClick={openAdd} style={{ marginTop: '1rem' }}><i className="fas fa-plus" />Add First Field</button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th style={{ width: 90 }}>Order</th>
                      <th>Field Name</th>
                      <th>Label</th>
                      <th>Type</th>
                      <th>Required</th>
                      <th>Options</th>
                      <th style={{ width: 120 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => (
                      <tr key={field.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                            {index > 0 && (
                              <button onClick={() => handleMoveField(field.id, 'up')} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }} disabled={saving}><i className="fas fa-arrow-up" /></button>
                            )}
                            <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{field.display_order}</span>
                            {index < fields.length - 1 && (
                              <button onClick={() => handleMoveField(field.id, 'down')} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }} disabled={saving}><i className="fas fa-arrow-down" /></button>
                            )}
                          </div>
                        </td>
                        <td><code style={{ background: '#f1f5f9', padding: '0.1rem 0.35rem', borderRadius: 4, fontSize: '0.8rem', color: '#1e3a5f' }}>{field.field_name}</code></td>
                        <td>{field.field_label || field.label}</td>
                        <td>
                          <span className={`${s.badge} ${s.badgeInfo}`}>
                            <i className={`fas ${typeIcon(field.field_type)}`} style={{ marginRight: 4 }} />
                            {typeLabel(field.field_type)}
                          </span>
                        </td>
                        <td>
                          {field.is_required
                            ? <span className={`${s.badge} ${s.badgePending}`}><i className="fas fa-check" style={{ marginRight: 3 }} />Required</span>
                            : <span className={`${s.badge} ${s.badgeInactive}`}>Optional</span>}
                        </td>
                        <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#6b7280' }}>
                          {(() => { const opts = field.options || field.field_options; return opts ? opts.substring(0, 40) + (opts.length > 40 ? '…' : '') : '—'; })()}
                        </td>
                        <td>
                          <div className={s.actionBtns}>
                            {hasPermission('application_field.update') && (
                              <button className={s.btnIcon} onClick={() => openEdit(field)} title="Edit"><i className="fas fa-edit" /></button>
                            )}
                            {hasPermission('application_field.delete') && (
                              <button className={s.btnIconDanger} onClick={() => setConfirmDelete(field)} title="Delete"><i className="fas fa-trash" /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className={s.mobileList}>
                {fields.map((field, index) => (
                  <div key={field.id} className={s.mobileCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <code style={{ background: '#f1f5f9', padding: '0.1rem 0.35rem', borderRadius: 4, fontSize: '0.8rem', color: '#1e3a5f' }}>{field.field_name}</code>
                        <span style={{ marginLeft: 8, fontSize: '0.875rem', color: '#374151' }}>{field.field_label || field.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {index > 0 && <button onClick={() => handleMoveField(field.id, 'up')} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} disabled={saving}><i className="fas fa-arrow-up" /></button>}
                        {index < fields.length - 1 && <button onClick={() => handleMoveField(field.id, 'down')} className={`${s.btn} ${s.btnOutline} ${s.btnSm}`} disabled={saving}><i className="fas fa-arrow-down" /></button>}
                        {hasPermission('application_field.update') && <button className={s.btnIcon} onClick={() => openEdit(field)}><i className="fas fa-edit" /></button>}
                        {hasPermission('application_field.delete') && <button className={s.btnIconDanger} onClick={() => setConfirmDelete(field)}><i className="fas fa-trash" /></button>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className={`${s.badge} ${s.badgeInfo}`}><i className={`fas ${typeIcon(field.field_type)}`} style={{ marginRight: 4 }} />{typeLabel(field.field_type)}</span>
                      {field.is_required ? <span className={`${s.badge} ${s.badgePending}`}>Required</span> : <span className={`${s.badge} ${s.badgeInactive}`}>Optional</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add / Edit Field Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e3a5f', margin: 0 }}>
                <i className={`fas ${editingField ? 'fa-edit' : 'fa-plus-circle'}`} style={{ marginRight: 8, color: '#2563eb' }} />
                {editingField ? 'Edit Field' : 'Add New Field'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#6b7280' }}><i className="fas fa-times" /></button>
            </div>
            <form onSubmit={handleSubmitField}>
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className={s.formLabel}>Field Type <span style={{ color: '#dc2626' }}>*</span></label>
                    <select className={s.formSelect} name="field_type" value={formData.field_type} onChange={handleChange} required disabled={saving}>
                      {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={s.formLabel}>Field Name <span style={{ color: '#dc2626' }}>*</span></label>
                    <input type="text" className={s.formInput} name="field_name" value={formData.field_name} onChange={handleChange} required placeholder="e.g., previous_school" disabled={saving} />
                    <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>Lowercase, no spaces</p>
                  </div>
                </div>
                <div>
                  <label className={s.formLabel}>Label (Display Text) <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="text" className={s.formInput} name="field_label" value={formData.field_label} onChange={handleChange} required placeholder="e.g., Previous School Name" disabled={saving} />
                </div>
                <div>
                  <label className={s.formLabel}>Placeholder Text</label>
                  <input type="text" className={s.formInput} name="placeholder" value={formData.placeholder} onChange={handleChange} placeholder="e.g., Enter your previous school name" disabled={saving} />
                </div>
                {['select', 'radio', 'checkbox'].includes(formData.field_type) && (
                  <div>
                    <label className={s.formLabel}>Options <span style={{ color: '#dc2626' }}>*</span></label>
                    <textarea className={s.formInput} name="field_options" value={formData.field_options} onChange={handleChange} rows={3} required placeholder="Primary, JSS, SSS" style={{ resize: 'vertical' }} disabled={saving} />
                    <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>Comma-separated values</p>
                  </div>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#374151' }}>
                  <input type="checkbox" name="is_required" checked={formData.is_required} onChange={handleChange} style={{ width: 15, height: 15, accentColor: '#059669' }} disabled={saving} />
                  This field is required
                </label>

                {/* Live preview */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <i className="fas fa-eye" style={{ marginRight: 4 }} />Preview
                  </p>
                  <label className={s.formLabel}>
                    {formData.field_label || 'Field Label'}
                    {formData.is_required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
                  </label>
                  {formData.field_type === 'textarea' && <textarea className={s.formInput} placeholder={formData.placeholder} disabled rows={2} />}
                  {formData.field_type === 'select' && (
                    <select className={s.formSelect} disabled>
                      <option>{formData.placeholder || 'Select…'}</option>
                      {formData.field_options && formData.field_options.split(',').map((opt, i) => <option key={i}>{opt.trim()}</option>)}
                    </select>
                  )}
                  {['text', 'number', 'email', 'phone', 'date'].includes(formData.field_type) && (
                    <input type={formData.field_type === 'phone' ? 'tel' : formData.field_type} className={s.formInput} placeholder={formData.placeholder} disabled />
                  )}
                  {formData.field_type === 'file' && <input type="file" className={s.formInput} disabled />}
                  {formData.field_type === 'checkbox' && formData.field_options && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {formData.field_options.split(',').map((opt, i) => (
                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}><input type="checkbox" disabled />{opt.trim()}</label>
                      ))}
                    </div>
                  )}
                  {formData.field_type === 'radio' && formData.field_options && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {formData.field_options.split(',').map((opt, i) => (
                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}><input type="radio" name="preview" disabled />{opt.trim()}</label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className={`${s.btn} ${s.btnOutline}`} disabled={saving}><i className="fas fa-times" />Cancel</button>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm" />{editingField ? 'Updating…' : 'Adding…'}</>
                    : <><i className="fas fa-save" />{editingField ? 'Update Field' : 'Add Field'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 400, padding: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e3a5f', marginBottom: '0.75rem' }}>
              <i className="fas fa-trash" style={{ color: '#dc2626', marginRight: 8 }} />Delete Field
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1.25rem' }}>
              Delete <strong>{confirmDelete.field_label || confirmDelete.label}</strong>? This cannot be undone and may affect existing applications.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} className={`${s.btn} ${s.btnOutline}`} disabled={saving}><i className="fas fa-times" />Cancel</button>
              <button onClick={() => handleDeleteField(confirmDelete.id)} className={`${s.btn} ${s.btnDanger}`} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm" />Deleting…</> : <><i className="fas fa-trash" />Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
