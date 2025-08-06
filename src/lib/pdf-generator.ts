
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Quotation, Invoice, CompanyInfo, Item } from './types';
import { toWords } from 'number-to-words';

// Extend jsPDF with the autoTable plugin
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

const isQuotation = (invoice: Quotation | Invoice, mode: string): invoice is Quotation => {
    return mode === 'Quotation';
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString + 'T00:00:00Z');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = date.getUTCFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return dateString;
    }
};

const drawSectionHeader = (pdf: jsPDFWithAutoTable, text: string, yPos: number, margin: number, color: string, fontSize: number = 12) => {
    pdf.setFontSize(fontSize);
    pdf.setTextColor(color);
    pdf.setFont('helvetica', 'bold');
    pdf.text(text, margin, yPos);
    pdf.setDrawColor(color);
    pdf.line(margin, yPos + 2, pageWidth - margin, yPos + 2); // full width line
    return yPos + 15;
}


const drawHeader = (pdf: jsPDFWithAutoTable, docName: string | null, docNumber: string | null, margin: number, onFirstPage: boolean = true, companyInfo: CompanyInfo | null = null) => {
      let yPos = margin;
      if (onFirstPage) {
        pdf.setFontSize(24);
        pdf.setTextColor('#2B6CB0'); // primaryColor
        pdf.setFont('helvetica', 'bold');
        pdf.text(docName!, margin, yPos);
      
        if (companyInfo && companyInfo.logo) {
            try {
                const logoHeight = 40;
                const logoY = margin - 10;
                pdf.addImage(companyInfo.logo, 'JPEG', pdf.internal.pageSize.width - margin - 80, logoY , 80, logoHeight, undefined, 'FAST');
                yPos = Math.max(yPos, logoY + logoHeight);
            } catch (e) {
                console.error("Error adding logo image to PDF:", e);
            }
        }
      } else {
        pdf.setFontSize(14);
        pdf.setTextColor('#718096'); // lightTextColor
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${docName} - ${docNumber} (Cont.)`, margin, margin/2);
      }
      return yPos;
    }

let pageHeight: number;
let pageWidth: number;

export const downloadPdf = async (
    mode: 'Quotation' | 'Invoice' | 'Receipt' | 'Bill',
    doc: Quotation | Invoice,
    companyInfo: CompanyInfo,
) => {
    const docName = mode.toUpperCase();
    const docNumber = isQuotation(doc, mode) ? doc.quotationNumber : doc.invoiceNumber;
    const fileName = `${docName}-${docNumber}.pdf`;

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
    }) as jsPDFWithAutoTable;
    
    pageHeight = pdf.internal.pageSize.height;
    pageWidth = pdf.internal.pageSize.width;

    const margin = 40;
    let yPos = 0;

    // --- PDF Theme ---
    const primaryColor = '#2B6CB0'; // A nice blue
    const textColor = '#2D3748';
    const lightTextColor = '#718096';

    pdf.setFont('helvetica', 'normal');
    
    yPos = drawHeader(pdf, docName, docNumber, margin, true, companyInfo);
      
    // Ensure yPos is below the header content
    yPos = yPos > margin ? yPos + 20 : margin + 30;

    // --- Document Details & From/To Section ---
    const detailsStartY = yPos;
    pdf.setFontSize(10);
    pdf.setTextColor(textColor);
    pdf.setFont('helvetica', 'normal');

    let leftColY = detailsStartY;
    if (isQuotation(doc, mode)) {
        pdf.text(`Quotation No: ${doc.quotationNumber}`, margin, leftColY);
        leftColY += 15;
        pdf.text(`Date: ${formatDate(doc.date)}`, margin, leftColY);
        leftColY += 15;
        pdf.text(`Valid Until: ${formatDate(doc.validUntil)}`, margin, leftColY);
    } else {
        pdf.text(`${mode} No: ${doc.invoiceNumber}`, margin, leftColY);
        leftColY += 15;
        pdf.text(`Date: ${formatDate(doc.date)}`, margin, leftColY);
    }


    yPos = leftColY + 30;

    // --- From/To Section ---
    const fromToStartY = yPos;
    let fromY = fromToStartY;
    let toY = fromToStartY;
    const toX = pageWidth / 2 + 20;

    pdf.setFont('helvetica', 'bold');
    pdf.text('From:', margin, fromY);
    fromY += 15;
    pdf.setFont('helvetica', 'normal');
    pdf.text(companyInfo.name || 'Your Company', margin, fromY);
    fromY += 15;
    if(companyInfo.address){
      const fromAddress = pdf.splitTextToSize(companyInfo.address, (pageWidth / 2) - margin);
      pdf.text(fromAddress, margin, fromY);
      fromY += fromAddress.length * 12;
    }
    if (companyInfo.gstin) {
      pdf.text(`GSTIN: ${companyInfo.gstin}`, margin, fromY);
      fromY += 15;
    }
    pdf.text(`Phone: ${companyInfo.contact || ''}`, margin, fromY);
    fromY += 15;
    pdf.text(`Email: ${companyInfo.email || ''}`, margin, fromY);


    pdf.setFont('helvetica', 'bold');
    pdf.text('To:', toX, toY);
    toY += 15;
    pdf.setFont('helvetica', 'normal');

    if (isQuotation(doc, mode)) {
        pdf.text(doc.clientName || 'Client Name', toX, toY);
        toY += 15;
        if (doc.clientContactPerson) {
             pdf.text(`Attn: ${doc.clientContactPerson}`, toX, toY);
             toY += 15;
        }
        if(doc.clientAddress){
          const toAddress = pdf.splitTextToSize(doc.clientAddress, (pageWidth / 2) - margin * 1.5);
          pdf.text(toAddress, toX, toY);
          toY += toAddress.length * 12;
        }
        pdf.text(`Phone: ${doc.clientPhone || ''}`, toX, toY);
        toY += 15;
        pdf.text(`Email: ${doc.clientEmail || ''}`, toX, toY);
    } else {
        pdf.text(doc.customerName || 'Customer Name', toX, toY);
        toY += 15;
        pdf.text(`Contact: ${doc.customerContact || ''}`, toX, toY);
    }

    yPos = Math.max(fromY, toY) + 30;

    // --- Project Description ---
    if (isQuotation(doc, mode) && doc.projectDescription) {
        yPos = drawSectionHeader(pdf, 'Project Description / Purpose', yPos, margin, primaryColor);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(textColor);
        const descLines = pdf.splitTextToSize(doc.projectDescription, pageWidth - margin * 2);
        pdf.text(descLines, margin, yPos);
        yPos += descLines.length * 12 + 20;
    }

    if (yPos + 40 > pageHeight - margin) {
        pdf.addPage();
        drawHeader(pdf, docName, docNumber, margin, false);
        yPos = margin + 20;
    }
    
    yPos = drawSectionHeader(pdf, mode === 'Quotation' ? 'Cost Estimate' : 'Details', yPos, margin, primaryColor);

    const tableBody = doc.items.map((item, index) => [
        index + 1,
        item.description,
        item.quantity,
        `Rs ${(item.price || 0).toFixed(2)}`,
        `Rs ${(item.quantity * item.price).toFixed(2)}`,
    ]);
    
    const drawFooterContent = (startY: number) => {
        let currentY = startY;
        
        const summaryX = pageWidth / 2;

        pdf.setFontSize(10);
        pdf.setTextColor(textColor);

        const drawSummaryLine = (label: string, value: string, isBold: boolean = false) => {
            pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
            pdf.text(label, summaryX, currentY);
            pdf.text(value, pageWidth - margin, currentY, { align: 'right' });
            currentY += 18;
        };
        
        let grandTotal = 0;
        if (isQuotation(doc, mode)) {
            const subtotal = doc.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
            const discountedSubtotal = subtotal - (doc.discount || 0);
            const gstAmount = discountedSubtotal * ((doc.gstPercentage || 0) / 100);
            grandTotal = discountedSubtotal + gstAmount;

            drawSummaryLine('Subtotal', `Rs ${subtotal.toFixed(2)}`);
            if (doc.discount > 0) drawSummaryLine('Discount', `- Rs ${doc.discount.toFixed(2)}`);
            drawSummaryLine('Discounted Subtotal', `Rs ${discountedSubtotal.toFixed(2)}`);
            drawSummaryLine(`GST (${doc.gstPercentage}%)`, `+ Rs ${gstAmount.toFixed(2)}`);
            
            currentY += 5;
            pdf.setDrawColor(lightTextColor);
            pdf.line(summaryX, currentY, pageWidth - margin, currentY);
            currentY += 10;
            
            pdf.setFontSize(12);
            drawSummaryLine('Total Payable', `Rs ${grandTotal.toFixed(2)}`, true);
            
        } else {
            const subtotal = doc.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
            grandTotal = subtotal - (doc.discount || 0);

            drawSummaryLine('Subtotal', `Rs ${subtotal.toFixed(2)}`);
            if (doc.discount > 0) drawSummaryLine('Discount', `- Rs ${doc.discount.toFixed(2)}`);
            
            currentY += 5;
            pdf.setDrawColor(lightTextColor);
            pdf.line(summaryX, currentY, pageWidth - margin, currentY);
            currentY += 10;

            pdf.setFontSize(12);
            drawSummaryLine('Total', `Rs ${grandTotal.toFixed(2)}`, true);
        }

        // --- Amount in Words ---
        const rawWords = toWords(grandTotal);
        const grandTotalInWords = `Rupees ${rawWords.charAt(0).toUpperCase() + rawWords.slice(1)} Only /-`;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const amountWordsLines = pdf.splitTextToSize(grandTotalInWords, (pageWidth - summaryX) - margin);
        pdf.text(amountWordsLines, summaryX, currentY);
        currentY += amountWordsLines.length * 12 + 20;

        const signatureBlock = (x: number, y: number) => {
            if (companyInfo.signature) {
                try {
                    pdf.addImage(companyInfo.signature, 'JPEG', x, y, 150, 40, undefined, 'FAST');
                } catch (e) {
                    console.error("Error adding signature image to PDF:", e);
                    pdf.line(x, y + 40, x + 150, y + 40); // fallback line
                }
            } else {
                pdf.line(x, y + 40, x + 150, y + 40);
            }
            pdf.setFont('helvetica', 'bold');
            pdf.text(`(${companyInfo.authorizedSignatory?.name || 'Authorized Signatory'})`, x + 75, y + 55, { align: 'center'});
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.text(companyInfo.authorizedSignatory?.designation || '', x + 75, y + 65, { align: 'center'});
            // pdf.text(companyInfo.name || '', x + 75, y + 75, { align: 'center'});
            return y + 85; // Return the Y position after the signature block
        };
        
        if (isQuotation(doc, mode)) {
            
            const closingNoteMaxWidth = pageWidth * 0.8;
            const closingNoteLines = doc.closingNote ? pdf.splitTextToSize(doc.closingNote, closingNoteMaxWidth) : [];
            const closingNoteHeight = closingNoteLines.length * 12 + 20;

            const termsLines = doc.termsAndConditions ? pdf.splitTextToSize(doc.termsAndConditions, pageWidth / 2 - margin) : [];
            const termsHeight = termsLines.length * 10 + 30; // Includes header
            const signatureHeight = 85;

            const requiredFooterHeight = closingNoteHeight + Math.max(termsHeight, signatureHeight) + 30; // Add some padding

             if (currentY + requiredFooterHeight > pageHeight - margin) {
                 pdf.addPage();
                 drawHeader(pdf, docName, docNumber, margin, false);
                 currentY = margin + 20; // reset Y for new page
            }
            
            let bottomSectionY = currentY;

            if (doc.closingNote) {
                pdf.setFontSize(10);
                pdf.setTextColor(textColor);
                pdf.setFont('helvetica', 'bold');
                const closingNoteX = pageWidth / 2;
                pdf.text(closingNoteLines, closingNoteX, bottomSectionY, { align: 'center' });
                bottomSectionY += closingNoteHeight;
            }


            if (doc.termsAndConditions) {
                let termsY = bottomSectionY;
                pdf.setFontSize(10);
                pdf.setTextColor(textColor);
                pdf.setFont('helvetica', 'bold');
                pdf.text('Terms & Conditions', margin, termsY);
                termsY += 15;
                pdf.setFontSize(8);
                pdf.setTextColor(lightTextColor);
                pdf.text(termsLines, margin, termsY);
            }

            const signatureX = pageWidth - margin - 150;
            signatureBlock(signatureX, bottomSectionY);

        } else {
            let footerY = currentY + 60; // Increased top margin for the footer section

            const footerBlockHeight = 120; 
            if (footerY + footerBlockHeight > pageHeight - margin) {
                pdf.addPage();
                drawHeader(pdf, docName, docNumber, margin, false);
                currentY = margin + 20;
                footerY = currentY + 60; // Reset Y and add margin again
            }

            let paymentDetailsY = drawSectionHeader(pdf, 'Payment Details', currentY, margin, primaryColor, 10);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.setTextColor(textColor);
            pdf.text(`Payment Mode: ${doc.paymentMode}`, margin, paymentDetailsY);
            paymentDetailsY += 15;
            if(doc.paymentMode === 'UPI' && doc.upiId) {
                pdf.text(`Transaction ID: ${doc.upiId}`, margin, paymentDetailsY);
            }

            const signatureX = pageWidth - margin - 150;
            signatureBlock(signatureX, footerY);

            pdf.setFontSize(10);
            pdf.setTextColor(textColor);
            pdf.setFont('helvetica', 'bold');
            const bottomMessageLines = pdf.splitTextToSize(doc.bottomMessage || '', signatureX - margin - 10);
            pdf.text(bottomMessageLines, margin, footerY);
            
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            // pdf.text(`Remember, ${companyInfo.authorizedSignatory?.name || 'Amal A M'}`, margin, footerY + bottomMessageLines.length * 12 + 2);
        }
    };
    
    pdf.autoTable({
        startY: yPos,
        head: [['Sl.No', 'Description', 'Qty', 'Unit Price', 'Total']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
            fillColor: [243, 244, 246], 
            textColor: textColor,
            fontStyle: 'bold',
        },
        styles: {
            font: 'helvetica',
            fontSize: 10,
            cellPadding: 8,
            minCellHeight: 20
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 40 },
            1: { cellWidth: 'auto' },
            2: { halign: 'center', cellWidth: 40 },
            3: { halign: 'right', cellWidth: 80 },
            4: { halign: 'right', cellWidth: 80 },
        },
        didDrawPage: (data) => {
            const pageNumber = data.pageNumber;
            if (pageNumber > 1) {
              drawHeader(pdf, docName, docNumber, margin, false);
              yPos = margin + 20;
            }
        },
        didParseCell: (data) => {
            if (data.column.dataKey === 1 && !data.cell.raw) {
                data.cell.text = ['-'];
            }
        }
    });
    
    const lastTableY = (pdf as any).autoTable.previous.finalY || yPos;

    drawFooterContent(lastTableY + 20);

    pdf.save(fileName);
};
