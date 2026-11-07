import QRCode from "qrcode";

export const generateQRCode = async (string, rowData, fogwatchLogo) => {
    try {
        // QR Code options
        const opts = {
            errorCorrectionLevel: "H",
            width: 320,
        };

        // Generate QR Code as a Data URL
        const qrCodeUrl = await QRCode.toDataURL(string, opts);

        // Convert fogwatchLogo (URL) to an Image
        const logoImg = new Image();
        logoImg.crossOrigin = "Anonymous"; // Allow cross-origin access
        logoImg.src = fogwatchLogo;

        // Create canvas and context
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas dimensions
        canvas.width = 400;
        canvas.height = 500;

        // Wait for the images to load
        logoImg.onload = () => {
            const qrImg = new Image();
            qrImg.src = qrCodeUrl;

            qrImg.onload = () => {
                // Draw white background
                ctx.fillStyle = "#fff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw the logo
                ctx.drawImage(logoImg, 35, 20, 330, 70);

                // Draw the QR code
                ctx.drawImage(qrImg, 75, 120, 250, 250);

                // Draw the establishment name
                ctx.fillStyle = "#000";
                ctx.textAlign = "center";
                let fontSize = 22;
                let maxWidth = 380;

                ctx.font = `bold ${fontSize}px Arial`;
                if (ctx.measureText(rowData?.establishment_name).width > maxWidth) {
                    fontSize = 18;
                    ctx.font = `bold ${fontSize}px Arial`;
                }

                // Wrap and draw text for establishment name
                const lines = [];
                const words = rowData?.establishment_name.split(" ");
                let line = "";

                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + " ";
                    const testWidth = ctx.measureText(testLine).width;

                    if (testWidth > maxWidth && n > 0) {
                        lines.push(line);
                        line = words[n] + " ";
                    } else {
                        line = testLine;
                    }
                }
                lines.push(line);

                let y = 400;
                lines.forEach((l) => {
                    ctx.fillText(l, canvas.width / 2, y);
                    y += fontSize + 5;
                });

                // Draw the trade license number and foodwatch ID
                let text = '';
                if (rowData?.trade_license_no) {
                    text += `TL No: ${rowData.trade_license_no}`;
                }
                if (rowData?.foodwatch_id) {
                    if (text) text += ' / ';
                    text += `FW Id: ${rowData.foodwatch_id}`;
                }
                ctx.fillText(text, canvas.width / 2, y + 15);

                // Convert canvas to JPEG and trigger download
                const jpegUrl = canvas.toDataURL("image/jpeg");
                const link = document.createElement('a');
                link.href = jpegUrl;
                link.download = `${rowData?.establishment_name}.jpg`;
                link.click();
            };

            qrImg.onerror = () => {
                console.error("Error loading QR code image.");
            };
        };

        logoImg.onerror = () => {
            console.error("Error loading logo image.");
        };
    } catch (err) {
        console.error("Error generating QR code:", err);
    }
};
