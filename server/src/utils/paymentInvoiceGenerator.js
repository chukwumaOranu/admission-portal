const PDFDocument = require('pdfkit');
const sharp = require('sharp');
const QRCode = require('qrcode');

/**
 * Generate payment invoice PDF
 * Creates a professional invoice/receipt for payment transactions
 */
const generatePaymentInvoice = async (paymentData, applicantData, schoolData = {}) => {
  try {
    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Payment Invoice - ${paymentData.transaction_reference}`,
        Author: schoolData.name || 'DeepFlux Academy',
        Subject: 'Payment Receipt',
        Creator: 'Admission Portal System'
      }
    });

    // Collect PDF data
    const pdfChunks = [];
    doc.on('data', chunk => pdfChunks.push(chunk));
    
    const pdfPromise = new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(pdfChunks)));
    });

    // Set up document styling
    const primaryColor = '#2c3e50';
    const secondaryColor = '#3498db';
    const successColor = '#27ae60';
    const dangerColor = '#e74c3c';

    // Header Section
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text('PAYMENT INVOICE', 50, 50, { align: 'center' });

    // School Information
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(secondaryColor)
       .text(schoolData.name || 'DeepFlux Academy', 50, 100, { align: 'center' });

    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#666')
       .text(schoolData.address || '123 Education Street, Learning City', 50, 125, { align: 'center' });

    if (schoolData.phone) {
      doc.text(`Phone: ${schoolData.phone}`, 50, 140, { align: 'center' });
    }

    // Invoice Details Box
    const invoiceBoxY = 180;
    doc.rect(50, invoiceBoxY, 495, 80)
       .stroke(primaryColor, 2)
       .fillColor('#f8f9fa')
       .fill();

    // Invoice Number and Date
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text('Invoice Number:', 70, invoiceBoxY + 15)
       .text('Invoice Date:', 70, invoiceBoxY + 35)
       .text('Payment Status:', 70, invoiceBoxY + 55);

    doc.font('Helvetica')
       .fillColor('#333')
       .text(paymentData.transaction_reference, 200, invoiceBoxY + 15)
       .text(new Date(paymentData.created_at).toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'long',
         day: 'numeric'
       }), 200, invoiceBoxY + 35);

    // Payment Status with color
    const statusColor = paymentData.payment_status === 'success' ? successColor : 
                       paymentData.payment_status === 'failed' ? dangerColor : '#f39c12';
    
    doc.fillColor(statusColor)
       .text(paymentData.payment_status.toUpperCase(), 200, invoiceBoxY + 55);

    // Bill To Section
    const billToY = invoiceBoxY + 100;
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text('Bill To:', 70, billToY);

    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#333')
       .text(`${applicantData.first_name} ${applicantData.last_name}`, 70, billToY + 25);

    if (applicantData.email) {
      doc.text(applicantData.email, 70, billToY + 45);
    }

    if (applicantData.phone) {
      doc.text(applicantData.phone, 70, billToY + 65);
    }

    // Payment Details Table
    const tableY = billToY + 100;
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text('Payment Details', 70, tableY);

    // Table Header
    const tableHeaderY = tableY + 30;
    doc.rect(70, tableHeaderY, 475, 25)
       .fillColor(primaryColor)
       .fill();

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('white')
       .text('Description', 80, tableHeaderY + 8)
       .text('Amount', 400, tableHeaderY + 8, { align: 'right' });

    // Payment Item
    const itemY = tableHeaderY + 25;
    doc.rect(70, itemY, 475, 30)
       .stroke('#ddd');

    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#333')
       .text('Application Fee Payment', 80, itemY + 10)
       .text(`₦${parseFloat(paymentData.amount || 0).toLocaleString()}`, 400, itemY + 10, { align: 'right' });

    // Total Section
    const totalY = itemY + 50;
    doc.rect(350, totalY, 195, 40)
       .fillColor('#f8f9fa')
       .fill()
       .stroke('#ddd');

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text('Total Amount:', 360, totalY + 8)
       .text(`₦${parseFloat(paymentData.amount || 0).toLocaleString()}`, 360, totalY + 25, { align: 'right' });

    // Payment Method and Reference
    const paymentInfoY = totalY + 70;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text('Payment Information:', 70, paymentInfoY);

    doc.font('Helvetica')
       .fillColor('#333')
       .text(`Payment Method: ${paymentData.payment_method || 'Card Payment'}`, 70, paymentInfoY + 25)
       .text(`Transaction Reference: ${paymentData.transaction_reference}`, 70, paymentInfoY + 45);

    if (paymentData.paystack_reference) {
      doc.text(`Paystack Reference: ${paymentData.paystack_reference}`, 70, paymentInfoY + 65);
    }

    // QR Code for verification
    try {
      const qrData = JSON.stringify({
        transaction_reference: paymentData.transaction_reference,
        amount: paymentData.amount,
        date: paymentData.created_at,
        status: paymentData.payment_status
      });

      const qrCodeBuffer = await QRCode.toBuffer(qrData, {
        width: 100,
        margin: 2,
        color: {
          dark: primaryColor,
          light: '#FFFFFF'
        }
      });

      // Add QR code to PDF
      doc.image(qrCodeBuffer, 400, paymentInfoY + 20, { width: 100, height: 100 });
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#666')
         .text('Scan to verify', 400, paymentInfoY + 130, { align: 'center' });
    } catch (qrError) {
      console.warn('Could not generate QR code:', qrError.message);
    }

    // Footer
    const footerY = 750;
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666')
       .text('Thank you for your payment!', 50, footerY, { align: 'center' })
       .text('This is an automated receipt generated by the Admission Portal System.', 50, footerY + 15, { align: 'center' });

    // Terms and Conditions
    doc.text('Terms: All payments are processed securely through Paystack. Contact support for any queries.', 
             50, footerY + 35, { align: 'center' });

    // Finalize PDF
    doc.end();

    // Wait for PDF to be generated
    const pdfBuffer = await pdfPromise;

    return {
      pdf: pdfBuffer,
      metadata: {
        transactionReference: paymentData.transaction_reference,
        amount: paymentData.amount,
        status: paymentData.payment_status,
        generatedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    throw new Error(`Failed to generate payment invoice: ${error.message}`);
  }
};

module.exports = {
  generatePaymentInvoice
};
