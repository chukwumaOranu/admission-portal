'use client';

import Link from 'next/link';
import s from '@/styles/student-portal.module.css';

export default function StudentResults() {
  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>
            <span className={s.iconBox} style={{ background: '#f5f3ff', color: '#7c3aed' }}><i className="fas fa-poll" /></span>
            My Results
          </h1>
          <p className={s.pageSub}>Exam results and admission status</p>
        </div>
      </div>

      <div className={s.card}>
        <div className={s.emptyState}>
          <div className={s.emptyIcon} style={{ background: '#f5f3ff', color: '#7c3aed' }}><i className="fas fa-poll" /></div>
          <h5 className={s.emptyTitle}>No Results Available</h5>
          <p className={s.emptySub}>Your exam results will appear here once they are published by the admissions office.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/admin/dashboard/student-portal/applications" className={s.btnPrimary}><i className="fas fa-file-alt" />My Applications</Link>
            <Link href="/admin/dashboard/student-portal/exams" className={s.btnOutline}><i className="fas fa-clipboard-check" />Exam Details</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
