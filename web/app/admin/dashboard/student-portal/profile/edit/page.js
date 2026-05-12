'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStudents } from '@/hooks/useRedux';
import { apiService } from '@/services/api';
import s from '@/styles/student-portal.module.css';

const API_URL   = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const IMAGE_URL = API_URL.replace('/api', '') || 'http://localhost:5000';

const inp = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', color: '#374151', background: '#fff', outline: 'none', boxSizing: 'border-box' };

const EMPTY_FORM = {
  first_name: '', last_name: '', middle_name: '', email: '', phone: '',
  date_of_birth: '', gender: '', address: '', city: '', state: '', country: '',
  guardian_name: '', guardian_relationship: '', guardian_phone: '', guardian_email: '',
};

export default function EditStudentProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { students, updateStudent } = useStudents();
  const redirectUrl = searchParams.get('redirect');

  const [student, setStudent]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [photoFile, setPhotoFile]       = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());
  const [confirmDeletePhoto, setConfirmDeletePhoto] = useState(false);
  const [formData, setFormData]         = useState(EMPTY_FORM);

  const populate = (data) => setFormData({
    first_name: data.first_name || '', last_name: data.last_name || '',
    middle_name: data.middle_name || '', email: data.email || '',
    phone: data.phone || '',
    date_of_birth: data.date_of_birth ? data.date_of_birth.split('T')[0] : '',
    gender: data.gender || '', address: data.address || '',
    city: data.city || '', state: data.state || '', country: data.country || '',
    guardian_name: data.guardian_name || '', guardian_relationship: data.guardian_relationship || '',
    guardian_phone: data.guardian_phone || '', guardian_email: data.guardian_email || '',
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const fromStore = students.find((st) => st.email === student?.email);
      if (fromStore) { setStudent(fromStore); populate(fromStore); return; }
      const res = await apiService.get('/students/me');
      setStudent(res.data); populate(res.data);
    } catch { setError('Failed to load profile'); }
    finally { setLoading(false); }
  }, [students, student?.email]);

  useEffect(() => { if (status === 'authenticated') fetchProfile(); }, [status, fetchProfile]);

  const photoUrl = useMemo(() => {
    if (!student?.profile_photo) return null;
    return `${IMAGE_URL}${student.profile_photo}?t=${imageRefreshKey}`;
  }, [student?.profile_photo, imageRefreshKey]);

  const handleChange = (e) => { setFormData(p => ({ ...p, [e.target.name]: e.target.value })); setError(''); setSuccess(''); };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image size must be less than 5MB'); return; }
    setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); setError('');
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) { setError('Please select a photo first'); return; }
    try {
      setUploading(true); setError('');
      const fd = new FormData(); fd.append('profile_photo', photoFile);
      const res = await apiService.post(`/students/${student.id}/upload-photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Profile photo uploaded successfully!');
      const newUrl = res.data?.data?.profile_photo || res.data?.profile_photo;
      if (newUrl) { setStudent(p => ({ ...p, profile_photo: newUrl })); setImageRefreshKey(Date.now()); }
      setPhotoFile(null); setPhotoPreview(null);
      setTimeout(fetchProfile, 1000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to upload photo'); }
    finally { setUploading(false); }
  };

  const handleDeletePhoto = async () => {
    try {
      setUploading(true); setError('');
      await apiService.delete(`/students/${student.id}/delete-photo`);
      setSuccess('Profile photo deleted.');
      setStudent(p => ({ ...p, profile_photo: null }));
      setConfirmDeletePhoto(false);
      setTimeout(fetchProfile, 1000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to delete photo'); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.email) { setError('First name, last name, and email are required'); return; }
    try {
      setSaving(true); setError('');
      updateStudent({ id: student.id, data: formData });
      setSuccess('Profile updated successfully!');
      setTimeout(() => router.push(redirectUrl || '/admin/dashboard/student-portal/profile'), 2000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to update profile'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  if (!student) return <div className={s.wrap}><div className={s.alertWarning}><i className="fas fa-info-circle" style={{ marginRight: 8 }} />Profile not found.</div></div>;

  const Section = ({ icon, color, bg, title, children }) => (
    <div className={s.formSection}>
      <div className={s.formSectionHead}>
        <div className={s.iconBox} style={{ background: bg, color }}><i className={icon} /></div>
        <span className={s.formSectionTitle}>{title}</span>
      </div>
      <div className={s.formSectionBody}>{children}</div>
    </div>
  );

  const lbl = (text, required) => (
    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>
      {text}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
    </label>
  );

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-edit" /></span>
            Edit Profile
          </h1>
          <p className={s.pageSub}>Update your personal information</p>
        </div>
        <Link href="/admin/dashboard/student-portal/profile" className={s.btnOutline}><i className="fas fa-arrow-left" />Back to Profile</Link>
      </div>

      {success && <div className={`${s.alertSuccess}`} style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span><i className="fas fa-check-circle" style={{ marginRight: 8 }} />{success}</span><button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }}>×</button></div>}
      {error   && <div className={`${s.alertDanger}`}  style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span><i className="fas fa-exclamation-triangle" style={{ marginRight: 8 }} />{error}</span><button onClick={() => setError('')}   style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}>×</button></div>}

      {redirectUrl && !student?.profile_photo && (
        <div className={s.alertWarning} style={{ marginBottom: '1rem' }}>
          <i className="fas fa-exclamation-circle" style={{ marginRight: 8 }} />
          <strong>Profile Photo Required:</strong> Your photo is needed for exam card generation. Please upload it below.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

          {/* Main form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <Section icon="fas fa-user" color="#2563eb" bg="#eff6ff" title="Personal Information">
              <div style={{ marginBottom: '1rem' }}>
                {lbl('Student ID')}
                <input type="text" value={student.student_id || ''} disabled style={{ ...inp, background: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed' }} />
                <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>Student ID cannot be changed</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  {lbl('First Name', true)}
                  <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required style={inp} />
                </div>
                <div>
                  {lbl('Last Name', true)}
                  <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required style={inp} />
                </div>
                <div>
                  {lbl('Middle Name')}
                  <input type="text" name="middle_name" value={formData.middle_name} onChange={handleChange} style={inp} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  {lbl('Gender')}
                  <select name="gender" value={formData.gender} onChange={handleChange} style={inp}>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  {lbl('Date of Birth')}
                  <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} max={new Date().toISOString().split('T')[0]} style={inp} />
                </div>
              </div>
            </Section>

            <Section icon="fas fa-address-book" color="#0891b2" bg="#e0f2fe" title="Contact Information">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  {lbl('Email', true)}
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inp} />
                </div>
                <div>
                  {lbl('Phone')}
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+234 XXX XXX XXXX" style={inp} />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                {lbl('Address')}
                <textarea name="address" value={formData.address} onChange={handleChange} rows={2} placeholder="Street address" style={{ ...inp, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>{lbl('City')}<input type="text" name="city"    value={formData.city}    onChange={handleChange} style={inp} /></div>
                <div>{lbl('State')}<input type="text" name="state"   value={formData.state}   onChange={handleChange} style={inp} /></div>
                <div>{lbl('Country')}<input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Nigeria" style={inp} /></div>
              </div>
            </Section>

            <Section icon="fas fa-user-friends" color="#d97706" bg="#fef3c7" title="Guardian / Parent Information">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  {lbl('Guardian Name')}
                  <input type="text" name="guardian_name" value={formData.guardian_name} onChange={handleChange} placeholder="Full name" style={inp} />
                </div>
                <div>
                  {lbl('Relationship')}
                  <select name="guardian_relationship" value={formData.guardian_relationship} onChange={handleChange} style={inp}>
                    <option value="">Select</option>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="guardian">Guardian</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  {lbl('Guardian Phone')}
                  <input type="tel" name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} placeholder="+234 XXX XXX XXXX" style={inp} />
                </div>
                <div>
                  {lbl('Guardian Email')}
                  <input type="email" name="guardian_email" value={formData.guardian_email} onChange={handleChange} placeholder="guardian@example.com" style={inp} />
                </div>
              </div>
            </Section>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Photo upload */}
            <div className={s.photoWrap}>
              <div className={s.cardHeader}><span className={s.cardTitle}><i className="fas fa-camera" style={{ color: '#2563eb', marginRight: 8 }} />Profile Photo</span></div>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                {photoPreview ? (
                  <Image src={photoPreview} alt="Preview" width={130} height={130} unoptimized style={{ borderRadius: '50%', objectFit: 'cover', border: '4px solid #2563eb', marginBottom: '0.75rem', display: 'block', margin: '0 auto 0.75rem' }} />
                ) : photoUrl ? (
                  <Image src={photoUrl} alt="Profile" width={130} height={130} unoptimized style={{ borderRadius: '50%', objectFit: 'cover', border: '4px solid #e5eaf2', marginBottom: '0.75rem', display: 'block', margin: '0 auto 0.75rem' }} />
                ) : (
                  <div className={s.photoAvatar} style={{ width: 130, height: 130, fontSize: '3rem', marginBottom: '0.75rem', margin: '0 auto 0.75rem' }}>
                    {formData.first_name?.[0]?.toUpperCase() || <i className="fas fa-user" />}
                  </div>
                )}
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{formData.first_name} {formData.last_name}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem' }}>{student.schema_display_name}</div>

                <input type="file" id="photoInput" accept="image/*" onChange={handlePhotoChange} disabled={uploading} style={{ ...inp, marginBottom: '0.25rem' }} />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 0.75rem' }}>Max 5MB · JPG, PNG, GIF</p>

                {photoFile && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <button type="button" className={s.btnGreen} style={{ justifyContent: 'center' }} onClick={handlePhotoUpload} disabled={uploading}>
                      {uploading ? <><span className="spinner-border spinner-border-sm" />Uploading…</> : <><i className="fas fa-upload" />Upload Photo</>}
                    </button>
                    <button type="button" className={s.btnOutline} style={{ justifyContent: 'center' }} onClick={() => { setPhotoFile(null); setPhotoPreview(null); document.getElementById('photoInput').value = ''; }} disabled={uploading}>
                      <i className="fas fa-times" />Cancel
                    </button>
                  </div>
                )}
                {student.profile_photo && !photoFile && (
                  <button type="button" onClick={() => setConfirmDeletePhoto(true)} disabled={uploading} style={{ background: 'none', border: '1.5px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '0.4rem 1rem', fontSize: '0.8rem', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <i className="fas fa-trash" />Delete Photo
                  </button>
                )}
              </div>
            </div>

            {/* Save */}
            <div className={s.card}>
              <div className={s.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem' }}>
                <button type="submit" className={s.btnPrimary} style={{ justifyContent: 'center', padding: '0.75rem', fontSize: '0.95rem' }} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm" />Saving…</> : <><i className="fas fa-save" />Save Changes</>}
                </button>
                <Link href="/admin/dashboard/student-portal/profile" className={s.btnOutline} style={{ justifyContent: 'center' }}>
                  <i className="fas fa-times" />Cancel
                </Link>
                <div className={s.alertInfo} style={{ fontSize: '0.78rem' }}>
                  <i className="fas fa-info-circle" />Fields marked <span style={{ color: '#dc2626' }}>*</span> are required
                </div>
              </div>
            </div>
          </div>

        </div>
      </form>

      {/* Confirm Delete Photo */}
      {confirmDeletePhoto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 380, padding: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e3a5f', marginBottom: '0.75rem' }}>
              <i className="fas fa-trash" style={{ color: '#dc2626', marginRight: 8 }} />Delete Profile Photo
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1.25rem' }}>Are you sure you want to delete your profile photo? This cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDeletePhoto(false)} className={s.btnOutline} disabled={uploading}><i className="fas fa-times" />Cancel</button>
              <button onClick={handleDeletePhoto} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }} disabled={uploading}>
                {uploading ? <><span className="spinner-border spinner-border-sm" />Deleting…</> : <><i className="fas fa-trash" />Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
