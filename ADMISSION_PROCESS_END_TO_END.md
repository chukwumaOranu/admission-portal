# Admission Portal End-to-End Walkthrough

This document explains the current implemented admission flow in this codebase from first contact (public/student) to admission letter generation and student follow-up.

## 1. System Architecture

- Frontend: Next.js app in `web/` with NextAuth credential login.
- Backend: Express API in `server/` mounted at `/api/*`.
- DB: MySQL (`deepflux_admissions` by default).
- Auth model:
  - Frontend login calls backend `POST /api/users/login`.
  - Backend returns JWT + role + permission names.
  - NextAuth stores role/permissions in session token.
  - API requests send `Authorization: Bearer <token>`.

Primary backend route mounts (in `server/src/index.js`):
- `/api/users`
- `/api/students`
- `/api/applications`
- `/api/payments`
- `/api/exams`
- `/api/settings`

## 2. Authentication and Access Control

### Backend

`protectRoute` (`server/src/middlewares/auth.middleware.js`):
- Accepts bearer token from NextAuth or legacy cookie/session fallback.
- Loads user, role, permissions from DB.
- Super Admin receives all permissions automatically.

Authorization helpers:
- `requireRoles(...)`
- `requirePermissions(...)`

### Frontend middleware

`web/middleware.js`:
- Public routes include `/student-registration`.
- Protected routes include `/admin/dashboard/*`.
- Student users are redirected into `/admin/dashboard/student-portal`.
- Non-students are blocked from student portal pages.

## 3. Data Model (Admission-Relevant)

Core tables used by this flow:
- `students`, `student_schemas`, `student_schema_fields`
- `users`, `roles`, `permissions`, `role_permissions`
- `application_schemas`, `application_schema_fields`, `applicants`
- `entry_dates`, `exam_cards`
- `payment_transactions`
- `admission_subjects`, `applicant_subject_scores`, `admission_results`, `admission_settings`
- `document_templates` (for DB-driven admission letter templates)

## 4. Public Student Registration (No Login)

### Public page

- URL: `/student-registration`
- File: `web/app/student-registration/page.js`
- Behavior:
  - Loads school branding from `GET /api/settings/school`.
  - Loads active student schemas + dynamic fields from `GET /api/students/public/schemas`.
  - Submits to `POST /api/students/public/register`.

### Backend registration behavior

Controller: `createPublicStudentRegistrationController` in `server/src/controllers/student.controller.js`

On submit it:
1. Validates required fields (`schema_id`, names, email).
2. Validates schema exists and active.
3. Validates email uniqueness in both `students` and `users`.
4. Validates schema custom required fields.
5. Generates `student_id`.
6. Auto-creates user login credentials with `Student` role.
7. Inserts into `students` with:
   - `status = 'inactive'`
   - `user_id` linked
   - `_public_registration` metadata inside `custom_data`.
8. Returns success with student reference.

Important: account is created automatically, but credentials are not automatically emailed in this flow.

## 5. Admin Student Management and Credential Distribution

### Admin can create student manually

- Endpoint: `POST /api/students`
- Optionally creates linked user account and optionally sends welcome email.

### Create login for existing student

- Endpoint: `POST /api/students/:id/create-login`
- Generates username/temp password, links `user_id`.

### Send login details manually (bulk)

- Endpoint: `POST /api/students/send-logins/bulk`
- Requires role Admin/Super Admin + permission `student.login.send`.
- Sends credentials by email for selected students.

This is the manual "release credentials" stage for pre-admission candidates.

## 6. Student Portal Flow (Authenticated Student)

Main path: `/admin/dashboard/student-portal/*`

### 6.1 Profile

- Student profile from `GET /api/students/me`.
- Profile photo upload is required in practical flow before application progresses.

### 6.2 Application creation

Student flow pages:
- Browse programs: `/admin/dashboard/student-portal/applications` and `/browse`
- New application: `/admin/dashboard/student-portal/applications/new?schema=<id>`

Backend endpoint used:
- `POST /api/applications/create`

Create behavior (`createApplicantController`):
- Maps frontend applicant fields.
- Creates applicant row in `applicants`.
- Links `user_id` to current student user.
- Stores custom schema data in JSON.
- Generates `application_number`.

### 6.3 Payment flow

Student payment page initializes via:
- `POST /api/payments/initialize`

`initializePaymentController`:
1. Validates applicant ownership for student users.
2. Creates pending row in `payment_transactions`.
3. Calls Paystack initialize.
4. Supports split/subaccount routing via request values, school settings, or env:
   - `PAYSTACK_SUBACCOUNT`
   - `PAYSTACK_SPLIT_CODE`
   - `PAYSTACK_BEARER`
   - `PAYSTACK_TRANSACTION_CHARGE`
5. Returns Paystack `authorization_url`.

Verification:
- `GET /api/payments/verify/:reference`
- On success updates `payment_transactions` + applicant `payment_status='paid'`.

