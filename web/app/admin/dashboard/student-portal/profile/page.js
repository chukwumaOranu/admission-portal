'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { API_ENDPOINTS, apiService } from '@/services/api';
import s from '@/styles/student-portal.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const IMAGE_URL = API_URL.replace('/api', '') || 'http://localhost:5000';

const calcAge = (dob) => {
  if (!dob) return null;
  const today = new Date(), birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() - birth.getMonth() < 0 || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function StudentProfile() {
  const { status } = useSession();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await apiService.get(API_ENDPOINTS.STUDENTS.GET_ME);
      setStudent(res.data || res);
    } catch { setError('Failed to load profile. Please try again.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (status === 'authenticated') fetchProfile(); }, [status, fetchProfile]);

  const photoUrl = useMemo(() => student?.profile_photo ? `${IMAGE_URL}${student.profile_photo}` : null, [student?.profile_photo]);

  if (loading) return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status"><span className="visually-hidden">Loading…</span></div></div>;
  if (error)   return <div className={s.wrap}><div className={s.alertDanger}><i className="fas fa-exclamation-triangle me-2" />{error}</div></div>;
  if (!student) return <div className={s.wrap}><div className={s.alertWarning}><i className="fas fa-info-circle me-2" />Profile not found. Please contact administrator.</div></div>;

  const Section = ({ icon, color, bg, title, children }) => (
    <div className={s.formSection}>
      <div className={s.formSectionHead}>
        <div className={s.iconBox} style={{ background: bg, color }}><i className={icon} /></div>
        <span className={s.formSectionTitle}>{title}</span>
      </div>
      <div className={s.formSectionBody}>{children}</div>
    </div>
  );

  const Field = ({ label, value }) => (
    <div className="col-md-6 mb-3">
      <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.3rem' }}>{label}</div>
      <div style={{ fontWeight: 500, color: '#1e293b' }}>{value || '—'}</div>
    </div>
  );

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-user" /></span>
            My Profile
          </h1>
          <p className={s.pageSub}>Your personal information and account details</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/admin/dashboard/student-portal" className={s.btnOutline}><i className="fas fa-arrow-left" />Dashboard</Link>
          <Link href="/admin/dashboard/student-portal/profile/edit" className={s.btnPrimary}><i className="fas fa-edit" />Edit Profile</Link>
        </div>
      </div>

      <div className="row g-4">
        {/* Main */}
        <div className="col-lg-8">
          <Section icon="fas fa-user" color="#2563eb" bg="#eff6ff" title="Personal Information">
            <div className="row">
              <Field label="Student ID" value={<strong style={{ color: '#2563eb', fontSize: '1.05rem' }}>{student.student_id}</strong>} />
              <Field label="School Level" value={<span className={`${s.badge} ${s.badgeInfo}`}>{student.schema_display_name || student.schema_name}</span>} />
              <Field label="First Name" value={student.first_name} />
              <Field label="Last Name" value={student.last_name} />
              {student.middle_name && <Field label="Middle Name" value={student.middle_name} />}
              <Field label="Gender" value={student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : null} />
              <Field label="Date of Birth" value={student.date_of_birth ? `${fmt(student.date_of_birth)}${calcAge(student.date_of_birth) ? ` (Age ${calcAge(student.date_of_birth)})` : ''}` : null} />
            </div>
          </Section>

          <Section icon="fas fa-address-book" color="#0891b2" bg="#e0f2fe" title="Contact Information">
            <div className="row">
              <Field label="Email" value={student.email} />
              <Field label="Phone" value={student.phone} />
              <div className="col-12 mb-3">
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.3rem' }}>Address</div>
                <div style={{ fontWeight: 500, color: '#1e293b' }}>{student.address || '—'}</div>
              </div>
              <Field label="City" value={student.city} />
              <Field label="State" value={student.state} />
              <Field label="Country" value={student.country} />
            </div>
          </Section>

          <Section icon="fas fa-user-friends" color="#d97706" bg="#fef3c7" title="Guardian / Parent Information">
            <div className="row">
              <Field label="Guardian Name" value={student.guardian_name} />
              <Field label="Relationship" value={student.guardian_relationship} />
              <Field label="Guardian Phone" value={student.guardian_phone} />
              <Field label="Guardian Email" value={student.guardian_email} />
            </div>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          <div className={s.photoWrap}>
            <div className={s.cardHeader}><span className={s.cardTitle}><i className="fas fa-camera me-2" style={{ color: '#2563eb' }} />Photo</span></div>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              {photoUrl ? (
                <Image src={photoUrl} alt="Profile" width={120} height={120} unoptimized
                  className="rounded-circle" style={{ objectFit: 'cover', border: '4px solid #e5eaf2', marginBottom: '0.75rem' }} />
              ) : (
                <div className={s.photoAvatar} style={{ marginBottom: '0.75rem' }}>
                  {student.first_name?.[0]?.toUpperCase() || <i className="fas fa-user" />}
                </div>
              )}
              <div style={{ fontWeight: 600, color: '#1e293b' }}>{student.first_name} {student.last_name}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem' }}>{student.schema_display_name}</div>
              <Link href="/admin/dashboard/student-portal/profile/edit" className={s.btnPrimary} style={{ width: '100%', justifyContent: 'center' }}>
                <i className="fas fa-camera" />Update Photo
              </Link>
            </div>
          </div>

          <div className={s.card}>
            <div className={s.cardHeader}><span className={s.cardTitle}><i className="fas fa-shield-alt me-2" style={{ color: '#059669' }} />Account Status</span></div>
            <div className={s.cardBody}>
              <div className={s.infoRow}>
                <span className={s.infoLabel}>Status</span>
                <span className={`${s.badge} ${s.badgeActive}`}><i className="fas fa-circle" style={{ fontSize: '0.5rem' }} />Active</span>
              </div>
              <div className={s.infoRow}>
                <span className={s.infoLabel}>Member Since</span>
                <span className={s.infoValue}>{fmt(student.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
