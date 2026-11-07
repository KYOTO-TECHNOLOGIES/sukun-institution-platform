import React from "react";
import "./SettingsSkelton.css";

const SettingsSkeleton = () => {
  return (
    <div className="row w-100 px-4">
      <div className="col-12">
        <div className="settings-skeleton">
          {/* Header */}
          <div className="skeleton-header">
            <div className="skeleton-icon-circle"></div>
            <div className="skeleton-title"></div>
          </div>

          {/* Setting item blocks */}
          <div className="row ">
            <div className="col-6">
              <div className="skeleton-setting-item mb-4">
                <div className="skeleton-item-left">
                  <div className="skeleton-icon"></div>
                  <div className="skeleton-lines">
                    <div className="skeleton-line short"></div>
                    <div className="skeleton-line"></div>
                  </div>
                </div>
                <div className="skeleton-edit-icon"></div>
              </div>

              <div className="skeleton-setting-item mb-4">
                <div className="skeleton-item-left">
                  <div className="skeleton-icon"></div>
                  <div className="skeleton-lines">
                    <div className="skeleton-line short"></div>
                    <div className="skeleton-line"></div>
                  </div>
                </div>
                <div className="skeleton-edit-icon"></div>
              </div>
              <div className="skeleton-setting-item mb-4">
                <div className="skeleton-item-left">
                  <div className="skeleton-icon"></div>
                  <div className="skeleton-lines">
                    <div className="skeleton-line short"></div>
                    <div className="skeleton-line"></div>
                  </div>
                </div>
                <div className="skeleton-edit-icon"></div>
              </div>
            </div>
            <div className="col-6  ">
              <div className="skeleton-setting-item mb-4">
                <div className="skeleton-item-left">
                  <div className="skeleton-icon"></div>
                  <div className="skeleton-lines">
                    <div className="skeleton-line short"></div>
                    <div className="skeleton-line"></div>
                  </div>
                </div>
                <div className="skeleton-edit-icon"></div>
              </div>

              <div className="skeleton-setting-item mb-4">
                <div className="skeleton-item-left">
                  <div className="skeleton-icon"></div>
                  <div className="skeleton-lines">
                    <div className="skeleton-line short"></div>
                    <div className="skeleton-line"></div>
                  </div>
                </div>
                <div className="skeleton-edit-icon"></div>
              </div>
              <div className="skeleton-setting-item mb-4">
                <div className="skeleton-item-left">
                  <div className="skeleton-icon"></div>
                  <div className="skeleton-lines">
                    <div className="skeleton-line short"></div>
                    <div className="skeleton-line"></div>
                  </div>
                </div>
                <div className="skeleton-edit-icon"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsSkeleton;
