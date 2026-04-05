'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSettings } from '@/hooks/useRedux';
import { getImageUrl } from '@/utils/imageUtils';
import styles from './register.module.css';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    agreeToTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [failedLogoSrc, setFailedLogoSrc] = useState(null);
  const router = useRouter();
  const { schoolSettings, fetchSchoolSettings } = useSettings();
  const logoSrc = schoolSettings?.school_logo ? getImageUrl(schoolSettings.school_logo) : null;
  const schoolName = schoolSettings?.school_name || 'DeepFlux Admissions';

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !schoolSettings) {
      const fetchSettings = async () => {
        try {
          await fetchSchoolSettings();
        } catch (fetchError) {
          console.log('Could not fetch school settings on register page:', fetchError);
        }
      };
      fetchSettings();
    }
  }, [isClient, schoolSettings, fetchSchoolSettings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear messages when user starts typing
    if (error || success) {
      setError('');
      setSuccess('');
    }
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (!formData.agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Registration successful! You can now log in.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageShell}>
      <div className={styles.registerFrame}>
        <section className={styles.showcasePanel}>
          <div className={styles.showcaseOverlay}></div>
          <div className={styles.showcaseContent}>
            <span className={styles.showcaseBadge}>Create account</span>
            <h1 className={styles.showcaseTitle}>Staff Registration.</h1>
            <p className={styles.showcaseText}>
              Set up your account to manage registration, track admission progress, and continue the next stages once the school shares access details.
            </p>
            <div className={styles.showcaseHighlights}>
              <div className={styles.highlightCard}>
                <i className="fas fa-user-check"></i>
                <div>
                  <strong>Create your profile</strong>
                  <span>Use a valid email and a secure password for admission updates.</span>
                </div>
              </div>
              <div className={styles.highlightCard}>
                <i className="fas fa-shield-alt"></i>
                <div>
                  <strong>Secure portal access</strong>
                  <span>Your account gives you a safe way to continue application and payment steps.</span>
                </div>
              </div>
              <div className={styles.highlightCard}>
                <i className="fas fa-sign-in-alt"></i>
                <div>
                  <strong>Return anytime</strong>
                  <span>Sign in later to complete the next part of the admissions process.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.formPanel}>
          <div className={styles.formCard}>
            <div className="mb-4">
              <div className={styles.formBrand}>
                {logoSrc && failedLogoSrc !== logoSrc ? (
                  <Image
                    src={logoSrc}
                    alt={`${schoolName} logo`}
                    width={64}
                    height={64}
                    unoptimized
                    style={{ objectFit: 'contain' }}
                    onError={() => setFailedLogoSrc(logoSrc)}
                  />
                ) : (
                  <i className={`fas fa-graduation-cap ${styles.schoolIcon}`}></i>
                )}
              </div>
              <h2 className={styles.formTitle}>{schoolName}</h2>
              <p className={styles.formSubtitle}>Create your account</p>
            </div>

            <form onSubmit={handleSubmit} className="needs-validation" noValidate>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="firstName" className="form-label small fw-semibold">
                    First Name
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="lastName" className="form-label small fw-semibold">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="username" className="form-label small fw-semibold">
                  Username
                </label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text">
                    <i className="fas fa-user text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label small fw-semibold">
                  Email Address
                </label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text">
                    <i className="fas fa-envelope text-muted"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="phone" className="form-label small fw-semibold">
                  Phone Number
                </label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text">
                    <i className="fas fa-phone text-muted"></i>
                  </span>
                  <input
                    type="tel"
                    className="form-control"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="password" className="form-label small fw-semibold">
                  Password
                </label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text">
                    <i className="fas fa-lock text-muted"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="confirmPassword" className="form-label small fw-semibold">
                  Confirm Password
                </label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text">
                    <i className="fas fa-lock text-muted"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>

              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="agreeToTerms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  required
                />
                <label className="form-check-label small" htmlFor="agreeToTerms">
                  I agree to the <Link href="/terms" className="text-primary">Terms and Conditions</Link>
                </label>
              </div>

              {error && (
                <div className="alert alert-danger small mb-3" role="alert">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success small mb-3" role="alert">
                  <i className="fas fa-check-circle me-2"></i>
                  {success}
                </div>
              )}

              <button
                type="submit"
                className={`btn btn-primary w-100 mb-3 ${styles.submitButton}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus me-2"></i>
                    Create Account
                  </>
                )}
              </button>
            </form>

            <hr className="my-3" />

            <div className="text-center">
              <p className="text-muted mb-2 small">Already have an account?</p>
              <Link href="/login" className="btn btn-outline-primary w-100">
                <i className="fas fa-sign-in-alt me-2"></i>
                Sign In
              </Link>
            </div>

            <div className="mt-3 text-center">
              <small className="text-muted">
                <i className="fas fa-shield-alt me-1"></i>
                Secure portal for {schoolName}
              </small>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
