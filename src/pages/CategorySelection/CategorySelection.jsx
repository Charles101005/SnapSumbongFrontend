import React, { useState } from "react";
import "./CategorySelection.css";

const CATEGORIES = [
  {
    id: "infrastructure-deficiencies",
    label: "Infrastructure Deficiencies",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    id: "alligator-cracks",
    label: "Alligator Cracks",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="20" x2="20" y2="4" />
        <line x1="4" y1="12" x2="12" y2="4" />
        <line x1="12" y1="20" x2="20" y2="12" />
      </svg>
    ),
  },
  {
    id: "major-scaling",
    label: "Major Scaling",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    id: "shoving-and-corrugation",
    label: "Shoving and Corrugation",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 8c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" />
        <path d="M2 12c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" />
        <path d="M2 16c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" />
      </svg>
    ),
  },
  {
    id: "pumping-and-depression",
    label: "Pumping and Depression",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="7 8 12 3 17 8" />
        <polyline points="7 16 12 21 17 16" />
        <line x1="12" y1="11" x2="12" y2="13" />
      </svg>
    ),
  },
  {
    id: "faded-road-markings",
    label: "Faded Road Markings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="12" x2="18" y2="12" />
        <line x1="12" y1="6" x2="12" y2="9" />
        <line x1="12" y1="15" x2="12" y2="18" />
      </svg>
    ),
  },
  {
    id: "defects-on-shoulders",
    label: "Defects on Shoulders",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    id: "lush-vegetation",
    label: "Lush Vegetation",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L7 10h3l-4 7h12l-4-7h3z" />
        <line x1="12" y1="17" x2="12" y2="22" />
      </svg>
    ),
  },
  {
    id: "clogged-drains",
    label: "Clogged Drains",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  {
    id: "open-manholes",
    label: "Open Manholes",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
      </svg>
    ),
  },
  {
    id: "inadequate-sealant",
    label: "Inadequate Sealant",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="12" r="5" />
        <circle cx="15" cy="12" r="5" />
      </svg>
    ),
  },
  {
    id: "road-cracks",
    label: "Road Cracks",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2c1.5 3-1.5 6 0 9s2 5 0 8" />
      </svg>
    ),
  },
  {
    id: "raveling",
    label: "Raveling",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <circle cx="8" cy="8" r="1.5" />
        <circle cx="16" cy="8" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="8" cy="16" r="1.5" />
        <circle cx="16" cy="16" r="1.5" />
      </svg>
    ),
  },
  {
    id: "unmaintained-signages",
    label: "Unmaintained Signages",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M8 6h8M8 12h8" />
      </svg>
    ),
  },
  {
    id: "unmaintained-bridges",
    label: "Unmaintained Bridges",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2" />
        <path d="M12 2v8M12 14v8" />
      </svg>
    ),
  },
  {
    id: "damaged-guardrails",
    label: "Damaged Guardrails",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="12" rx="1" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="8" y1="6" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="18" />
      </svg>
    ),
  },
];

export default function CategorySelection({ initialCategory, onSelectCategory, onBack }) {
  const [selectedId, setSelectedId] = useState(
    initialCategory || "infrastructure-deficiencies"
  );

  const handleConfirm = () => {
    const selectedObj = CATEGORIES.find((cat) => cat.id === selectedId);
    if (onSelectCategory) {
      onSelectCategory(selectedObj ? selectedObj.label : selectedId);
    }
  };

  return (
    <div className="category-selection-overlay">
      <div className="category-selection-card">
        {/* Header */}
        <div className="category-selection-header">
          <svg
            className="header-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <h2>3. Category Selection</h2>
        </div>

        {/* 4x4 Grid */}
        <div className="extended-category-grid">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedId === cat.id;
            return (
              <div
                key={cat.id}
                className={`extended-category-card ${isSelected ? "selected" : ""}`}
                onClick={() => setSelectedId(cat.id)}
              >
                <div className="extended-icon-wrapper">{cat.icon}</div>
                <span className="extended-category-label">{cat.label}</span>
              </div>
            );
          })}
        </div>

        {/* Separated Action Buttons */}
        <div className="category-selection-actions">
          <button type="button" className="btn-back" onClick={onBack}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>

          <button type="button" className="btn-confirm" onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}