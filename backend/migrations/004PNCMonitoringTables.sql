-- Migration: 004_pnc_monitoring_tables.sql
-- Description: Create tables for P&C Monthly Monitoring Report storage and caching
-- Created: 2025-01-13
-- Author: System
-- Version: 1.0

-- =============================================================================
-- P&C MONTHLY MONITORING REPORT TABLES
-- =============================================================================

-- Table to store P&C Monthly Monitoring Reports
CREATE TABLE IF NOT EXISTS pnc_monitoring_reports (
    id SERIAL PRIMARY KEY,
    report_month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    report_year INTEGER NOT NULL,
    report_month_number INTEGER NOT NULL,
    
    -- Statistics
    total_headcount INTEGER DEFAULT 0,
    total_contractors INTEGER DEFAULT 0,
    total_leavers INTEGER DEFAULT 0,
    future_joiners INTEGER DEFAULT 0,
    total_vacancies INTEGER DEFAULT 0,
    
    -- Demographics
    average_age DECIMAL(5,2) DEFAULT 0,
    average_tenure DECIMAL(5,2) DEFAULT 0,
    disability_percentage DECIMAL(5,2) DEFAULT 0,
    attrition_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Report metadata
    report_data JSONB, -- Store complete report data
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    
    -- Indexes and constraints
    CONSTRAINT unique_month_report UNIQUE (report_month),
    CONSTRAINT valid_month_format CHECK (report_month ~ '^\d{4}-\d{2}$'),
    CONSTRAINT valid_year CHECK (report_year >= 2020 AND report_year <= 2050),
    CONSTRAINT valid_month_number CHECK (report_month_number >= 1 AND report_month_number <= 12)
);

-- Table to store detailed breakdowns for each report
CREATE TABLE IF NOT EXISTS pnc_monitoring_breakdowns (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES pnc_monitoring_reports(id) ON DELETE CASCADE,
    breakdown_type VARCHAR(50) NOT NULL, -- 'age', 'tenure', 'gender'
    category_name VARCHAR(100) NOT NULL,
    category_value VARCHAR(100),
    count INTEGER DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_breakdown_type CHECK (breakdown_type IN ('age', 'tenure', 'gender')),
    CONSTRAINT positive_count CHECK (count >= 0),
    CONSTRAINT valid_percentage CHECK (percentage >= 0 AND percentage <= 100)
);

