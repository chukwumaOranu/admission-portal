'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudents } from '@/hooks/useRedux';
import { apiService, API_ENDPOINTS } from '@/services/api';

export default function ManageSchemaFieldsPage() {
  const params = useParams();
  const { status } = useSession();
  const { hasPermission } = usePermissions();
  
  // ✅ Redux for schemas
  const { schemas, loading: schemasLoading, fetchStudentSchemas } = useStudents();
  
  const [schema, setSchema] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({
    field_name: '',
    field_label: '',
    field_type: 'text',
    is_required: false,
    field_options: '',
    display_order: 1
  });

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Phone' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'file', label: 'File Upload' }
  ];

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStudentSchemas();
    }
  }, [status, fetchStudentSchemas]);

  useEffect(() => {
    if (schemas.length > 0 && params.id) {
      const foundSchema = schemas.find(s => s.id === parseInt(params.id));
      setSchema(foundSchema);
    }
  }, [schemas, params.id]);

  const fetchFields = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.STUDENTS.SCHEMAS.FIELDS.GET_ALL(params.id));
      const fetchedFields = response.data.data?.fields || response.data.fields || [];
      setFields(fetchedFields);
      setError('');
    } catch (err) {
      console.error('Error fetching fields:', err);
      setError('Failed to load fields');
      setFields([]);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id && status === 'authenticated') {
      fetchFields();
    }
  }, [params.id, status, fetchFields]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddField = () => {
    setEditingField(null);
    setFormData({
      field_name: '',
      field_label: '',
      field_type: 'text',
      is_required: false,
      field_options: '',
      display_order: fields.length + 1
    });
    setShowAddModal(true);
  };

  const handleEditField = (field) => {
    setEditingField(field);
    setFormData({
      field_name: field.field_name || '',
      field_label: field.field_label || '',
      field_type: field.field_type || 'text',
      is_required: field.is_required || false,
      field_options: field.field_options || '',
      display_order: field.display_order || 1
    });
    setShowAddModal(true);
  };

  const handleSubmitField = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingField) {
        // Update existing field
        await apiService.put(
          `/students/fields/${editingField.id}`,
          formData
        );
      } else {
        // Create new field
        await apiService.post(
          API_ENDPOINTS.STUDENTS.SCHEMAS.FIELDS.CREATE(params.id),
          formData
        );
      }
      
      setShowAddModal(false);
      await fetchFields();
    } catch (err) {
      console.error('Error saving field:', err);
      setError(err.response?.data?.message || 'Failed to save field');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async (fieldId) => {
    if (!window.confirm('Are you sure you want to delete this field?')) {
      return;
    }

    try {
      setLoading(true);
      await apiService.delete(API_ENDPOINTS.STUDENTS.SCHEMAS.FIELDS.DELETE(fieldId));
      await fetchFields();
      setError('');
    } catch (err) {
      console.error('Error deleting field:', err);
      setError('Failed to delete field');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || schemasLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!hasPermission('student_schema.update')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to manage student schema fields.</p>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="alert alert-warning" role="alert">
        <h4 className="alert-heading">Schema Not Found</h4>
        <p>The requested student schema could not be found.</p>
        <Link href="/admin/dashboard/students/schemas" className="btn btn-primary">
          Back to Schemas
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Manage Schema Fields</h2>
          <p className="text-muted">
            Schema: <strong>{schema.display_name}</strong>
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link
            href={`/admin/dashboard/students/schemas/${params.id}`}
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to Schema
          </Link>
          <button
            className="btn btn-primary"
            onClick={handleAddField}
            disabled={loading}
          >
            <i className="fas fa-plus me-2"></i>
            Add Field
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {loading && !showAddModal ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : fields.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-list-ul fa-3x text-muted mb-3"></i>
              <h5>No Fields Yet</h5>
              <p className="text-muted">Add your first field to get started</p>
              <button className="btn btn-primary" onClick={handleAddField}>
                <i className="fas fa-plus me-2"></i>
                Add Field
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Field Name</th>
                    <th>Label</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Options</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr key={field.id}>
                      <td>{field.display_order}</td>
                      <td><code>{field.field_name}</code></td>
                      <td>{field.field_label}</td>
                      <td>
                        <span className="badge bg-info">
                          {field.field_type}
                        </span>
                      </td>
                      <td>
                        {field.is_required ? (
                          <i className="fas fa-check text-success"></i>
                        ) : (
                          <i className="fas fa-times text-muted"></i>
                        )}
                      </td>
                      <td>
                        {field.field_options ? (
                          <small className="text-muted">
                            {field.field_options.substring(0, 30)}
                            {field.field_options.length > 30 ? '...' : ''}
                          </small>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEditField(field)}
                            title="Edit Field"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteField(field.id)}
                            title="Delete Field"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Field Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingField ? 'Edit Field' : 'Add New Field'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                  disabled={loading}
                ></button>
              </div>
              <form onSubmit={handleSubmitField}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Field Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="field_name"
                        value={formData.field_name}
                        onChange={handleChange}
                        placeholder="e.g., date_of_birth"
                        required
                        disabled={loading}
                      />
                      <small className="text-muted">Use lowercase with underscores</small>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Field Label <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="field_label"
                        value={formData.field_label}
                        onChange={handleChange}
                        placeholder="e.g., Date of Birth"
                        required
                        disabled={loading}
                      />
                      <small className="text-muted">Displayed to users</small>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Field Type <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        name="field_type"
                        value={formData.field_type}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      >
                        {fieldTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Display Order</label>
                      <input
                        type="number"
                        className="form-control"
                        name="display_order"
                        value={formData.display_order}
                        onChange={handleChange}
                        min="1"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {['select', 'radio', 'checkbox'].includes(formData.field_type) && (
                    <div className="mb-3">
                      <label className="form-label">
                        Options <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        name="field_options"
                        value={formData.field_options}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Enter options (comma-separated): Option 1, Option 2, Option 3"
                        required
                        disabled={loading}
                      ></textarea>
                      <small className="text-muted">Comma-separated list of options</small>
                    </div>
                  )}

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="is_required"
                      name="is_required"
                      checked={formData.is_required}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <label className="form-check-label" htmlFor="is_required">
                      Required Field
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddModal(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        {editingField ? 'Update Field' : 'Add Field'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
