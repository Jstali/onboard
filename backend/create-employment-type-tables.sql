-- Create separate tables for different employment types

-- Interns table
CREATE TABLE IF NOT EXISTS interns (
    id SERIAL PRIMARY KEY,
    intern_id VARCHAR(100) UNIQUE NOT NULL,
    intern_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(100),
    designation VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Full-time employees table
CREATE TABLE IF NOT EXISTS full_time_employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(100) UNIQUE NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(100),
    designation VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contract employees table
CREATE TABLE IF NOT EXISTS contract_employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(100) UNIQUE NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(100),
    designation VARCHAR(100),
    contract_start_date DATE,
    contract_end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interns_intern_id ON interns(intern_id);
CREATE INDEX IF NOT EXISTS idx_interns_email ON interns(email);
CREATE INDEX IF NOT EXISTS idx_full_time_employees_employee_id ON full_time_employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_full_time_employees_email ON full_time_employees(email);
CREATE INDEX IF NOT EXISTS idx_contract_employees_employee_id ON contract_employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_contract_employees_email ON contract_employees(email);

-- Add comments for documentation
COMMENT ON TABLE interns IS 'Table to store intern employees';
COMMENT ON TABLE full_time_employees IS 'Table to store full-time employees';
COMMENT ON TABLE contract_employees IS 'Table to store contract employees';
COMMENT ON TABLE managers IS 'Table to store manager employees';
