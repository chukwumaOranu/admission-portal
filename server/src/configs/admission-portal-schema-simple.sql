-- =====================================================
-- ADMISSION PORTAL DATABASE SCHEMA (SIMPLIFIED)
-- =====================================================

-- =====================================================
-- EMPLOYEE MANAGEMENT TABLES
-- =====================================================

-- Employee schemas table
CREATE TABLE IF NOT EXISTS employee_schemas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schema_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Employee schema fields table
CREATE TABLE IF NOT EXISTS employee_schema_fields (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schema_id INT NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(200) NOT NULL,
    field_type ENUM('text', 'email', 'number', 'date', 'datetime', 'time', 'textarea', 'select', 'checkbox', 'radio', 'file', 'url', 'phone') NOT NULL,
    field_options JSON,
    is_required BOOLEAN DEFAULT FALSE,
    validation_rules JSON,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (schema_id) REFERENCES employee_schemas(id) ON DELETE CASCADE
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    schema_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    department VARCHAR(100),
    position VARCHAR(100),
    employment_date DATE,
    salary DECIMAL(10,2),
    status ENUM('active', 'inactive', 'terminated', 'on_leave') DEFAULT 'active',
    profile_image VARCHAR(500),
    custom_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (schema_id) REFERENCES employee_schemas(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- APPLICATION MANAGEMENT TABLES
-- =====================================================

-- Application schemas table
CREATE TABLE IF NOT EXISTS application_schemas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schema_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    application_fee DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Application schema fields table
CREATE TABLE IF NOT EXISTS application_schema_fields (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schema_id INT NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(200) NOT NULL,
    field_type ENUM('text', 'email', 'number', 'date', 'datetime', 'time', 'textarea', 'select', 'checkbox', 'radio', 'file', 'url', 'phone') NOT NULL,
    field_options JSON,
    is_required BOOLEAN DEFAULT FALSE,
    validation_rules JSON,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (schema_id) REFERENCES application_schemas(id) ON DELETE CASCADE
);

-- Entry dates table (needed before applicants)
CREATE TABLE IF NOT EXISTS entry_dates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    exam_title VARCHAR(200) NOT NULL,
    exam_description TEXT,
    exam_date DATE NOT NULL,
    exam_time TIME NOT NULL,
    exam_duration INT DEFAULT 120,
    exam_venue VARCHAR(200) NOT NULL,
    exam_address TEXT,
    max_capacity INT DEFAULT 100,
    current_registrations INT DEFAULT 0,
    registration_deadline DATE,
    instructions TEXT,
    requirements TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Applicants table
CREATE TABLE IF NOT EXISTS applicants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    application_number VARCHAR(20) NOT NULL UNIQUE,
    schema_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    nationality VARCHAR(100),
    address TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    passport_photo VARCHAR(500),
    exam_date_id INT,
    status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'admitted') DEFAULT 'draft',
    payment_status ENUM('pending', 'paid', 'failed', 'cancelled') DEFAULT 'pending',
    payment_reference VARCHAR(100),
    submitted_at TIMESTAMP NULL,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT,
    review_notes TEXT,
    custom_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (schema_id) REFERENCES application_schemas(id) ON DELETE RESTRICT,
    FOREIGN KEY (exam_date_id) REFERENCES entry_dates(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- PAYMENT AND EXAM MANAGEMENT TABLES
-- =====================================================

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_reference VARCHAR(100) NOT NULL UNIQUE,
    applicant_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    payment_method VARCHAR(50) DEFAULT 'card',
    payment_status ENUM('pending', 'success', 'failed', 'cancelled') DEFAULT 'pending',
    paystack_response JSON,
    gateway_response TEXT,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE
);

-- Exam cards table
CREATE TABLE IF NOT EXISTS exam_cards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    applicant_id INT NOT NULL,
    entry_date_id INT NOT NULL,
    card_number VARCHAR(20) NOT NULL UNIQUE,
    qr_code_data TEXT,
    qr_code_image VARCHAR(500),
    card_image VARCHAR(500),
    card_pdf VARCHAR(500),
    is_printed BOOLEAN DEFAULT FALSE,
    printed_at TIMESTAMP NULL,
    printed_by INT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
    FOREIGN KEY (entry_date_id) REFERENCES entry_dates(id) ON DELETE CASCADE,
    FOREIGN KEY (printed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- SETTINGS AND FILE MANAGEMENT TABLES
-- =====================================================

-- School settings table
CREATE TABLE IF NOT EXISTS school_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    school_name VARCHAR(200) NOT NULL,
    school_logo VARCHAR(500),
    school_address TEXT,
    school_phone VARCHAR(20),
    school_email VARCHAR(255),
    school_website VARCHAR(255),
    school_motto TEXT,
    school_mission TEXT,
    school_vision TEXT,
    academic_year VARCHAR(10),
    application_fee DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'NGN',
    timezone VARCHAR(50) DEFAULT 'Africa/Lagos',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(10) DEFAULT '24h',
    language VARCHAR(10) DEFAULT 'en',
    theme_color VARCHAR(7),
    custom_settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- File uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL UNIQUE,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_category VARCHAR(50) NOT NULL,
    uploaded_by INT NOT NULL,
    description TEXT,
    metadata JSON,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);