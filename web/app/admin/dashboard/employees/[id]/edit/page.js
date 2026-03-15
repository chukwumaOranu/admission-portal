'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useEmployees, useDepartments } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  // Redux state
  const { 
    employees, 
    schemas,
    loading: employeesLoading, 
    fetchEmployees, 
    fetchEmployeeSchemas,
    updateEmployee 
  } = useEmployees();
  const { departments, loading: departmentsLoading, fetchDepartments } = useDepartments();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    schema_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    position: '',
    employment_date: '',
    status: 'active'
  });

  const fetchEmployeeDirectly = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.get(API_ENDPOINTS.EMPLOYEES.GET_BY_ID(params.id));
      const emp = response.data;
      
      setFormData({
        employee_id: emp.employee_id || '',
        schema_id: emp.schema_id || '',
        first_name: emp.first_name || '',
        last_name: emp.last_name || '',
        email: emp.email || '',
        phone: emp.phone || '',
        department_id: emp.department_id || '',
        position: emp.position || '',
        employment_date: emp.employment_date ? emp.employment_date.split('T')[0] : '',
        status: emp.status || 'active'
      });
    } catch (err) {
      console.error('Error fetching employee:', err);
      setError('Failed to fetch employee details');
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      // Fetch from Redux if not already loaded
      if (employees.length === 0) {
        fetchEmployees();
      }
      if (departments.length === 0) {
        fetchDepartments();
      }
      if (schemas.length === 0) {
        fetchEmployeeSchemas();
      }
    }
  }, [
    status,
    session,
    employees.length,
    departments.length,
    schemas.length,
    fetchEmployees,
    fetchDepartments,
    fetchEmployeeSchemas
  ]);

  useEffect(() => {
    // Find employee from Redux store
    if (params.id && employees.length > 0) {
      const emp = employees.find(e => e.id === parseInt(params.id));
      if (emp) {
        setFormData({
          employee_id: emp.employee_id || '',
          schema_id: emp.schema_id || '',
          first_name: emp.first_name || '',
          last_name: emp.last_name || '',
          email: emp.email || '',
          phone: emp.phone || '',
          department_id: emp.department_id || '',
          position: emp.position || '',
          employment_date: emp.employment_date ? emp.employment_date.split('T')[0] : '',
          status: emp.status || 'active'
        });
        setIsLoading(false);
      }
    } else if (params.id && !employeesLoading) {
      // If employee not in Redux, fetch directly
      fetchEmployeeDirectly();
    }
  }, [params.id, employees, employeesLoading, fetchEmployeeDirectly]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);

      await updateEmployee(params.id, formData);
      
      setSuccess(true);
      alert('Employee updated successfully!');
      
      setTimeout(() => {
        router.push(`/admin/dashboard/employees/${params.id}`);
      }, 1500);
      
    } catch (err) {
      console.error('Error updating employee:', err);
      setError(err.message || 'Failed to update employee');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading while checking authentication
  if (status === 'loading' || isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    window.location.href = '/login';
    return null;
  }

  // Check permissions
  if (!hasPermission('employee.update')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to edit employees.</p>
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
            Edit Employee
          </h2>
          <p className="text-muted mb-0">Update employee information</p>
        </div>
        <Link 
          href={`/admin/dashboard/employees/${params.id}`}
          className="btn btn-outline-secondary"
        >
          <i className="fas fa-arrow-left me-2"></i>
          Back to Details
        </Link>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          Employee updated successfully! Redirecting...
          <button type="button" className="btn-close" onClick={() => setSuccess(false)}></button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Form */}
      <div className="row">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-user me-2"></i>
                Employee Information
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  {/* Employee ID */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Employee ID <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleInputChange}
                      required
                      disabled
                    />
                    <small className="text-muted">Employee ID cannot be changed</small>
                  </div>

                  {/* Schema */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Employee Type <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      name="schema_id"
                      value={formData.schema_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Type</option>
                      {schemas.map((schema) => (
                        <option key={schema.id} value={schema.id}>
                          {schema.display_name || schema.schema_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* First Name */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      First Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Last Name */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Last Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Phone */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Department */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Department</label>
                    <select
                      className="form-select"
                      name="department_id"
                      value={formData.department_id}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Position */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Position</label>
                    <input
                      type="text"
                      className="form-control"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Employment Date */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Employment Date</label>
                    <input
                      type="date"
                      className="form-control"
                      name="employment_date"
                      value={formData.employment_date}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Status */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="on_leave">On Leave</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="d-flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary-custom"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Save Changes
                      </>
                    )}
                  </button>
                  
                  <Link
                    href={`/admin/dashboard/employees/${params.id}`}
                    className="btn btn-outline-secondary"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Help & Info */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Edit Information
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info mb-3">
                <h6><i className="fas fa-lightbulb me-2"></i>Tips:</h6>
                <ul className="mb-0 ps-3">
                  <li>Employee ID cannot be changed</li>
                  <li>Email changes don&apos;t affect login username</li>
                  <li>Assign roles via User Management page</li>
                </ul>
              </div>

              <div className="alert alert-warning mb-0">
                <h6><i className="fas fa-exclamation-triangle me-2"></i>Note:</h6>
                <p className="mb-0">
                  Changes will take effect immediately. Make sure all information is correct before saving.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
