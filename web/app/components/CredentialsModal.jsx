'use client';

import { useState, useRef } from 'react';

export default function CredentialsModal({ isOpen, onClose, credentials, employeeName }) {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const credentialsRef = useRef(null);

  if (!isOpen || !credentials) return null;

  const handleCopyToClipboard = () => {
    const text = `
=================================
LOGIN CREDENTIALS
=================================

Employee: ${employeeName}
Username: ${credentials.username}
Password: ${credentials.password}
Email: ${credentials.email}

⚠️ IMPORTANT NOTES:
- Please change your password after first login
- Keep these credentials secure
- Contact IT support if you have any issues

=================================
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadPDF = () => {
    // Create text content for download
    const content = `
=================================
LOGIN CREDENTIALS
=================================

Employee: ${employeeName}
Username: ${credentials.username}
Password: ${credentials.password}
Email: ${credentials.email}

⚠️ IMPORTANT NOTES:
- Please change your password after first login
- Keep these credentials secure
- Contact IT support if you have any issues

Generated: ${new Date().toLocaleString()}
=================================
    `.trim();

    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${credentials.username}_credentials_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>Login Credentials - ${employeeName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              line-height: 1.6;
            }
            .header {
              border-bottom: 3px solid #007bff;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .credentials-box {
              background: #f8f9fa;
              border: 2px solid #dee2e6;
              border-radius: 8px;
              padding: 30px;
              margin: 20px 0;
            }
            .credential-item {
              margin: 15px 0;
              padding: 10px;
              background: white;
              border-left: 4px solid #007bff;
            }
            .credential-label {
              font-weight: bold;
              color: #495057;
              display: block;
              margin-bottom: 5px;
            }
            .credential-value {
              font-size: 1.1em;
              color: #212529;
              font-family: 'Courier New', monospace;
            }
            .warning-box {
              background: #fff3cd;
              border: 1px solid #ffc107;
              border-radius: 4px;
              padding: 15px;
              margin-top: 20px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #dee2e6;
              color: #6c757d;
              font-size: 0.9em;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 Login Credentials</h1>
            <p>Employee System Access</p>
          </div>
          
          <div class="credentials-box">
            <div class="credential-item">
              <span class="credential-label">👤 Employee Name:</span>
              <span class="credential-value">${employeeName}</span>
            </div>
            <div class="credential-item">
              <span class="credential-label">🆔 Username:</span>
              <span class="credential-value">${credentials.username}</span>
            </div>
            <div class="credential-item">
              <span class="credential-label">🔑 Password:</span>
              <span class="credential-value">${credentials.password}</span>
            </div>
            <div class="credential-item">
              <span class="credential-label">📧 Email:</span>
              <span class="credential-value">${credentials.email}</span>
            </div>
          </div>

          <div class="warning-box">
            <strong>⚠️ IMPORTANT SECURITY NOTES:</strong>
            <ul>
              <li>You must change your password after first login</li>
              <li>Keep these credentials confidential and secure</li>
              <li>Do not share your password with anyone</li>
              <li>Contact IT support immediately if you suspect unauthorized access</li>
            </ul>
          </div>

          <div class="footer">
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>This is a one-time display. Please save these credentials securely.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop fade show" 
        style={{ zIndex: 1050 }}
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div 
        className="modal fade show d-block" 
        style={{ zIndex: 1055 }}
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header bg-success text-white">
              <h5 className="modal-title">
                <i className="fas fa-check-circle me-2"></i>
                Login Credentials Created
              </h5>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={onClose}
              ></button>
            </div>

            {/* Body */}
            <div className="modal-body">
              <div className="alert alert-warning mb-4">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Important:</strong> This is the ONLY time these credentials will be displayed. 
                Please save them securely before closing this window.
              </div>

              <div className="card bg-light border-primary" ref={credentialsRef}>
                <div className="card-header bg-primary text-white">
                  <h6 className="mb-0">
                    <i className="fas fa-user-circle me-2"></i>
                    {employeeName}
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted mb-1">
                        <i className="fas fa-user me-2"></i>
                        Username
                      </label>
                      <div className="input-group">
                        <input 
                          type="text" 
                          className="form-control form-control-lg font-monospace" 
                          value={credentials.username} 
                          readOnly 
                        />
                        <button 
                          className="btn btn-outline-secondary"
                          onClick={() => navigator.clipboard.writeText(credentials.username)}
                        >
                          <i className="fas fa-copy"></i>
                        </button>
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted mb-1">
                        <i className="fas fa-envelope me-2"></i>
                        Email
                      </label>
                      <div className="input-group">
                        <input 
                          type="text" 
                          className="form-control form-control-lg" 
                          value={credentials.email} 
                          readOnly 
                        />
                        <button 
                          className="btn btn-outline-secondary"
                          onClick={() => navigator.clipboard.writeText(credentials.email)}
                        >
                          <i className="fas fa-copy"></i>
                        </button>
                      </div>
                    </div>

                    <div className="col-12 mb-3">
                      <label className="form-label text-muted mb-1">
                        <i className="fas fa-key me-2"></i>
                        Password
                      </label>
                      <div className="input-group">
                        <input 
                          type={showPassword ? "text" : "password"}
                          className="form-control form-control-lg font-monospace bg-warning bg-opacity-10" 
                          value={credentials.password} 
                          readOnly 
                        />
                        <button 
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                        </button>
                        <button 
                          className="btn btn-outline-secondary"
                          onClick={() => navigator.clipboard.writeText(credentials.password)}
                        >
                          <i className="fas fa-copy"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-info mb-0">
                    <h6 className="alert-heading">
                      <i className="fas fa-info-circle me-2"></i>
                      Security Requirements
                    </h6>
                    <ul className="mb-0 ps-3">
                      <li>User must change password on first login</li>
                      <li>Password contains uppercase, lowercase, numbers, and symbols</li>
                      <li>Keep credentials secure and confidential</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline-secondary"
                onClick={handleCopyToClipboard}
              >
                <i className={`fas fa-${copied ? 'check' : 'clipboard'} me-2`}></i>
                {copied ? 'Copied!' : 'Copy All'}
              </button>
              <button 
                type="button" 
                className="btn btn-outline-info"
                onClick={handleDownloadPDF}
              >
                <i className="fas fa-download me-2"></i>
                Download as Text
              </button>
              <button 
                type="button" 
                className="btn btn-outline-primary"
                onClick={handlePrint}
              >
                <i className="fas fa-print me-2"></i>
                Print
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={onClose}
              >
                <i className="fas fa-times me-2"></i>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
