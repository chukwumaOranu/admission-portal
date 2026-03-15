const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');

// =====================================================
// SIMPLIFIED EXAM CARD GENERATOR (PDF-ONLY)
// =====================================================

/**
 * Generate QR Code for exam card
 */
const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Load and process profile image
 */
const loadProfileImage = async (profilePhotoPath) => {
  try {
    if (!profilePhotoPath) {
      return null;
    }

    // Remove the leading slash and 'uploads/' from profilePhotoPath if it exists
    let cleanPath = profilePhotoPath.startsWith('/') ? profilePhotoPath.slice(1) : profilePhotoPath;
    if (cleanPath.startsWith('uploads/')) {
      cleanPath = cleanPath.replace('uploads/', '');
    }
    const fullPath = path.join(__dirname, '../../uploads', cleanPath);
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      console.warn(`Profile image not found: ${fullPath}`);
      return null;
    }

    // Process image with Sharp
    const processedImage = await sharp(fullPath)
      .resize(150, 150, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    return processedImage;
  } catch (error) {
    console.error('Error loading profile image:', error);
    return null;
  }
};

/**
 * Generate exam card as PDF (primary method)
 */
const generateExamCardPDF = async (examData) => {
  try {
    const {
      studentName,
      applicationId,
      programName,
      examDate,
      examTime,
      examVenue,
      examDuration,
      profilePhoto,
      qrCodeData,
      schoolName,
      schoolContact
    } = examData;

    const schoolDisplayName = schoolName || 'DeepFlux Academy';
    const contactDetails = [];
    if (schoolContact?.address) contactDetails.push(schoolContact.address);
    const communicationParts = [];
    if (schoolContact?.phone) communicationParts.push(`Phone: ${schoolContact.phone}`);
    if (schoolContact?.email) communicationParts.push(`Email: ${schoolContact.email}`);
    if (schoolContact?.website) communicationParts.push(`Website: ${schoolContact.website}`);
    if (communicationParts.length > 0) {
      contactDetails.push(communicationParts.join(' • '));
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Collect PDF data
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const margin = doc.page.margins.left;
      const contentWidth = pageWidth - margin * 2;

      // ===== HEADER & SCHOOL BRANDING =====
      doc.fontSize(26)
         .font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text('ADMISSION EXAMINATION CARD', {
           align: 'center'
         });

      doc.moveDown(0.4);
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor('#34495e')
         .text(schoolDisplayName, {
           align: 'center'
         });

      if (contactDetails.length > 0) {
        doc.moveDown(0.3);
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#555555')
           .text(contactDetails.join('\n'), {
             align: 'center'
           });
      }

      // Decorative line
      const lineY = doc.y + 10;
      doc.moveTo(margin, lineY)
         .lineTo(pageWidth - margin, lineY)
         .stroke('#3498db', 2);
      doc.moveDown(1.2);

      // ===== LAYOUT MEASUREMENTS =====
      const sectionStartY = doc.y;
      const profileSize = 80;
      const profileX = margin;
      const qrSize = 80;
      const qrX = pageWidth - margin - qrSize;

      const infoAreaLeft = profilePhoto ? profileX + profileSize + 20 : margin;
      const infoAreaRight = qrX - 20;
      const infoX = infoAreaLeft;
      const infoWidth = Math.max(infoAreaRight - infoAreaLeft, 160);

      // ----- Candidate photo area -----
      if (profilePhoto) {
        try {
          doc.image(profilePhoto, profileX, sectionStartY, {
            width: profileSize,
            height: profileSize,
            fit: [profileSize, profileSize]
          });
          doc.rect(profileX, sectionStartY, profileSize, profileSize)
             .stroke('#2c3e50', 1.5);
        } catch (error) {
          console.warn('Could not add profile image to PDF:', error.message);
        }
      }

      // ----- Candidate information text block (centered between photo & QR) -----
      const infoHeadingY = sectionStartY;
      doc.font('Helvetica-Bold')
         .fontSize(14)
         .fillColor('#2c3e50')
         .text('Candidate Information', infoX, infoHeadingY, {
           width: infoWidth,
           align: 'center'
         });

      let infoCurrentY = infoHeadingY + 24;
      doc.font('Helvetica')
         .fontSize(11)
         .fillColor('#1e1e1e')
         .text(`Name: ${studentName}`, infoX, infoCurrentY, {
           width: infoWidth,
           align: 'center'
         });

      infoCurrentY = doc.y + 6;
      doc.text(`Application ID: ${applicationId}`, infoX, infoCurrentY, {
        width: infoWidth,
        align: 'center'
      });

      infoCurrentY = doc.y + 6;
      doc.text(`Program: ${programName}`, infoX, infoCurrentY, {
        width: infoWidth,
        align: 'center'
      });

      const candidateInfoBottom = doc.y;

      // ===== EXAMINATION DETAILS STYLED BOX =====
      const detailsBoxHeight = 130;
      const detailsBoxY = Math.max(candidateInfoBottom + 20, sectionStartY + profileSize + 20);
      doc.roundedRect(margin, detailsBoxY, contentWidth, detailsBoxHeight, 10)
         .fillOpacity(0.05)
         .fillAndStroke('#2980b9', '#2980b9');
      doc.fillOpacity(1);

      const detailsInnerX = margin + 20;
      const detailsInnerWidth = contentWidth - 40;
      let detailsCurrentY = detailsBoxY + 18;

      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor('#2980b9')
         .text('Examination Details', detailsInnerX, detailsCurrentY, {
           width: detailsInnerWidth,
           align: 'left'
         });

      detailsCurrentY += 24;
      doc.font('Helvetica')
         .fontSize(11)
         .fillColor('#1e1e1e')
         .text(`Exam: ${examData.exam_title || 'Entrance Examination'}`, detailsInnerX, detailsCurrentY, {
           width: detailsInnerWidth,
           align: 'left'
         });

      detailsCurrentY = doc.y + 4;
      doc.text(`Date: ${examDate}`, detailsInnerX, detailsCurrentY, {
        width: detailsInnerWidth,
        align: 'left'
      });

      detailsCurrentY = doc.y + 4;
      doc.text(`Time: ${examTime}`, detailsInnerX, detailsCurrentY, {
        width: detailsInnerWidth,
        align: 'left'
      });

      detailsCurrentY = doc.y + 4;
      doc.text(`Venue: ${examVenue}`, detailsInnerX, detailsCurrentY, {
        width: detailsInnerWidth,
        align: 'left'
      });

      detailsCurrentY = doc.y + 4;
      doc.text(`Duration: ${examDuration} minutes`, detailsInnerX, detailsCurrentY, {
        width: detailsInnerWidth,
        align: 'left'
      });

      const detailsBoxBottom = detailsBoxY + detailsBoxHeight;

      // ===== QR CODE PANEL =====
      if (qrCodeData) {
        try {
          const qrBase64 = qrCodeData.split(',')[1];
          const qrBuffer = Buffer.from(qrBase64, 'base64');
          const qrY = sectionStartY;

          doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
          doc.font('Helvetica')
             .fontSize(9)
             .fillColor('#555555')
             .text('Scan to verify', qrX, qrY + qrSize + 10, {
               width: qrSize,
               align: 'center'
             });
        } catch (error) {
          console.warn('Could not add QR code to PDF:', error.message);
        }
      }

      // ===== IMPORTANT INSTRUCTIONS STYLED BOX =====
      const instructionsY = detailsBoxBottom + 20;
      const instructionsHeight = 130;
      doc.roundedRect(margin, instructionsY, contentWidth, instructionsHeight, 10)
         .fillOpacity(0.05)
         .fillAndStroke('#e74c3c', '#e74c3c');
      doc.fillOpacity(1);

      doc.save();
      doc.font('Helvetica-Bold')
         .fontSize(13)
         .fillColor('#e74c3c')
         .text('Important Instructions', margin + 15, instructionsY + 15);

      doc.font('Helvetica')
         .fontSize(10.5)
         .fillColor('#2c3e50')
         .list([
           'Arrive at the exam venue at least 30 minutes before the scheduled time.',
           'Present this exam card and a valid photo ID for verification.',
           'Electronic devices, smart watches, and study materials are strictly prohibited.',
           'Follow all instructions provided by invigilators and maintain exam discipline.',
           'Any form of malpractice will result in immediate disqualification.'
         ], margin + 25, instructionsY + 40, {
           width: contentWidth - 50,
           bulletRadius: 2,
           lineGap: 4,
           bulletIndent: 12,
           textIndent: 6
         });
      doc.restore();

      // ===== FOOTER =====
      const footerY = instructionsY + instructionsHeight + 40;
      doc.font('Helvetica')
         .fontSize(9)
         .fillColor('#7f8c8d')
         .text(`Generated on ${new Date().toLocaleDateString()} • ${schoolDisplayName} Admissions`, margin, footerY, {
           width: contentWidth,
           align: 'center'
         });

      doc.end();
    });

  } catch (error) {
    console.error('Error generating exam card PDF:', error);
    throw new Error('Failed to generate exam card PDF');
  }
};

