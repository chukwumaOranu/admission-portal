'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSettings } from '@/hooks/useRedux';
import { getImageUrl } from '@/utils/imageUtils';

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

  // Ensure we're on the client side before using Redux
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch school settings only once when component mounts
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
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
        // Get the session to check user data
        const session = await getSession();
        console.log('Login successful, session:', session);
        console.log('Redirecting to dashboard...');
        
        // Redirect to dashboard
        router.push('/admin/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6 col-xl-5">
            <div className="card shadow border-0">
              <div className="card-body p-4">
                {/* Header */}
                <div className="text-center mb-3">
                  <div className="mb-2">
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
                  <h4 className="fw-bold text-dark mb-1">
                    {schoolSettings?.school_name || 'DeepFlux Admissions'}
                  </h4>
                  <p className="text-muted small">Sign in to your account</p>
                </div>

                {/* Login Form */}
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

                  {/* Error Display */}
                  {error && (
                    <div className="alert alert-danger small mb-3" role="alert">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary w-100 mb-3"
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

                <div className="mt-3 text-center">
                  <small className="text-muted">
                    <i className="fas fa-shield-alt me-1"></i>
                    Secure portal for {schoolSettings?.school_name || 'DeepFlux Admissions'}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
