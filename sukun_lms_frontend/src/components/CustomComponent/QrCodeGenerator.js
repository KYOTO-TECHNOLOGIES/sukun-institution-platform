import QRCode from 'qrcode';

/**
 * QR Code Generator Utility Functions
 * Provides various methods to generate QR codes for the car wash application
 */

/**
 * Generate QR code as data URL (base64 encoded image)
 * @param {string} data - The data to encode in the QR code
 * @param {Object} options - QR code generation options
 * @returns {Promise<string>} - Base64 encoded image data URL
 */
export const generateQRCodeAsDataURL = async (data, options = {}) => {
  try {
    const defaultOptions = {
      width: 450,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };

    const qrOptions = { ...defaultOptions, ...options };
    const dataURL = await QRCode.toDataURL(data, qrOptions);
    return dataURL;
  } catch (error) {
    console.error('Error generating QR code as data URL:', error);
    throw error;
  }
};

/**
 * Generate QR code as SVG string
 * @param {string} data - The data to encode in the QR code
 * @param {Object} options - QR code generation options
 * @returns {Promise<string>} - SVG string
 */
export const generateQRCodeAsSVG = async (data, options = {}) => {
  try {
    const defaultOptions = {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };

    const qrOptions = { ...defaultOptions, ...options };
    const svg = await QRCode.toString(data, { type: 'svg', ...qrOptions });
    return svg;
  } catch (error) {
    console.error('Error generating QR code as SVG:', error);
    throw error;
  }
};

/**
 * Generate QR code as canvas element
 * @param {string} data - The data to encode in the QR code
 * @param {HTMLCanvasElement} canvas - Canvas element to draw on
 * @param {Object} options - QR code generation options
 * @returns {Promise<void>}
 */
export const generateQRCodeOnCanvas = async (data, canvas, options = {}) => {
  try {
    const defaultOptions = {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };

    const qrOptions = { ...defaultOptions, ...options };
    await QRCode.toCanvas(canvas, data, qrOptions);
  } catch (error) {
    console.error('Error generating QR code on canvas:', error);
    throw error;
  }
};

/**
 * Generate QR code and download as image file
 * @param {string} data - The data to encode in the QR code
 * @param {string} filename - Name of the file to download
 * @param {Object} options - QR code generation options
 * @returns {Promise<void>}
 */
export const downloadQRCode = async (data, filename = 'qrcode.png', options = {}) => {
  try {
    const dataURL = await generateQRCodeAsDataURL(data, options);

    // Create download link
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw error;
  }
};

/**
 * Generate QR code for car wash specific data
 * @param {Object} carWashData - Car wash specific data object
 * @param {string} carWashData.siteId - Site ID
 * @param {string} carWashData.bayId - Bay ID
 * @param {string} carWashData.serviceId - Service ID
 * @param {string} carWashData.customerId - Customer ID (optional)
 * @param {Object} options - QR code generation options
 * @returns {Promise<string>} - Base64 encoded image data URL
 */
export const generateCarWashQRCode = async (carWashData, options = {}) => {
  try {
    const qrData = {
      type: 'carwash',
      siteId: carWashData.siteId,
      bayId: carWashData.bayId,
      serviceId: carWashData.serviceId,
      customerId: carWashData.customerId || null,
      timestamp: new Date().toISOString()
    };

    const jsonData = JSON.stringify(qrData);
    return await generateQRCodeAsDataURL(jsonData, options);
  } catch (error) {
    console.error('Error generating car wash QR code:', error);
    throw error;
  }
};

/**
 * Generate QR code for payment/checkout
 * @param {Object} paymentData - Payment data object
 * @param {string} paymentData.amount - Payment amount
 * @param {string} paymentData.currency - Currency code
 * @param {string} paymentData.orderId - Order ID
 * @param {string} paymentData.paymentMethod - Payment method
 * @param {Object} options - QR code generation options
 * @returns {Promise<string>} - Base64 encoded image data URL
 */
