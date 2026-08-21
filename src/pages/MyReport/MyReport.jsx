import React, { useState } from 'react';
import './MyReport.css';

const MOCK_REPORTS = [
  {
    id: '#HZ-4431',
    category: 'Pothole',
    dateSubmitted: 'Oct 12, 2023',
    status: 'IN PROGRESS',
    description: 'Deep pothole right in the middle of the lane. Cars are swerving to avoid it, which is very dangerous during rush hour. It\'s about 10 inches deep.',
    coordinates: '14.5995° N, 120.9842° E',
    address: 'Main St. & 4th Ave Intersection',
    timeline: [
      { label: 'Report Received', date: 'Oct 12, 2023', completed: true },
      { label: 'Under Verification', date: 'Oct 13, 2023', completed: true },
      { label: 'Under Repair', date: 'Pending', completed: false },
      { label: 'Ticket Resolved', date: 'Pending', completed: false },
    ],
    remarks: 'Report received and currently under review.',
    photos: [
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&q=80',
      'https://images.unsplash.com/photo-1584463688353-29c11224d4bc?w=400&q=80',
    ],
  },
  {
    id: '#HZ-4390',
    category: 'Uneven Roads',
    dateSubmitted: 'Sep 28, 2023',
    status: 'RESOLVED',
    description: 'Uneven road surface causing vehicle instability.',
    coordinates: '14.5818° N, 120.9770° E',
    address: 'Rizal Park Area',
    timeline: [
      { label: 'Report Received', date: 'Sep 28, 2023', completed: true },
      { label: 'Under Verification', date: 'Sep 29, 2023', completed: true },
      { label: 'Under Repair', date: 'Oct 01, 2023', completed: true },
      { label: 'Ticket Resolved', date: 'Oct 03, 2023', completed: true },
    ],
    remarks: 'Road resurfacing completed.',
    photos: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&q=80'],
  },
  {
    id: '#HZ-4355',
    category: 'Road Debris',
    dateSubmitted: 'Sep 15, 2023',
    status: 'RESOLVED',
    description: 'Fallen tree branches blocking right lane.',
    coordinates: '14.5900° N, 120.9800° E',
    address: 'Taft Ave Extension',
    timeline: [
      { label: 'Report Received', date: 'Sep 15, 2023', completed: true },
      { label: 'Under Verification', date: 'Sep 15, 2023', completed: true },
      { label: 'Under Repair', date: 'Sep 16, 2023', completed: true },
      { label: 'Ticket Resolved', date: 'Sep 16, 2023', completed: true },
    ],
    remarks: 'Debris cleared by local maintenance team.',
    photos: [],
  },
  {
    id: '#HZ-4210',
    category: 'Uneven Roads',
    dateSubmitted: 'Aug 30, 2023',
    status: 'PENDING',
    description: 'Cracked asphalt expanding near pedestrian lane.',
    coordinates: '14.6000° N, 120.9900° E',
    address: 'Espana Blvd',
    timeline: [
      { label: 'Report Received', date: 'Aug 30, 2023', completed: true },
      { label: 'Under Verification', date: 'Pending', completed: false },
      { label: 'Under Repair', date: 'Pending', completed: false },
      { label: 'Ticket Resolved', date: 'Pending', completed: false },
    ],
    remarks: 'Queued for site inspection.',
    photos: [],
  },
];

