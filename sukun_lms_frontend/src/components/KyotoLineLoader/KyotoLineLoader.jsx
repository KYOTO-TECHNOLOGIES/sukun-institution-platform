import React from 'react';
import '../KyotoLoader/KyotoLoader.css';

const KyotoLineLoader = () => {
  return (
    <div className="kyoto-loader-content">
      <div className="kyoto-loader-line line-top-1"></div>
      <div className="kyoto-loader-line line-top-2"></div>
      <div className="kyoto-center-track">
        <div className="kyoto-track-rail"></div>
        <div className="kyoto-letters-layer">
          <span className="kyoto-letter letter-k">K</span>
          <span className="kyoto-letter letter-y">Y</span>
          <span className="kyoto-letter letter-o1">O</span>
          <span className="kyoto-letter letter-t">T</span>
          <span className="kyoto-letter letter-o2">O</span>
        </div>
      </div>
      <div className="kyoto-loader-line line-bottom-4"></div>
      <div className="kyoto-loader-line line-bottom-5"></div>
    </div>
  );
};

export default KyotoLineLoader;
