import React, { useState } from 'react';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';

const LoaderPreview = () => {
  const [bgTheme, setBgTheme] = useState<'light' | 'dark' | 'gradient' | 'navy'>('dark');

  const getBgStyle = () => {
    switch (bgTheme) {
      case 'light':
        return { backgroundColor: '#f8f9fa', color: '#212529' };
      case 'dark':
        return { backgroundColor: '#0f172a', color: '#f8fafc' };
      case 'gradient':
        return { background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #0f172a 100%)', color: '#ffffff' };
      case 'navy':
        return { backgroundColor: '#1e293b', color: '#f1f5f9' };
      default:
        return { backgroundColor: '#0f172a', color: '#ffffff' };
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '30px 20px',
        boxSizing: 'border-box',
        transition: 'all 0.4s ease',
        ...getBgStyle(),
      }}
    >
      {/* Top Controls Bar */}
      <div style={{ textAlign: 'center', zIndex: 10000 }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '0.02em' }}>
          Kyoto Kinetic Line Loader Preview
        </h2>
        <p style={{ opacity: 0.75, fontSize: '0.9rem', marginBottom: '16px' }}>
          300px Wide Cut-Line & Animated Letter Choreography
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setBgTheme('dark')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: bgTheme === 'dark' ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.2)',
              background: '#0f172a',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            Dark Canvas
          </button>

          <button
            onClick={() => setBgTheme('light')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: bgTheme === 'light' ? '2px solid #0284c7' : '1px solid rgba(0,0,0,0.2)',
              background: '#ffffff',
              color: '#0f172a',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            Light Canvas
          </button>

          <button
            onClick={() => setBgTheme('gradient')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: bgTheme === 'gradient' ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.2)',
              background: 'linear-gradient(135deg, #4c1d95, #0284c7)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            Gradient Canvas
          </button>
        </div>
      </div>

      {/* Center Showcase Loader */}
      <div style={{ position: 'relative', width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <KyotoLoader />
      </div>

      {/* Footer Info */}
      <div style={{ fontSize: '0.8rem', opacity: 0.6, textAlign: 'center', zIndex: 10000 }}>
        Kyoto LMS • Powered by Kyoto Technologies
      </div>
    </div>
  );
};

export default LoaderPreview;