-- Table to store recruitment/vacancy data (for future use)
CREATE TABLE IF NOT EXISTS recruitment_requisitions (
    id SERIAL PRIMARY KEY,
    requisition_id VARCHAR(100) UNIQUE NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    location VARCHAR(100),
    employment_type VARCHAR(50) DEFAULT 'Full-Time',
    status VARCHAR(50) DEFAULT 'Open', -- 'Open', 'Closed', 'On Hold', 'Filled'
    priority VARCHAR(20) DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
    
    -- Requirements
    min_experience INTEGER DEFAULT 0,
    max_experience INTEGER,
    required_skills TEXT[],
    preferred_skills TEXT[],
    
    -- Dates
    posted_date DATE DEFAULT CURRENT_DATE,
    closing_date DATE,
    filled_date DATE,
    
    -- Hiring details
    hiring_manager_id INTEGER REFERENCES users(id),
    assigned_recruiter_id INTEGER REFERENCES users(id),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT valid_employment_type CHECK (employment_type IN ('Full-Time', 'Contract', 'Intern', 'Part-Time')),
    CONSTRAINT valid_status CHECK (status IN ('Open', 'Closed', 'On Hold', 'Filled', 'Cancelled')),
    CONSTRAINT valid_priority CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    CONSTRAINT valid_experience CHECK (min_experience >= 0 AND (max_experience IS NULL OR max_experience >= min_experience))
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Indexes for pnc_monitoring_reports
CREATE INDEX IF NOT EXISTS idx_pnc_reports_month ON pnc_monitoring_reports(report_month);
CREATE INDEX IF NOT EXISTS idx_pnc_reports_year_month ON pnc_monitoring_reports(report_year, report_month_number);
CREATE INDEX IF NOT EXISTS idx_pnc_reports_generated_at ON pnc_monitoring_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_pnc_reports_active ON pnc_monitoring_reports(is_active);

-- Indexes for pnc_monitoring_breakdowns
CREATE INDEX IF NOT EXISTS idx_pnc_breakdowns_report_id ON pnc_monitoring_breakdowns(report_id);
CREATE INDEX IF NOT EXISTS idx_pnc_breakdowns_type ON pnc_monitoring_breakdowns(breakdown_type);
CREATE INDEX IF NOT EXISTS idx_pnc_breakdowns_category ON pnc_monitoring_breakdowns(breakdown_type, category_name);

-- Indexes for recruitment_requisitions
CREATE INDEX IF NOT EXISTS idx_recruitment_status ON recruitment_requisitions(status);
CREATE INDEX IF NOT EXISTS idx_recruitment_department ON recruitment_requisitions(department);
CREATE INDEX IF NOT EXISTS idx_recruitment_posted_date ON recruitment_requisitions(posted_date);
CREATE INDEX IF NOT EXISTS idx_recruitment_hiring_manager ON recruitment_requisitions(hiring_manager_id);

-- =============================================================================
-- FUNCTIONS FOR P&C MONITORING
-- =============================================================================

-- Function to generate P&C monitoring report for a specific month
CREATE OR REPLACE FUNCTION generate_pnc_monitoring_report(target_month VARCHAR(7))
RETURNS JSONB AS $$
DECLARE
    report_data JSONB;
    start_date DATE;
    end_date DATE;
    year_part INTEGER;
    month_part INTEGER;
BEGIN
    -- Parse month
    year_part := EXTRACT(YEAR FROM (target_month || '-01')::DATE);
    month_part := EXTRACT(MONTH FROM (target_month || '-01')::DATE);
    
    -- Calculate date range
    start_date := (target_month || '-01')::DATE;
    end_date := (start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    
    -- Generate complete report data
    SELECT jsonb_build_object(
        'month', target_month,
        'period', jsonb_build_object(
            'startOfMonth', start_date::TEXT,
            'endOfMonth', end_date::TEXT,
            'lastDayOfMonth', EXTRACT(DAY FROM end_date)
        ),
        'statistics', jsonb_build_object(
            'totalHeadcount', (
                SELECT COUNT(*) 
                FROM employee_master 
                WHERE status = 'active' 
                AND doj <= end_date
            ),
            'totalContractors', (
                SELECT COUNT(*) 
                FROM employee_master 
                WHERE status = 'active' 
                AND type = 'Contract'
                AND doj <= end_date
            ),
            'totalLeavers', (
                SELECT COUNT(*) 
                FROM employee_master 
                WHERE status = 'inactive'
                AND updated_at >= start_date 
                AND updated_at <= end_date
            ),
            'totalVacancies', (
                SELECT COUNT(*) 
                FROM recruitment_requisitions 
                WHERE status = 'Open'
            ),
            'futureJoiners', (
                SELECT COUNT(*) 
                FROM employee_master 
                WHERE doj > end_date
            )
        ),
        'ageDistribution', jsonb_build_object(
            'averageAge', COALESCE((
                SELECT AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, ap.dob)))
                FROM employee_master em
                JOIN adp_payroll ap ON em.employee_id = ap.employee_id
                WHERE em.status = 'active' AND em.doj <= end_date AND ap.dob IS NOT NULL
            ), 0),
            'groups', jsonb_build_array(
                jsonb_build_object('name', 'Younger than 25', 'count', (
                    SELECT COUNT(*) 
                    FROM employee_master em
                    JOIN adp_payroll ap ON em.employee_id = ap.employee_id
                    WHERE em.status = 'active' AND em.doj <= end_date 
                    AND ap.dob IS NOT NULL
                    AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, ap.dob)) < 25
                )),
                jsonb_build_object('name', '25-45', 'count', (
                    SELECT COUNT(*) 
                    FROM employee_master em
                    JOIN adp_payroll ap ON em.employee_id = ap.employee_id
                    WHERE em.status = 'active' AND em.doj <= end_date 
                    AND ap.dob IS NOT NULL
                    AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, ap.dob)) BETWEEN 25 AND 45
                )),
                jsonb_build_object('name', '45-60', 'count', (
                    SELECT COUNT(*) 
                    FROM employee_master em
                    JOIN adp_payroll ap ON em.employee_id = ap.employee_id
                    WHERE em.status = 'active' AND em.doj <= end_date 
                    AND ap.dob IS NOT NULL
                    AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, ap.dob)) BETWEEN 46 AND 60
                )),
                jsonb_build_object('name', '60+', 'count', (
                    SELECT COUNT(*) 
                    FROM employee_master em
                    JOIN adp_payroll ap ON em.employee_id = ap.employee_id
                    WHERE em.status = 'active' AND em.doj <= end_date 
                    AND ap.dob IS NOT NULL
                    AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, ap.dob)) > 60
                ))
            )
        ),
        'tenure', jsonb_build_object(
            'averageTenure', COALESCE((
                SELECT AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, em.doj)))
                FROM employee_master em
                WHERE em.status = 'active' AND em.doj <= end_date
            ), 0),
            'groups', jsonb_build_array(
                jsonb_build_object('name', 'Less than 12 months', 'count', (
                    SELECT COUNT(*) 
                    FROM employee_master em
                    WHERE em.status = 'active' AND em.doj <= end_date 
                    AND em.doj > (CURRENT_DATE - INTERVAL '1 year')
                )),
                jsonb_build_object('name', '1-3 Years', 'count', (
                    SELECT COUNT(*) 
                    FROM employee_master em
                    WHERE em.status = 'active' AND em.doj <= end_date 
                    AND em.doj BETWEEN (CURRENT_DATE - INTERVAL '3 years') AND (CURRENT_DATE - INTERVAL '1 year')
                )),
                jsonb_build_object('name', '4-6 Years', 'count', (
                    SELECT COUNT(*) 
                    FROM employee_master em
                    WHERE em.status = 'active' AND em.doj <= end_date 
                    AND em.doj BETWEEN (CURRENT_DATE - INTERVAL '6 years') AND (CURRENT_DATE - INTERVAL '4 years')
                )),
                jsonb_build_object('name', '7-10 Years', 'count', (
                    SELECT COUNT(*) 
                    FROM employee_master em
                    WHERE em.status = 'active' AND em.doj <= end_date 
                    AND em.doj BETWEEN (CURRENT_DATE - INTERVAL '10 years') AND (CURRENT_DATE - INTERVAL '7 years')
                )),
                jsonb_build_object('name', '11+ years', 'count', (
                    SELECT COUNT(*) 
                    FROM employee_master em
                    WHERE em.status = 'active' AND em.doj <= end_date 
                    AND em.doj < (CURRENT_DATE - INTERVAL '10 years')
                ))
            )
        ),
        'gender', jsonb_build_array(
            jsonb_build_object('name', 'Male', 'count', (
                SELECT COUNT(*) 
                FROM employee_master em
                JOIN adp_payroll ap ON em.employee_id = ap.employee_id
                WHERE em.status = 'active' AND em.doj <= end_date 
                AND ap.gender = 'Male'
            )),
            jsonb_build_object('name', 'Female', 'count', (
                SELECT COUNT(*) 
                FROM employee_master em
                JOIN adp_payroll ap ON em.employee_id = ap.employee_id
                WHERE em.status = 'active' AND em.doj <= end_date 
                AND ap.gender = 'Female'
            )),
            jsonb_build_object('name', 'Prefer not to say', 'count', (
                SELECT COUNT(*) 
                FROM employee_master em
                JOIN adp_payroll ap ON em.employee_id = ap.employee_id
                WHERE em.status = 'active' AND em.doj <= end_date 
                AND (ap.gender IS NULL OR ap.gender = 'Prefer not to say')
            ))
        ),
        'disability', jsonb_build_object(
            'percentage', COALESCE((
                SELECT ROUND((COUNT(*) * 100.0 / NULLIF((
                    SELECT COUNT(*) 
                    FROM employee_master em2
                    JOIN adp_payroll ap2 ON em2.employee_id = ap2.employee_id
                    WHERE em2.status = 'active' AND em2.doj <= end_date
                ), 0)), 2)
                FROM employee_master em
                JOIN adp_payroll ap ON em.employee_id = ap.employee_id
                WHERE em.status = 'active' AND em.doj <= end_date 
                AND ap.disability_status = 'Yes'
            ), 0)
        ),
        'attrition', jsonb_build_object(
            'percentage', COALESCE((
                SELECT ROUND((COUNT(*) * 100.0 / NULLIF((
                    SELECT COUNT(*) 
                    FROM employee_master em2
                    WHERE em2.status = 'active' AND em2.doj <= start_date
                ), 0)), 2)
                FROM employee_master em
                WHERE em.status = 'inactive'
                AND em.updated_at >= start_date 
                AND em.updated_at <= end_date
            ), 0)
        ),
        'generatedAt', NOW()::TEXT
    ) INTO report_data;
    
    RETURN report_data;
