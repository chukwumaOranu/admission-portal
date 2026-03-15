const { executeQuery, executeTransaction } = require('../configs/db.config');

const getAdmissionSettings = async () => {
  const { rows } = await executeQuery(
    'SELECT * FROM admission_settings ORDER BY id DESC LIMIT 1'
  );
  return rows[0] || null;
};

const updateAdmissionBenchmark = async (benchmarkScore, updatedBy) => {
  const settings = await getAdmissionSettings();
  if (!settings) {
    await executeQuery(
      'INSERT INTO admission_settings (benchmark_score, updated_by) VALUES (?, ?)',
      [benchmarkScore, updatedBy]
    );
  } else {
    await executeQuery(
      'UPDATE admission_settings SET benchmark_score = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
      [benchmarkScore, updatedBy, settings.id]
    );
  }
  return await getAdmissionSettings();
};

const getAdmissionSubjects = async () => {
  const { rows } = await executeQuery(
    'SELECT * FROM admission_subjects WHERE is_active = TRUE ORDER BY subject_name ASC'
  );
  return rows;
};

const createAdmissionSubject = async ({ subject_name, max_score = 100, created_by }) => {
  const result = await executeQuery(
    'INSERT INTO admission_subjects (subject_name, max_score, created_by) VALUES (?, ?, ?)',
    [subject_name, max_score, created_by]
  );
  const { rows } = await executeQuery('SELECT * FROM admission_subjects WHERE id = ?', [result.insertId]);
  return rows[0];
};

const updateAdmissionSubject = async (id, data) => {
  const updates = [];
  const params = [];
  const allowed = ['subject_name', 'max_score', 'is_active'];

  for (const field of allowed) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      updates.push(`${field} = ?`);
      params.push(data[field]);
    }
  }

  if (updates.length === 0) {
    throw new Error('No valid subject fields to update');
  }

  updates.push('updated_at = NOW()');
  params.push(id);

  await executeQuery(
    `UPDATE admission_subjects SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  const { rows } = await executeQuery('SELECT * FROM admission_subjects WHERE id = ?', [id]);
  return rows[0] || null;
};

const upsertApplicantScores = async ({ applicantId, scores, enteredBy }) => {
  const queries = scores.map((score) => ({
    query: `
      INSERT INTO applicant_subject_scores (applicant_id, subject_id, score, entered_by)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE score = VALUES(score), entered_by = VALUES(entered_by), updated_at = NOW()
    `,
    params: [applicantId, score.subject_id, score.score, enteredBy]
  }));

  await executeTransaction(queries);
};

const calculateApplicantResult = async (applicantId, benchmarkScore) => {
  const query = `
    SELECT 
      COALESCE(SUM(score), 0) AS total_score,
      COALESCE(AVG(score), 0) AS average_score
    FROM applicant_subject_scores
    WHERE applicant_id = ?
  `;
  const { rows } = await executeQuery(query, [applicantId]);
  const total = Number(rows[0]?.total_score || 0);
  const avg = Number(rows[0]?.average_score || 0);
  const isSuccessful = total >= Number(benchmarkScore);

  await executeQuery(
    `
    INSERT INTO admission_results (applicant_id, total_score, average_score, benchmark_score, is_successful)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      total_score = VALUES(total_score),
      average_score = VALUES(average_score),
      benchmark_score = VALUES(benchmark_score),
      is_successful = VALUES(is_successful),
      updated_at = NOW()
    `,
    [applicantId, total, avg, benchmarkScore, isSuccessful]
  );

  return { total_score: total, average_score: avg, benchmark_score: Number(benchmarkScore), is_successful: isSuccessful };
};

const getApplicantResult = async (applicantId) => {
  const { rows } = await executeQuery(
    `
    SELECT 
      ar.*,
      a.application_number,
      a.first_name,
      a.last_name,
      a.email,
      a.phone
    FROM admission_results ar
    JOIN applicants a ON a.id = ar.applicant_id
    WHERE ar.applicant_id = ?
    `,
    [applicantId]
  );

  const result = rows[0] || null;
  if (!result) return null;

  const { rows: scoreRows } = await executeQuery(
    `
    SELECT 
      s.subject_id,
      s.score,
      sub.subject_name,
      sub.max_score
    FROM applicant_subject_scores s
    JOIN admission_subjects sub ON sub.id = s.subject_id
    WHERE s.applicant_id = ?
    ORDER BY sub.subject_name ASC
    `,
    [applicantId]
  );

  return { ...result, subjects: scoreRows };
};

const listSuccessfulCandidates = async () => {
  const { rows } = await executeQuery(
    `
    SELECT 
      ar.*,
      a.application_number,
      a.first_name,
      a.last_name,
      a.email
    FROM admission_results ar
    JOIN applicants a ON a.id = ar.applicant_id
    WHERE ar.is_successful = TRUE
    ORDER BY ar.total_score DESC, a.last_name ASC
    `
  );
  return rows;
};

const updateAdmissionDecision = async ({ applicantId, status, notes, decidedBy }) => {
  await executeQuery(
    `
    INSERT INTO admission_results (applicant_id, admission_status, decision_notes, decided_by, decided_at)
    VALUES (?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      admission_status = VALUES(admission_status),
      decision_notes = VALUES(decision_notes),
      decided_by = VALUES(decided_by),
      decided_at = VALUES(decided_at),
      updated_at = NOW()
    `,
    [applicantId, status, notes || null, decidedBy]
  );
};

const saveAdmissionLetterMeta = async ({ applicantId, letterRef, payload }) => {
  await executeQuery(
    `
    INSERT INTO admission_results (applicant_id, letter_ref, letter_payload, letter_generated_at)
    VALUES (?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      letter_ref = VALUES(letter_ref),
      letter_payload = VALUES(letter_payload),
      letter_generated_at = VALUES(letter_generated_at),
      updated_at = NOW()
    `,
    [applicantId, letterRef, JSON.stringify(payload || {})]
  );
};

const markAdmissionLetterSent = async (applicantId) => {
  await executeQuery(
    'UPDATE admission_results SET letter_sent = TRUE, letter_sent_at = NOW(), updated_at = NOW() WHERE applicant_id = ?',
    [applicantId]
  );
};

module.exports = {
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
};

