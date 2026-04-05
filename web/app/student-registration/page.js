'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import styles from './student-registration.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const API_BASE_URL = API_URL.replace(/\/api\/?$/, '');

const defaultFormState = {
  schema_id: '',
  first_name: '',
  last_name: '',
  middle_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  gender: '',
  address: '',
  city: '',
  state: '',
  country: 'Nigeria',
  postal_code: '',
  guardian_name: '',
  guardian_phone: '',
  guardian_email: '',
  guardian_relationship: '',
  previous_school: '',
  graduation_year: ''
};

const getInputType = (fieldType) => {
  if (fieldType === 'number') return 'number';
  if (fieldType === 'email') return 'email';
  if (fieldType === 'tel') return 'tel';
  if (fieldType === 'date') return 'date';
  return 'text';
};

export default function PublicStudentRegistrationPage() {
  const [formData, setFormData] = useState(defaultFormState);
  const [customData, setCustomData] = useState({});
  const [schemas, setSchemas] = useState([]);
  const [schoolSettings, setSchoolSettings] = useState(null);
  const [loadingSchemas, setLoadingSchemas] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchSchemas = async () => {
      try {
        setLoadingSchemas(true);
        const response = await fetch(`${API_URL}/students/public/schemas`);
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || 'Failed to load registration schemas');
        }

        setSchemas(payload.data?.schemas || []);
      } catch (fetchError) {
        setError(fetchError.message || 'Failed to load student registration form');
      } finally {
        setLoadingSchemas(false);
      }
    };

    const fetchSchoolSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/settings/school`);
        const payload = await response.json();
        if (response.ok && payload.success) {
          setSchoolSettings(payload.data || null);
        }
      } catch (_) {
        // keep default heading if unavailable
      }
    };

    fetchSchoolSettings();
    fetchSchemas();
  }, []);

  const selectedSchema = useMemo(
    () => schemas.find((schema) => String(schema.id) === String(formData.schema_id)) || null,
    [schemas, formData.schema_id]
  );

  const selectedSchemaFields = selectedSchema?.fields || [];
  const schoolName = schoolSettings?.school_name || 'Student Admissions';
  const schoolMotto = schoolSettings?.school_motto || 'Complete the form and await admin approval.';
  const schoolLogo = schoolSettings?.school_logo
    ? `${API_BASE_URL}/${String(schoolSettings.school_logo).replace(/^\/+/, '')}`
    : null;
  const totalCustomFields = selectedSchemaFields.length;

  const handleBasicFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccessMessage('');
  };

  const handleCustomFieldChange = (event, field) => {
    const { value, checked } = event.target;
    const nextValue = field.field_type === 'checkbox' ? checked : value;
    setCustomData((prev) => ({ ...prev, [field.field_name]: nextValue }));
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.schema_id) {
      setError('Please select a student registration category.');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_URL}/students/public/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          custom_data: customData
        })
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to submit registration');
      }

      setSuccessMessage(
        `Registration submitted successfully. Reference: ${payload.data?.student_id || 'N/A'}. The admin will contact you after review.`
      );
      setFormData(defaultFormState);
      setCustomData({});
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit registration');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.pageShell}>
      <div className={styles.registrationFrame}>
        <section className={styles.showcasePanel}>
          <div className={styles.showcaseOverlay}></div>
          <div className={styles.showcaseContent}>
            <span className={styles.showcaseBadge}>Public Admissions</span>
            <h1 className={styles.showcaseTitle}>Start an application.</h1>
            <p className={styles.showcaseText}>
              Complete the first admission form and wait for the school to review your submission and share the next steps.
            </p>
            <div className={styles.showcaseHighlights}>
              <div className={styles.highlightCard}>
                <i className="fas fa-file-signature"></i>
                <div>
                  <strong>Complete the form</strong>
                  <span>Pick a category and enter the required details.</span>
                </div>
              </div>
              <div className={styles.highlightCard}>
                <i className="fas fa-user-check"></i>
                <div>
                  <strong>Admissions review</strong>
                  <span>The school reviews your application.</span>
                </div>
              </div>
              <div className={styles.highlightCard}>
                <i className="fas fa-key"></i>
                <div>
                  <strong>Receive login details</strong>
                  <span>You will be contacted when portal access is ready.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.formPanel}>
          <div className={styles.formCard}>
            <div className="mb-4">
              <div className={styles.formBrand}>
                {schoolLogo ? (
                  <Image
                    src={schoolLogo}
                    alt={`${schoolName} logo`}
                    width={64}
                    height={64}
                    unoptimized
                    style={{ objectFit: 'contain' }}
                  />
                ) : (
                  <div className={styles.schoolIcon}>
                    <i className="fas fa-school"></i>
                  </div>
                )}
              </div>
              <h2 className={styles.formTitle}>{schoolName}</h2>
              <p className={styles.formSubtitle}>{schoolMotto}</p>
            </div>

            {loadingSchemas && (
              <div className="alert alert-info mb-4">Loading registration form...</div>
            )}

            {!loadingSchemas && error && (
              <div className="alert alert-danger mb-4">{error}</div>
            )}

            {!loadingSchemas && successMessage && (
              <div className="alert alert-success mb-4">
                <p className="mb-2">{successMessage}</p>
                <p className="mb-0">Please wait for the school admin to send the next admission instructions.</p>
              </div>
            )}

            {!loadingSchemas && (
              <form onSubmit={handleSubmit}>
                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <h3>Application Category</h3>
                    <p>Choose the school level or registration type that matches this application.</p>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-7">
                      <label className="form-label">Category / School Level *</label>
                      <select
                        name="schema_id"
                        className="form-select"
                        value={formData.schema_id}
                        onChange={handleBasicFieldChange}
                        required
                      >
                        <option value="">Select category</option>
                        {schemas.map((schema) => (
                          <option key={schema.id} value={schema.id}>
                            {schema.display_name || schema.schema_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-5">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={formData.email}
                        onChange={handleBasicFieldChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <h3>Student Information</h3>
                    <p>Enter the applicant&apos;s basic details exactly as they should appear in school records.</p>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">First Name *</label>
                      <input type="text" name="first_name" className="form-control" value={formData.first_name} onChange={handleBasicFieldChange} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Last Name *</label>
                      <input type="text" name="last_name" className="form-control" value={formData.last_name} onChange={handleBasicFieldChange} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Middle Name</label>
                      <input type="text" name="middle_name" className="form-control" value={formData.middle_name} onChange={handleBasicFieldChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Phone</label>
                      <input type="tel" name="phone" className="form-control" value={formData.phone} onChange={handleBasicFieldChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Date of Birth</label>
                      <input type="date" name="date_of_birth" className="form-control" value={formData.date_of_birth} onChange={handleBasicFieldChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Gender</label>
                      <select name="gender" className="form-select" value={formData.gender} onChange={handleBasicFieldChange}>
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <div className={styles.sectionHeader}>
                    <h3>Parent / Guardian Information</h3>
                    <p>These contact details will be used for admission communication and login delivery.</p>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Guardian Name</label>
                      <input type="text" name="guardian_name" className="form-control" value={formData.guardian_name} onChange={handleBasicFieldChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Guardian Phone</label>
                      <input type="tel" name="guardian_phone" className="form-control" value={formData.guardian_phone} onChange={handleBasicFieldChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Guardian Email</label>
                      <input type="email" name="guardian_email" className="form-control" value={formData.guardian_email} onChange={handleBasicFieldChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Guardian Relationship</label>
                      <input type="text" name="guardian_relationship" className="form-control" value={formData.guardian_relationship} onChange={handleBasicFieldChange} />
                    </div>
                  </div>
                </div>

                {selectedSchemaFields.length > 0 && (
                  <div className={styles.formSection}>
                    <div className={styles.sectionHeader}>
                      <h3>Additional Information</h3>
                      <p>These questions are specific to the selected category.</p>
                    </div>
                    <div className="row g-3">
                      {selectedSchemaFields.map((field) => (
                        <div className="col-md-6" key={field.id}>
                          <label className="form-label">
                            {field.field_label}
                            {field.is_required ? ' *' : ''}
                          </label>

                          {(field.field_type === 'select' || field.field_type === 'radio') && (
                            <select
                              className="form-select"
                              value={customData[field.field_name] || ''}
                              required={field.is_required}
                              onChange={(event) => handleCustomFieldChange(event, field)}
                            >
                              <option value="">Select option</option>
                              {(field.field_options || []).map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          )}

                          {field.field_type === 'textarea' && (
                            <textarea
                              className="form-control"
                              rows={3}
                              value={customData[field.field_name] || ''}
                              required={field.is_required}
                              onChange={(event) => handleCustomFieldChange(event, field)}
                            />
                          )}

                          {field.field_type === 'checkbox' && (
                            <div className="form-check mt-2">
                              <input
                                id={`custom-${field.id}`}
                                type="checkbox"
                                className="form-check-input"
                                checked={!!customData[field.field_name]}
                                onChange={(event) => handleCustomFieldChange(event, field)}
                              />
                              <label className="form-check-label" htmlFor={`custom-${field.id}`}>
                                {field.help_text || 'Check to confirm'}
                              </label>
                            </div>
                          )}

                          {!['select', 'radio', 'textarea', 'checkbox'].includes(field.field_type) && (
                            <input
                              type={getInputType(field.field_type)}
                              className="form-control"
                              value={customData[field.field_name] || ''}
                              required={field.is_required}
                              onChange={(event) => handleCustomFieldChange(event, field)}
                            />
                          )}

                          {field.help_text && field.field_type !== 'checkbox' && (
                            <small className="text-muted">{field.help_text}</small>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.submitRow}>
                  <div>
                    <strong>Review before submitting.</strong>
                    <p className="mb-0 text-muted">Incorrect parent contact details may delay communication from the admissions office.</p>
                  </div>
                  <button type="submit" className={`btn btn-primary ${styles.submitButton}`} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Registration'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
