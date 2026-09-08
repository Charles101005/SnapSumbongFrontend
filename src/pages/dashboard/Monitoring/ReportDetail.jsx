import React, { useState } from "react";
import "./ReportDetail.css";

const MOCK_DETAIL_REPORTS = {
  "HRZ-4421": {
    id: "#HZ-4421",
    category: "Uneven Roads",
    location: "Sampaloc, Manila",
    reportedSeverity: "P5",
    status: "RESOLVED",
    reporterComments: "Huge fissure, dangerous to vehicles",
    media: [
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=300&q=80",
      "https://images.unsplash.com/photo-1584463688353-29c11224d4bc?w=300&q=80",
      "https://images.unsplash.com/photo-1590682680695-43b96c480e93?w=300&q=80",
      "https://images.unsplash.com/photo-1504432842672-1a79f78e4084?w=300&q=80",
      "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=300&q=80",
    ],
    timeline: [
      {
        status: "PENDING",
        color: "pending",
        performedBy: "Elena Gomez",
        date: "Oct 7, 2025",
        time: "3:30 pm",
        activity: {
          logId: "#LOG-6818",
          role: "Right Officer",
          module: "Report Management",
          primaryAction: "Created new road hazard report #HZ-4421",
          description: "Reporter submitted a new road hazard report for uneven roads in Sampaloc, Manila with severity level P5.",
        },
      },
      {
        status: "ONGOING",
        color: "ongoing",
        performedBy: "Elena Gomez",
        date: "Oct 10, 2025",
        time: "3:30 pm",
        activity: {
          logId: "#LOG-6819",
          role: "Right Officer",
          module: "Report Management",
          primaryAction: "Updated report status #HZ-4421",
          description: "Administrator updated the status of road hazard report #HZ-4421 from PENDING to ONGOING and added internal notes regarding crew dispatch.",
        },
      },
      {
        status: "RESOLVED",
        color: "resolved",
        performedBy: "Elena Gomez",
        date: "Oct 14, 2025",
        time: "3:34 pm",
        activity: {
          logId: "#LOG-6820",
          role: "Right Officer",
          module: "Report Management",
          primaryAction: "Resolved report #HZ-4421",
          description: "Administrator marked road hazard report #HZ-4421 as RESOLVED after crew completed repair work on the uneven road.",
        },
      },
    ],
  },
  "HRZ-4422": {
    id: "#HZ-4422",
    category: "Road Debris",
    location: "Ermita, Manila",
    reportedSeverity: "P4",
    status: "RESOLVED",
    reporterComments: "Fallen tree branches blocking the main road after heavy rain.",
    media: [
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=300&q=80",
    ],
    timeline: [
      {
        status: "PENDING",
        color: "pending",
        performedBy: "Carlos Reyes",
        date: "Oct 15, 2025",
        time: "10:00 am",
        activity: {
          logId: "#LOG-6821",
          role: "Right Officer",
          module: "Report Management",
          primaryAction: "Created new road hazard report #HZ-4422",
          description: "Reporter submitted a new road hazard report for road debris in Ermita, Manila with severity level P4.",
        },
      },
      {
        status: "ONGOING",
        color: "ongoing",
        performedBy: "Carlos Reyes",
        date: "Oct 16, 2025",
        time: "2:15 pm",
        activity: {
          logId: "#LOG-6822",
          role: "Right Officer",
          module: "Report Management",
          primaryAction: "Updated report status #HZ-4422",
          description: "Administrator updated the status of road hazard report #HZ-4422 from PENDING to ONGOING and assigned cleanup crew.",
        },
      },
      {
        status: "RESOLVED",
        color: "resolved",
        performedBy: "Carlos Reyes",
        date: "Oct 17, 2025",
        time: "9:45 am",
        activity: {
          logId: "#LOG-6823",
          role: "Right Officer",
          module: "Report Management",
          primaryAction: "Resolved report #HZ-4422",
          description: "Administrator marked road hazard report #HZ-4422 as RESOLVED after crew removed fallen tree branches.",
        },
      },
    ],
  },
  "HRZ-4423": {
    id: "#HZ-4423",
    category: "Potholes",
    location: "Brgy 724, Manila",
    reportedSeverity: "P3",
    status: "PENDING",
    reporterComments: "Deep pothole near the school zone, risk to children.",
    media: [
      "https://images.unsplash.com/photo-1584463688353-29c11224d4bc?w=300&q=80",
    ],
    timeline: [
      {
        status: "PENDING",
        color: "pending",
        performedBy: "Maria Santos",
        date: "Oct 16, 2025",
        time: "11:00 am",
        activity: {
          logId: "#LOG-6824",
          role: "Right Officer",
          module: "Report Management",
          primaryAction: "Created new road hazard report #HZ-4423",
          description: "Reporter submitted a new road hazard report for potholes in Brgy 724, Manila with severity level P3.",
        },
      },
    ],
  },
};

