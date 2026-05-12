'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useEmployees, useEmployeeSchemaActions } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

const FIELD_TYPES = ['text', 'email', 'number', 'date', 'datetime', 'time', 'textarea', 'select', 'checkbox', 'radio', 'file', 'url', 'phone'];

export default function EditEmployeeSchemaPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();

  const { currentSchema, schemaFields, loading, fetchEmployeeSchemas, getEmployeeSchemaById, getEmployeeSchemaFields } = useEmployees();
  const { updateEmployeeSchema, deleteEmployeeSchema, addEmployeeSchemaField, updateEmployeeSchemaField, deleteEmployeeSchemaField } = useEmployeeSchemaActions();

  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [notice, setNotice]       = useState('');
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField]     = useState(null);
  const loadedRef = useRef(false);

  const [formData, setFormData] = useState({ schema_name: '', display_name: '', description: '', is_active: true });
  const [fieldForm, setFieldForm] = useState({
    field_name: '', field_label: '', field_type: 'text', field_options: '',
    is_required: false, validation_rules: '', display_order: 0,
  });

  useEffect(() => {
    if (status === 'authenticated' && !loadedRef.current) {
      loadedRef.current = true; fetchEmployeeSchemas();
    }
  }, [status, fetchEmployeeSchemas]);

  useEffect(() => {
    if (params.id) { getEmployeeSchemaById(params.id); getEmployeeSchemaFields(params.id); }
  }, [params.id, getEmployeeSchemaById, getEmployeeSchemaFields]);

  useEffect(() => {
    if (currentSchema) {
      setFormData({
        schema_name:  currentSchema.schema_name || '',
        display_name: currentSchema.display_name || '',
        description:  currentSchema.description || '',
        is_active:    currentSchema.is_active !== undefined ? currentSchema.is_active : true,
      });
    }
  }, [currentSchema]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setNotice('');
    updateEmployeeSchema(params.id, formData);
    setNotice('Schema updated successfully!');
    setTimeout(() => router.push('/admin/dashboard/employees/schemas'), 1500);
    setSaving(false);
  };

  const handleDeleteSchema = () => {
    if (!window.confirm('Delete this schema? This cannot be undone.')) return;
    deleteEmployeeSchema(params.id);
    router.push('/admin/dashboard/employees/schemas');
  };

  const openAddField = () => {
    setFieldForm({ field_name: '', field_label: '', field_type: 'text', field_options: '', is_required: false, validation_rules: '', display_order: schemaFields.length });
    setEditingField(null); setShowFieldModal(true);
  };

  const openEditField = (field) => {
    setFieldForm({
      field_name:        field.field_name,
      field_label:       field.field_label,
      field_type:        field.field_type,
      field_options:     field.field_options ? JSON.stringify(field.field_options) : '',
      is_required:       field.is_required,
      validation_rules:  field.validation_rules ? JSON.stringify(field.validation_rules) : '',
      display_order:     field.display_order,
    });
    setEditingField(field); setShowFieldModal(true);
  };

  const handleFieldSubmit = (e) => {
    e.preventDefault();
    try {
      const fieldData = {
        ...fieldForm,
        field_options:    fieldForm.field_options    ? JSON.parse(fieldForm.field_options)    : null,
        validation_rules: fieldForm.validation_rules ? JSON.parse(fieldForm.validation_rules) : null,
      };
      if (editingField) updateEmployeeSchemaField(params.id, editingField.id, fieldData);
      else              addEmployeeSchemaField(params.id, fieldData);
      setShowFieldModal(false); getEmployeeSchemaFields(params.id);
    } catch { setError('Invalid JSON in field options or validation rules.'); }
  };

  const handleDeleteField = (fieldId) => {
    if (!window.confirm('Delete this field?')) return;
    deleteEmployeeSchemaField(params.id, fieldId);
    getEmployeeSchemaFields(params.id);
  };

  if (status === 'loading' || permLoading || loading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('employee_schema.update')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to edit employee schemas.</div>
        <Link href="/admin/dashboard/employees/schemas" className={`${s.btn} ${s.btnOutline}`} style={{ marginTop: '0.75rem' }}><i className="fas fa-arrow-left" />Back to Schemas</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#e0f2fe', color: '#0891b2' }}><i className="fas fa-database" /></span>
            Edit Employee Schema
          </h1>
          <p className={s.pageSub}>Modify schema information and manage custom fields</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/employees/schemas" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Schemas
          </Link>
          {hasPermission('employee_schema.delete') && (
            <button onClick={handleDeleteSchema} className={`${s.btn} ${s.btnDanger}`}>
              <i className="fas fa-trash" />Delete
            </button>
          )}
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

        {/* Schema Info Form */}
        <div className={s.card} style={{ marginBottom: 0 }}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>
              <span style={{ width: 28, height: 28, borderRadius: 6, background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2' }}>
                <i className="fas fa-info-circle" style={{ fontSize: '0.75rem' }} />
              </span>
              Schema Information
            </span>
          </div>
          <div className={s.cardBody} style={{ padding: '1.25rem' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className={s.formLabel}>Schema Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="text" className={s.formInput} name="schema_name" value={formData.schema_name} onChange={handleChange} required disabled={saving} />
                </div>
                <div>
                  <label className={s.formLabel}>Display Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="text" className={s.formInput} name="display_name" value={formData.display_name} onChange={handleChange} required disabled={saving} />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className={s.formLabel}>Description</label>
                <textarea className={s.formInput} name="description" value={formData.description} onChange={handleChange} rows={3} style={{ resize: 'vertical' }} disabled={saving} />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} style={{ width: 15, height: 15, accentColor: '#059669' }} disabled={saving} />
                  Active Schema
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm" />Updating…</> : <><i className="fas fa-save" />Update Schema</>}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Custom Fields */}
        <div className={s.card} style={{ marginBottom: 0 }}>
          <div className={s.cardHeader}>
            <span className={s.cardTitle}>
              <span style={{ width: 28, height: 28, borderRadius: 6, background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2' }}>
                <i className="fas fa-list-ul" style={{ fontSize: '0.75rem' }} />
              </span>
              Custom Fields
            </span>
            <button onClick={openAddField} className={`${s.btn} ${s.btnPrimary} ${s.btnSm}`}>
              <i className="fas fa-plus" />Add Field
            </button>
          </div>
          <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
            {schemaFields.length === 0 ? (
              <div className={s.emptyState} style={{ padding: '1.5rem 0' }}>
                <div className={s.emptyIcon}><i className="fas fa-list-ul" /></div>
                <div className={s.emptyTitle}>No Custom Fields</div>
                <p className={s.emptySub}>Add fields to capture additional employee information.</p>
                <button onClick={openAddField} className={`${s.btn} ${s.btnPrimary}`}><i className="fas fa-plus" />Add First Field</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {schemaFields.map(field => (
                  <div key={field.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.875rem', color: '#1e293b' }}>{field.field_label}</strong>
                        <span className={`${s.badge} ${s.badgeInfo}`}>{field.field_type}</span>
                        {field.is_required && <span className={`${s.badge} ${s.badgePending}`}>Required</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.1rem' }}>{field.field_name}</div>
                    </div>
                    <div className={s.actionBtns}>
                      <button onClick={() => openEditField(field)} className={s.btnIcon} title="Edit"><i className="fas fa-edit" /></button>
                      <button onClick={() => handleDeleteField(field.id)} className={s.btnIconDanger} title="Delete"><i className="fas fa-trash" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Field Modal Overlay */}
      {showFieldModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e3a5f' }}>
                {editingField ? 'Edit Field' : 'Add New Field'}
              </h3>
              <button onClick={() => setShowFieldModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#9ca3af', padding: '0.25rem' }}>
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleFieldSubmit}>
              <div style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className={s.formLabel}>Field Name <span style={{ color: '#dc2626' }}>*</span></label>
                    <input type="text" className={s.formInput} value={fieldForm.field_name} onChange={e => setFieldForm(p => ({ ...p, field_name: e.target.value }))} required placeholder="e.g., emergency_contact" />
                  </div>
                  <div>
                    <label className={s.formLabel}>Field Label <span style={{ color: '#dc2626' }}>*</span></label>
                    <input type="text" className={s.formInput} value={fieldForm.field_label} onChange={e => setFieldForm(p => ({ ...p, field_label: e.target.value }))} required placeholder="e.g., Emergency Contact" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className={s.formLabel}>Field Type <span style={{ color: '#dc2626' }}>*</span></label>
                    <select className={s.formSelect} value={fieldForm.field_type} onChange={e => setFieldForm(p => ({ ...p, field_type: e.target.value }))} required>
                      {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={s.formLabel}>Display Order</label>
                    <input type="number" className={s.formInput} value={fieldForm.display_order} onChange={e => setFieldForm(p => ({ ...p, display_order: parseInt(e.target.value) }))} min="0" />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className={s.formLabel}>Field Options (JSON)</label>
                  <textarea className={s.formInput} value={fieldForm.field_options} onChange={e => setFieldForm(p => ({ ...p, field_options: e.target.value }))} rows={3} placeholder={'{"options": ["Option 1", "Option 2"]}'} style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.82rem' }} />
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>For select, radio, checkbox fields</p>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className={s.formLabel}>Validation Rules (JSON)</label>
                  <textarea className={s.formInput} value={fieldForm.validation_rules} onChange={e => setFieldForm(p => ({ ...p, validation_rules: e.target.value }))} rows={2} placeholder={'{"min": 0, "max": 100}'} style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.82rem' }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                  <input type="checkbox" checked={fieldForm.is_required} onChange={e => setFieldForm(p => ({ ...p, is_required: e.target.checked }))} style={{ width: 15, height: 15, accentColor: '#2563eb' }} />
                  Required Field
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" className={`${s.btn} ${s.btnOutline}`} onClick={() => setShowFieldModal(false)}>
                  <i className="fas fa-times" />Cancel
                </button>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`}>
                  <i className={`fas ${editingField ? 'fa-save' : 'fa-plus'}`} />{editingField ? 'Update Field' : 'Add Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