export default function MyReport() {
  const [selectedReport, setSelectedReport] = useState(null);

  // Temporary control states (bound to form controls)
  const [tempCategory, setTempCategory] = useState('All Categories');
  const [tempStatus, setTempStatus] = useState('All Statuses');
  const [tempDate, setTempDate] = useState('');

  // Applied filter states (used to actually filter the data table)
  const [appliedCategory, setAppliedCategory] = useState('All Categories');
  const [appliedStatus, setAppliedStatus] = useState('All Statuses');
  const [appliedDate, setAppliedDate] = useState('');

  // Handle click on "Apply Filters"
  const handleApplyFilters = () => {
    setAppliedCategory(tempCategory);
    setAppliedStatus(tempStatus);
    setAppliedDate(tempDate);
  };

  // Handle click on "Reset"
  const handleResetFilters = () => {
    setTempCategory('All Categories');
    setTempStatus('All Statuses');
    setTempDate('');
    
    setAppliedCategory('All Categories');
    setAppliedStatus('All Statuses');
    setAppliedDate('');
  };

  // Filter based ONLY on applied states
  const filteredReports = MOCK_REPORTS.filter((report) => {
    if (appliedCategory !== 'All Categories' && report.category !== appliedCategory) {
      return false;
    }
    if (
      appliedStatus !== 'All Statuses' &&
      report.status.replaceAll(' ', '') !== appliedStatus.replaceAll(' ', '')
    ) {
      return false;
    }
    // Simple date filter check if date input matches submitted date (adjust formatting if needed)
    if (appliedDate && !report.dateSubmitted.includes(appliedDate)) {
      return false;
    }
    return true;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'IN PROGRESS':
        return 'status-badge status-in-progress';
      case 'RESOLVED':
        return 'status-badge status-resolved';
      case 'PENDING':
        return 'status-badge status-pending';
      default:
        return 'status-badge';
    }
  };

  // --- DETAIL VIEW ---
  if (selectedReport) {
    return (
      <div className="reports-detail-container">
        <button className="back-link-btn" onClick={() => setSelectedReport(null)}>
          &larr; Back to All Reports
        </button>

        <div className="detail-layout">
          {/* Main Detail Column */}
          <div className="detail-main-column">
            {/* Status Header Card */}
            <div className="card report-status-card">
              <div className="status-header-info">
                <div className="status-icon-circle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <div>
                  <span className="report-id-sub">Report ID: {selectedReport.id}</span>
                  <h2>{selectedReport.status}</h2>
                </div>
              </div>
              <span className={getStatusBadgeClass(selectedReport.status)}>
                {selectedReport.status}
              </span>
            </div>

            {/* Resolution Timeline */}
            <div className="card timeline-card">
              <h3>RESOLUTION TIMELINE</h3>
              <div className="timeline-stepper">
                {selectedReport.timeline.map((step, idx) => (
                  <div key={idx} className={`timeline-step ${step.completed ? 'completed' : ''}`}>
                    <div className="step-node">
                      {step.completed ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <div className="step-inner-circle" />
                      )}
                    </div>
                    <div className="step-label">{step.label}</div>
                    <div className="step-date">{step.date}</div>
                  </div>
                ))}
              </div>
              <div className="remarks-box">
                <span className="remarks-title">REMARKS:</span>
                <p>{selectedReport.remarks}</p>
              </div>
            </div>

            {/* Original Report Submission */}
            <div className="card submission-card">
              <h3>Original Report Submission</h3>
              <div className="submission-content-grid">
                <div className="photos-column">
                  {selectedReport.photos.length > 0 ? (
                    <div className="photo-grid">
                      {selectedReport.photos.map((src, i) => (
                        <img key={i} src={src} alt={`Submission proof ${i + 1}`} />
                      ))}
                    </div>
                  ) : (
                    <div className="no-photos-placeholder">No Photos Attached</div>
                  )}

                  <div className="gps-location-box">
                    <div className="gps-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                        <path d="M12 22s8-7.58 8-13a8 8 0 1 0-16 0c0 5.42 8 13 8 13Z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                      <strong>GPS Coordinates</strong>
                    </div>
                    <span className="coords-text">{selectedReport.coordinates}</span>
                    <span className="address-text">{selectedReport.address}</span>
                  </div>
                </div>

                <div className="details-column">
                  <div className="user-description-section">
                    <h4>USER DESCRIPTION</h4>
                    <p>"{selectedReport.description}"</p>
                  </div>

                  <div className="map-view-section">
                    <h4>ATTACHED MAP VIEW</h4>
                    <div className="map-preview-box">
                      <img
                        src="https://tile.openstreetmap.org/15/27393/14660.png"
                        alt="Map Location"
                      />
                      <div className="map-pin"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel: LGU Resolution Proof */}
          <div className="detail-side-column">
            <div className="card resolution-proof-card">
              <h3>LGU Resolution Proof</h3>
              <div className="proof-placeholder-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <p>Photo of the repair will appear here once the case is marked 'Resolved'</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="reports-list-container">
      <div className="page-header">
        <h1>All Reports</h1>
        <p>Track and manage your submitted hazard reports.</p>
      </div>

      {/* Stats Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <span className="stat-label">TOTAL REPORTS</span>
            <div className="stat-value">11</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon resolved-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <span className="stat-label">RESOLVED</span>
            <div className="stat-value">4</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon in-progress-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <span className="stat-label">IN PROGRESS</span>
            <div className="stat-value">2</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <span className="stat-label">PENDING</span>
            <div className="stat-value">1</div>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card filters-card">
        <div className="filter-group">
          <label>Category</label>
          <select value={tempCategory} onChange={(e) => setTempCategory(e.target.value)}>
            <option>All Categories</option>
            <option>Pothole</option>
            <option>Uneven Roads</option>
            <option>Road Debris</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select value={tempStatus} onChange={(e) => setTempStatus(e.target.value)}>
            <option>All Statuses</option>
            <option>IN PROGRESS</option>
            <option>RESOLVED</option>
            <option>PENDING</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Date Submitted</label>
          <input
            type="date"
            value={tempDate}
            onChange={(e) => setTempDate(e.target.value)}
          />
        </div>

        <div className="filter-actions">
          <button className="btn-apply" onClick={handleApplyFilters}>
            Apply Filters
          </button>
          <button className="btn-reset" onClick={handleResetFilters}>
            Reset
          </button>
        </div>
      </div>

      {/* Reports Table Card */}
      <div className="card table-card">
        <table className="reports-table">
          <thead>
            <tr>
              <th>REPORT ID</th>
              <th>CATEGORY</th>
              <th>DATE SUBMITTED</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report) => (
              <tr key={report.id}>
                <td className="report-id-cell">{report.id}</td>
                <td>{report.category}</td>
                <td>{report.dateSubmitted}</td>
                <td>
                  <span className={getStatusBadgeClass(report.status)}>
                    {report.status}
                  </span>
                </td>
                <td>
                  <button
                    className="action-view-btn"
                    onClick={() => setSelectedReport(report)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Table Footer Pagination */}
        <div className="table-footer">
          <span>Showing 1 to {filteredReports.length} of 12 results</span>
          <div className="pagination">
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
}