END;
$$ LANGUAGE plpgsql;

-- Function to get cached report or generate new one
CREATE OR REPLACE FUNCTION get_pnc_monitoring_report(target_month VARCHAR(7))
RETURNS JSONB AS $$
DECLARE
    cached_report JSONB;
    new_report JSONB;
BEGIN
    -- Try to get cached report
    SELECT report_data INTO cached_report
    FROM pnc_monitoring_reports
    WHERE report_month = target_month
    AND is_active = true
    ORDER BY generated_at DESC
    LIMIT 1;
    
    -- If cached report exists and is recent (within 1 hour), return it
    IF cached_report IS NOT NULL THEN
        RETURN cached_report;
    END IF;
    
    -- Generate new report
    new_report := generate_pnc_monitoring_report(target_month);
    
    -- Cache the new report
    INSERT INTO pnc_monitoring_reports (
        report_month, report_year, report_month_number, report_data
    ) VALUES (
        target_month, 
        EXTRACT(YEAR FROM (target_month || '-01')::DATE),
        EXTRACT(MONTH FROM (target_month || '-01')::DATE),
        new_report
    ) ON CONFLICT (report_month) 
    DO UPDATE SET 
        report_data = EXCLUDED.report_data,
        generated_at = CURRENT_TIMESTAMP,
        is_active = true;
    
    RETURN new_report;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SAMPLE DATA (Optional)