Webhook:
- `POST /api/payments/webhook` (Paystack callback)
- Signature checked with `x-paystack-signature`.
- Also updates DB transaction and applicant payment status.

Student-safe payment history:
- `GET /api/payments/transactions/my` (returns only current user’s transactions).

### 6.4 Exam date selection (capacity-aware)

Admin configures calendar slots in entry date module:
- `POST /api/exams/entry-dates`
- Includes `exam_date`, `exam_time`, `max_capacity`, deadline, venue.

Student sees available slots:
- `GET /api/exams/entry-dates/available/list`

Student selects slot:
- `PUT /api/applications/:id/select-exam-date`

`selectMyExamDateController` enforces:
- ownership check,
- payment must be completed,
- selected slot must have capacity,
- current registration counts synced.

Admin bulk assignment supports auto-overflow logic:
- `POST /api/applications/assign-exam` with `auto_assign_next_available=true`
- If chosen date is full, system picks next available date automatically.

### 6.5 Exam card generation/download

After assignment:
- Student can download via `GET /api/exams/cards/generate/:applicantId`
- PDF/image generation utilities are in `server/src/utils/examCardGenerator*.js`.

## 7. Admission Scoring and Decisions (Admin)

Admin page:
- `/admin/dashboard/applications/admission`

Features implemented:
1. Manage custom admission subjects.
2. Set benchmark score.
3. Enter per-subject scores per applicant.
4. Auto-aggregate total + average.
5. Mark success by benchmark comparison.
6. List successful candidates.

Key endpoints:
- `GET/POST/PUT /api/applications/admission/subjects`
- `GET/PUT /api/applications/admission/benchmark`
- `POST /api/applications/admission/scores/:applicantId`
- `GET /api/applications/admission/results/:applicantId`
- `GET /api/applications/admission/successful`
- `PUT /api/applications/admission/decision/:applicantId`

Aggregation logic:
- `upsertApplicantScores` + `calculateApplicantResult` in `server/src/models/admission.model.js`.

## 8. Admission Letter Template (DB-Driven)

Admin template page:
- `/admin/dashboard/settings/templates/admission-letter`

Template APIs (`/api/settings/templates*`):
- List templates
- Get active by key
- Create new version
- Update version
- Activate version
- Preview rendering

Table:
- `document_templates`

Template key used by admission flow:
- `admission_letter`

Supported placeholders include:
- `{{reference}}`, `{{issued_date}}`, `{{student_name}}`, `{{application_number}}`, `{{student_email}}`, `{{school_name}}`, etc.

## 9. Admission Letter Generation and Delivery

Admin-only endpoints:
- Download one PDF: `GET /api/applications/admission/letters/:applicantId/download`
- Send to many by email: `POST /api/applications/admission/letters/send`

Controller: `server/src/controllers/admission.controller.js`

Flow:
1. Load applicant.
2. Load school settings.
3. Load active `admission_letter` template.
4. Render PDF via `generateAdmissionLetterPDF`.
5. Save metadata into `admission_results` (`letter_ref`, payload, timestamps).
6. Optionally email PDF attachment and mark `letter_sent`.

## 10. Student-Side Result/Letter Availability (Current State)

- Student results page (`/admin/dashboard/student-portal/results`) currently shows placeholder “Coming Soon”.
- Student self-service admission letter download endpoint is not yet implemented.
- Current operational model: admin downloads/sends letters from admin admission page.

## 11. Practical End-to-End Sequence

1. Admin configures:
   - school settings,
   - student schemas,
   - application schemas/fees,
   - exam entry date capacity calendar,
   - admission template and benchmark.
2. Candidate submits public student registration (`/student-registration`).
3. System creates student + login (inactive student record by default).
4. Admin reviews and manually sends login credentials to selected students.
5. Student logs in to student portal.
6. Student completes profile and submits application.
7. Student pays application fee via Paystack; status becomes paid.
8. Student selects available exam date (or admin assigns).
9. Student downloads exam card and sits exam.
10. Admin enters subject scores; system computes totals and success by benchmark.
11. Admin sets admission decision and sends/downloads admission letters.
12. Student receives letter by email (current implemented distribution channel).

## 12. Operational Notes

- Ensure migrations are present in DB before using related modules:
  - `create_admission_results_tables.sql`
  - `create_document_templates_table.sql`
  - `add_permissions_for_admission_and_templates.sql`
  - `add_student_portal_permissions.sql`
- Payment reliability depends on valid Paystack keys and callback/webhook accessibility.
- Permission checks are enforced both at route-level and in frontend UI.

## 13. Current Gaps You May Want Next

1. Student results page should consume real admission result endpoint for own applications.
2. Student self-download admission letter endpoint with ownership checks.
3. Optional admin workflow action to activate public-registered student accounts explicitly before credential mail.
4. Audit trail dashboard for “registration -> login sent -> payment -> exam -> result -> letter sent”.

