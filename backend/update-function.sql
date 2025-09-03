-- Drop existing function
DROP FUNCTION IF EXISTS manually_add_employee(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR) CASCADE;

-- Create updated function
CREATE OR REPLACE FUNCTION manually_add_employee(
  p_email VARCHAR,
  p_first_name VARCHAR,
  p_last_name VARCHAR,
  p_employment_type VARCHAR,
  p_temp_password VARCHAR
)
RETURNS INTEGER AS $$
DECLARE
  v_user_id INTEGER;
  v_generated_password VARCHAR;
  v_employee_id VARCHAR;
BEGIN
  -- Generate password if not provided
  IF p_temp_password IS NULL OR p_temp_password = '' THEN
    v_generated_password := substr(md5(random()::text), 1, 8);
  ELSE
    v_generated_password := p_temp_password;
  END IF;

  -- Generate employee ID
  v_employee_id := substr(md5(random()::text), 1, 6);

  -- Create user
  INSERT INTO users (email, password, role, temp_password, first_name, last_name)
  VALUES (p_email, '', 'employee', v_generated_password, p_first_name, p_last_name)
  RETURNING id INTO v_user_id;

  -- Create initial employee form record with employment type
  INSERT INTO employee_forms (employee_id, type, status)
  VALUES (v_user_id, p_employment_type, 'pending');

  -- Create employee master record
  INSERT INTO employee_master (
    employee_id,
    employee_name,
    company_email,
    type,
    status,
    doj,
    created_at,
    updated_at
  ) VALUES (
    v_employee_id,
    p_first_name || ' ' || p_last_name,
    p_email,
    p_employment_type,
    'active',
    CURRENT_DATE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;
