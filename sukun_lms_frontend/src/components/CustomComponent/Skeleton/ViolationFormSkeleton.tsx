import React from 'react';
import './ViolationFormSkeleton.css';

const ViolationFormSkeleton = () => {
  return (
    <div className="violation-form-skeleton">
      {/* Violator Field */}
      <div className="skeleton-field">
        <div className="skeleton-label"></div>
        <div className="skeleton-select"></div>
      </div>

      {/* Issued By Field */}
      <div className="skeleton-field">
        <div className="skeleton-label"></div>
        <div className="skeleton-select"></div>
      </div>

      {/* Violation Field */}
      <div className="skeleton-field">
        <div className="skeleton-label"></div>
        <div className="skeleton-select"></div>
      </div>

      {/* GTCC or Entity Field */}
      <div className="skeleton-field">
        <div className="skeleton-label"></div>
        <div className="skeleton-select"></div>
      </div>

      {/* Reported By Field */}
      <div className="skeleton-field">
        <div className="skeleton-label"></div>
        <div className="skeleton-input"></div>
      </div>

      {/* Reported Date Field */}
      <div className="skeleton-field">
        <div className="skeleton-label"></div>
        <div className="skeleton-input"></div>
      </div>

      {/* Remarks Field */}
      <div className="skeleton-field">
        <div className="skeleton-label"></div>
        <div className="skeleton-textarea"></div>
        <div className="skeleton-char-count"></div>
      </div>

      {/* Violation Images Upload */}
      <div className="skeleton-field">
        <div className="skeleton-label"></div>
        <div className="skeleton-upload-box">
          <div className="skeleton-upload-icon"></div>
          <div className="skeleton-upload-text"></div>
          <div className="skeleton-upload-subtext"></div>
        </div>
      </div>
    </div>
  );
};

export default ViolationFormSkeleton;

