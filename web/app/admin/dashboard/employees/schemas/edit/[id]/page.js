'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useEmployees, useEmployeeSchemaActions } from '@/hooks/useRedux';

export default function EditEmployeeSchemaPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermissions();
  
  // Redux state
  const { 
    schemas, 
    currentSchema, 
    schemaFields, 
    loading, 
    error, 
    fetchEmployeeSchemas,
    getEmployeeSchemaById,
    getEmployeeSchemaFields 
  } = useEmployees();
  
  const { 
    updateEmployeeSchema, 
    deleteEmployeeSchema,
    addEmployeeSchemaField,
    updateEmployeeSchemaField,
    deleteEmployeeSchemaField 
  } = useEmployeeSchemaActions();
  
  const [formData, setFormData] = useState({
    schema_name: '',
    display_name: '',
    description: '',
    is_active: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [fieldFormData, setFieldFormData] = useState({
    field_name: '',
    field_label: '',
    field_type: 'text',
    field_options: '',
    is_required: false,
    validation_rules: '',
    display_order: 0
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEmployeeSchemas();
    }
  }, [status, fetchEmployeeSchemas]);

  useEffect(() => {
    if (params.id) {
      getEmployeeSchemaById(params.id);
      getEmployeeSchemaFields(params.id);
    }
  }, [params.id, getEmployeeSchemaById, getEmployeeSchemaFields]);

  useEffect(() => {
    if (currentSchema) {
      setFormData({
        schema_name: currentSchema.schema_name || '',
        display_name: currentSchema.display_name || '',
        description: currentSchema.description || '',
        is_active: currentSchema.is_active !== undefined ? currentSchema.is_active : true
      });
    }
  }, [currentSchema]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      await updateEmployeeSchema(params.id, formData);
      setSubmitSuccess(true);
      setTimeout(() => {
        router.push('/admin/dashboard/employees/schemas');
      }, 1500);
    } catch (error) {
      console.error('Error updating schema:', error);
      setSubmitError('Failed to update schema. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchema = async () => {
    if (window.confirm('Are you sure you want to delete this schema? This action cannot be undone.')) {
      try {
        await deleteEmployeeSchema(params.id);
        router.push('/admin/dashboard/employees/schemas');
      } catch (error) {
        console.error('Error deleting schema:', error);
        setSubmitError('Failed to delete schema. Please try again.');
      }
    }
  };

  const handleAddField = () => {
    setFieldFormData({
      field_name: '',
      field_label: '',
      field_type: 'text',
      field_options: '',
      is_required: false,
      validation_rules: '',
      display_order: schemaFields.length
    });
    setEditingField(null);
    setShowAddFieldModal(true);
  };

  const handleEditField = (field) => {
    setFieldFormData({
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      field_options: field.field_options ? JSON.stringify(field.field_options) : '',
      is_required: field.is_required,
      validation_rules: field.validation_rules ? JSON.stringify(field.validation_rules) : '',
      display_order: field.display_order
    });
    setEditingField(field);
    setShowAddFieldModal(true);
  };

  const handleFieldSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const fieldData = {
        ...fieldFormData,
        field_options: fieldFormData.field_options ? JSON.parse(fieldFormData.field_options) : null,
        validation_rules: fieldFormData.validation_rules ? JSON.parse(fieldFormData.validation_rules) : null
      };

      if (editingField) {
        await updateEmployeeSchemaField(params.id, editingField.id, fieldData);
      } else {
        await addEmployeeSchemaField(params.id, fieldData);
      }
      
      setShowAddFieldModal(false);
      getEmployeeSchemaFields(params.id); // Refresh fields
    } catch (error) {
      console.error('Error saving field:', error);
      setSubmitError('Failed to save field. Please try again.');
    }
  };

  const handleDeleteField = async (fieldId) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      try {
        await deleteEmployeeSchemaField(params.id, fieldId);
        getEmployeeSchemaFields(params.id); // Refresh fields
      } catch (error) {
        console.error('Error deleting field:', error);
        setSubmitError('Failed to delete field. Please try again.');
      }
    }
  };

  const fieldTypes = [
    'text', 'email', 'number', 'date', 'datetime', 'time', 
    'textarea', 'select', 'checkbox', 'radio', 'file', 'url', 'phone'
  ];

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Authentication Required</h4>
        <p>You need to be logged in to access this page.</p>
        <hr />
        <p className="mb-0">
          <Link href="/login" className="btn btn-primary">Go to Login</Link>
        </p>
      </div>
    );
  }

  // Check permissions
  if (!hasPermission('employee_schema.update')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to edit employee schemas.</p>
        <hr />
        <p className="mb-0">
          <Link href="/admin/dashboard/employees/schemas" className="btn btn-primary">Back to Schemas</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-edit text-primary-custom me-2"></i>
            Edit Employee Schema
          </h2>
          <p className="text-muted mb-0">Modify schema information and manage custom fields</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/dashboard/employees/schemas" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            Back to Schemas
          </Link>
          <button 
            className="btn btn-outline-danger"
            onClick={handleDeleteSchema}
          >
            <i className="fas fa-trash me-2"></i>
            Delete Schema
          </button>
        </div>
      </div>

      {/* Error Message */}
      {submitError && (
        <div className="alert alert-danger" role="alert">
          {submitError}
        </div>
      )}

      {/* Success Message */}
      {submitSuccess && (
        <div className="alert alert-success" role="alert">
          Schema updated successfully! Redirecting...
        </div>
      )}

      <div className="row">
        {/* Schema Information */}
        <div className="col-lg-6">
          <div className="card card-custom">
            <div className="card-header">
              <h5 className="card-title mb-0">Schema Information</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  {/* Schema Name */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="schema_name" className="form-label">
                      Schema Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="schema_name"
                      name="schema_name"
                      value={formData.schema_name}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Display Name */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="display_name" className="form-label">
                      Display Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="display_name"
                      name="display_name"
                      value={formData.display_name}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Description */}
                  <div className="col-12 mb-3">
                    <label htmlFor="description" className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Active Status */}
                  <div className="col-12 mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="is_active"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                      <label className="form-check-label" htmlFor="is_active">
                        Active Schema
                      </label>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="d-flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary-custom"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Update Schema
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Schema Fields */}
        <div className="col-lg-6">
          <div className="card card-custom">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Custom Fields</h5>
              <button 
                className="btn btn-sm btn-primary-custom"
                onClick={handleAddField}
              >
                <i className="fas fa-plus me-1"></i>
                Add Field
              </button>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : schemaFields.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="fas fa-list-ul fs-1 mb-3"></i>
                  <p>No custom fields defined</p>
                  <p className="small">Add fields to capture additional employee information</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {schemaFields.map((field) => (
                    <div key={field.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-1">
                          <strong>{field.field_label}</strong>
                          <span className="badge bg-secondary ms-2">{field.field_type}</span>
                          {field.is_required && <span className="badge bg-danger ms-1">Required</span>}
                        </div>
                        <small className="text-muted">{field.field_name}</small>
                      </div>
                      <div className="d-flex gap-1">
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEditField(field)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteField(field.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Field Modal */}
      {showAddFieldModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingField ? 'Edit Field' : 'Add New Field'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddFieldModal(false)}
                ></button>
              </div>
              <form onSubmit={handleFieldSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="field_name" className="form-label">
                        Field Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="field_name"
                        name="field_name"
                        value={fieldFormData.field_name}
                        onChange={(e) => setFieldFormData(prev => ({ ...prev, field_name: e.target.value }))}
                        required
                        placeholder="e.g., emergency_contact"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="field_label" className="form-label">
                        Field Label <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="field_label"
                        name="field_label"
                        value={fieldFormData.field_label}
                        onChange={(e) => setFieldFormData(prev => ({ ...prev, field_label: e.target.value }))}
                        required
                        placeholder="e.g., Emergency Contact"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="field_type" className="form-label">
                        Field Type <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="field_type"
                        name="field_type"
                        value={fieldFormData.field_type}
                        onChange={(e) => setFieldFormData(prev => ({ ...prev, field_type: e.target.value }))}
                        required
                      >
                        {fieldTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="display_order" className="form-label">
                        Display Order
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="display_order"
                        name="display_order"
                        value={fieldFormData.display_order}
                        onChange={(e) => setFieldFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                        min="0"
                      />
                    </div>

                    <div className="col-12 mb-3">
                      <label htmlFor="field_options" className="form-label">
                        Field Options (JSON)
                      </label>
                      <textarea
                        className="form-control"
                        id="field_options"
                        name="field_options"
                        value={fieldFormData.field_options}
                        onChange={(e) => setFieldFormData(prev => ({ ...prev, field_options: e.target.value }))}
                        rows="3"
                        placeholder='{"options": ["Option 1", "Option 2"]}'
                      />
                      <div className="form-text">For select, radio, checkbox fields</div>
                    </div>

                    <div className="col-12 mb-3">
                      <label htmlFor="validation_rules" className="form-label">
                        Validation Rules (JSON)
                      </label>
                      <textarea
                        className="form-control"
                        id="validation_rules"
                        name="validation_rules"
                        value={fieldFormData.validation_rules}
                        onChange={(e) => setFieldFormData(prev => ({ ...prev, validation_rules: e.target.value }))}
                        rows="3"
                        placeholder='{"min": 0, "max": 100}'
                      />
                    </div>

                    <div className="col-12 mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="is_required"
                          name="is_required"
                          checked={fieldFormData.is_required}
                          onChange={(e) => setFieldFormData(prev => ({ ...prev, is_required: e.target.checked }))}
                        />
                        <label className="form-check-label" htmlFor="is_required">
                          Required Field
                        </label>
                      </div>
                    </div>
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
                  <button type="submit" className="btn btn-primary-custom">
                    {editingField ? 'Update Field' : 'Add Field'}
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
