'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/hooks/useRedux';
import { getImageUrl } from '@/utils/imageUtils';
import styles from './login.module.css';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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
          console.log('Could not fetch school settings (expected on login page):', fetchError);
        }
      };
      fetchSettings();
    }
  }, [isClient, schoolSettings, fetchSchoolSettings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid username or password');
      } else if (result?.ok) {
        const session = await getSession();
        console.log('Login successful, session:', session);
        console.log('Redirecting to dashboard...');
        router.push('/admin/dashboard');
      }
    } catch (loginError) {
      console.error('Login error:', loginError);
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageShell}>
      <div className={styles.loginFrame}>
        <section className={styles.showcasePanel}>
          <div className={styles.showcaseOverlay}></div>
          <div className={styles.showcaseContent}>
            <span className={styles.showcaseBadge}>Admissions portal</span>
            <h2 className={styles.showcaseTitle}>Online Admission into {schoolName}</h2>
            <p className={styles.showcaseText}>
              Manage primary and secondary school admissions and keep each stage of the admission process clear, organized, and secure.
            </p>

            <div className={styles.showcaseHighlights}>
              <div className={styles.highlightCard}>
                <i className="fas fa-user-graduate"></i>
                <span>Student-friendly onboarding</span>
              </div>
              <div className={styles.highlightCard}>
                <i className="fas fa-file-signature"></i>
                <span>Application review and approval</span>
              </div>
              <div className={styles.highlightCard}>
                <i className="fas fa-shield-alt"></i>
                <span>Secure access for Prospective Applicants</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.formPanel}>
          <div className={styles.formCard}>
            <div className="mb-4 text-center text-md-start">
              <div className="mb-3">
                {logoSrc && failedLogoSrc !== logoSrc ? (
                  <Image
                    src={logoSrc}
                    alt="School Logo"
                    width={180}
                    height={48}
                    unoptimized
                    style={{ height: '48px', width: 'auto' }}
                    onError={() => setFailedLogoSrc(logoSrc)}
                  />
                ) : null}
                <i
                  className="fas fa-graduation-cap text-primary"
                  style={{ fontSize: '2rem', display: logoSrc && failedLogoSrc !== logoSrc ? 'none' : 'inline' }}
                ></i>
              </div>
              <h2 className={styles.formTitle}>{schoolName}</h2>
              <p className={styles.formSubtitle}>Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="needs-validation" noValidate>
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
                    placeholder="Enter your username"
                    required
                  />
                </div>
                <div className="invalid-feedback">
                  Please provide a valid username.
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
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    type="button"
                    onClick={() => {
                      const passwordInput = document.getElementById('password');
                      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
                    }}
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                </div>
                <div className="invalid-feedback">
                  Please provide a valid password.
                </div>
              </div>

              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <label className="form-check-label small" htmlFor="rememberMe">
                  Remember me
                </label>
              </div>

              {error && (
                <div className="alert alert-danger small mb-3" role="alert">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
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
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="mt-3 text-center text-md-start">
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