export const generatePaymentQRCode = async (paymentData, options = {}) => {
  try {
    const qrData = {
      type: 'payment',
      amount: paymentData.amount,
      currency: paymentData.currency,
      orderId: paymentData.orderId,
      paymentMethod: paymentData.paymentMethod,
      timestamp: new Date().toISOString()
    };

    const jsonData = JSON.stringify(qrData);
    return await generateQRCodeAsDataURL(jsonData, options);
  } catch (error) {
    console.error('Error generating payment QR code:', error);
    throw error;
  }
};

/**
 * Generate QR code for customer loyalty/rewards
 * @param {Object} loyaltyData - Loyalty data object
 * @param {string} loyaltyData.customerId - Customer ID
 * @param {string} loyaltyData.membershipLevel - Membership level
 * @param {number} loyaltyData.points - Current points
 * @param {Object} options - QR code generation options
 * @returns {Promise<string>} - Base64 encoded image data URL
 */
export const generateLoyaltyQRCode = async (loyaltyData, options = {}) => {
  try {
    const qrData = {
      type: 'loyalty',
      customerId: loyaltyData.customerId,
      membershipLevel: loyaltyData.membershipLevel,
      points: loyaltyData.points,
      timestamp: new Date().toISOString()
    };

    const jsonData = JSON.stringify(qrData);
    return await generateQRCodeAsDataURL(jsonData, options);
  } catch (error) {
    console.error('Error generating loyalty QR code:', error);
    throw error;
  }
};

/**
 * Generate QR code with custom styling and logo
 * @param {string} data - The data to encode in the QR code
 * @param {Object} options - QR code generation options
 * @param {string} options.logo - Logo image URL (optional)
 * @param {Object} options.logoOptions - Logo positioning and size options
 * @returns {Promise<string>} - Base64 encoded image data URL
 */
export const generateStyledQRCode = async (data, options = {
  logo: null,
  logoOptions: {
    width: 40,
    height: 40,
    margin: 2
  }
}) => {
  try {
    const defaultOptions = {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H', // Higher error correction for logo overlay
      logo: null,
      logoOptions: {
        width: 40,
        height: 40,
        margin: 2
      }
    };

    const qrOptions = { ...defaultOptions, ...options };
    
    if (qrOptions.logo) {
      // Generate QR code with logo overlay
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Generate QR code on canvas
      await generateQRCodeOnCanvas(data, canvas, qrOptions);
      
      // Add logo overlay
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        logo.onload = () => {
          const logoWidth = qrOptions.logoOptions.width;
          const logoHeight = qrOptions.logoOptions.height;
          const logoX = (canvas.width - logoWidth) / 2;
          const logoY = (canvas.height - logoHeight) / 2;
          
          // Draw logo
          ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
          
          // Convert to data URL
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        };
        
        logo.onerror = reject;
        logo.src = qrOptions.logo;
      });
    } else {
      // Generate regular QR code
      return await generateQRCodeAsDataURL(data, qrOptions);
    }
  } catch (error) {
    console.error('Error generating styled QR code:', error);
    throw error;
  }
};

/**
 * Validate QR code data
 * @param {string} data - The data to validate
 * @returns {boolean} - Whether the data is valid for QR code generation
 */
export const validateQRCodeData = (data) => {
  if (!data || typeof data !== 'string') {
    return false;
  }
  
  // Check if data is not too long (QR codes have size limits)
  if (data.length > 2953) { // Maximum for version 40 QR code
    return false;
  }
  
  return true;
};

/**
 * Parse QR code data from car wash QR codes
 * @param {string} qrData - QR code data string
 * @returns {Object|null} - Parsed data object or null if invalid
 */
export const parseCarWashQRData = (qrData) => {
  try {
    const data = JSON.parse(qrData);
    if (data.type === 'carwash' && data.siteId && data.bayId && data.serviceId) {
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error parsing car wash QR data:', error);
    return null;
  }
};

export default {
  generateQRCodeAsDataURL,
  generateQRCodeAsSVG,
  generateQRCodeOnCanvas,
  downloadQRCode,
  generateCarWashQRCode,
  generatePaymentQRCode,
  generateLoyaltyQRCode,
  generateStyledQRCode,
  validateQRCodeData,
  parseCarWashQRData
};
