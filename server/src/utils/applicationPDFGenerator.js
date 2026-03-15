const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Generate application PDF
 * Creates a professional application document for student applications
 */
const generateApplicationPDF = async (applicationData, schoolData = {}) => {
  try {
    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Application - ${applicationData.application_number || applicationData.id}`,
        Author: schoolData.school_name || 'DeepFlux Academy',
        Subject: 'Student Application',
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
    const warningColor = '#f39c12';

    // Header Section
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text('STUDENT APPLICATION', 50, 50, { align: 'center' });

    // School Information
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor(secondaryColor)
       .text(schoolData.school_name || 'DeepFlux Academy', 50, 100, { align: 'center' });

    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#666')
       .text(schoolData.school_address || '123 Education Street, Learning City', 50, 125, { align: 'center' });

    if (schoolData.school_phone) {
      doc.text(`Phone: ${schoolData.school_phone}`, 50, 140, { align: 'center' });
    }

    // Application Details Box
    const appBoxY = 180;
    doc.rect(50, appBoxY, 495, 80)
       .stroke(primaryColor, 2)
       .fillColor('#f8f9fa')
       .fill();

    // Application Number and Date
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text('Application Number:', 70, appBoxY + 15)
       .text('Application Date:', 70, appBoxY + 35)
       .text('Application Status:', 70, appBoxY + 55);

    doc.font('Helvetica')
       .fillColor('#333')
       .text(applicationData.application_number || `APP${applicationData.id}`, 200, appBoxY + 15)
       .text(new Date(applicationData.created_at).toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'long',
         day: 'numeric'
       }), 200, appBoxY + 35);

    // Application Status with color
    const statusColor = applicationData.status === 'approved' ? successColor : 
                       applicationData.status === 'rejected' ? '#e74c3c' : warningColor;
    
    doc.fillColor(statusColor)
       .text(applicationData.status.toUpperCase(), 200, appBoxY + 55);

    // Applicant Information Section
    const applicantY = appBoxY + 100;
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text('Applicant Information:', 70, applicantY);

    // Personal Details Table
    const personalDetailsY = applicantY + 30;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text('Personal Details', 70, personalDetailsY);

    // Personal details rows
    const details = [
      { label: 'Full Name:', value: applicationData.applicant_name || 'N/A' },
      { label: 'Email Address:', value: applicationData.applicant_email || 'N/A' },
      { label: 'Phone Number:', value: applicationData.phone || 'N/A' },
      { label: 'Date of Birth:', value: applicationData.date_of_birth ? new Date(applicationData.date_of_birth).toLocaleDateString() : 'N/A' },
      { label: 'Address:', value: applicationData.address || 'N/A' }
    ];

    let currentY = personalDetailsY + 25;
    details.forEach(detail => {
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#333')
         .text(detail.label, 70, currentY);
      
      doc.font('Helvetica')
         .fillColor('#666')
         .text(detail.value, 200, currentY);
      
      currentY += 20;
    });

    // Program Information
    const programY = currentY + 20;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text('Program Information', 70, programY);

    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor('#333')
       .text('Program/Schema:', 70, programY + 25)
       .text('Application Fee:', 70, programY + 45);

    doc.font('Helvetica')
       .fillColor('#666')
       .text(applicationData.schema_display_name || applicationData.schema_name || 'N/A', 200, programY + 25)
       .text(`₦${parseFloat(applicationData.application_fee || 0).toLocaleString()}`, 200, programY + 45);

    // Payment Information
    const paymentY = programY + 80;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text('Payment Information', 70, paymentY);

    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor('#333')
       .text('Payment Status:', 70, paymentY + 25);

    const paymentStatusColor = applicationData.payment_status === 'paid' ? successColor : warningColor;
    doc.font('Helvetica')
       .fillColor(paymentStatusColor)
       .text(applicationData.payment_status?.toUpperCase() || 'PENDING', 200, paymentY + 25);

    // Additional Information
    if (applicationData.notes || applicationData.custom_data) {
      const additionalY = paymentY + 60;
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor(primaryColor)
         .text('Additional Information', 70, additionalY);

      let additionalCurrentY = additionalY + 25;

      if (applicationData.notes) {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#333')
           .text('Notes:', 70, additionalCurrentY);
        
        doc.font('Helvetica')
           .fillColor('#666')
           .text(applicationData.notes, 200, additionalCurrentY, { width: 300 });
        
        additionalCurrentY += 40;
      }

      if (applicationData.custom_data) {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#333')
           .text('Custom Data:', 70, additionalCurrentY);
        
        doc.font('Helvetica')
           .fillColor('#666')
           .text(JSON.stringify(applicationData.custom_data, null, 2), 200, additionalCurrentY, { width: 300 });
      }
    }

    // QR Code for verification
    try {
      const qrData = JSON.stringify({
        application_id: applicationData.id,
        application_number: applicationData.application_number || `APP${applicationData.id}`,
        applicant_name: applicationData.applicant_name,
        status: applicationData.status,
        created_at: applicationData.created_at
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
      doc.image(qrCodeBuffer, 400, paymentY + 20, { width: 100, height: 100 });
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#666')
         .text('Scan to verify', 400, paymentY + 130, { align: 'center' });
    } catch (qrError) {
      console.warn('Could not generate QR code:', qrError.message);
    }

    // Footer
    const footerY = 750;
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666')
       .text('Thank you for your application!', 50, footerY, { align: 'center' })
       .text('This document was generated by the Admission Portal System.', 50, footerY + 15, { align: 'center' });

    // Terms and Conditions
    doc.text('Note: This application is subject to review and approval by the admissions committee.', 
             50, footerY + 35, { align: 'center' });

    // Finalize PDF
    doc.end();

    // Wait for PDF to be generated
    const pdfBuffer = await pdfPromise;

    return {
      pdf: pdfBuffer,
      metadata: {
        applicationId: applicationData.id,
        applicationNumber: applicationData.application_number || `APP${applicationData.id}`,
        applicantName: applicationData.applicant_name,
        status: applicationData.status,
        generatedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    throw new Error(`Failed to generate application PDF: ${error.message}`);
  }
};

module.exports = {
  generateApplicationPDF
};
