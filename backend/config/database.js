const { Pool } = require("pg");
require("dotenv").config({ path: "./config.env" });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Connected to PostgreSQL database");
    client.release();

    // Initialize database tables
    await initializeTables();
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
};

// Initialize database tables
const initializeTables = async () => {
  try {
    // Users table - Enhanced with more user details
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'employee',
        temp_password VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        emergency_contact_name VARCHAR(100),
        emergency_contact_phone VARCHAR(20),
        emergency_contact_relationship VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Employee forms table - Enhanced with more form details
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employee_forms (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        form_data JSONB NOT NULL,
        files TEXT[],
        status VARCHAR(50) DEFAULT 'pending',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_by INTEGER REFERENCES users(id),
        reviewed_at TIMESTAMP,
        review_notes TEXT
      )
    `);

    // Onboarded employees table - For intermediate approval stage
    await pool.query(`
      CREATE TABLE IF NOT EXISTS onboarded_employees (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) UNIQUE,
        employee_id VARCHAR(100),
        company_email VARCHAR(255),
        manager_id VARCHAR(100),
        manager_name VARCHAR(100),
        assigned_by INTEGER REFERENCES users(id),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending_assignment',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Employee master table - Enhanced with more employee details
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employee_master (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(100) UNIQUE NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        company_email VARCHAR(255) UNIQUE NOT NULL,
        manager_id VARCHAR(100),
        manager_name VARCHAR(100),
        type VARCHAR(50) NOT NULL,
        role VARCHAR(100),
        doj DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        department VARCHAR(100),
        designation VARCHAR(100),
        salary_band VARCHAR(50),
        location VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Managers table - To store manager information
    await pool.query(`
      CREATE TABLE IF NOT EXISTS managers (
        id SERIAL PRIMARY KEY,
        manager_id VARCHAR(100) UNIQUE NOT NULL,
        manager_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        department VARCHAR(100),
        designation VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Attendance table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES users(id),
        date DATE NOT NULL,
        status VARCHAR(50) NOT NULL,
        reason TEXT,
        clock_in_time TIMESTAMP,
        clock_out_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, date)
      )
    `);

    // Leave requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id SERIAL PRIMARY KEY,
        series VARCHAR(50) UNIQUE NOT NULL,
        employee_id INTEGER NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        leave_type VARCHAR(100) NOT NULL,
        leave_balance_before DECIMAL(5,1) NOT NULL,
        from_date DATE NOT NULL,
        to_date DATE,
        half_day BOOLEAN DEFAULT FALSE,
        total_leave_days DECIMAL(5,1) NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending_manager_approval',
        manager_id INTEGER,
        manager_name VARCHAR(255),
        manager_approved_at TIMESTAMP,
        manager_approval_notes TEXT,
        hr_id INTEGER,
        hr_name VARCHAR(255),
        hr_approved_at TIMESTAMP,
        hr_approval_notes TEXT,
        approval_token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (hr_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create leave_types table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leave_types (
        id SERIAL PRIMARY KEY,
        type_name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR(20) DEFAULT '#3B82F6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create leave_balances table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leave_balances (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL,
        year INTEGER NOT NULL,
        total_allocated INTEGER DEFAULT 27,
        leaves_taken INTEGER DEFAULT 0,
        leaves_remaining INTEGER DEFAULT 27,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, year),
        FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Insert default leave types
    await pool.query(`
      INSERT INTO leave_types (type_name, description, color) VALUES
      ('Privilege Leave', 'Annual leave for personal reasons', '#3B82F6'),
      ('Sick Leave', 'Medical leave for health reasons', '#EF4444'),
      ('Casual Leave', 'Short-term leave for urgent matters', '#10B981'),
      ('Maternity Leave', 'Leave for expecting mothers', '#8B5CF6'),
      ('Paternity Leave', 'Leave for new fathers', '#F59E0B')
      ON CONFLICT (type_name) DO NOTHING
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_employee_forms_employee_id ON employee_forms(employee_id);
      CREATE INDEX IF NOT EXISTS idx_employee_forms_status ON employee_forms(status);
      CREATE INDEX IF NOT EXISTS idx_onboarded_employees_user_id ON onboarded_employees(user_id);
      CREATE INDEX IF NOT EXISTS idx_onboarded_employees_status ON onboarded_employees(status);
      CREATE INDEX IF NOT EXISTS idx_employee_master_employee_id ON employee_master(employee_id);
      CREATE INDEX IF NOT EXISTS idx_employee_master_manager_id ON employee_master(manager_id);
      CREATE INDEX IF NOT EXISTS idx_managers_manager_id ON managers(manager_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
      CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
      CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
      CREATE INDEX IF NOT EXISTS idx_leave_requests_manager_id ON leave_requests(manager_id);
      CREATE INDEX IF NOT EXISTS idx_leave_requests_hr_id ON leave_requests(hr_id);
      CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(from_date, to_date);
      CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_year ON leave_balances(employee_id, year);
    `);

    // Insert default HR user if not exists
    const hrExists = await pool.query("SELECT * FROM users WHERE email = $1", [
      "hr@nxzen.com",
    ]);
    if (hrExists.rows.length === 0) {
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("hr123", 10);
      await pool.query(
        "INSERT INTO users (email, password, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5)",
        ["hr@nxzen.com", hashedPassword, "hr", "HR", "Manager"]
      );
      console.log("✅ Default HR user created: hr@nxzen.com / hr123");
    }

    // Insert default managers if not exists
    const managers = [
      {
        id: "MGR001",
        name: "Pradeep",
        email: "pradeep@company.com",
        department: "Engineering",
      },
      {
        id: "MGR002",
        name: "Vamshi",
        email: "vamshi@company.com",
        department: "Product",
      },
      {
        id: "MGR003",
        name: "Vinod",
        email: "vinod@company.com",
        department: "Design",
      },
      {
        id: "MGR004",
        name: "Rakesh",
        email: "rakesh@company.com",
        department: "Marketing",
      },
    ];

    for (const manager of managers) {
      const managerExists = await pool.query(
        "SELECT * FROM managers WHERE manager_id = $1",
        [manager.id]
      );
      if (managerExists.rows.length === 0) {
        await pool.query(
          "INSERT INTO managers (manager_id, manager_name, email, department, designation) VALUES ($1, $2, $3, $4, $5)",
          [
            manager.id,
            manager.name,
            manager.email,
            manager.department,
            "Manager",
          ]
        );
        console.log(
          `✅ Default manager created: ${manager.name} (${manager.id})`
        );
      }
    }

    console.log("✅ Database tables initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize tables:", error);
    throw error;
  }
};

module.exports = { pool, connectDB };
