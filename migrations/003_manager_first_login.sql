-- Migration: 003_manager_first_login.sql
-- Description: Add isFirstLogin flag for manager first-time login flow
-- Date: 2025-09-03
-- Author: System

-- Add isFirstLogin column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT true;

-- Update existing managers to have is_first_login = false (they already have passwords)
UPDATE users 
SET is_first_login = false 
WHERE role = 'manager' AND password IS NOT NULL AND password != '';

-- Update existing employees and HR to have is_first_login = false
UPDATE users 
SET is_first_login = false 
WHERE role IN ('employee', 'hr');

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_email_role ON users(email, role);

-- Log the migration
INSERT INTO migration_log (migration_name, executed_at, status, details) 
VALUES (
    '003_manager_first_login', 
    CURRENT_TIMESTAMP, 
    'SUCCESS', 
    'Added is_first_login flag for manager first-time login flow'
);

-- Verify the changes
SELECT 
    role,
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_first_login = true THEN 1 END) as first_login_users,
    COUNT(CASE WHEN is_first_login = false THEN 1 END) as existing_users
FROM users 
GROUP BY role
ORDER BY role;
