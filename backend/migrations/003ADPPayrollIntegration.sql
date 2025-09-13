-- Migration: 003_adp_payroll_integration.sql
-- Description: ADP Payroll table with explicit field-to-column mapping
-- Created: 2025-01-09
-- Author: System
-- Version: 3.0

-- =============================================================================
-- ADP PAYROLL TABLE - COMPLETE FIELD MAPPING
-- =============================================================================

CREATE TABLE IF NOT EXISTS adp_payroll (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(100) UNIQUE NOT NULL REFERENCES employee_master(employee_id) ON DELETE CASCADE,
    
    -- Basic Information
    name_prefix VARCHAR(10),
    employee_full_name VARCHAR(255),
    given_or_first_name VARCHAR(100),
    middle_name VARCHAR(100),
    last_name VARCHAR(100),
    joining_date DATE,
    payroll_starting_month DATE,
    dob DATE,
    aadhar VARCHAR(12),
    name_as_per_aadhar VARCHAR(255),
    designation_description VARCHAR(255),
    email VARCHAR(255),
    alternate_email VARCHAR(255),
    pan VARCHAR(10),
    name_as_per_pan VARCHAR(255),
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    department_description VARCHAR(255),
    work_location VARCHAR(255),
    labour_state_description VARCHAR(255),
    
    -- LWF Information
    lwf_designation VARCHAR(255),
    lwf_relationship VARCHAR(255),
    lwf_id VARCHAR(50),
    professional_tax_group_description VARCHAR(255),
    pf_computational_group VARCHAR(255),
    
    -- Contact Information
    mobile_number VARCHAR(15),
    phone_number1 VARCHAR(15),
    phone_number2 VARCHAR(15),
    
    -- Address Information
    address1 TEXT,
    address2 TEXT,
    address3 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(100),
    nationality VARCHAR(100),
    
    -- International Worker Information
    iw_nationality VARCHAR(100),
    iw_city VARCHAR(100),
    iw_country VARCHAR(100),
    coc_issuing_authority VARCHAR(255),
    coc_issue_date DATE,
    coc_from_date DATE,
    coc_upto_date DATE,
    
    -- Banking Information
    bank_name VARCHAR(255),
    name_as_per_bank VARCHAR(255),
    account_no VARCHAR(50),
    bank_ifsc_code VARCHAR(15),
    payment_mode VARCHAR(50),
    
    -- PF/ESI Information
    pf_account_no VARCHAR(50),
    esi_account_no VARCHAR(50),
    esi_above_wage_limit BOOLEAN DEFAULT false,
    uan VARCHAR(20),
    branch_description VARCHAR(255),
    enrollment_id VARCHAR(50),
    manager_employee_id VARCHAR(100),
    tax_regime VARCHAR(50),
    
    -- Family Information
    father_name VARCHAR(255),
    mother_name VARCHAR(255),
    spouse_name VARCHAR(255),
    marital_status VARCHAR(20) CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed')),
    number_of_children INTEGER DEFAULT 0,
    
    -- Disability Information
    disability_status BOOLEAN DEFAULT false,
    type_of_disability VARCHAR(255),
    
    -- Employment Information
    employment_type VARCHAR(50),
    grade_description VARCHAR(255),
    cadre_description VARCHAR(255),
    payment_description VARCHAR(255),
    attendance_description VARCHAR(255),
    workplace_description VARCHAR(255),
    band VARCHAR(50),
    level VARCHAR(50),
    work_cost_center VARCHAR(100),
    
    -- Custom Groups
    custom_group_1 VARCHAR(255),
    custom_group_2 VARCHAR(255),
    custom_group_3 VARCHAR(255),
    custom_group_4 VARCHAR(255),
    custom_group_5 VARCHAR(255),
    
    -- Passport Information
    passport_number VARCHAR(50),
    passport_issue_date DATE,
    passport_valid_upto DATE,
    passport_issued_country VARCHAR(100),
    
    -- Visa Information
    visa_issuing_authority VARCHAR(255),
    visa_from_date DATE,
    visa_upto_date DATE,
    
    -- PF/Pension Information
    already_member_in_pf BOOLEAN DEFAULT false,
    already_member_in_pension BOOLEAN DEFAULT false,
    withdrawn_pf_and_pension BOOLEAN DEFAULT false,
    international_worker_status BOOLEAN DEFAULT false,
    relationship_for_pf VARCHAR(255),
    
    -- Additional Information
    qualification VARCHAR(255),
    driving_licence_number VARCHAR(50),
    driving_licence_valid_date DATE,
    pran_number VARCHAR(50),
    rehire BOOLEAN DEFAULT false,
    old_employee_id VARCHAR(100),
    is_non_payroll_employee BOOLEAN DEFAULT false,
    category_name VARCHAR(255),
    custom_master_name VARCHAR(255),
    custom_master_name2 VARCHAR(255),
    custom_master_name3 VARCHAR(255),
    
    -- Eligibility Information
    ot_eligibility BOOLEAN DEFAULT false,
    auto_shift_eligibility BOOLEAN DEFAULT false,
    mobile_user BOOLEAN DEFAULT false,
    web_punch BOOLEAN DEFAULT false,
    attendance_exception_eligibility BOOLEAN DEFAULT false,
    attendance_exception_type VARCHAR(255),
    
    -- System Fields
    is_draft BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    CONSTRAINT adp_payroll_employee_id_unique UNIQUE (employee_id)
);

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_adp_payroll_employee_id ON adp_payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_adp_payroll_is_draft ON adp_payroll(is_draft);
CREATE INDEX IF NOT EXISTS idx_adp_payroll_created_at ON adp_payroll(created_at);

-- Add comments for documentation
COMMENT ON TABLE adp_payroll IS 'ADP Payroll integration table with explicit field-to-column mapping';
COMMENT ON COLUMN adp_payroll.employee_id IS 'References employee_master.employee_id';
COMMENT ON COLUMN adp_payroll.is_draft IS 'Flag to indicate if payroll data is in draft state';
COMMENT ON COLUMN adp_payroll.esi_above_wage_limit IS 'Boolean flag for ESI wage limit status';
COMMENT ON COLUMN adp_payroll.disability_status IS 'Boolean flag for disability status';
COMMENT ON COLUMN adp_payroll.already_member_in_pf IS 'Boolean flag for existing PF membership';
COMMENT ON COLUMN adp_payroll.international_worker_status IS 'Boolean flag for international worker status';
