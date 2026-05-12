'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudents } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';
import s from '@/styles/admin-portal.module.css';

const fmtDt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function ViewStudentPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { students, loading: studentsLoading, deleteStudent } = useStudents();

  const [student, setStudent]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState('');
  const [notice, setNotice]     = useState('');
  const loadedRef = useRef(false);

  const fetchStudent = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const found = students.find(st => st.id === parseInt(params.id, 10));
      if (found) { setStudent(found); return; }
      const res = await apiService.get(API_ENDPOINTS.STUDENTS.GET_BY_ID(params.id));
      setStudent(res.data);
    } catch { setError('Failed to load student details'); }
    finally { setLoading(false); }
  }, [students, params.id]);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && params.id && !loadedRef.current) {
      loadedRef.current = true; fetchStudent();
    }
  }, [status, session?.user?.id, params.id, fetchStudent]);

  const handleDelete = () => {
    if (!window.confirm(`Delete ${student?.first_name} ${student?.last_name}? This cannot be undone.`)) return;
    setDeleting(true);
    deleteStudent(params.id);
    setNotice('Student deleted.');
    setTimeout(() => router.push('/admin/dashboard/students'), 1500);
  };

  if (status === 'loading' || permLoading || studentsLoading || loading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('student.read')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to view student details.</div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error || 'Student not found.'}</div>
        <Link href="/admin/dashboard/students" className={`${s.btn} ${s.btnOutline}`} style={{ marginTop: '0.75rem' }}><i className="fas fa-arrow-left" />Back to Students</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-user-graduate" /></span>
            Student Details
          </h1>
          <p className={s.pageSub}>{student.first_name} {student.last_name}{student.student_id ? ` — ${student.student_id}` : ''}</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/students" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Students
          </Link>
          {hasPermission('student.update') && (
            <Link href={`/admin/dashboard/students/${params.id}/edit`} className={`${s.btn} ${s.btnPrimary}`}>
              <i className="fas fa-edit" />Edit
            </Link>
          )}
          {hasPermission('student.delete') && (
            <button onClick={handleDelete} className={`${s.btn} ${s.btnDanger}`} disabled={deleting}>
              {deleting ? <><span className="spinner-border spinner-border-sm" />Deleting…</> : <><i className="fas fa-trash" />Delete</>}
            </button>
          )}
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

        {/* Main column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Basic Information */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <i className="fas fa-user" style={{ fontSize: '0.75rem' }} />
                </span>
                Basic Information
              </span>
              <span className={`${s.badge} ${student.status === 'active' ? s.badgeActive : s.badgeInactive}`}>{student.status}</span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              {[
                { label: 'Student ID',   value: student.student_id ? <span className={`${s.badge} ${s.badgeInfo}`}>{student.student_id}</span> : '—' },
                { label: 'First Name',   value: student.first_name },
                { label: 'Last Name',    value: student.last_name },
                ...(student.middle_name ? [{ label: 'Middle Name', value: student.middle_name }] : []),
                { label: 'Gender',       value: student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : 'Not specified' },
                { label: 'Date of Birth', value: student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                { label: 'School Level', value: student.schema_display_name || student.schema_name || '—' },
              ].map(row => (
                <div key={row.label} className={s.infoRow}>
                  <span className={s.infoLabel}>{row.label}</span>
                  <span className={s.infoValue}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2' }}>
                  <i className="fas fa-address-book" style={{ fontSize: '0.75rem' }} />
                </span>
                Contact Information
              </span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              {[
                { label: 'Email',   value: student.email || 'Not provided' },
                { label: 'Phone',   value: student.phone || 'Not provided' },
                { label: 'Address', value: student.address || 'Not provided' },
                { label: 'City',    value: student.city || '—' },
                { label: 'State',   value: student.state || '—' },
                { label: 'Country', value: student.country || '—' },
              ].map(row => (
                <div key={row.label} className={s.infoRow}>
                  <span className={s.infoLabel}>{row.label}</span>
                  <span className={s.infoValue}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Guardian / Emergency Contact */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: '#fef3c7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                  <i className="fas fa-user-friends" style={{ fontSize: '0.75rem' }} />
                </span>
                Guardian / Emergency Contact
              </span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              {[
                { label: 'Guardian Name',     value: student.guardian_name || 'Not provided' },
                { label: 'Relationship',      value: student.guardian_relationship || 'Not specified' },
                { label: 'Guardian Phone',    value: student.guardian_phone || 'Not provided' },
                { label: 'Guardian Email',    value: student.guardian_email || 'Not provided' },
              ].map(row => (
                <div key={row.label} className={s.infoRow}>
                  <span className={s.infoLabel}>{row.label}</span>
                  <span className={s.infoValue}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Previous School (conditional) */}
          {(student.previous_school || student.graduation_year) && (
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    <i className="fas fa-school" style={{ fontSize: '0.75rem' }} />
                  </span>
                  Previous School
                </span>
              </div>
              <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
                {[
                  { label: 'School Name', value: student.previous_school || 'Not provided' },
                  { label: 'Year Left',   value: student.graduation_year || '—' },
                ].map(row => (
                  <div key={row.label} className={s.infoRow}>
                    <span className={s.infoLabel}>{row.label}</span>
                    <span className={s.infoValue}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Quick Actions */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-bolt" style={{ color: '#d97706' }} />Quick Actions</span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {hasPermission('student.update') && (
                <Link href={`/admin/dashboard/students/${params.id}/edit`} className={`${s.btn} ${s.btnPrimary}`} style={{ justifyContent: 'flex-start' }}>
                  <i className="fas fa-edit" />Edit Student
                </Link>
              )}
              {!student.user_id && hasPermission('user.create') && (
                <Link href={`/admin/dashboard/students/${params.id}/create-login`} className={`${s.btn} ${s.btnGreen}`} style={{ justifyContent: 'flex-start' }}>
                  <i className="fas fa-user-plus" />Create Login Account
                </Link>
              )}
              {student.user_id && (
                <Link href={`/admin/dashboard/users/${student.user_id}`} className={`${s.btn} ${s.btnOutline}`} style={{ justifyContent: 'flex-start' }}>
                  <i className="fas fa-user-cog" />View User Account
                </Link>
              )}
              {hasPermission('student.delete') && (
                <button onClick={handleDelete} className={`${s.btn} ${s.btnDanger}`} style={{ justifyContent: 'flex-start' }} disabled={deleting}>
                  <i className="fas fa-trash" />Delete Student
                </button>
              )}
              <Link href="/admin/dashboard/students" className={`${s.btn} ${s.btnOutline}`} style={{ justifyContent: 'flex-start' }}>
                <i className="fas fa-arrow-left" />Back to List
              </Link>
            </div>
          </div>

          {/* System Access */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: '#d1fae5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <i className="fas fa-user-lock" style={{ fontSize: '0.75rem' }} />
                </span>
                Portal Access
              </span>
              <span className={`${s.badge} ${student.user_id ? s.badgeActive : s.badgeInactive}`}>{student.user_id ? 'Active' : 'None'}</span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              {student.user_id ? (
                <>
                  <div className={`${s.alert} ${s.alertSuccess}`} style={{ marginBottom: '0.75rem' }}>
                    <i className="fas fa-check-circle" />
                    <span style={{ fontSize: '0.82rem' }}>This student has an active portal account.</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <Link href={`/admin/dashboard/users/${student.user_id}`} className={`${s.btn} ${s.btnOutline}`} style={{ justifyContent: 'flex-start', fontSize: '0.82rem' }}>
                      <i className="fas fa-user-cog" />View Account
                    </Link>
                    {hasPermission('role.assign') && (
                      <Link href="/admin/dashboard/users/roles" className={`${s.btn} ${s.btnOutline}`} style={{ justifyContent: 'flex-start', fontSize: '0.82rem' }}>
                        <i className="fas fa-shield-alt" />Manage Role
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                <div className={s.emptyState} style={{ padding: '1.25rem 0' }}>
                  <div className={s.emptyIcon} style={{ background: '#f1f5f9', color: '#9ca3af' }}><i className="fas fa-user-slash" /></div>
                  <div className={s.emptyTitle}>No Portal Access</div>
                  <p className={s.emptySub}>This student doesn&apos;t have a login account yet.</p>
                  {hasPermission('user.create') && (
                    <Link href={`/admin/dashboard/students/${params.id}/create-login`} className={`${s.btn} ${s.btnGreen}`}>
                      <i className="fas fa-user-plus" />Create Account
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Record Info */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}><i className="fas fa-info-circle" style={{ color: '#0891b2' }} />Record Information</span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem' }}>
              {[
                { label: 'Created By', value: student.created_by_username || 'System' },
                { label: 'Created',    value: fmtDt(student.created_at) },
                { label: 'Updated',    value: fmtDt(student.updated_at) },
              ].map(row => (
                <div key={row.label} className={s.infoRow}>
                  <span className={s.infoLabel}>{row.label}</span>
                  <span className={s.infoValue}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
