import React from "react";
import "./InspectionDetailsSkeleton.css";

const InspectionDetailsSkeleton = () => {
  return (
    <div className="inspection-details-skeleton">
      {/* Tabs */}
      <div className="skeleton-tabs">
        <div className="skeleton-block skeleton-tab"></div>
        <div className="skeleton-block skeleton-tab"></div>
      </div>

      {/* Inspection Details */}
      <div>
        <div className="skeleton-block skeleton-section-title"></div>
        <div className="skeleton-section">
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div className="skeleton-block skeleton-field-label"></div>
              <div className="skeleton-block skeleton-field-value"></div>
            </div>
          ))}
        </div>
        <div className="skeleton-block skeleton-remarks" style={{ marginTop: "1rem" }}></div>
      </div>

      {/* Inspection Images */}
      <div>
        <div className="skeleton-block skeleton-section-title"></div>
        <div className="skeleton-block skeleton-circle"></div>
      </div>

      {/* Follow-up Details */}
      <div>
        <div className="skeleton-block skeleton-section-title"></div>
        <div className="skeleton-section">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="skeleton-block skeleton-field-label"></div>
              <div className="skeleton-block skeleton-field-value"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InspectionDetailsSkeleton;
