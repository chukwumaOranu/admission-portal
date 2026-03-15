'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useApplications } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';

export default function SchemaFieldsPage() {
  const params = useParams();
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  // Redux state
  const { schemas, loading: reduxLoading, fetchApplicationSchemas } = useApplications();
  
  const [schema, setSchema] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [addingField, setAddingField] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [showEditFieldModal, setShowEditFieldModal] = useState(false);
  
  const [newField, setNewField] = useState({
    field_name: '',
    field_type: 'text',
    field_label: '',
    placeholder: '',
    is_required: false,
    field_options: '',
    display_order: 0
  });

  const [editField, setEditField] = useState({
    field_name: '',
    field_type: 'text',
    field_label: '',
    placeholder: '',
    is_required: false,
    field_options: '',
    display_order: 0
  });

  const fetchFields = useCallback(async () => {
    try {
      const fieldsResponse = await apiService.get(API_ENDPOINTS.APPLICATIONS.SCHEMAS.FIELDS.GET_ALL(params.id));
      console.log('📥 Fields response:', fieldsResponse);
      const fieldsData = Array.isArray(fieldsResponse.data) ? fieldsResponse.data : (fieldsResponse.data?.data || []);
      console.log('📋 Fields data:', fieldsData);
      setFields(fieldsData.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching fields:', err);
      setLoading(false);
    }
  }, [params.id]);

  const fetchSchemaAndFields = useCallback(async () => {
    try {
      setLoading(true);
      
      const schemaResponse = await apiService.get(API_ENDPOINTS.APPLICATIONS.SCHEMAS.GET_BY_ID(params.id));
      setSchema(schemaResponse.data);
      
      await fetchFields();
    } catch (err) {
      console.error('Error fetching schema:', err);
      setError('Failed to load schema details');
    } finally {
      setLoading(false);
    }
  }, [params.id, fetchFields]);

  const fieldTypes = [
    { value: 'text', label: 'Text Input', icon: 'fa-font' },
    { value: 'textarea', label: 'Text Area', icon: 'fa-align-left' },
    { value: 'number', label: 'Number', icon: 'fa-hashtag' },
    { value: 'email', label: 'Email', icon: 'fa-envelope' },
    { value: 'phone', label: 'Phone', icon: 'fa-phone' },
    { value: 'date', label: 'Date', icon: 'fa-calendar' },
    { value: 'select', label: 'Dropdown', icon: 'fa-list' },
    { value: 'radio', label: 'Radio Buttons', icon: 'fa-check-circle' },
    { value: 'checkbox', label: 'Checkbox', icon: 'fa-check-square' },
    { value: 'file', label: 'File Upload', icon: 'fa-upload' }
  ];

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      // Fetch schemas from Redux if not already loaded
      if (schemas.length === 0) {
        fetchApplicationSchemas();
      }
    }
  }, [status, session?.user?.id, session?.accessToken, schemas.length, fetchApplicationSchemas]);

  useEffect(() => {
    // Find schema from Redux store or fetch directly
    if (params.id && schemas.length > 0) {
      const foundSchema = schemas.find(s => s.id === parseInt(params.id));
      if (foundSchema) {
        setSchema(foundSchema);
        fetchFields();
      }
    } else if (params.id && !reduxLoading) {
      fetchSchemaAndFields();
    }
  }, [params.id, schemas, reduxLoading, fetchSchemaAndFields, fetchFields]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewField(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddField = async (e) => {
    e.preventDefault();
    setAddingField(true);
    
    try {
      // Set display_order to next available
      const nextOrder = fields.length > 0 ? Math.max(...fields.map(f => f.display_order || 0)) + 1 : 0;
      
      const fieldData = {
        ...newField,
        display_order: nextOrder
      };
      
      await apiService.post(API_ENDPOINTS.APPLICATIONS.SCHEMAS.FIELDS.CREATE(params.id), fieldData);
      alert('Field added successfully!');
      setShowAddFieldModal(false);
      setNewField({
        field_name: '',
        field_type: 'text',
        field_label: '',
        placeholder: '',
        is_required: false,
        field_options: '',
        display_order: 0
      });
      await fetchSchemaAndFields();
    } catch (err) {
      console.error('Error adding field:', err);
      alert(err.response?.data?.message || 'Failed to add field');
    } finally {
      setAddingField(false);
    }
  };

  const handleEditField = (field) => {
    setEditingField(field.id);
    setEditField({
      field_name: field.field_name,
      field_type: field.field_type,
      field_label: field.field_label,
      placeholder: field.placeholder || '',
      is_required: field.is_required,
      field_options: field.field_options || '',
      display_order: field.display_order
    });
    setShowEditFieldModal(true);
  };

  const handleUpdateField = async (e) => {
    e.preventDefault();
    setAddingField(true);
    
    try {
      await apiService.put(
        API_ENDPOINTS.APPLICATIONS.SCHEMAS.FIELDS.UPDATE(params.id, editingField),
        editField
      );
      alert('Field updated successfully!');
      setShowEditFieldModal(false);
      setEditingField(null);
      await fetchSchemaAndFields();
    } catch (err) {
      console.error('Error updating field:', err);
      alert(err.response?.data?.message || 'Failed to update field');
    } finally {
      setAddingField(false);
    }
  };

  const handleDeleteField = async (fieldId) => {
    if (!window.confirm('Are you sure you want to delete this field? This cannot be undone.')) {
      return;
    }
    
    try {
      await apiService.delete(API_ENDPOINTS.APPLICATIONS.SCHEMAS.FIELDS.DELETE(params.id, fieldId));
      alert('Field deleted successfully!');
      await fetchSchemaAndFields();
    } catch (err) {
      console.error('Error deleting field:', err);
      alert('Failed to delete field');
    }
  };

  const handleMoveField = async (fieldId, direction) => {
    const fieldIndex = fields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) return;
    
    const newIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    
    // Swap display_order values
    const newFields = [...fields];
    const temp = newFields[fieldIndex].display_order;
    newFields[fieldIndex].display_order = newFields[newIndex].display_order;
    newFields[newIndex].display_order = temp;
    
    // Update both fields
    try {
      await Promise.all([
        apiService.put(
          API_ENDPOINTS.APPLICATIONS.SCHEMAS.FIELDS.UPDATE(params.id, newFields[fieldIndex].id),
          { display_order: newFields[fieldIndex].display_order }
        ),
        apiService.put(
          API_ENDPOINTS.APPLICATIONS.SCHEMAS.FIELDS.UPDATE(params.id, newFields[newIndex].id),
          { display_order: newFields[newIndex].display_order }
        )
      ]);
      await fetchSchemaAndFields();
    } catch (err) {
      console.error('Error reordering fields:', err);
      alert('Failed to reorder fields');
    }
  };

  const getFieldTypeIcon = (type) => {
    const fieldType = fieldTypes.find(ft => ft.value === type);
    return fieldType?.icon || 'fa-question';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
        <Link href="/admin/dashboard/applications/schemas" className="btn btn-primary">
          Back to Schemas
        </Link>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="container-fluid">
        <div className="alert alert-warning">
          Schema not found
        </div>
        <Link href="/admin/dashboard/applications/schemas" className="btn btn-primary">
          Back to Schemas
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-list-ul text-primary me-2"></i>
            Manage Form Fields
          </h2>
          <p className="text-muted mb-0">
            {schema.display_name || schema.schema_name}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/dashboard/applications/schemas" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            Back to Schemas
          </Link>
          {hasPermission('application_field.create') && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddFieldModal(true)}
            >
              <i className="fas fa-plus me-2"></i>
              Add Field
            </button>
          )}
        </div>
      </div>

      {/* Schema Info Banner */}
      <div className="alert alert-info mb-4">
        <div className="row align-items-center">
          <div className="col-md-8">
            <h6 className="mb-2">
              <i className="fas fa-info-circle me-2"></i>
              About This Schema
            </h6>
            <p className="mb-0 small">{schema.description || 'No description'}</p>
          </div>
          <div className="col-md-4 text-md-end">
            <div className="mb-1">
              <strong>Application Fee:</strong> ₦{parseFloat(schema.application_fee).toLocaleString()}
            </div>
            <span className={`badge bg-${schema.is_active ? 'success' : 'secondary'}`}>
              {schema.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Fields List */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white">
          <h5 className="card-title mb-0">
            <i className="fas fa-list me-2"></i>
            Form Fields ({fields.length})
          </h5>
        </div>
        <div className="card-body">
          {fields.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-inbox text-muted" style={{ fontSize: '4rem' }}></i>
              <h5 className="mt-3 text-muted">No Fields Added Yet</h5>
              <p className="text-muted">Add custom fields to build your application form</p>
              {hasPermission('application_field.create') && (
                <button 
                  className="btn btn-primary mt-2"
                  onClick={() => setShowAddFieldModal(true)}
                >
                  <i className="fas fa-plus me-2"></i>
                  Add First Field
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>Order</th>
                    <th>Field Name</th>
                    <th>Label</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Options</th>
                    <th style={{ width: '180px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      <td>
                        <div className="btn-group-vertical btn-group-sm">
                          {index > 0 && (
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleMoveField(field.id, 'up')}
                              title="Move up"
                            >
                              <i className="fas fa-arrow-up"></i>
                            </button>
                          )}
                          {index < fields.length - 1 && (
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleMoveField(field.id, 'down')}
                              title="Move down"
                            >
                              <i className="fas fa-arrow-down"></i>
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <code className="small">{field.field_name}</code>
                      </td>
                      <td>{field.label}</td>
                      <td>
                        <span className="badge bg-info">
                          <i className={`fas ${getFieldTypeIcon(field.field_type)} me-1`}></i>
                          {field.field_type}
                        </span>
                      </td>
                      <td>
                        {field.is_required ? (
                          <span className="badge bg-danger">Required</span>
                        ) : (
                          <span className="badge bg-secondary">Optional</span>
                        )}
                      </td>
                      <td>
                        {field.options ? (
                          <small className="text-muted">{field.options.substring(0, 30)}...</small>
                        ) : (
                          <small className="text-muted">-</small>
                        )}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          {hasPermission('application_field.update') && (
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleEditField(field)}
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          )}
                          {hasPermission('application_field.delete') && (
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteField(field.id)}
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
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

      {/* Add Field Modal */}
      {showAddFieldModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-plus-circle me-2"></i>
                  Add New Field
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddFieldModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddField}>
                <div className="modal-body">
                  <div className="row">
                    {/* Field Type */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Field Type <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        name="field_type"
                        value={newField.field_type}
                        onChange={handleInputChange}
                        required
                      >
                        {fieldTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Field Name */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Field Name (ID) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="field_name"
                        value={newField.field_name}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., previous_school"
                      />
                      <small className="text-muted">Lowercase, no spaces (use underscore)</small>
                    </div>

                    {/* Label */}
                    <div className="col-md-12 mb-3">
                      <label className="form-label">
                        Label (Display Text) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="field_label"
                        value={newField.field_label}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., Previous School Name"
                      />
                    </div>

                    {/* Placeholder */}
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Placeholder Text</label>
                      <input
                        type="text"
                        className="form-control"
                        name="placeholder"
                        value={newField.placeholder}
                        onChange={handleInputChange}
                        placeholder="e.g., Enter your previous school name"
                      />
                    </div>

                    {/* Options (for select, radio, checkbox) */}
                    {['select', 'radio', 'checkbox'].includes(newField.field_type) && (
                      <div className="col-md-12 mb-3">
                        <label className="form-label">
                          Options <span className="text-danger">*</span>
                        </label>
                        <textarea
                          className="form-control"
                          name="field_options"
                          value={newField.field_options}
                          onChange={handleInputChange}
                          rows="3"
                          required
                          placeholder="Enter options separated by commas (e.g., Primary,JSS,SSS)"
                        ></textarea>
                        <small className="text-muted">
                          Separate options with commas
                        </small>
                      </div>
                    )}

                    {/* Required Checkbox */}
                    <div className="col-md-12 mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="is_required"
                          checked={newField.is_required}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label">
                          This field is required
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Field Preview */}
                  <div className="alert alert-light border">
                    <h6 className="mb-3">
                      <i className="fas fa-eye me-2"></i>
                      Preview:
                    </h6>
                    <label className="form-label">
                      {newField.field_label || 'Field Label'}
                      {newField.is_required && <span className="text-danger ms-1">*</span>}
                    </label>
                    
                    {newField.field_type === 'textarea' && (
                      <textarea 
                        className="form-control" 
                        placeholder={newField.placeholder}
                        disabled
                      ></textarea>
                    )}
                    
                    {newField.field_type === 'select' && (
                      <select className="form-select" disabled>
                        <option>{newField.placeholder || 'Select an option'}</option>
                        {newField.field_options && newField.field_options.split(',').map((opt, i) => (
                          <option key={i}>{opt.trim()}</option>
                        ))}
                      </select>
                    )}
                    
                    {['text', 'number', 'email', 'phone', 'date'].includes(newField.field_type) && (
                      <input 
                        type={newField.field_type} 
                        className="form-control" 
                        placeholder={newField.placeholder}
                        disabled
                      />
                    )}
                    
                    {newField.field_type === 'file' && (
                      <input 
                        type="file" 
                        className="form-control" 
                        disabled
                      />
                    )}
                    
                    {newField.field_type === 'checkbox' && (
                      <div>
                        {newField.field_options && newField.field_options.split(',').map((opt, i) => (
                          <div key={i} className="form-check">
                            <input className="form-check-input" type="checkbox" disabled />
                            <label className="form-check-label">{opt.trim()}</label>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {newField.field_type === 'radio' && (
                      <div>
                        {newField.field_options && newField.field_options.split(',').map((opt, i) => (
                          <div key={i} className="form-check">
                            <input className="form-check-input" type="radio" name="preview" disabled />
                            <label className="form-check-label">{opt.trim()}</label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddFieldModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={addingField}
                  >
                    {addingField ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Adding...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Add Field
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Field Modal */}
      {showEditFieldModal && editingField && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-edit me-2"></i>
                  Edit Field
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowEditFieldModal(false);
                    setEditingField(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleUpdateField}>
                <div className="modal-body">
                  <div className="row">
                    {/* Field Type */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Field Type <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        name="field_type"
                        value={editField.field_type}
                        onChange={(e) => setEditField({...editField, field_type: e.target.value})}
                        required
                      >
                        {fieldTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Field Name */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Field Name (ID) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="field_name"
                        value={editField.field_name}
                        onChange={(e) => setEditField({...editField, field_name: e.target.value})}
                        required
                      />
                    </div>

                    {/* Label */}
                    <div className="col-md-12 mb-3">
                      <label className="form-label">
                        Label <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="field_label"
                        value={editField.field_label}
                        onChange={(e) => setEditField({...editField, field_label: e.target.value})}
                        required
                      />
                    </div>

                    {/* Placeholder */}
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Placeholder</label>
                      <input
                        type="text"
                        className="form-control"
                        name="placeholder"
                        value={editField.placeholder}
                        onChange={(e) => setEditField({...editField, placeholder: e.target.value})}
                      />
                    </div>

                    {/* Options */}
                    {['select', 'radio', 'checkbox'].includes(editField.field_type) && (
                      <div className="col-md-12 mb-3">
                        <label className="form-label">
                          Options <span className="text-danger">*</span>
                        </label>
                        <textarea
                          className="form-control"
                          name="field_options"
                          value={editField.field_options}
                          onChange={(e) => setEditField({...editField, field_options: e.target.value})}
                          rows="3"
                          required
                        ></textarea>
                        <small className="text-muted">Comma-separated values</small>
                      </div>
                    )}

                    {/* Required */}
                    <div className="col-md-12 mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="is_required"
                          checked={editField.is_required}
                          onChange={(e) => setEditField({...editField, is_required: e.target.checked})}
                        />
                        <label className="form-check-label">
                          This field is required
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowEditFieldModal(false);
                      setEditingField(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={addingField}
                  >
                    {addingField ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Update Field
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
