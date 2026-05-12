'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useEmployees, useDepartments } from '@/hooks/useRedux';
import s from '@/styles/admin-portal.module.css';

export default function AddEmployeePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { schemas, loading: employeesLoading, fetchEmployeeSchemas, createEmployee } = useEmployees();
  const { departments, fetchDepartments } = useDepartments();

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [notice, setNotice] = useState('');
  const loadedRef = useRef(false);

  const [formData, setFormData] = useState({
    employee_id: '', schema_id: '', first_name: '', last_name: '',
    email: '', phone: '', department_id: '', position: '',
    employment_date: '', create_user_account: false, send_welcome_email: false,
  });

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchEmployeeSchemas(); fetchDepartments();
    }
  }, [status, session?.user?.id, fetchEmployeeSchemas, fetchDepartments]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.schema_id || !formData.first_name || !formData.last_name) {
      setError('Employee ID, Employee Type, First Name and Last Name are required.');
      return;
    }
    if (formData.create_user_account && !formData.email) {
      setError('Email is required when creating a user account.');
      return;
    }
    setSaving(true); setError(''); setNotice('');
    createEmployee(formData);
    setNotice('Employee created successfully!');
    setTimeout(() => router.push('/admin/dashboard/employees'), 1500);
    setSaving(false);
  };

  if (status === 'loading' || permLoading || employeesLoading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('employee.create')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to create employees.</div>
        <Link href="/admin/dashboard/employees" className={`${s.btn} ${s.btnOutline}`} style={{ marginTop: '0.75rem' }}><i className="fas fa-arrow-left" />Back to Employees</Link>
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
            <span className={s.iconBox} style={{ background: '#e0f2fe', color: '#0891b2' }}><i className="fas fa-user-plus" /></span>
            Add Employee
          </h1>
          <p className={s.pageSub}>Create a new employee record</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/employees" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Employees
          </Link>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

          {/* Left: form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Employee Info */}
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
                  <div>{field('Employee ID *', <input type="text" className={s.formInput} name="employee_id" value={formData.employee_id} onChange={handleChange} required placeholder="e.g., EMP001" disabled={saving} />, 'Must be unique')}</div>
                  <div>
                    {field('Employee Type *',
                      <select className={s.formSelect} name="schema_id" value={formData.schema_id} onChange={handleChange} required disabled={saving}>
                        <option value="">Select Type</option>
                        {schemas.map(sc => <option key={sc.id} value={sc.id}>{sc.display_name || sc.schema_name}</option>)}
                      </select>
                    )}
                  </div>
                  <div>{field('First Name *', <input type="text" className={s.formInput} name="first_name" value={formData.first_name} onChange={handleChange} required placeholder="John" disabled={saving} />)}</div>
                  <div>{field('Last Name *',  <input type="text" className={s.formInput} name="last_name"  value={formData.last_name}  onChange={handleChange} required placeholder="Doe"  disabled={saving} />)}</div>
                  <div>
                    {field('Email',
                      <input type="email" className={s.formInput} name="email" value={formData.email} onChange={handleChange}
                        required={formData.create_user_account}
                        placeholder="john.doe@company.com" disabled={saving} />,
                      formData.create_user_account ? 'Required for user account' : undefined
                    )}
                  </div>
                  <div>{field('Phone', <input type="tel" className={s.formInput} name="phone" value={formData.phone} onChange={handleChange} placeholder="+234 XXX XXX XXXX" disabled={saving} />)}</div>
                  <div>
                    {field('Department',
                      <select className={s.formSelect} name="department_id" value={formData.department_id} onChange={handleChange} disabled={saving}>
                        <option value="">Select Department</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    )}
                  </div>
                  <div>{field('Position', <input type="text" className={s.formInput} name="position" value={formData.position} onChange={handleChange} placeholder="e.g., Manager" disabled={saving} />)}</div>
                  <div>{field('Employment Date', <input type="date" className={s.formInput} name="employment_date" value={formData.employment_date} onChange={handleChange} disabled={saving} />)}</div>
                </div>
              </div>
            </div>

            {/* System Access */}
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#d1fae5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                    <i className="fas fa-user-lock" style={{ fontSize: '0.75rem' }} />
                  </span>
                  System Access (Optional)
                </span>
              </div>
              <div className={s.cardBody} style={{ padding: '1.25rem' }}>
                <div className={`${s.alert} ${s.alertInfo}`} style={{ marginBottom: '1rem' }}>
                  <i className="fas fa-info-circle" />
                  <span style={{ fontSize: '0.82rem' }}>Create a login account so this employee can access the system. Role can be assigned later.</span>
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '1rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="create_user_account" checked={formData.create_user_account} onChange={handleChange} style={{ marginTop: 3, width: 15, height: 15, accentColor: '#059669' }} disabled={saving} />
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                    <strong>Create User Account</strong><br />
                    <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Generate login credentials for system access</span>
                  </span>
                </label>
                {formData.create_user_account && (
                  <>
                    <div className={`${s.alert} ${s.alertSuccess}`} style={{ marginBottom: '0.75rem' }}>
                      <i className="fas fa-key" />
                      <span style={{ fontSize: '0.82rem' }}>Username &amp; password will be auto-generated and shown after creation.</span>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer' }}>
                      <input type="checkbox" name="send_welcome_email" checked={formData.send_welcome_email} onChange={handleChange} style={{ marginTop: 3, width: 15, height: 15, accentColor: '#059669' }} disabled={saving} />
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                        Send welcome email with credentials<br />
                        <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>(Requires email configuration)</span>
                      </span>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm" />Creating…</> : <><i className="fas fa-save" />Create Employee</>}
              </button>
              <Link href="/admin/dashboard/employees" className={`${s.btn} ${s.btnOutline}`}>
                <i className="fas fa-times" />Cancel
              </Link>
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
                  Quick Guide
                </span>
              </div>
              <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
                <div className={`${s.alert} ${s.alertInfo}`} style={{ marginBottom: '0.75rem' }}>
                  <i className="fas fa-clipboard-list" />
                  <span style={{ fontSize: '0.82rem' }}><strong>Required:</strong> Employee ID, Employee Type, First &amp; Last Name</span>
                </div>
                <ul style={{ fontSize: '0.82rem', color: '#374151', paddingLeft: '1.1rem', lineHeight: 1.9, margin: '0 0 0.75rem' }}>
                  <li><strong>Employee ID</strong> must be unique</li>
                  <li><strong>Email</strong> required if creating user account</li>
                  <li>Department and Position can be set later</li>
                </ul>
                <div className={`${s.alert} ${s.alertSuccess}`} style={{ marginBottom: 0 }}>
                  <i className="fas fa-shield-alt" />
                  <span style={{ fontSize: '0.78rem' }}>After creating, assign a role via <strong>User Management → User Roles</strong>.</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