/**
 * Generate exam card as JPEG using Sharp (alternative method)
 */
const generateExamCardImage = async (examData) => {
  // JPEG generation disabled - PDF only
  // Return a minimal placeholder image (1x1 pixel)
  const placeholder = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  return placeholder;
};

/**
 * Generate complete exam card (PDF primary, JPEG fallback)
 */
const generateCompleteExamCard = async (applicantData, examData) => {
  try {
    const {
      first_name,
      last_name,
      application_id,
      profile_photo
    } = applicantData;

    const {
      exam_title,
      exam_date,
      exam_time,
      exam_venue,
      exam_duration
    } = examData;

    // Prepare exam card data
    const examCardData = {
      studentName: `${first_name} ${last_name}`,
      applicationId: application_id || `APP${applicantData.id}`,
      programName: examData.schema_display_name || examData.schema_name || 'General Program',
      examDate: new Date(exam_date).toLocaleDateString(),
      examTime: exam_time,
      examVenue: exam_venue,
      examDuration: exam_duration || 120,
      profilePhoto: null,
      qrCodeData: null,
      schoolName: examData.schoolName || 'DeepFlux Academy',
      schoolContact: examData.schoolContact || null
    };

    // Load profile photo
    if (profile_photo) {
      examCardData.profilePhoto = await loadProfileImage(profile_photo);
    }

    // Generate QR code
    const qrData = JSON.stringify({
      applicant_id: applicantData.id,
      application_id: examCardData.applicationId,
      exam_date: exam_date,
      exam_time: exam_time,
      generated_at: new Date().toISOString()
    });
    examCardData.qrCodeData = await generateQRCode(qrData);

    // Generate PDF (primary method)
    const pdfBuffer = await generateExamCardPDF(examCardData);
    
    // Generate JPEG (simplified fallback)
    const imageBuffer = await generateExamCardImage(examCardData);

    return {
      image: imageBuffer,
      pdf: pdfBuffer,
      qrCode: examCardData.qrCodeData,
      metadata: {
        applicant_id: applicantData.id,
        application_id: examCardData.applicationId,
        generated_at: new Date().toISOString(),
        format: 'both'
      }
    };

  } catch (error) {
    console.error('Error generating complete exam card:', error);
    throw new Error('Failed to generate exam card');
  }
};

module.exports = {
  generateQRCode,
  loadProfileImage,
  generateExamCardImage,
  generateExamCardPDF,
  generateCompleteExamCard
};
