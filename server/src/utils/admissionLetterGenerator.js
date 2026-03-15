const PDFDocument = require('pdfkit');

const renderWithVariables = (template, variables) => {
  let output = template || '';
  for (const [key, value] of Object.entries(variables || {})) {
    output = output.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value ?? ''));
  }
  return output;
};

const getDefaultAdmissionLetterText = () => `PROVISIONAL ADMISSION LETTER

Reference: {{reference}}
Date Issued: {{issued_date}}

Dear {{student_name}},

Congratulations. You have been offered provisional admission into {{school_name}}.

Application Number: {{application_number}}
Candidate Email: {{student_email}}

Next Steps:
1. Login to your student portal with your credentials.
2. Complete profile and required documentation.
3. Pay applicable admission and screening fees.
4. Print your exam/admission card where applicable.

This offer remains provisional until all requirements are met and verified.

Admissions Office
{{school_name}}`;

const generateAdmissionLetterPDF = async ({ applicant, schoolSettings = {}, letterRef, issuedAt, template = null }) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks = [];

  return await new Promise((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);

    const schoolName = schoolSettings.school_name || 'School';
    const schoolAddress = schoolSettings.school_address || '';
    const schoolEmail = schoolSettings.school_email || '';
    const schoolPhone = schoolSettings.school_phone || '';

    doc.fontSize(20).text(schoolName, { align: 'center' });
    if (schoolAddress) doc.fontSize(10).text(schoolAddress, { align: 'center' });
    const contactLine = [schoolPhone, schoolEmail].filter(Boolean).join(' | ');
    if (contactLine) doc.fontSize(10).text(contactLine, { align: 'center' });

    doc.moveDown(2);
    const variables = {
      reference: letterRef,
      issued_date: new Date(issuedAt).toLocaleDateString(),
      student_name: `${applicant.first_name} ${applicant.last_name}`,
      first_name: applicant.first_name,
      last_name: applicant.last_name,
      application_number: applicant.application_number || applicant.id,
      student_email: applicant.email,
      school_name: schoolName,
      school_address: schoolAddress,
      school_phone: schoolPhone,
      school_email: schoolEmail
    };

    const bodyTemplate = template?.text_body || getDefaultAdmissionLetterText();
    const renderedBody = renderWithVariables(bodyTemplate, variables);
    doc.fontSize(11).text(renderedBody, { align: 'left', lineGap: 4 });

    doc.moveDown(2);
    doc.text('Admissions Office', { align: 'left' });
    doc.text(schoolName, { align: 'left' });

    doc.end();
  });
};

module.exports = {
  generateAdmissionLetterPDF
};
