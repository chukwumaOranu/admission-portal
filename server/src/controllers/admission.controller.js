const { findApplicantById } = require('../models/applicant.model');
const { findSchoolSettings } = require('../models/settings-upload.model');
const { getActiveTemplate } = require('../models/documentTemplate.model');
const {
  getAdmissionSettings,
  updateAdmissionBenchmark,
  getAdmissionSubjects,
  createAdmissionSubject,
  updateAdmissionSubject,
  upsertApplicantScores,
  calculateApplicantResult,
  getApplicantResult,
  listSuccessfulCandidates,
  updateAdmissionDecision,
  saveAdmissionLetterMeta,
  markAdmissionLetterSent
} = require('../models/admission.model');
const { generateAdmissionLetterPDF } = require('../utils/admissionLetterGenerator');
const emailService = require('../utils/emailService');

const generateLetterRef = (applicationNumber) => {
  const ts = Date.now().toString().slice(-6);
  return `ADM-${applicationNumber || 'APP'}-${ts}`;
};

const getAdmissionSubjectsController = async (req, res) => {
  try {
    const subjects = await getAdmissionSubjects();
    res.status(200).json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createAdmissionSubjectController = async (req, res) => {
  try {
    const { subject_name, max_score } = req.body;
    if (!subject_name) {
      return res.status(400).json({ success: false, message: 'subject_name is required' });
    }
    const subject = await createAdmissionSubject({
      subject_name,
      max_score: Number(max_score || 100),
      created_by: req.user.id
    });
    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateAdmissionSubjectController = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await updateAdmissionSubject(id, req.body);
    res.status(200).json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBenchmarkController = async (req, res) => {
  try {
    const settings = await getAdmissionSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBenchmarkController = async (req, res) => {
  try {
    const { benchmark_score } = req.body;
    if (benchmark_score === undefined || Number.isNaN(Number(benchmark_score))) {
      return res.status(400).json({ success: false, message: 'benchmark_score must be a number' });
    }
    const settings = await updateAdmissionBenchmark(Number(benchmark_score), req.user.id);
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const upsertApplicantScoresController = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const { scores } = req.body;
    if (!Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({ success: false, message: 'scores array is required' });
    }

    await upsertApplicantScores({
      applicantId: Number(applicantId),
      scores: scores.map((score) => ({
        subject_id: Number(score.subject_id),
        score: Number(score.score || 0)
      })),
      enteredBy: req.user.id
    });

    const settings = await getAdmissionSettings();
    const result = await calculateApplicantResult(Number(applicantId), settings?.benchmark_score || 180);

    res.status(200).json({
      success: true,
      message: 'Scores saved and result aggregated',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getApplicantResultController = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const result = await getApplicantResult(Number(applicantId));
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const listSuccessfulCandidatesController = async (req, res) => {
  try {
    const rows = await listSuccessfulCandidates();
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateAdmissionDecisionController = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const { admission_status, decision_notes } = req.body;
    const valid = ['pending', 'approved', 'rejected'];
    if (!valid.includes(admission_status)) {
      return res.status(400).json({ success: false, message: 'Invalid admission_status' });
    }

    await updateAdmissionDecision({
      applicantId: Number(applicantId),
      status: admission_status,
      notes: decision_notes,
      decidedBy: req.user.id
    });

    res.status(200).json({ success: true, message: 'Admission decision updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateAdmissionLetterController = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const applicant = await findApplicantById(Number(applicantId));
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Applicant not found' });
    }

    const schoolSettings = await findSchoolSettings();
    const activeTemplate = await getActiveTemplate('admission_letter');
    const letterRef = generateLetterRef(applicant.application_number);
    const issuedAt = new Date().toISOString();
    const pdf = await generateAdmissionLetterPDF({
      applicant,
      schoolSettings: schoolSettings || {},
      letterRef,
      issuedAt,
      template: activeTemplate
    });

    await saveAdmissionLetterMeta({
      applicantId: Number(applicantId),
      letterRef,
      payload: { issuedAt, applicantId: Number(applicantId) }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="admission_letter_${applicant.application_number || applicant.id}.pdf"`
    );
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const sendAdmissionLettersController = async (req, res) => {
  try {
    const { applicant_ids } = req.body;
    if (!Array.isArray(applicant_ids) || applicant_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'applicant_ids array is required' });
    }

    await emailService.initialize();
    const schoolSettings = await findSchoolSettings();
    const activeTemplate = await getActiveTemplate('admission_letter');
    const results = [];

    for (const applicantId of applicant_ids) {
      try {
        const applicant = await findApplicantById(Number(applicantId));
        if (!applicant) {
          results.push({ applicant_id: applicantId, success: false, error: 'Applicant not found' });
          continue;
        }

        const letterRef = generateLetterRef(applicant.application_number);
        const issuedAt = new Date().toISOString();
        const pdf = await generateAdmissionLetterPDF({
          applicant,
          schoolSettings: schoolSettings || {},
          letterRef,
          issuedAt,
          template: activeTemplate
        });

        const mail = await emailService.sendAdmissionLetterEmail({
          applicant,
          letterPdfBuffer: pdf,
          letterRef
        });

        if (!mail.success) {
          results.push({ applicant_id: applicantId, success: false, error: mail.error || mail.message });
          continue;
        }

        await saveAdmissionLetterMeta({
          applicantId: Number(applicantId),
          letterRef,
          payload: { issuedAt, sentBy: req.user.id }
        });
        await markAdmissionLetterSent(Number(applicantId));

        results.push({ applicant_id: applicantId, success: true });
      } catch (error) {
        results.push({ applicant_id: applicantId, success: false, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        sent: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdmissionSubjectsController,
  createAdmissionSubjectController,
  updateAdmissionSubjectController,
  getBenchmarkController,
  updateBenchmarkController,
  upsertApplicantScoresController,
  getApplicantResultController,
  listSuccessfulCandidatesController,
  updateAdmissionDecisionController,
  generateAdmissionLetterController,
  sendAdmissionLettersController
};
