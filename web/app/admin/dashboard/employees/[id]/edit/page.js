'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useEmployees, useDepartments } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';
import s from '@/styles/admin-portal.module.css';

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { employees, schemas, loading: employeesLoading, fetchEmployees, fetchEmployeeSchemas, updateEmployee } = useEmployees();
  const { departments, fetchDepartments } = useDepartments();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [notice, setNotice]   = useState('');
  const loadedRef = useRef(false);

  const [formData, setFormData] = useState({
    employee_id: '', schema_id: '', first_name: '', last_name: '',
    email: '', phone: '', department_id: '', position: '',
    employment_date: '', status: 'active',
  });

  const fetchEmployeeDirectly = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const res = await apiService.get(API_ENDPOINTS.EMPLOYEES.GET_BY_ID(params.id));
      const emp = res.data;
      setFormData({
        employee_id:      emp.employee_id || '',
        schema_id:        emp.schema_id || '',
        first_name:       emp.first_name || '',
        last_name:        emp.last_name || '',
        email:            emp.email || '',
        phone:            emp.phone || '',
        department_id:    emp.department_id || '',
        position:         emp.position || '',
        employment_date:  emp.employment_date ? emp.employment_date.split('T')[0] : '',
        status:           emp.status || 'active',
      });
    } catch { setError('Failed to load employee details'); }
    finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchEmployees(); fetchDepartments(); fetchEmployeeSchemas();
    }
  }, [status, session?.user?.id, fetchEmployees, fetchDepartments, fetchEmployeeSchemas]);

  useEffect(() => {
    if (params.id && employees.length > 0) {
      const emp = employees.find(e => e.id === parseInt(params.id, 10));
      if (emp) {
        setFormData({
          employee_id:     emp.employee_id || '',
          schema_id:       emp.schema_id || '',
          first_name:      emp.first_name || '',
          last_name:       emp.last_name || '',
          email:           emp.email || '',
          phone:           emp.phone || '',
          department_id:   emp.department_id || '',
          position:        emp.position || '',
          employment_date: emp.employment_date ? emp.employment_date.split('T')[0] : '',
          status:          emp.status || 'active',
        });
        setLoading(false);
      } else if (!employeesLoading) {
        fetchEmployeeDirectly();
      }
    } else if (params.id && !employeesLoading && employees.length === 0) {
      fetchEmployeeDirectly();
    }
  }, [employees, employeesLoading, params.id, fetchEmployeeDirectly]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setNotice('');
    updateEmployee(params.id, formData);
    setNotice('Employee updated successfully!');
    setTimeout(() => router.push(`/admin/dashboard/employees/${params.id}`), 1500);
    setSaving(false);
  };

  if (status === 'loading' || permLoading || loading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('employee.update')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to edit employees.</div>
      </div>
    );
  }

  const field = (label, child, hint) => (
    <div style={{ marginBottom: '1rem' }}>
      <label className={s.formLabel}>{label}</label>
      {child}
      {hint && <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>{hint}</p>}
    </div>
  );

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#e0f2fe', color: '#0891b2' }}><i className="fas fa-user-edit" /></span>
            Edit Employee
          </h1>
          <p className={s.pageSub}>Update employee information</p>
        </div>
        <div className={s.pageActions}>
          <Link href={`/admin/dashboard/employees/${params.id}`} className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Back
          </Link>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

          {/* Left: form */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2' }}>
                  <i className="fas fa-user" style={{ fontSize: '0.75rem' }} />
                </span>
                Employee Information
              </span>
            </div>
            <div className={s.cardBody} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>{field('Employee ID', <input type="text" className={s.formInput} name="employee_id" value={formData.employee_id} disabled style={{ background: '#f1f5f9', cursor: 'not-allowed' }} />, 'Cannot be changed')}</div>
                <div>
                  {field('Employee Type *',
                    <select className={s.formSelect} name="schema_id" value={formData.schema_id} onChange={handleChange} required disabled={saving}>
                      <option value="">Select Type</option>
                      {schemas.map(sc => <option key={sc.id} value={sc.id}>{sc.display_name || sc.schema_name}</option>)}
                    </select>
                  )}
                </div>
                <div>{field('First Name *', <input type="text"  className={s.formInput} name="first_name" value={formData.first_name} onChange={handleChange} required disabled={saving} />)}</div>
                <div>{field('Last Name *',  <input type="text"  className={s.formInput} name="last_name"  value={formData.last_name}  onChange={handleChange} required disabled={saving} />)}</div>
                <div>{field('Email',        <input type="email" className={s.formInput} name="email"      value={formData.email}      onChange={handleChange} disabled={saving} />)}</div>
                <div>{field('Phone',        <input type="tel"   className={s.formInput} name="phone"      value={formData.phone}      onChange={handleChange} disabled={saving} />)}</div>
                <div>
                  {field('Department',
                    <select className={s.formSelect} name="department_id" value={formData.department_id} onChange={handleChange} disabled={saving}>
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  )}
                </div>
                <div>{field('Position', <input type="text" className={s.formInput} name="position" value={formData.position} onChange={handleChange} disabled={saving} />)}</div>
                <div>{field('Employment Date', <input type="date" className={s.formInput} name="employment_date" value={formData.employment_date} onChange={handleChange} disabled={saving} />)}</div>
                <div>
                  {field('Status',
                    <select className={s.formSelect} name="status" value={formData.status} onChange={handleChange} disabled={saving}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="on_leave">On Leave</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm" />Saving…</> : <><i className="fas fa-save" />Save Changes</>}
                </button>
                <button type="button" className={`${s.btn} ${s.btnOutline}`} onClick={() => router.back()} disabled={saving}>
                  <i className="fas fa-times" />Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
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
                  <li>Employee ID cannot be changed</li>
                  <li>Email changes don&apos;t affect login username</li>
                  <li>Assign roles via User Management page</li>
                  <li>Changes take effect immediately</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
