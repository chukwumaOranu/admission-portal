'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudents } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';

export default function ImportStudentsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  
  // ✅ Redux for schemas
  const { schemas, fetchStudentSchemas } = useStudents();
  
  const [selectedSchema, setSelectedSchema] = useState('');
  const [schemaFields, setSchemaFields] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [importResults, setImportResults] = useState(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStudentSchemas();
    }
  }, [status, fetchStudentSchemas]);

  const fetchSchemaFields = useCallback(async (schemaId) => {
    try {
      const response = await apiService.get(API_ENDPOINTS.STUDENTS.SCHEMAS.FIELDS.GET_ALL(schemaId));
      const fields = response.data.data?.fields || response.data.fields || [];
      setSchemaFields(fields);
    } catch (err) {
      console.error('Error fetching schema fields:', err);
      setSchemaFields([]);
    }
  }, []);

  // Fetch schema fields when schema is selected
  useEffect(() => {
    if (selectedSchema) {
      fetchSchemaFields(selectedSchema);
    } else {
      setSchemaFields([]);
    }
  }, [selectedSchema, fetchSchemaFields]);

  // ✅ Download CSV Template with dynamic custom fields
  const handleDownloadTemplate = () => {
    // Default fields
    const defaultHeaders = [
      'first_name',
      'last_name',
      'middle_name',
      'email',
      'phone',
      'date_of_birth',
      'gender',
      'address',
      'city',
      'state',
      'country',
      'postal_code',
      'guardian_name',
      'guardian_phone',
      'guardian_email',
      'guardian_relationship',
      'previous_school',
      'graduation_year',
      'school_level',
      'class_level',
      'create_user_account'
    ];

    // ✅ Add custom fields with cf_ prefix
    const customHeaders = schemaFields.map(field => `cf_${field.field_name}`);
    
    const headers = [...defaultHeaders, ...customHeaders];

    // ✅ Generate sample values for custom fields
    const generateCustomFieldSample = (field) => {
      switch (field.field_type) {
        case 'text':
          return `Sample ${field.field_label}`;
        case 'textarea':
          return `Sample description for ${field.field_label}`;
        case 'email':
          return 'sample@email.com';
        case 'tel':
        case 'phone':
          return '+2348012345678';
        case 'number':
          return '0';
        case 'date':
          return '2024-01-01';
        case 'select':
        case 'radio':
          const options = field.field_options ? field.field_options.split(',').map(o => o.trim()) : [];
          return options[0] || 'Option 1';
        case 'checkbox':
          return 'false';
        default:
          return '';
      }
    };

    const customSampleValues = schemaFields.map(generateCustomFieldSample);

    // Sample data rows with custom fields
    const sampleRows = [
      [
        'John',
        'Doe',
        'Michael',
        'john.doe@parent.com',
        '+2348012345678',
        '2010-05-15',
        'male',
        '123 Main Street',
        'Lagos',
        'Lagos',
        'Nigeria',
        '100001',
        'Mrs. Jane Doe',
        '+2348098765432',
        'jane.doe@email.com',
        'Mother',
        'ABC Primary School',
        '2023',
        'Primary',
        'Primary 3',
        'true',
        ...customSampleValues
      ]
    ];

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // ✅ Dynamic filename based on schema
    const schemaName = schemas.find(s => s.id === parseInt(selectedSchema))?.schema_name || 'students';
    link.download = `${schemaName}_import_template_${new Date().toISOString().split('T')[0]}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setError('Please select a valid CSV file');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a CSV file first');
      return;
    }

    if (!selectedSchema) {
      setError('Please select a student schema first');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('schema_id', selectedSchema); // ✅ Include schema_id

      // Simulate progress (you can implement actual progress tracking)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await apiService.post(API_ENDPOINTS.STUDENTS.BULK_CREATE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      setSuccess(true);
      setImportResults(response.data);
      
      setTimeout(() => {
        router.push('/admin/dashboard/students');
      }, 3000);

    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.message || 'Failed to import students. Please check your CSV format.');
      setImportResults(err.response?.data);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    window.location.href = '/login';
    return null;
  }

  // Check permissions
  if (!hasPermission('student.create')) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Access Denied</h4>
        <p>You don&apos;t have permission to import students.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-file-import text-primary-custom me-2"></i>
            Bulk Import Students
          </h2>
          <p className="text-muted mb-0">Import multiple students from CSV file</p>
        </div>
        <Link href="/admin/dashboard/students" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to Students
        </Link>
      </div>

      {/* Success Alert */}
      {success && importResults && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          <strong>Import Successful!</strong> {importResults.success_count || 0} students imported successfully.
          {importResults.error_count > 0 && ` (${importResults.error_count} failed)`}
          <button type="button" className="btn-close" onClick={() => setSuccess(false)}></button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      <div className="row">
        {/* Main Content */}
        <div className="col-lg-8">
          {/* ✅ Step 0: Select Schema */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-info text-white">
              <h5 className="card-title mb-0">
                <span className="badge bg-light text-info me-2">📋</span>
                Select Student Schema
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="schema-select" className="form-label">
                  Student Schema <span className="text-danger">*</span>
                </label>
                <select
                  id="schema-select"
                  className="form-select"
                  value={selectedSchema}
                  onChange={(e) => setSelectedSchema(e.target.value)}
                  disabled={isUploading}
                >
                  <option value="">-- Select a schema --</option>
                  {schemas.map(schema => (
                    <option key={schema.id} value={schema.id}>
                      {schema.display_name} ({schema.schema_name})
                    </option>
                  ))}
                </select>
                <small className="text-muted">
                  The CSV template will include custom fields from the selected schema
                </small>
              </div>

              {/* ✅ Show custom fields info */}
              {selectedSchema && schemaFields.length > 0 && (
                <div className="alert alert-info mb-0">
                  <strong>
                    <i className="fas fa-info-circle me-1"></i>
                    Custom Fields ({schemaFields.length}):
                  </strong>
                  <ul className="mb-0 mt-2">
                    {schemaFields.map(field => (
                      <li key={field.id}>
                        <code>cf_{field.field_name}</code> - {field.field_label}
                        {field.is_required && <span className="text-danger"> *</span>}
                        <small className="text-muted"> ({field.field_type})</small>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedSchema && schemaFields.length === 0 && (
                <div className="alert alert-warning mb-0">
                  <i className="fas fa-exclamation-triangle me-1"></i>
                  This schema has no custom fields. Only default student fields will be included.
                </div>
              )}
            </div>
          </div>

          {/* Step 1: Download Template */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                <span className="badge bg-light text-primary me-2">1</span>
                Download CSV Template
              </h5>
            </div>
            <div className="card-body">
              <p className="mb-3">
                Download the CSV template with sample data. The template will include custom fields from your selected schema.
              </p>
              <button 
                className="btn btn-success"
                onClick={handleDownloadTemplate}
                disabled={!selectedSchema}
              >
                <i className="fas fa-download me-2"></i>
                Download Template {selectedSchema && `(${schemas.find(s => s.id === parseInt(selectedSchema))?.schema_name}_template.csv)`}
              </button>
              {!selectedSchema && (
                <p className="text-muted mt-2 mb-0">
                  <small><i className="fas fa-info-circle me-1"></i>Please select a schema first</small>
                </p>
              )}
            </div>
          </div>

          {/* Step 2: Fill Template */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-info text-white">
              <h5 className="card-title mb-0">
                <span className="badge bg-light text-info me-2">2</span>
                Fill in Student Data
              </h5>
            </div>
            <div className="card-body">
              <p className="mb-3">
                Open the CSV file in Excel or Google Sheets and fill in your student data.
              </p>
              
              <div className="alert alert-warning mb-3">
                <h6><i className="fas fa-exclamation-triangle me-2"></i>Important Notes:</h6>
                <ul className="mb-0 small">
                  <li>Keep the header row as is (don&apos;t modify column names)</li>
                  <li>Required fields: <strong>first_name, last_name, email, schema_name</strong></li>
                  <li><strong>schema_name</strong> must be: nursery, primary, jss, or sss</li>
                  <li><strong>gender</strong> must be: male, female, or other</li>
                  <li><strong>date_of_birth</strong> format: YYYY-MM-DD (e.g., 2010-05-15)</li>
                  <li><strong>create_user_account</strong>: true or false</li>
                  <li>Save as CSV format (not Excel)</li>
                </ul>
              </div>

              <div className="table-responsive">
                <table className="table table-sm table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Column</th>
                      <th>Required</th>
                      <th>Format/Options</th>
                    </tr>
                  </thead>
                  <tbody className="small">
                    <tr>
                      <td><code>first_name</code></td>
                      <td><span className="badge bg-danger">Required</span></td>
                      <td>Text</td>
                    </tr>
                    <tr>
                      <td><code>last_name</code></td>
                      <td><span className="badge bg-danger">Required</span></td>
                      <td>Text</td>
                    </tr>
                    <tr>
                      <td><code>email</code></td>
                      <td><span className="badge bg-danger">Required</span></td>
                      <td>Valid email address</td>
                    </tr>
                    <tr>
                      <td><code>schema_name</code></td>
                      <td><span className="badge bg-danger">Required</span></td>
                      <td>nursery | primary | jss | sss</td>
                    </tr>
                    <tr>
                      <td><code>gender</code></td>
                      <td><span className="badge bg-secondary">Optional</span></td>
                      <td>male | female | other</td>
                    </tr>
                    <tr>
                      <td><code>date_of_birth</code></td>
                      <td><span className="badge bg-secondary">Optional</span></td>
                      <td>YYYY-MM-DD</td>
                    </tr>
                    <tr>
                      <td><code>create_user_account</code></td>
                      <td><span className="badge bg-secondary">Optional</span></td>
                      <td>true | false (default: false)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Step 3: Upload File */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-success text-white">
              <h5 className="card-title mb-0">
                <span className="badge bg-light text-success me-2">3</span>
                Upload CSV File
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Select CSV File</label>
                <input
                  type="file"
                  className="form-control"
                  accept=".csv"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
              </div>

              {selectedFile && (
                <div className="alert alert-info mb-3">
                  <i className="fas fa-file-csv me-2"></i>
                  <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </div>
              )}

              {uploadProgress > 0 && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="progress">
                    <div 
                      className="progress-bar progress-bar-striped progress-bar-animated" 
                      role="progressbar" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary-custom"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    Importing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload me-2"></i>
                    Import Students
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Import Results */}
          {importResults && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-light">
                <h5 className="card-title mb-0">
                  <i className="fas fa-chart-bar me-2"></i>
                  Import Results
                </h5>
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-md-4 mb-3">
                    <div className="p-3 border rounded">
                      <h2 className="text-success mb-0">{importResults.success_count || 0}</h2>
                      <small className="text-muted">Successful</small>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="p-3 border rounded">
                      <h2 className="text-danger mb-0">{importResults.error_count || 0}</h2>
                      <small className="text-muted">Failed</small>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="p-3 border rounded">
                      <h2 className="text-primary mb-0">{importResults.total_count || 0}</h2>
                      <small className="text-muted">Total</small>
                    </div>
                  </div>
                </div>

                {importResults.errors && importResults.errors.length > 0 && (
                  <div className="mt-3">
                    <h6 className="text-danger">Errors:</h6>
                    <div className="alert alert-danger">
                      <ul className="mb-0 small">
                        {importResults.errors.map((err, index) => (
                          <li key={index}>
                            Row {err.row}: {err.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {importResults.created_students && importResults.created_students.length > 0 && (
                  <div className="mt-3">
                    <h6 className="text-success">Successfully Created Students:</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResults.created_students.slice(0, 10).map((student) => (
                            <tr key={student.id}>
                              <td>{student.student_id}</td>
                              <td>{student.first_name} {student.last_name}</td>
                              <td>{student.email}</td>
                              <td>{student.schema_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {importResults.created_students.length > 10 && (
                        <p className="text-muted small mb-0">
                          Showing 10 of {importResults.created_students.length} students
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Help & Info */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-info text-white">
              <h5 className="card-title mb-0">
                <i className="fas fa-question-circle me-2"></i>
                Import Guidelines
              </h5>
            </div>
            <div className="card-body">
              <h6>📋 Before You Start:</h6>
              <ul className="small">
                <li>Prepare your student data in Excel/Google Sheets</li>
                <li>Verify all email addresses are valid</li>
                <li>Ensure dates are in YYYY-MM-DD format</li>
                <li>Double-check school levels (nursery, primary, jss, sss)</li>
              </ul>

              <hr />

              <h6>⚠️ Common Mistakes:</h6>
              <ul className="small text-danger">
                <li>Missing required fields</li>
                <li>Invalid email formats</li>
                <li>Wrong date format (use YYYY-MM-DD)</li>
                <li>Incorrect schema_name values</li>
                <li>Duplicate student emails</li>
              </ul>

              <hr />

              <h6>💡 Pro Tips:</h6>
              <ul className="small text-success">
                <li>Start with a small batch (10-20 students)</li>
                <li>Test import before doing large batches</li>
                <li>Keep a backup of your original data</li>
                <li>Review error messages carefully</li>
              </ul>

              <hr />

              <h6>🔐 User Accounts:</h6>
              <p className="small mb-0">
                If <code>create_user_account</code> is set to <strong>true</strong>, 
                login credentials will be auto-generated. Download the report after import 
                to get usernames and passwords.
              </p>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-warning">
              <h5 className="card-title mb-0">
                <i className="fas fa-lightbulb me-2"></i>
                Need Help?
              </h5>
            </div>
            <div className="card-body">
              <p className="small mb-2">
                <i className="fas fa-envelope me-2 text-primary"></i>
                Email: support@school.com
              </p>
              <p className="small mb-2">
                <i className="fas fa-phone me-2 text-success"></i>
                Phone: +234 XXX XXX XXXX
              </p>
              <p className="small mb-0">
                <i className="fas fa-book me-2 text-info"></i>
                <Link href="/admin/dashboard/help">View User Guide</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
