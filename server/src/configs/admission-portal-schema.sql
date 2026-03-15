-- =====================================================
-- School Academic Admission Portal - Extended Schema
-- =====================================================
-- Database: deepflux_admissions
-- Created: 2024
-- Description: Extended database schema for Employee Management, 
--              Application Management, Payment Processing, 
--              Exam Management, and Exam Card Generation
-- =====================================================

USE deepflux_admissions;

-- =====================================================
-- 6. EMPLOYEE TABLE SCHEMA MANAGEMENT
-- =====================================================
-- Stores dynamic table schemas for employee management
CREATE TABLE IF NOT EXISTS employee_schemas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schema_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key to users table
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_employee_schemas_name (schema_name),
    INDEX idx_employee_schemas_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. EMPLOYEE SCHEMA FIELDS
-- =====================================================
-- Stores field definitions for employee schemas
CREATE TABLE IF NOT EXISTS employee_schema_fields (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schema_id INT NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(100) NOT NULL,
    field_type ENUM('text', 'email', 'number', 'date', 'datetime', 'time', 'textarea', 'select', 'checkbox', 'radio', 'file', 'url', 'phone') NOT NULL,
    field_options JSON, -- For select, radio, checkbox options
    is_required BOOLEAN DEFAULT FALSE,
    validation_rules JSON, -- Custom validation rules
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key to employee_schemas
    FOREIGN KEY (schema_id) REFERENCES employee_schemas(id) ON DELETE CASCADE,
    
    -- Unique constraint for field names within schema
    UNIQUE KEY unique_schema_field (schema_id, field_name),
    
    -- Indexes
    INDEX idx_employee_fields_schema (schema_id),
    INDEX idx_employee_fields_order (display_order),
    INDEX idx_employee_fields_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. EMPLOYEES TABLE (Dynamic Structure)
-- =====================================================
-- Base employees table with common fields
CREATE TABLE IF NOT EXISTS employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(50) NOT NULL UNIQUE, -- Custom employee ID
    schema_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    department VARCHAR(100),
    position VARCHAR(100),
    employment_date DATE,
    salary DECIMAL(10,2),
    status ENUM('active', 'inactive', 'terminated', 'on_leave') DEFAULT 'active',
    profile_image VARCHAR(255),
    custom_data JSON, -- Store dynamic field data
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (schema_id) REFERENCES employee_schemas(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_employees_employee_id (employee_id),
    INDEX idx_employees_schema (schema_id),
    INDEX idx_employees_email (email),
    INDEX idx_employees_status (status),
    INDEX idx_employees_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. APPLICATION SCHEMA MANAGEMENT
-- =====================================================
-- Stores dynamic table schemas for application management
CREATE TABLE IF NOT EXISTS application_schemas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schema_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    application_fee DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key to users table
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_application_schemas_name (schema_name),
    INDEX idx_application_schemas_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. APPLICATION SCHEMA FIELDS
-- =====================================================
-- Stores field definitions for application schemas
CREATE TABLE IF NOT EXISTS application_schema_fields (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schema_id INT NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(100) NOT NULL,
    field_type ENUM('text', 'email', 'number', 'date', 'datetime', 'time', 'textarea', 'select', 'checkbox', 'radio', 'file', 'url', 'phone') NOT NULL,
    field_options JSON, -- For select, radio, checkbox options
    is_required BOOLEAN DEFAULT FALSE,
    validation_rules JSON, -- Custom validation rules
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key to application_schemas
    FOREIGN KEY (schema_id) REFERENCES application_schemas(id) ON DELETE CASCADE,
    
    -- Unique constraint for field names within schema
    UNIQUE KEY unique_schema_field (schema_id, field_name),
    
    -- Indexes
    INDEX idx_application_fields_schema (schema_id),
    INDEX idx_application_fields_order (display_order),
    INDEX idx_application_fields_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 11. APPLICANTS TABLE (Dynamic Structure)
-- =====================================================
-- Base applicants table with common fields
CREATE TABLE IF NOT EXISTS applicants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    application_number VARCHAR(50) NOT NULL UNIQUE, -- Auto-generated application number
    schema_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    nationality VARCHAR(100),
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    passport_photo VARCHAR(255),
    status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'admitted') DEFAULT 'draft',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_reference VARCHAR(100),
    exam_date_id INT NULL,
    exam_card_generated BOOLEAN DEFAULT FALSE,
    exam_card_path VARCHAR(255),
    custom_data JSON, -- Store dynamic field data
    submitted_at TIMESTAMP NULL,
    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL,
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (schema_id) REFERENCES application_schemas(id) ON DELETE RESTRICT,
    FOREIGN KEY (exam_date_id) REFERENCES entry_dates(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_applicants_application_number (application_number),
    INDEX idx_applicants_schema (schema_id),
    INDEX idx_applicants_email (email),
    INDEX idx_applicants_status (status),
    INDEX idx_applicants_payment_status (payment_status),
    INDEX idx_applicants_exam_date (exam_date_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 12. PAYMENT TRANSACTIONS TABLE
-- =====================================================
-- Stores payment transaction details
CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_reference VARCHAR(100) NOT NULL UNIQUE, -- Paystack reference
    applicant_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    payment_method ENUM('card', 'bank_transfer', 'ussd', 'qr', 'bank_account') DEFAULT 'card',
    payment_status ENUM('pending', 'success', 'failed', 'cancelled', 'reversed') DEFAULT 'pending',
    paystack_response JSON, -- Store full Paystack response
    gateway_response TEXT, -- Store gateway response details
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key to applicants
    FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_payments_reference (transaction_reference),
    INDEX idx_payments_applicant (applicant_id),
    INDEX idx_payments_status (payment_status),
    INDEX idx_payments_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 13. ENTRY DATES TABLE
-- =====================================================
-- Manages exam dates and scheduling
CREATE TABLE IF NOT EXISTS entry_dates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    exam_title VARCHAR(200) NOT NULL,
    exam_description TEXT,
    exam_date DATE NOT NULL,
    exam_time TIME NOT NULL,
    exam_duration INT DEFAULT 120, -- Duration in minutes
    exam_venue VARCHAR(200) NOT NULL,
    exam_address TEXT,
    max_capacity INT DEFAULT 100,
    current_registrations INT DEFAULT 0,
    registration_deadline DATE,
    is_active BOOLEAN DEFAULT TRUE,
    instructions TEXT, -- Special instructions for the exam
    requirements TEXT, -- What applicants need to bring
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key to users table
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_entry_dates_exam_date (exam_date),
    INDEX idx_entry_dates_active (is_active),
    INDEX idx_entry_dates_capacity (max_capacity, current_registrations)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 14. EXAM CARDS TABLE
-- =====================================================
-- Stores exam card generation details
CREATE TABLE IF NOT EXISTS exam_cards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    applicant_id INT NOT NULL,
    entry_date_id INT NOT NULL,
    card_number VARCHAR(50) NOT NULL UNIQUE, -- Unique exam card number
    qr_code_data VARCHAR(500), -- QR code data
    qr_code_image VARCHAR(255), -- Path to QR code image
    card_image VARCHAR(255), -- Path to generated exam card image
    card_pdf VARCHAR(255), -- Path to PDF version
    is_printed BOOLEAN DEFAULT FALSE,
    printed_at TIMESTAMP NULL,
    printed_by INT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
    FOREIGN KEY (entry_date_id) REFERENCES entry_dates(id) ON DELETE CASCADE,
    FOREIGN KEY (printed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_exam_cards_applicant (applicant_id),
    INDEX idx_exam_cards_entry_date (entry_date_id),
    INDEX idx_exam_cards_card_number (card_number),
    INDEX idx_exam_cards_printed (is_printed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 15. SCHOOL SETTINGS TABLE
-- =====================================================
-- Stores school configuration and settings
CREATE TABLE IF NOT EXISTS school_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('text', 'number', 'boolean', 'json', 'file') DEFAULT 'text',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key to users table
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_school_settings_key (setting_key),
    INDEX idx_school_settings_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 16. FILE UPLOADS TABLE
-- =====================================================
-- Tracks file uploads and their metadata
CREATE TABLE IF NOT EXISTS file_uploads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL, -- Size in bytes
    mime_type VARCHAR(100) NOT NULL,
    file_type ENUM('image', 'document', 'pdf', 'other') NOT NULL,
    upload_type ENUM('employee', 'applicant', 'exam_card', 'other') NOT NULL,
    related_id INT NULL, -- ID of related record (employee, applicant, etc.)
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to users table
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_file_uploads_type (upload_type),
    INDEX idx_file_uploads_related (related_id),
    INDEX idx_file_uploads_uploaded_by (uploaded_by),
    INDEX idx_file_uploads_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default school settings
INSERT INTO school_settings (setting_key, setting_value, setting_type, description) VALUES
('school_name', 'DeepFlux Academy', 'text', 'Name of the school'),
('school_logo', '/uploads/school-logo.png', 'file', 'School logo file path'),
('school_address', '123 Education Street, Learning City', 'text', 'School physical address'),
('school_phone', '+234-123-456-7890', 'text', 'School contact phone number'),
('school_email', 'info@deepfluxacademy.com', 'text', 'School contact email'),
('application_fee', '5000.00', 'number', 'Default application fee amount'),
('currency', 'NGN', 'text', 'Default currency for payments'),
('paystack_public_key', '', 'text', 'Paystack public key'),
('paystack_secret_key', '', 'text', 'Paystack secret key'),
('exam_card_template', '/templates/exam-card.html', 'file', 'Exam card template file path');

-- Insert default employee schema
INSERT INTO employee_schemas (schema_name, display_name, description, created_by) VALUES
('default_employee', 'Default Employee Schema', 'Standard employee information schema', 1);

-- Insert default employee schema fields
INSERT INTO employee_schema_fields (schema_id, field_name, field_label, field_type, is_required, display_order) VALUES
(1, 'employee_id', 'Employee ID', 'text', TRUE, 1),
(1, 'first_name', 'First Name', 'text', TRUE, 2),
(1, 'last_name', 'Last Name', 'text', TRUE, 3),
(1, 'email', 'Email Address', 'email', TRUE, 4),
(1, 'phone', 'Phone Number', 'phone', TRUE, 5),
(1, 'department', 'Department', 'select', TRUE, 6),
(1, 'position', 'Position', 'text', TRUE, 7),
(1, 'employment_date', 'Employment Date', 'date', TRUE, 8),
(1, 'salary', 'Salary', 'number', FALSE, 9),
(1, 'address', 'Address', 'textarea', FALSE, 10),
(1, 'emergency_contact', 'Emergency Contact', 'text', FALSE, 11),
(1, 'profile_image', 'Profile Image', 'file', FALSE, 12);

-- Insert default application schema
INSERT INTO application_schemas (schema_name, display_name, description, application_fee, created_by) VALUES
('default_application', 'Default Application Schema', 'Standard student application schema', 5000.00, 1);

-- Insert default application schema fields
INSERT INTO application_schema_fields (schema_id, field_name, field_label, field_type, is_required, display_order) VALUES
(1, 'first_name', 'First Name', 'text', TRUE, 1),
(1, 'last_name', 'Last Name', 'text', TRUE, 2),
(1, 'middle_name', 'Middle Name', 'text', FALSE, 3),
(1, 'email', 'Email Address', 'email', TRUE, 4),
(1, 'phone', 'Phone Number', 'phone', TRUE, 5),
(1, 'date_of_birth', 'Date of Birth', 'date', TRUE, 6),
(1, 'gender', 'Gender', 'select', TRUE, 7),
(1, 'nationality', 'Nationality', 'text', TRUE, 8),
(1, 'address', 'Address', 'textarea', TRUE, 9),
(1, 'emergency_contact_name', 'Emergency Contact Name', 'text', TRUE, 10),
(1, 'emergency_contact_phone', 'Emergency Contact Phone', 'phone', TRUE, 11),
(1, 'passport_photo', 'Passport Photo', 'file', TRUE, 12),
(1, 'previous_school', 'Previous School', 'text', FALSE, 13),
(1, 'academic_qualification', 'Academic Qualification', 'textarea', FALSE, 14),
(1, 'intended_course', 'Intended Course', 'text', FALSE, 15);

-- =====================================================
-- CREATE TRIGGERS FOR AUTO-INCREMENT UPDATES
-- =====================================================

-- Trigger to update current_registrations in entry_dates
DELIMITER //
CREATE TRIGGER update_entry_date_registrations_insert
AFTER INSERT ON applicants
FOR EACH ROW
BEGIN
    IF NEW.exam_date_id IS NOT NULL THEN
        UPDATE entry_dates 
        SET current_registrations = current_registrations + 1 
        WHERE id = NEW.exam_date_id;
    END IF;
END//

CREATE TRIGGER update_entry_date_registrations_update
AFTER UPDATE ON applicants
FOR EACH ROW
BEGIN
    -- If exam_date_id changed
    IF OLD.exam_date_id != NEW.exam_date_id THEN
        -- Decrease old entry date
        IF OLD.exam_date_id IS NOT NULL THEN
            UPDATE entry_dates 
            SET current_registrations = current_registrations - 1 
            WHERE id = OLD.exam_date_id;
        END IF;
        
        -- Increase new entry date
        IF NEW.exam_date_id IS NOT NULL THEN
            UPDATE entry_dates 
            SET current_registrations = current_registrations + 1 
            WHERE id = NEW.exam_date_id;
        END IF;
    END IF;
END//

CREATE TRIGGER update_entry_date_registrations_delete
AFTER DELETE ON applicants
FOR EACH ROW
BEGIN
    IF OLD.exam_date_id IS NOT NULL THEN
        UPDATE entry_dates 
        SET current_registrations = current_registrations - 1 
        WHERE id = OLD.exam_date_id;
    END IF;
END//

DELIMITER ;

-- =====================================================
-- CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for employee details with schema information
CREATE VIEW employee_details AS
SELECT 
    e.*,
    es.schema_name,
    es.display_name as schema_display_name,
    u.username as created_by_username
FROM employees e
JOIN employee_schemas es ON e.schema_id = es.id
LEFT JOIN users u ON e.created_by = u.id;

-- View for applicant details with schema information
CREATE VIEW applicant_details AS
SELECT 
    a.*,
    as_schema.schema_name,
    as_schema.display_name as schema_display_name,
    as_schema.application_fee,
    ed.exam_title,
    ed.exam_date,
    ed.exam_time,
    ed.exam_venue,
    u.username as reviewed_by_username
FROM applicants a
JOIN application_schemas as_schema ON a.schema_id = as_schema.id
LEFT JOIN entry_dates ed ON a.exam_date_id = ed.id
LEFT JOIN users u ON a.reviewed_by = u.id;

-- View for payment summary
CREATE VIEW payment_summary AS
SELECT 
    a.id as applicant_id,
    a.application_number,
    a.first_name,
    a.last_name,
    a.email,
    pt.transaction_reference,
    pt.amount,
    pt.payment_status,
    pt.paid_at,
    pt.created_at as payment_created_at
FROM applicants a
LEFT JOIN payment_transactions pt ON a.id = pt.applicant_id;

-- =====================================================
-- CREATE STORED PROCEDURES
-- =====================================================

-- Procedure to generate application number
DELIMITER //
CREATE PROCEDURE GenerateApplicationNumber(OUT app_number VARCHAR(50))
BEGIN
    DECLARE year_part VARCHAR(4);
    DECLARE sequence_num INT;
    
    SET year_part = YEAR(CURDATE());
    
    -- Get next sequence number for current year
    SELECT COALESCE(MAX(CAST(SUBSTRING(application_number, 6) AS UNSIGNED)), 0) + 1
    INTO sequence_num
    FROM applicants 
    WHERE application_number LIKE CONCAT('APP', year_part, '%');
    
    SET app_number = CONCAT('APP', year_part, LPAD(sequence_num, 4, '0'));
END//

-- Procedure to generate exam card number
CREATE PROCEDURE GenerateExamCardNumber(OUT card_number VARCHAR(50))
BEGIN
    DECLARE year_part VARCHAR(4);
    DECLARE sequence_num INT;
    
    SET year_part = YEAR(CURDATE());
    
    -- Get next sequence number for current year
    SELECT COALESCE(MAX(CAST(SUBSTRING(card_number, 6) AS UNSIGNED)), 0) + 1
    INTO sequence_num
    FROM exam_cards 
    WHERE card_number LIKE CONCAT('CARD', year_part, '%');
    
    SET card_number = CONCAT('CARD', year_part, LPAD(sequence_num, 4, '0'));
END//

DELIMITER ;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
