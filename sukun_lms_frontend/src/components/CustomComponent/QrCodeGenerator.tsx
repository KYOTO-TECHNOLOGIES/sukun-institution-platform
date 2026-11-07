import React, { useState, useEffect } from 'react';
import generateQRCodeAsDataURL from '../../components/CustomComponent/QrCodeGenerator';
// import { generateQRCodeAsDataURL } from '../../components/CustomComponent/QrCodeGenerator';
import { authAxios } from '../../axiosInstance';

interface QRCodeGeneratorProps {
  siteName: string;
  parkingName: string;
  className?: string;
  siteId: string;
  parkingId: string;
}

interface Level {
  id: number;
  name: string;
  status: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  siteName,
  parkingName,
  siteId,
  parkingId,
  className = ''
}) => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<any>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Fetch levels from backend API
  const fetchLevels = async () => {
    try {
      setLoading(true);
      const response = await authAxios.get(`api/locations/levels?site=${siteId}&parking_area=${parkingId}`);
      if (response.data && Array.isArray(response.data.results)) {
        setLevels(response.data.results);
      }
    } catch (err) {
      console.error('Error fetching levels:', err);
      setError('Failed to fetch levels from server');
    } finally {
      setLoading(false);
    }
  };

  // Generate QR code for selected level
  const generateQRCode = async () => {
    if (!selectedLevel) {
      setError('Please select a level first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const text = `Wash my car. I am in ${siteName}, ${parkingName}, level ${selectedLevel}`;
      const data:any = `https://wa.me/971501537807?text=${encodeURIComponent(text)}`;
      
      const qrCodeUrl = await generateQRCodeAsDataURL(data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      setQrCodeUrl(qrCodeUrl);
    } catch (err) {
      setError('Failed to generate QR code');
      console.error('QR Code generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Download QR code
  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${siteName}-${parkingName}-${selectedLevel}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  useEffect(() => {
    if (selectedLevel) {
      generateQRCode();
    }
  }, [selectedLevel, siteName, parkingName]);

  return (
    <div className={`qr-code-generator ${className}`}>
      <div className="card">
        <div className="card-header">
          <h5>Generate WhatsApp QR Code</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="form-group mb-3">
                <label htmlFor="levelSelect" className="form-label">Select Level:</label>
                <select
                  id="levelSelect"
                  className="form-select"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Choose a level...</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.name}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <strong>Site:</strong> {siteName}
              </div>
              <div className="mb-3">
                <strong>Parking:</strong> {parkingName}
              </div>

              {selectedLevel && (
                <div className="mb-3">
                  <strong>Selected Level:</strong> {selectedLevel}
                </div>
              )}

              {qrCodeUrl && (
                <button
                  className="btn btn-primary"
                  onClick={downloadQRCode}
                  disabled={loading}
                >
                  Download QR Code
                </button>
              )}
            </div>

            <div className="col-md-6">
              <div className="text-center">
                {loading && (
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {qrCodeUrl && !loading && (
                  <div>
                    <img
                      src={qrCodeUrl}
                      alt={`QR Code for ${siteName} - ${parkingName} - ${selectedLevel}`}
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                      }}
                    />
                    <div className="mt-2">
                      <small className="text-muted">
                        Scan to open WhatsApp with pre-filled message
                      </small>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedLevel && (
            <div className="mt-3">
              <div className="card bg-light">
                <div className="card-body">
                  <h6>WhatsApp Message Preview:</h6>
                  <p className="mb-0">
                    "Wash my car. I am in {siteName}, {parkingName}, level {selectedLevel}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator; 