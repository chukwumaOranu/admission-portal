'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { useStudents } from '@/hooks/useRedux';
import { API_ENDPOINTS, apiService } from '@/services/api';
import s from '@/styles/admin-portal.module.css';

export default function ImportStudentsPage() {
  const router  = useRouter();
  const { data: session, status } = useSession();
  const { hasPermission, loading: permLoading } = usePermissions();
  const { schemas, loading: schemasLoading, fetchStudentSchemas } = useStudents();

  const [selectedSchema, setSelectedSchema] = useState('');
  const [schemaFields, setSchemaFields]     = useState([]);
  const [selectedFile, setSelectedFile]     = useState(null);
  const [uploading, setUploading]           = useState(false);
  const [progress, setProgress]             = useState(0);
  const [error, setError]                   = useState('');
  const [notice, setNotice]                 = useState('');
  const [importResults, setImportResults]   = useState(null);
  const loadedRef = useRef(false);

  useEffect(() => { loadedRef.current = false; }, [session?.user?.id]);
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !loadedRef.current) {
      loadedRef.current = true; fetchStudentSchemas();
    }
  }, [status, session?.user?.id, fetchStudentSchemas]);

  const fetchSchemaFields = useCallback(async (schemaId) => {
    try {
      const res = await apiService.get(API_ENDPOINTS.STUDENTS.SCHEMAS.FIELDS.GET_ALL(schemaId));
      setSchemaFields(res.data.data?.fields || res.data.fields || []);
    } catch { setSchemaFields([]); }
  }, []);

  useEffect(() => {
    if (selectedSchema) fetchSchemaFields(selectedSchema);
    else setSchemaFields([]);
  }, [selectedSchema, fetchSchemaFields]);

  const handleDownloadTemplate = () => {
    const defaultHeaders = [
      'first_name','last_name','middle_name','email','phone','date_of_birth','gender',
      'address','city','state','country','postal_code',
      'guardian_name','guardian_phone','guardian_email','guardian_relationship',
      'previous_school','graduation_year','school_level','class_level','create_user_account',
    ];
    const customHeaders = schemaFields.map(f => `cf_${f.field_name}`);
    const headers = [...defaultHeaders, ...customHeaders];

    const genSample = (f) => {
      const t = f.field_type;
      if (t === 'email') return 'sample@email.com';
      if (t === 'tel' || t === 'phone') return '+2348012345678';
      if (t === 'number') return '0';
      if (t === 'date') return '2024-01-01';
      if (t === 'checkbox') return 'false';
      if (t === 'select' || t === 'radio') {
        const opts = f.field_options ? f.field_options.split(',').map(o => o.trim()) : [];
        return opts[0] || 'Option 1';
      }
      return `Sample ${f.field_label}`;
    };

    const sampleRow = [
      'John','Doe','Michael','john.doe@parent.com','+2348012345678','2010-05-15','male',
      '123 Main Street','Lagos','Lagos','Nigeria','100001',
      'Mrs. Jane Doe','+2348098765432','jane.doe@email.com','Mother',
      'ABC Primary School','2023','Primary','Primary 3','true',
      ...schemaFields.map(genSample),
    ];

    const csv = [headers.join(','), sampleRow.map(c => `"${c}"`).join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const schemaName = schemas.find(sc => sc.id === parseInt(selectedSchema))?.schema_name || 'students';
    link.download = `${schemaName}_template_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link); link.click();
    document.body.removeChild(link); window.URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setError('Please select a valid CSV file'); return;
      }
      setSelectedFile(file); setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile)  { setError('Please select a CSV file first'); return; }
    if (!selectedSchema){ setError('Please select a student schema first'); return; }
    setUploading(true); setError(''); setProgress(0);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('schema_id', selectedSchema);
      const iv = setInterval(() => setProgress(p => { if (p >= 90) { clearInterval(iv); return 90; } return p + 10; }), 200);
      const res = await apiService.post(API_ENDPOINTS.STUDENTS.BULK_CREATE, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      clearInterval(iv); setProgress(100);
      setNotice(`Import complete! ${res.data.success_count || 0} students imported.`);
      setImportResults(res.data);
      setTimeout(() => router.push('/admin/dashboard/students'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to import students. Please check your CSV format.');
      setImportResults(err.response?.data);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  if (status === 'loading' || permLoading || schemasLoading) {
    return <div className={s.spinnerWrap}><div className="spinner-border" style={{ color: '#1e3a5f' }} role="status" /></div>;
  }

  if (!hasPermission('student.create')) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-lock" />You don&apos;t have permission to import students.</div>
        <Link href="/admin/dashboard/students" className={`${s.btn} ${s.btnOutline}`} style={{ marginTop: '0.75rem' }}><i className="fas fa-arrow-left" />Back to Students</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: '1.5rem' }}>

      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-file-import" /></span>
            Bulk Import Students
          </h1>
          <p className={s.pageSub}>Import multiple students from a CSV file</p>
        </div>
        <div className={s.pageActions}>
          <Link href="/admin/dashboard/students" className={`${s.btn} ${s.btnOutline}`}>
            <i className="fas fa-arrow-left" />Students
          </Link>
        </div>
      </div>

      {error  && <div className={`${s.alert} ${s.alertDanger}`}><i className="fas fa-exclamation-triangle" />{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><i className="fas fa-times" /></button></div>}
      {notice && <div className={`${s.alert} ${s.alertSuccess}`}><i className="fas fa-check-circle" />{notice}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

        {/* Left: steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Step 0: Select Schema */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#e0f2fe', color: '#0891b2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>0</span>
                Select Schema
              </span>
            </div>
            <div className={s.cardBody} style={{ padding: '1.25rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label className={s.formLabel}>Student Schema <span style={{ color: '#dc2626' }}>*</span></label>
                <select className={s.formSelect} value={selectedSchema} onChange={e => setSelectedSchema(e.target.value)} disabled={uploading}>
                  <option value="">— Select a schema —</option>
                  {schemas.map(sc => <option key={sc.id} value={sc.id}>{sc.display_name} ({sc.schema_name})</option>)}
                </select>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>The CSV template will include custom fields from the selected schema</p>
              </div>
              {selectedSchema && schemaFields.length > 0 && (
                <div className={`${s.alert} ${s.alertInfo}`} style={{ marginBottom: 0 }}>
                  <i className="fas fa-info-circle" />
                  <div>
                    <strong style={{ fontSize: '0.82rem' }}>Custom Fields ({schemaFields.length}):</strong>
                    <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1rem', fontSize: '0.78rem' }}>
                      {schemaFields.map(f => (
                        <li key={f.id}><code style={{ background: '#e0f2fe', padding: '0.1rem 0.3rem', borderRadius: 3 }}>cf_{f.field_name}</code> — {f.field_label}{f.is_required && <span style={{ color: '#dc2626' }}> *</span>}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {selectedSchema && schemaFields.length === 0 && (
                <div className={`${s.alert} ${s.alertInfo}`} style={{ marginBottom: 0 }}>
                  <i className="fas fa-info-circle" />
                  <span style={{ fontSize: '0.82rem' }}>This schema has no custom fields — only default student fields will be included.</span>
                </div>
              )}
            </div>
          </div>

          {/* Step 1: Download Template */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>1</span>
                Download CSV Template
              </span>
            </div>
            <div className={s.cardBody} style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                Download the CSV template with sample data. Includes custom fields for the selected schema.
              </p>
              <button className={`${s.btn} ${s.btnGreen}`} onClick={handleDownloadTemplate} disabled={!selectedSchema}>
                <i className="fas fa-download" />Download Template{selectedSchema ? ` (${schemas.find(sc => sc.id === parseInt(selectedSchema))?.schema_name}_template.csv)` : ''}
              </button>
              {!selectedSchema && <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.5rem' }}>Select a schema above first</p>}
            </div>
          </div>

          {/* Step 2: Fill Data */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#e0f2fe', color: '#0891b2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>2</span>
                Fill in Student Data
              </span>
            </div>
            <div className={s.cardBody} style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>Open the CSV in Excel or Google Sheets and fill in your student data.</p>
              <div className={`${s.alert} ${s.alertDanger}`} style={{ marginBottom: '1rem' }}>
                <i className="fas fa-exclamation-triangle" />
                <div style={{ fontSize: '0.82rem' }}>
                  <strong>Important:</strong>
                  <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1rem' }}>
                    <li>Keep column names as-is (don&apos;t rename)</li>
                    <li>Required: <strong>first_name, last_name, email, schema_name</strong></li>
                    <li>Date format: <strong>YYYY-MM-DD</strong> (e.g., 2010-05-15)</li>
                    <li>Save as CSV, not Excel format</li>
                  </ul>
                </div>
              </div>
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr><th>Column</th><th>Required</th><th>Format</th></tr>
                  </thead>
                  <tbody>
                    {[
                      { col: 'first_name',           req: true,  fmt: 'Text' },
                      { col: 'last_name',             req: true,  fmt: 'Text' },
                      { col: 'email',                 req: true,  fmt: 'Valid email' },
                      { col: 'schema_name',           req: true,  fmt: 'nursery | primary | jss | sss' },
                      { col: 'gender',                req: false, fmt: 'male | female | other' },
                      { col: 'date_of_birth',         req: false, fmt: 'YYYY-MM-DD' },
                      { col: 'create_user_account',   req: false, fmt: 'true | false' },
                    ].map(r => (
                      <tr key={r.col}>
                        <td><code style={{ background: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: 3, fontSize: '0.78rem' }}>{r.col}</code></td>
                        <td><span className={`${s.badge} ${r.req ? s.badgePending : s.badgeInfo}`}>{r.req ? 'Required' : 'Optional'}</span></td>
                        <td style={{ fontSize: '0.82rem' }}>{r.fmt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Step 3: Upload */}
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#d1fae5', color: '#059669', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>3</span>
                Upload CSV File
              </span>
            </div>
            <div className={s.cardBody} style={{ padding: '1.25rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label className={s.formLabel}>Select CSV File</label>
                <input type="file" className={s.formInput} accept=".csv" onChange={handleFileSelect} disabled={uploading} />
              </div>
              {selectedFile && (
                <div className={`${s.alert} ${s.alertInfo}`} style={{ marginBottom: '1rem' }}>
                  <i className="fas fa-file-csv" />
                  <span style={{ fontSize: '0.82rem' }}><strong>{selectedFile.name}</strong> — {(selectedFile.size / 1024).toFixed(2)} KB</span>
                </div>
              )}
              {progress > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.82rem', color: '#6b7280' }}>
                    <span>Uploading…</span><span>{progress}%</span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#2563eb', borderRadius: 4, width: `${progress}%`, transition: 'width 0.2s' }} />
                  </div>
                </div>
              )}
              <button className={`${s.btn} ${s.btnPrimary}`} onClick={handleUpload} disabled={!selectedFile || uploading}>
                {uploading ? <><span className="spinner-border spinner-border-sm" />Importing…</> : <><i className="fas fa-upload" />Import Students</>}
              </button>
            </div>
          </div>

          {/* Results */}
          {importResults && (
            <div className={s.card} style={{ marginBottom: 0 }}>
              <div className={s.cardHeader}>
                <span className={s.cardTitle}><i className="fas fa-chart-bar" style={{ color: '#0891b2' }} />Import Results</span>
              </div>
              <div className={s.cardBody} style={{ padding: '1.25rem' }}>
                <div className={s.statsGrid} style={{ margin: '0 0 1rem' }}>
                  {[
                    { label: 'Successful', value: importResults.success_count || 0, icon: 'fas fa-check-circle', color: '#059669' },
                    { label: 'Failed',     value: importResults.error_count   || 0, icon: 'fas fa-times-circle', color: '#dc2626' },
                    { label: 'Total',      value: importResults.total_count   || 0, icon: 'fas fa-list',          color: '#2563eb' },
                  ].map(st => (
                    <div key={st.label} className={s.statCard} style={{ '--accent': st.color, cursor: 'default' }}>
                      <div className={s.statInfo}>
                        <div className={s.statLabel}>{st.label}</div>
                        <div className={s.statNumber} style={{ color: st.color }}>{st.value}</div>
                      </div>
                      <div className={s.statIcon} style={{ background: `${st.color}18`, color: st.color }}><i className={st.icon} /></div>
                    </div>
                  ))}
                </div>

                {importResults.errors?.length > 0 && (
                  <div className={`${s.alert} ${s.alertDanger}`} style={{ marginBottom: '1rem' }}>
                    <i className="fas fa-exclamation-triangle" />
                    <div>
                      <strong style={{ fontSize: '0.82rem' }}>Errors:</strong>
                      <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1rem', fontSize: '0.78rem' }}>
                        {importResults.errors.map((e, i) => <li key={i}>Row {e.row}: {e.message}</li>)}
                      </ul>
                    </div>
                  </div>
                )}

                {importResults.created_students?.length > 0 && (
                  <>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#059669', marginBottom: '0.5rem' }}>
                      <i className="fas fa-check-circle" style={{ marginRight: '0.4rem' }} />
                      Successfully Created ({importResults.created_students.length})
                    </p>
                    <div className={s.tableWrap}>
                      <table className={s.table}>
                        <thead>
                          <tr><th>Student ID</th><th>Name</th><th>Email</th><th>Level</th></tr>
                        </thead>
                        <tbody>
                          {importResults.created_students.slice(0, 10).map(st => (
                            <tr key={st.id}>
                              <td className={s.tdMono}>{st.student_id}</td>
                              <td>{st.first_name} {st.last_name}</td>
                              <td className={s.tdEmail}>{st.email}</td>
                              <td><span className={`${s.badge} ${s.badgeInfo}`}>{st.schema_name}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {importResults.created_students.length > 10 && (
                      <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.4rem' }}>Showing 10 of {importResults.created_students.length} students</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: guidelines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className={s.card} style={{ marginBottom: 0 }}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0891b2' }}>
                  <i className="fas fa-question-circle" style={{ fontSize: '0.75rem' }} />
                </span>
                Import Guidelines
              </span>
            </div>
            <div className={s.cardBody} style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: '#374151' }}>
              <strong style={{ display: 'block', marginBottom: '0.4rem' }}>Before You Start:</strong>
              <ul style={{ paddingLeft: '1.1rem', lineHeight: 1.9, marginBottom: '0.75rem' }}>
                <li>Prepare student data in Excel or Google Sheets</li>
                <li>Verify all email addresses are valid</li>
                <li>Dates must be YYYY-MM-DD format</li>
                <li>Double-check school levels (nursery, primary, jss, sss)</li>
              </ul>
              <strong style={{ display: 'block', marginBottom: '0.4rem', color: '#dc2626' }}>Common Mistakes:</strong>
              <ul style={{ paddingLeft: '1.1rem', lineHeight: 1.9, marginBottom: '0.75rem', color: '#dc2626' }}>
                <li>Missing required fields</li>
                <li>Invalid email formats</li>
                <li>Wrong date format</li>
                <li>Incorrect schema_name values</li>
                <li>Duplicate student emails</li>
              </ul>
              <strong style={{ display: 'block', marginBottom: '0.4rem', color: '#059669' }}>Pro Tips:</strong>
              <ul style={{ paddingLeft: '1.1rem', lineHeight: 1.9, marginBottom: 0, color: '#059669' }}>
                <li>Start small — test with 10–20 students first</li>
                <li>Keep a backup of your original data</li>
                <li>Review error messages carefully</li>
              </ul>
            </div>
          </div>

          <div className={`${s.alert} ${s.alertInfo}`} style={{ margin: 0 }}>
            <i className="fas fa-key" />
            <span style={{ fontSize: '0.78rem' }}>If <code>create_user_account</code> is <strong>true</strong>, login credentials are auto-generated. Download the results report after import.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
