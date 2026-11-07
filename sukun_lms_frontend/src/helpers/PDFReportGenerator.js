/* eslint-disable new-cap */
import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // Import at the top level
// import base64ImgSrc from '../assets/NMDC Group Blue.png';
import logo from '../assets/FogwatchLogo.svg'

const pdfGenerator = (headRowData, bodyRowData, name) => {

  const base64Img = new Image();
  base64Img.src = logo;

  const Document = new jsPDF({
    format: 'legal',
    orientation: 'landscape',
  });

  const totalPagesExp = '{total_pages_count_string}';
  // @ts-ignore
  Document.autoTable({
    head: headRowData,
    body: bodyRowData,
    styles: { font: 'helvetica', fontSize: 8 },
    headStyles: {
      fillColor: '#0082CA',
    },

    didDrawPage(data) {
      // Header
      Document.setTextColor(40);
      if (base64Img) {
        Document.addImage(base64Img, 'JPEG', data.settings.margin.left, 9, 35, 8);
      }

      Document.setFontSize(14);
      Document.text(name, data.settings.margin.left + 45, 15);
      Document.setFont('helvetica', 'bold');

      // Footer
      // @ts-ignore
      let str = `Page ${Document.internal.getNumberOfPages()}`;
      if (typeof Document.putTotalPages === 'function') {
        str = `${str} of ${totalPagesExp}`;
      }
      Document.setFontSize(8);

      const { pageSize } = Document.internal;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      Document.text(str, data.settings.margin.left, pageHeight - 10);
    },
    margin: { top: 25, bottom: 15, right: 15 },
  });

  if (typeof Document.putTotalPages === 'function') {
    Document.putTotalPages(totalPagesExp);
  }

  return Document;
};

export default pdfGenerator;
/* eslint-enable new-cap */