-- =============================================================================

-- Insert sample recruitment requisitions
INSERT INTO recruitment_requisitions (requisition_id, job_title, department, status, priority) VALUES
('REQ-2025-001', 'Senior Software Engineer', 'Engineering', 'Open', 'High'),
('REQ-2025-002', 'HR Business Partner', 'Human Resources', 'Open', 'Medium'),
('REQ-2025-003', 'Marketing Manager', 'Marketing', 'Open', 'Medium'),
('REQ-2025-004', 'DevOps Engineer', 'Engineering', 'Closed', 'High'),
('REQ-2025-005', 'Financial Analyst', 'Finance', 'Open', 'Low')
ON CONFLICT (requisition_id) DO NOTHING;

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE pnc_monitoring_reports IS 'Stores P&C Monthly Monitoring Reports with aggregated data';
COMMENT ON TABLE pnc_monitoring_breakdowns IS 'Stores detailed breakdowns for each P&C monitoring report';
COMMENT ON TABLE recruitment_requisitions IS 'Stores job requisitions and vacancy information for recruitment metrics';

COMMENT ON COLUMN pnc_monitoring_reports.report_month IS 'Month in YYYY-MM format (e.g., 2025-01)';
COMMENT ON COLUMN pnc_monitoring_reports.report_data IS 'Complete JSON report data for API responses';
COMMENT ON COLUMN pnc_monitoring_breakdowns.breakdown_type IS 'Type of breakdown: age, tenure, or gender';
COMMENT ON COLUMN recruitment_requisitions.requisition_id IS 'Unique identifier for the job requisition';

-- =============================================================================
-- MIGRATION COMPLETION
-- =============================================================================

INSERT INTO migration_log (migration_name, applied_at, description) 
VALUES (
    '004_pnc_monitoring_tables', 
    CURRENT_TIMESTAMP, 
    'Created P&C Monthly Monitoring Report tables and functions'
) ON CONFLICT (migration_name) DO NOTHING;
