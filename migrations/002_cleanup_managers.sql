-- Migration: 002_cleanup_managers.sql
-- Description: Clean up deleted manager users and related data
-- Date: 2025-09-03
-- Author: System

-- Clean up attendance records for deleted managers
DELETE FROM attendance 
WHERE employee_id IN (
    SELECT id FROM users 
    WHERE first_name IN ('John', 'Rakesh', 'Test', 'Vamshi', 'Vinod') 
    AND last_name = 'Manager'
);

-- Clean up manager_employee_mapping for deleted managers
DELETE FROM manager_employee_mapping 
WHERE manager_id IN (
    SELECT id FROM users 
    WHERE first_name IN ('John', 'Rakesh', 'Test', 'Vamshi', 'Vinod') 
    AND last_name = 'Manager'
);

-- Clean up leave_requests for deleted managers
DELETE FROM leave_requests 
WHERE employee_id IN (
    SELECT id FROM users 
    WHERE first_name IN ('John', 'Rakesh', 'Test', 'Vamshi', 'Vinod') 
    AND last_name = 'Manager'
);

-- Clean up leave_balances for deleted managers
DELETE FROM leave_balances 
WHERE employee_id IN (
    SELECT id FROM users 
    WHERE first_name IN ('John', 'Rakesh', 'Test', 'Vamshi', 'Vinod') 
    AND last_name = 'Manager'
);

-- Clean up comp_off_balances for deleted managers
DELETE FROM comp_off_balances 
WHERE employee_id IN (
    SELECT id FROM users 
    WHERE first_name IN ('John', 'Rakesh', 'Test', 'Vamshi', 'Vinod') 
    AND last_name = 'Manager'
);

-- Clean up expenses for deleted managers
DELETE FROM expenses 
WHERE employee_id IN (
    SELECT id FROM users 
    WHERE first_name IN ('John', 'Rakesh', 'Test', 'Vamshi', 'Vinod') 
    AND last_name = 'Manager'
);

-- Clean up employee_documents for deleted managers
DELETE FROM employee_documents 
WHERE employee_id IN (
    SELECT id FROM users 
    WHERE first_name IN ('John', 'Rakesh', 'Test', 'Vamshi', 'Vinod') 
    AND last_name = 'Manager'
);

-- Clean up document_collection for deleted managers
DELETE FROM document_collection 
WHERE employee_id IN (
    SELECT id FROM users 
    WHERE first_name IN ('John', 'Rakesh', 'Test', 'Vamshi', 'Vinod') 
    AND last_name = 'Manager'
);

-- Clean up employee_forms for deleted managers
DELETE FROM employee_forms 
WHERE employee_id IN (
    SELECT id FROM users 
    WHERE first_name IN ('John', 'Rakesh', 'Test', 'Vamshi', 'Vinod') 
    AND last_name = 'Manager'
);

-- Clean up company_emails for deleted managers
DELETE FROM company_emails 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE first_name IN ('John', 'Rakesh', 'Test', 'Vamshi', 'Vinod') 
    AND last_name = 'Manager'
);

-- Clean up managers table for deleted managers
DELETE FROM managers 
WHERE manager_name IN ('John Manager', 'Rakesh Manager', 'Test Manager', 'Vamshi Manager', 'Vinod Manager');

-- Clean up employee_master for deleted managers
DELETE FROM employee_master 
WHERE employee_name IN ('John Manager', 'Rakesh Manager', 'Test Manager', 'Vamshi Manager', 'Vinod Manager');

-- Update any references to deleted managers in employee_master
UPDATE employee_master 
SET manager_id = NULL, manager_name = NULL 
WHERE manager_name IN ('John Manager', 'Rakesh Manager', 'Test Manager', 'Vamshi Manager', 'Vinod Manager');

-- Log the migration
INSERT INTO migration_log (migration_name, executed_at, status, details) 
VALUES (
    '002_cleanup_managers', 
    CURRENT_TIMESTAMP, 
    'SUCCESS', 
    'Cleaned up 6 deleted manager users and all related data'
);

-- Verify cleanup
SELECT 
    'Users' as table_name,
    COUNT(*) as remaining_count
FROM users 
WHERE role = 'manager'
UNION ALL
SELECT 
    'Attendance Records' as table_name,
    COUNT(*) as remaining_count
FROM attendance a
JOIN users u ON a.employee_id = u.id
WHERE u.role = 'manager';
