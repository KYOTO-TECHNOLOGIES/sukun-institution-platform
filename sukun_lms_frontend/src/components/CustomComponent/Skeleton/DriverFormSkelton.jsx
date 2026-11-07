import React from 'react';
import './DriverFormSkelton.css';

const DriverFormSkelton = () => {
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

         

            {/* Violation Images Upload */}
            {/* <div className="skeleton-field">
                <div className="skeleton-upload-box">
                    <div className="skeleton-label"></div>
                    <div className='d-flex gap-2'>
                        <div className="skeleton-password-input"></div>
                        <div className="skeleton-button"></div>
                    </div>
                </div>
            </div> */}
        </div>
    );
};

export default DriverFormSkelton;

