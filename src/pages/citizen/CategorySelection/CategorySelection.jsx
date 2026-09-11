import React, { useState } from "react";
import "./CategorySelection.css";

const DEFAULT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

// Best-effort icon lookup by keyword found in the category name, since icons
// are purely decorative and the category list itself comes from the API.
const ICON_RULES = [
  { match: /pothole/i, icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
    </svg>
  ) },
  { match: /alligator|crack/i, icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="20" x2="20" y2="4" />
      <line x1="4" y1="12" x2="12" y2="4" />
      <line x1="12" y1="20" x2="20" y2="12" />
    </svg>
  ) },
  { match: /scaling/i, icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ) },
  { match: /shoving|corrugation/i, icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" />
      <path d="M2 12c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" />
      <path d="M2 16c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" />
    </svg>
  ) },
  { match: /pumping|depression/i, icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="7 8 12 3 17 8" />
      <polyline points="7 16 12 21 17 16" />
      <line x1="12" y1="11" x2="12" y2="13" />
    </svg>
  ) },
  { match: /marking/i, icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="12" x2="18" y2="12" />
      <line x1="12" y1="6" x2="12" y2="9" />
      <line x1="12" y1="15" x2="12" y2="18" />
    </svg>
  ) },
  { match: /shoulder/i, icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ) },
  { match: /vegetation/i, icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L7 10h3l-4 7h12l-4-7h3z" />
      <line x1="12" y1="17" x2="12" y2="22" />
    </svg>
  ) },
  { match: /drain/i, icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ) },
  { match: /manhole/i, icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
    </svg>
  ) },
  { match: /sealant/i, icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="12" r="5" />
      <circle cx="15" cy="12" r="5" />
    </svg>
  ) },
  { match: /raveling/i, icon: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="16" cy="8" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="8" cy="16" r="1.5" />
      <circle cx="16" cy="16" r="1.5" />
    </svg>
  ) },
  { match: /signage/i, icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M8 6h8M8 12h8" />
    </svg>
  ) },
  { match: /bridge/i, icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2v8M12 14v8" />
    </svg>
  ) },
  { match: /guardrail/i, icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12" rx="1" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="8" y1="6" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="18" />
    </svg>
  ) },
];

function getIconFor(name = "") {
  const rule = ICON_RULES.find((r) => r.match.test(name));
  return rule ? rule.icon : DEFAULT_ICON;
}

export default function CategorySelection({
  categories = [],
  initialCategoryIds = [],
  maxSelections = 3,
  onSelectCategories,
  onBack,
}) {
  const [selectedIds, setSelectedIds] = useState(initialCategoryIds);
  const [limitNotice, setLimitNotice] = useState("");

  const toggleCategory = (hazardId) => {
    setSelectedIds((prev) => {
      if (prev.includes(hazardId)) {
        setLimitNotice("");
        return prev.filter((id) => id !== hazardId);
      }
      if (prev.length >= maxSelections) {
        setLimitNotice(`You can select up to ${maxSelections} categories.`);
        return prev;
      }
      setLimitNotice("");
      return [...prev, hazardId];
    });
  };

  const handleConfirm = () => {
    if (onSelectCategories && selectedIds.length > 0) {
      onSelectCategories(selectedIds);
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
          <span className="category-selection-count">
            {selectedIds.length}/{maxSelections} selected
          </span>
        </div>

        {/* Category Grid */}
        <div className="extended-category-grid">
          {categories.length === 0 ? (
            <p className="category-empty-state">
              No hazard categories are available right now. Please try again later.
            </p>
          ) : (
            categories.map((cat) => {
              const isSelected = selectedIds.includes(cat.hazard_id);
              return (
                <div
                  key={cat.hazard_id}
                  className={`extended-category-card ${isSelected ? "selected" : ""}`}
                  onClick={() => toggleCategory(cat.hazard_id)}
                  title={cat.description}
                >
                  <div className="extended-icon-wrapper">{getIconFor(cat.hazard_name)}</div>
                  <span className="extended-category-label">{cat.hazard_name}</span>
                  {isSelected && <span className="extended-check-badge">&#10003;</span>}
                </div>
              );
            })
          )}
        </div>

        {limitNotice && <p className="category-limit-notice">{limitNotice}</p>}

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

          <button
            type="button"
            className="btn-confirm"
            onClick={handleConfirm}
            disabled={selectedIds.length === 0}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
