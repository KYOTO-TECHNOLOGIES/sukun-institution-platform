import React from "react";
import "./ContractLogSkelton.css";

const ContractLogSkelton = () => {
  return (
    <div className="contract-log-skeleton">
      {/* Header */}
      <div className="d-flex  align-items-center gap-2 mb-4">
        <div className="skeleton-block skeleton-header-icon"></div>
        <div>
          <div className="skeleton-block skeleton-header-title"></div>
          <div className="skeleton-block skeleton-header-subtitle"></div>
        </div>
      </div>


      {/* Contract Status */}
      <div className="skeleton-status-section">
        <div className="d-flex flex-column gap-2">
          <div className="skeleton-block skeleton-status-title mb-2"></div>
          <div className="skeleton-block skeleton-status-subtitle"></div>
        </div>
        <div className="skeleton-block skeleton-status-badge"></div>
      </div>

      {/* Contract Info */}
      <div className="skeleton-card">
        <div className="skeleton-block skeleton-header-title"></div>
        <div className="skeleton-info-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="skeleton-block skeleton-field-label"></div>
              <div className="skeleton-block skeleton-field-value"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Contract Logs */}
      <div>
        <div className="skeleton-block skeleton-header-title mb-4 mt-4" style={{ width: "160px" }}></div>
        <div className="skeleton-logs ">
          {[...Array(2)].map((_, i) => (
            <div className="skeleton-log-item" key={i}>
              <div className="skeleton-block skeleton-log-icon"></div>
              <div className="skeleton-log-card">
                <div className="skeleton-log-header">
                  <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                    <div className="skeleton-block skeleton-log-name"></div>
                    <div className="skeleton-block skeleton-log-time"></div>
                  </div>
                  <div className="skeleton-block skeleton-log-badge"></div>
                </div>
                <div className="skeleton-block skeleton-log-message"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContractLogSkelton;
