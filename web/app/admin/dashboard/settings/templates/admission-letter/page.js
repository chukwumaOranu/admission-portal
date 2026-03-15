'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_ENDPOINTS, apiService } from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';

const defaultPlaceholders = [
  '{{reference}}',
  '{{issued_date}}',
  '{{student_name}}',
  '{{first_name}}',
  '{{last_name}}',
  '{{application_number}}',
  '{{student_email}}',
  '{{school_name}}',
  '{{school_address}}',
  '{{school_phone}}',
  '{{school_email}}'
];

export default function AdmissionLetterTemplatePage() {
  const { hasPermission } = usePermissions();
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({
    template_name: 'Admission Letter Template',
    subject: 'Provisional Admission Letter',
    text_body: ''
  });
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const canReadTemplates = hasPermission('settings.template.read');
  const canCreateTemplates = hasPermission('settings.template.create');
  const canUpdateTemplates = hasPermission('settings.template.update');
  const canActivateTemplates = hasPermission('settings.template.activate');
  const canPreviewTemplates = hasPermission('settings.template.preview');

  const loadTemplates = async () => {
    try {
      const [activeRes, listRes] = await Promise.all([
        apiService.get(API_ENDPOINTS.SETTINGS.TEMPLATES.ACTIVE('admission_letter')),
        apiService.get(`${API_ENDPOINTS.SETTINGS.TEMPLATES.LIST}?template_key=admission_letter`)
      ]);

      const active = activeRes.data || null;
      const all = listRes.data || [];
      setActiveTemplate(active);
      setTemplates(all);
      setSelectedTemplateId(active?.id || all?.[0]?.id || null);

      if (active) {
        setForm({
          template_name: active.template_name || 'Admission Letter Template',
          subject: active.subject || 'Provisional Admission Letter',
          text_body: active.text_body || ''
        });
      }
    } catch (loadError) {
      setError(loadError.message || 'Failed to load templates');
    }
  };

  useEffect(() => {
    if (canReadTemplates) {
      loadTemplates();
    }
  }, [canReadTemplates]);

  if (!canReadTemplates) {
    return (
      <div className="container-fluid">
        <div className="alert alert-warning mt-4">You do not have permission to view templates.</div>
      </div>
    );
  }

  const saveTemplate = async () => {
    if (!canCreateTemplates) {
      setError('You do not have permission to create templates');
      return;
    }

    try {
      setBusy(true);
      setError('');
      setNotice('');

      const created = await apiService.post(API_ENDPOINTS.SETTINGS.TEMPLATES.CREATE, {
        template_key: 'admission_letter',
        template_name: form.template_name,
        subject: form.subject,
        text_body: form.text_body,
        placeholders_json: defaultPlaceholders,
        is_active: true
      });

      setNotice(`Saved and activated template version ${created.data?.version || ''}`.trim());
      await loadTemplates();
    } catch (saveError) {
      setError(saveError.message || 'Failed to save template');
    } finally {
      setBusy(false);
    }
  };

  const updateCurrentTemplate = async () => {
    if (!canUpdateTemplates) {
      setError('You do not have permission to update templates');
      return;
    }

    try {
      if (!selectedTemplateId) {
        setError('Select a template version to update');
        return;
      }

      setBusy(true);
      setError('');
      setNotice('');

      await apiService.put(API_ENDPOINTS.SETTINGS.TEMPLATES.UPDATE(selectedTemplateId), {
        template_name: form.template_name,
        subject: form.subject,
        text_body: form.text_body,
        placeholders_json: defaultPlaceholders
      });

      setNotice('Template updated');
      await loadTemplates();
    } catch (updateError) {
      setError(updateError.message || 'Failed to update template');
    } finally {
      setBusy(false);
    }
  };

  const activateTemplate = async (id) => {
    if (!canActivateTemplates) {
      setError('You do not have permission to activate templates');
      return;
    }

    try {
      setBusy(true);
      setError('');
      setNotice('');
      await apiService.post(API_ENDPOINTS.SETTINGS.TEMPLATES.ACTIVATE(id));
      setNotice('Template activated');
      await loadTemplates();
    } catch (activateError) {
      setError(activateError.message || 'Failed to activate template');
    } finally {
      setBusy(false);
    }
  };

  const previewTemplate = async () => {
    if (!canPreviewTemplates) {
      setError('You do not have permission to preview templates');
      return;
    }

    try {
      setBusy(true);
      setError('');
      setNotice('');
      const variables = {
        reference: 'ADM-APP-001122',
        issued_date: new Date().toLocaleDateString(),
        student_name: 'Jane Doe',
        first_name: 'Jane',
        last_name: 'Doe',
        application_number: 'APP20260001',
        student_email: 'jane@example.com',
        school_name: 'Deepflux Academy',
        school_address: 'No 1 School Avenue',
        school_phone: '+2348000000000',
        school_email: 'admissions@school.com'
      };

      let rendered = form.text_body || '';
      Object.entries(variables).forEach(([key, value]) => {
        rendered = rendered.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value ?? ''));
      });

      setPreview(rendered);
    } catch (previewError) {
      setError(previewError.message || 'Failed to preview template');
    } finally {
      setBusy(false);
    }
  };

  const loadTemplateToEditor = (template) => {
    setSelectedTemplateId(template.id);
    setForm({
      template_name: template.template_name || '',
      subject: template.subject || '',
      text_body: template.text_body || ''
    });
    setNotice(`Loaded version ${template.version} into editor`);
    setError('');
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-file-signature text-primary me-2"></i>
            Admission Letter Template
          </h2>
          <p className="text-muted mb-0">Customize and save DB-driven admission letter template</p>
        </div>
        <Link href="/admin/dashboard/settings/school" className="btn btn-outline-secondary">
          Back to Settings
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Template Editor</h5>
              <div className="mb-3">
                <label className="form-label">Template Name</label>
                <input
                  className="form-control"
                  value={form.template_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, template_name: e.target.value }))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Subject</label>
                <input
                  className="form-control"
                  value={form.subject}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Text Body</label>
                <textarea
                  className="form-control"
                  rows={18}
                  value={form.text_body}
                  onChange={(e) => setForm((prev) => ({ ...prev, text_body: e.target.value }))}
                />
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary" disabled={busy || !selectedTemplateId || !canUpdateTemplates} onClick={updateCurrentTemplate}>
                  Save Changes to Selected Version
                </button>
                <button className="btn btn-primary" disabled={busy || !canCreateTemplates} onClick={saveTemplate}>
                  Save as New Version + Activate
                </button>
                <button className="btn btn-outline-primary" disabled={busy || !canPreviewTemplates} onClick={previewTemplate}>
                  Preview
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h6>Available Placeholders</h6>
              <ul className="list-group list-group-flush">
                {defaultPlaceholders.map((placeholder) => (
                  <li key={placeholder} className="list-group-item px-0 py-1">
                    <code>{placeholder}</code>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h6>Template Versions</h6>
              <div className="list-group">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`list-group-item ${selectedTemplateId === template.id ? 'border-primary' : ''}`}
                  >
                    <div className="d-flex justify-content-between align-items-center gap-2">
                      <span>v{template.version} - {template.template_name}</span>
                      {template.is_active && <span className="badge bg-success">Active</span>}
                    </div>
                    <div className="d-flex gap-2 mt-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => loadTemplateToEditor(template)}
                        disabled={busy || !canUpdateTemplates}
                      >
                        Edit
                      </button>
                      {!template.is_active && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success"
                          onClick={() => activateTemplate(template.id)}
                          disabled={busy || !canActivateTemplates}
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {templates.length === 0 && <div className="text-muted">No templates yet.</div>}
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h6>Preview Output</h6>
              <pre className="small bg-light p-3 rounded" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {preview || 'No preview generated yet.'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
