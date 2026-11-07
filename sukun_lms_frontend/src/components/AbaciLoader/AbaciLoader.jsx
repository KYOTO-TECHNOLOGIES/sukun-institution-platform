import React from 'react';
import './AbaciLoader.css';

const AbaciLoader = () => {
  return (
    <div className="box">
      <div className="bead-container">
        <div className="rod" id="rod-one">
          <div className="bead" style={{ backgroundColor: '#20A868' }}></div>
          <div className="bead" style={{ backgroundColor: '#EE6422' }}></div>
          <div className="bead" style={{ backgroundColor: '#F8F12B' }}></div>
          <div className="bead" style={{ backgroundColor: '#E42825' }}></div>
        </div>
        <div className="rod" id="rod-two">
          <div className="bead" style={{ backgroundColor: '#20A868' }}></div>
          <div className="bead" style={{ backgroundColor: '#EE6422' }}></div>
          <div className="bead" style={{ backgroundColor: '#F8F12B' }}></div>
          <div className="bead" style={{ backgroundColor: '#E42825' }}></div>
        </div>
        <div className="rod" id="rod-three">
          <div className="bead" style={{ backgroundColor: '#20A868' }}></div>
          <div className="bead" style={{ backgroundColor: '#EE6422' }}></div>
          <div className="bead" style={{ backgroundColor: '#F8F12B' }}></div>
          <div className="bead" style={{ backgroundColor: '#E42825' }}></div>
        </div>
        <div className="rod" id="rod-four">
          <div className="bead" style={{ backgroundColor: '#20A868' }}></div>
          <div className="bead" style={{ backgroundColor: '#EE6422' }}></div>
          <div className="bead" style={{ backgroundColor: '#F8F12B' }}></div>
          <div className="bead" style={{ backgroundColor: '#E42825' }}></div>
        </div>
      </div>
    </div>
  );
};

export default AbaciLoader;