function getReportDetail(reportId) {
  if (MOCK_DETAIL_REPORTS[reportId]) return MOCK_DETAIL_REPORTS[reportId];
  const fallbackId = `HRZ-${reportId.split("-").pop()}`;
  if (MOCK_DETAIL_REPORTS[fallbackId]) return MOCK_DETAIL_REPORTS[fallbackId];
  return {
    id: `#${reportId}`,
    category: "Uneven Roads",
    location: "Sampaloc, Manila",
    reportedSeverity: "P5",
    status: "RESOLVED",
    reporterComments: "Huge fissure, dangerous to vehicles",
    media: [
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=300&q=80",
    ],
    timeline: [
      {
        status: "PENDING",
        color: "pending",
        performedBy: "System",
        date: "Oct 14, 2025",
        time: "8:00 am",
        activity: {
          logId: "#LOG-6825",
          role: "System",
          module: "Report Management",
          primaryAction: "Created new road hazard report",
          description: "System automatically created a new road hazard report.",
        },
      },
    ],
  };
}

export default function ReportDetail({ reportId, onClose }) {
  const report = getReportDetail(reportId);
  const [selectedActivity, setSelectedActivity] = useState(null);

  return (
    <div className="report-detail-wrapper">
      <div className="report-detail-card">
        <div className="report-detail-header">
          <h2 className="report-detail-title">
            Report Details: {report.id} &ndash; {report.category}
          </h2>
          <button className="btn-export-pdf">
            <DownloadIcon />
            Export as PDF
          </button>
        </div>

        <div className="report-detail-fields">
          <div className="detail-field">
            <label className="detail-field-label">Location</label>
            <div className="detail-field-value">{report.location}</div>
          </div>
          <div className="detail-field">
            <label className="detail-field-label">Reported Severity</label>
            <div className="detail-field-value">{report.reportedSeverity}</div>
          </div>
          <div className="detail-field">
            <label className="detail-field-label">Report ID</label>
            <div className="detail-field-value">{report.id}</div>
          </div>
          <div className="detail-field">
            <label className="detail-field-label">Category</label>
            <div className="detail-field-value">{report.category}</div>
          </div>
          <div className="detail-field">
            <label className="detail-field-label">Status</label>
            <div className="detail-field-value">
              <span className={`status-badge status-${report.status.toLowerCase()}`}>
                {report.status.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        <div className="report-detail-section">
          <label className="detail-field-label">Reporter Comments</label>
          <p className="reporter-comments-text">{report.reporterComments}</p>
        </div>

        <div className="report-detail-section">
          <label className="detail-field-label">Attached Media</label>
          <div className="attached-media-grid">
            {report.media.map((src, idx) => (
              <div key={idx} className="media-thumbnail">
                <img src={src} alt={`Media ${idx + 1}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="report-detail-section">
          <label className="detail-field-label">Timeline of Status Changes</label>
          <div className="status-timeline">
            {report.timeline.map((entry, idx) => (
              <div key={idx} className="timeline-entry">
                <div className={`timeline-icon timeline-icon-${entry.color}`}>
                  <span className="timeline-step-number">{idx + 1}</span>
                </div>
                <span className={`timeline-status-badge timeline-status-${entry.color}`}>
                  {entry.status}
                </span>
                <p className="timeline-datetime">
                  {entry.date} . {entry.time}
                </p>
                <p className="timeline-performed-by">
                  Performed by: {entry.performedBy}
                </p>
                <button
                  className="timeline-view-details"
                  onClick={() => setSelectedActivity({ ...entry, reportId: report.id })}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="report-detail-footer">
          <button className="btn-close-detail" onClick={onClose}>
            CLOSE
          </button>
        </div>
      </div>

      {selectedActivity && selectedActivity.activity && (
        <ActivityDetailsModal
          activity={selectedActivity.activity}
          performedBy={selectedActivity.performedBy}
          date={selectedActivity.date}
          time={selectedActivity.time}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </div>
  );
}

function ActivityDetailsModal({ activity, performedBy, date, time, onClose }) {
  return (
    <div className="activity-details-overlay" onClick={onClose}>
      <div className="activity-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="activity-details-header">
          <div className="activity-details-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div className="activity-details-title-group">
            <h3 className="activity-details-title">Activity Details</h3>
            <p className="activity-details-subtitle">Detailed log information for system audit</p>
          </div>
          <button className="activity-details-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="activity-details-body">
          <div className="activity-details-grid">
            <div className="activity-detail-field">
              <label className="activity-detail-label">LOG ID</label>
              <div className="activity-detail-value">{activity.logId}</div>
            </div>
            <div className="activity-detail-field">
              <label className="activity-detail-label">PERFORMED BY</label>
              <div className="activity-detail-value">
                {performedBy}
                <span className="activity-detail-role-badge">{activity.role}</span>
              </div>
            </div>
            <div className="activity-detail-field">
              <label className="activity-detail-label">DATE & TIME</label>
              <div className="activity-detail-value">{date} • {time}</div>
            </div>
            <div className="activity-detail-field">
              <label className="activity-detail-label">MODULE</label>
              <div className="activity-detail-value">{activity.module}</div>
            </div>
          </div>

          <div className="activity-primary-action">
            <label className="activity-detail-label">PRIMARY ACTION</label>
            <div className="activity-primary-action-text">{activity.primaryAction}</div>
          </div>

          <div className="activity-description">
            <label className="activity-detail-label">DESCRIPTION</label>
            <p className="activity-description-text">{activity.description}</p>
          </div>
        </div>

        <div className="activity-details-footer">
          <button className="btn-activity-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
