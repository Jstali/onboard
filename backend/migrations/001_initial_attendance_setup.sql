-- Migration: 001_initial_attendance_setup.sql
-- Description: Initial setup for attendance system
-- Created: 2025-09-03
-- Author: System

-- Drop existing function if it exists to prevent errors
DROP FUNCTION IF EXISTS manually_add_employee(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR) CASCADE;

-- Create function to manually add employee with employment type
CREATE OR REPLACE FUNCTION manually_add_employee(
    p_email VARCHAR,
    p_first_name VARCHAR,
    p_last_name VARCHAR,
    p_role VARCHAR,
    p_type VARCHAR
) RETURNS INTEGER AS $$
DECLARE
    user_id INTEGER;
BEGIN
    -- Insert into users table
    INSERT INTO users (email, first_name, last_name, role, password_hash)
    VALUES (p_email, p_first_name, p_last_name, p_role, '$2b$10$default_hash_placeholder')
    RETURNING id INTO user_id;
    
    -- Insert into employee_master table
    INSERT INTO employee_master (user_id, first_name, last_name, email, role, status)
    VALUES (user_id, p_first_name, p_last_name, p_email, p_role, 'active');
    
    -- Insert into employee_forms table with employment type
    INSERT INTO employee_forms (employee_id, type, status)
    VALUES (user_id, p_type, 'pending');
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Create Manager-Employee Mapping table for attendance management
CREATE TABLE IF NOT EXISTS manager_employee_mapping (
    id SERIAL PRIMARY KEY,
    manager_id INTEGER REFERENCES users(id),
    employee_id INTEGER REFERENCES users(id),
    mapping_type VARCHAR(50) DEFAULT 'primary', -- primary, secondary, tertiary
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(manager_id, employee_id, mapping_type)
);

-- Create Attendance table for daily attendance records
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES users(id),
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'wfh', 'leave', 'half_day', 'holiday')),
    clock_in_time TIME,
    clock_out_time TIME,
    total_hours DECIMAL(4,2),
    reason TEXT,
    marked_by INTEGER REFERENCES users(id), -- who marked the attendance (employee or manager)
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

-- Create Attendance Settings table
CREATE TABLE IF NOT EXISTS attendance_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default attendance settings
INSERT INTO attendance_settings (setting_key, setting_value, description) VALUES
('allow_edit_past_days', 'true', 'Allow employees to edit attendance for past days'),
('max_edit_days', '7', 'Maximum number of days in the past that can be edited'),
('require_check_in_time', 'false', 'Require check-in time when marking attendance'),
('require_check_out_time', 'false', 'Require check-out time when marking attendance'),
('default_work_hours', '8', 'Default work hours per day'),
('week_start_day', 'monday', 'First day of the work week'),
('timezone', 'UTC', 'Default timezone for attendance records'),
('auto_approve_attendance', 'true', 'Automatically approve attendance submissions'),
('notification_enabled', 'true', 'Enable attendance notifications'),
('late_threshold_minutes', '15', 'Minutes after which attendance is marked as late')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_manager_employee_mapping_manager ON manager_employee_mapping(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_employee_mapping_employee ON manager_employee_mapping(employee_id);
CREATE INDEX IF NOT EXISTS idx_manager_employee_mapping_active ON manager_employee_mapping(is_active);

-- Insert sample manager-employee mappings (adjust user IDs as needed)
-- Note: These are example mappings - update with actual user IDs from your system
INSERT INTO manager_employee_mapping (manager_id, employee_id, mapping_type) VALUES
(1, 71, 'primary') -- Example: Manager ID 1 manages Employee ID 71
ON CONFLICT (manager_id, employee_id, mapping_type) DO NOTHING;

-- Create a view for easy attendance reporting
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
    u.id as employee_id,
    u.first_name,
    u.last_name,
    u.email,
    a.date,
    a.status,
    a.clock_in_time,
    a.clock_out_time,
    a.reason,
    a.marked_at,
    a.updated_at
FROM attendance a
JOIN users u ON a.employee_id = u.id
ORDER BY a.date DESC, u.first_name, u.last_name;

-- Create a function to get attendance statistics
CREATE OR REPLACE FUNCTION get_attendance_stats(
    p_employee_id INTEGER,
    p_start_date DATE,
    p_end_date DATE
) RETURNS TABLE(
    total_days INTEGER,
    present_days INTEGER,
    wfh_days INTEGER,
    leave_days INTEGER,
    absent_days INTEGER,
    half_day_days INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_days,
        COUNT(CASE WHEN status = 'present' THEN 1 END)::INTEGER as present_days,
        COUNT(CASE WHEN status = 'wfh' THEN 1 END)::INTEGER as wfh_days,
        COUNT(CASE WHEN status = 'leave' THEN 1 END)::INTEGER as leave_days,
        COUNT(CASE WHEN status = 'absent' THEN 1 END)::INTEGER as absent_days,
        COUNT(CASE WHEN status = 'half_day' THEN 1 END)::INTEGER as half_day_days
    FROM attendance 
    WHERE employee_id = p_employee_id 
        AND date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE attendance IS 'Daily attendance records for employees';
COMMENT ON TABLE manager_employee_mapping IS 'Mapping between managers and their team members';
COMMENT ON TABLE attendance_settings IS 'Configuration settings for attendance system';
COMMENT ON FUNCTION get_attendance_stats IS 'Get attendance statistics for an employee within a date range';

-- Migration completed successfully
SELECT 'Migration 001_initial_attendance_setup completed successfully' as status;
