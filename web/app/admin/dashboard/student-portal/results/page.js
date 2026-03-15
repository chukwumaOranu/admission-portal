'use client';

export default function StudentResults() {
  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">
            <i className="fas fa-chart-line text-info me-2"></i>
            My Results
          </h2>
          <p className="text-muted mb-0">View exam results and admission status</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body text-center py-5">
          <i className="fas fa-poll text-muted" style={{ fontSize: '4rem' }}></i>
          <h5 className="mt-3 text-muted">No Results Available</h5>
          <p className="text-muted">Your exam results will appear here when published</p>
          <p className="text-muted small">(Coming Soon)</p>
        </div>
      </div>
    </div>
  );
}

