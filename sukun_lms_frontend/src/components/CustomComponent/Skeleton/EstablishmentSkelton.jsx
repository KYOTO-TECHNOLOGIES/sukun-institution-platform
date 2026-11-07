import React from "react";
import "./EstablishmentSkelton.css";

const EstablishmentSkelton = () => {
    return (
        <div className="establishment-skeleton">
            {/* Header Section */}
            <div className="skeleton-header">
                <div className="d-flex flex-column gap-2">
                    <div className="skeleton-logo"></div>
                    <div className="d-flex  gap-2">
                        <div className="skeleton-header-button"></div>
                        <div className="skeleton-header-button"></div>
                        <div className="skeleton-header-button"></div>
                        <div className="skeleton-header-button"></div>

                    </div>
                </div>
                <div className="skeleton-grade-container">
                    <div className="skeleton-grade"></div>
                    <div className="d-flex flex-column gap-2">
                        <div className="skeleton-gradetitle"></div>
                        <div className="skeleton-gradetitle"></div>
                    </div>

                </div>
                <div className="skeleton-location-container">
                    <div className="skeleton-location"></div>
                    <div className="d-flex flex-column gap-2">
                        <div className="skeleton-location-title"></div>
                        <div className="skeleton-location-title"></div>
                    </div>

                </div>
                <div className="skeleton-user-container">

                    <div className="d-flex  gap-2">
                        <div className="skeleton-user"></div>
                        <div className="d-flex flex-column ">  
                        <div className="skeleton-user-name"></div>
                        <div className="skeleton-user-name"></div>
                        </div>
                    </div>

                </div>
                <div className="skeleton-header-right">
                    <div className="skeleton-circle"></div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="skeleton-stats">
                {[...Array(5)].map((_, i) => (
                    <div className="skeleton-stat-box" key={i}></div>
                ))}
            </div>

            <div className="skeleton-main">
                {/* Sidebar */}
                <div className="skeleton-sidebar">
                    {[...Array(8)].map((_, i) => (
                        <div className="skeleton-side-btn" key={i}></div>
                    ))}
                </div>

                {/* Content Area */}
                <div className="skeleton-content">
                    <div className="skeleton-tab-row">
                        {[...Array(4)].map((_, i) => (
                            <div className="skeleton-tab" key={i}></div>
                        ))}
                    </div>

                    <div className="skeleton-address-section">
                        <div className="skeleton-address-details">
                            {[...Array(8)].map((_, i) => (
                                <div className="skeleton-line" key={i}></div>
                            ))}
                        </div>
                        <div className="skeleton-image"></div>
                    </div>
                    <div className="skeleton-address-details">
                            {[...Array(8)].map((_, i) => (
                                <div className="skeleton-line" key={i}></div>
                            ))}
                        </div>
                </div>
            </div>
        </div>
    );
};

export default EstablishmentSkelton;
