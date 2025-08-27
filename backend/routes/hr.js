const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const { pool } = require("../config/database");
const { authenticateToken, requireHR } = require("../middleware/auth");
const { sendOnboardingEmail } = require("../utils/mailer");

const router = express.Router();

// Apply authentication to all HR routes
router.use(authenticateToken, requireHR);

// Generate temporary password
function generateTempPassword() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Add new employee
router.post(
  "/employees",
  [
    body("email").isEmail().normalizeEmail(),
    body("name").notEmpty().trim(),
    body("type").isIn(["Intern", "Contract", "Full-Time"]),
    body("doj").isISO8601().toDate(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, name, type, doj } = req.body;

      // Check if email already exists
      const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Generate temporary password
      const tempPassword = generateTempPassword();

      // Create user
      const userResult = await pool.query(
        "INSERT INTO users (email, password, role, temp_password) VALUES ($1, $2, $3, $4) RETURNING id",
        [email, "", "employee", tempPassword]
      );

      const userId = userResult.rows[0].id;

      // Send onboarding email
      const emailSent = await sendOnboardingEmail(email, tempPassword);

      if (!emailSent) {
        // If email fails, delete the user and return error
        await pool.query("DELETE FROM users WHERE id = $1", [userId]);
        return res
          .status(500)
          .json({ error: "Failed to send onboarding email" });
      }

      res.status(201).json({
        message: "Employee added successfully",
        employee: {
          id: userId,
          email,
          name,
          type,
          doj,
          tempPassword,
        },
      });
    } catch (error) {
      console.error("Add employee error:", error);
      res.status(500).json({ error: "Failed to add employee" });
    }
  }
);

// Get all employees with comprehensive details
router.get("/employees", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, 
        u.email, 
        u.first_name,
        u.last_name,
        u.phone,
        u.address,
        u.emergency_contact_name,
        u.emergency_contact_phone,
        u.emergency_contact_relationship,
        u.created_at, 
        ef.type, 
        ef.status as form_status,
        ef.submitted_at,
        ef.form_data,
        COALESCE(ef.status, 'no_form') as status,
        em.employee_id as assigned_employee_id,
        em.manager_name as assigned_manager,
        em.department,
        em.designation,
        em.salary_band,
        em.location
      FROM users u
      LEFT JOIN employee_forms ef ON u.id = ef.employee_id
      LEFT JOIN employee_master em ON u.email = em.company_email
      WHERE u.role = 'employee'
      ORDER BY u.created_at DESC
    `);

    res.json({ employees: result.rows });
  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({ error: "Failed to get employees" });
  }
});

// Get all employee forms for management with comprehensive details
router.get("/employee-forms", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ef.id,
        ef.employee_id,
        ef.type as employee_type,
        ef.form_data,
        ef.files,
        ef.status,
        ef.submitted_at,
        ef.updated_at,
        ef.reviewed_by,
        ef.reviewed_at,
        ef.review_notes,
        u.email as user_email,
        u.first_name,
        u.last_name,
        u.phone,
        u.address,
        u.emergency_contact_name,
        u.emergency_contact_phone,
        u.emergency_contact_relationship,
        u.created_at as user_created_at,
        em.employee_id as assigned_employee_id,
        em.manager_name as assigned_manager,
        em.department,
        em.designation,
        em.salary_band,
        em.location
      FROM employee_forms ef
      JOIN users u ON ef.employee_id = u.id
      LEFT JOIN employee_master em ON u.email = em.company_email
      ORDER BY ef.submitted_at DESC
    `);

    res.json({ forms: result.rows });
  } catch (error) {
    console.error("Get employee forms error:", error);
    res.status(500).json({ error: "Failed to get employee forms" });
  }
});

// Delete employee form
router.delete("/employee-forms/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if form exists
    const formExists = await pool.query(
      "SELECT id FROM employee_forms WHERE id = $1",
      [id]
    );

    if (formExists.rows.length === 0) {
      return res.status(404).json({ error: "Employee form not found" });
    }

    // Delete the form
    await pool.query("DELETE FROM employee_forms WHERE id = $1", [id]);

    res.json({ message: "Employee form deleted successfully" });
  } catch (error) {
    console.error("Delete employee form error:", error);
    res.status(500).json({ error: "Failed to delete employee form" });
  }
});

// Get employee form details
router.get("/employees/:id/form", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT ef.*, u.email
      FROM employee_forms ef
      JOIN users u ON ef.employee_id = u.id
      WHERE ef.employee_id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee form not found" });
    }

    res.json({ form: result.rows[0] });
  } catch (error) {
    console.error("Get employee form error:", error);
    res.status(500).json({ error: "Failed to get employee form" });
  }
});

// Approve/reject employee form
router.put(
  "/employees/:id/approve",
  [
    body("status").isIn(["approved", "rejected"]),
    body("managerId")
      .optional()
      .custom((value) => {
        if (value !== undefined && value !== null && value !== "") {
          return value;
        }
        return undefined; // Convert empty string to undefined
      }),
    body("employeeId").optional(),
    body("companyEmail").optional(),
  ],
  async (req, res) => {
    try {
      console.log("🔍 Received approval request:", {
        body: req.body,
        params: req.params,
        status: req.body.status,
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { status, managerId, employeeId, companyEmail } = req.body;

      // Manual validation for approved status
      let finalEmployeeId, finalCompanyEmail;

      if (status === "approved") {
        console.log("🔍 Validating approval data:", {
          employeeId,
          companyEmail,
        });

        // Use fallback values if not provided
        finalEmployeeId = employeeId || `EMP${id}`;
        finalCompanyEmail = companyEmail || `employee${id}@company.com`;

        console.log("🔍 Using fallback values:", {
          finalEmployeeId,
          finalCompanyEmail,
        });
      }

      // Update form status
      await pool.query(
        "UPDATE employee_forms SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE employee_id = $2",
        [status, id]
      );

      if (status === "approved") {
        // Get employee details
        console.log("🔍 Querying employee details for ID:", id);

        // First check if user exists
        const userResult = await pool.query(
          "SELECT id, email FROM users WHERE id = $1",
          [id]
        );

        if (userResult.rows.length === 0) {
          console.log("❌ No user found with ID:", id);
          return res.status(404).json({ error: "User not found" });
        }

        const user = userResult.rows[0];
        console.log("🔍 User found:", user);

        // Then check if employee form exists
        const formResult = await pool.query(
          "SELECT type, form_data FROM employee_forms WHERE employee_id = $1",
          [id]
        );

        if (formResult.rows.length === 0) {
          console.log("❌ No employee form found for user ID:", id);
          return res.status(404).json({ error: "Employee form not found" });
        }

        const form = formResult.rows[0];
        console.log("🔍 Form found:", form);

        const formData = form.form_data || {};

        console.log("🔍 Form data:", formData);

        // Validate form_data structure
        if (!formData || typeof formData !== "object") {
          console.error("Invalid form_data structure:", formData);
          return res.status(400).json({ error: "Invalid form data structure" });
        }

        // Check if employee is already onboarded
        const existingOnboarded = await pool.query(
          "SELECT id FROM onboarded_employees WHERE user_id = $1",
          [id]
        );

        if (existingOnboarded.rows.length > 0) {
          console.log("⚠️  Employee already onboarded");
          return res.status(400).json({ error: "Employee already onboarded" });
        }

        // Move employee to onboarded_employees table (pending assignment)
        await pool.query(
          `
        INSERT INTO onboarded_employees (user_id, status, notes)
        VALUES ($1, $2, $3)
      `,
          [
            id,
            "pending_assignment",
            `Approved on ${new Date().toISOString()}. Awaiting HR assignment of employee ID, company email, and manager.`,
          ]
        );

        console.log("✅ Employee moved to onboarded_employees table");

        res.json({
          message:
            "Employee approved and moved to onboarding queue. HR needs to assign employee ID, company email, and manager.",
          nextStep: "assign_details",
        });
      } else {
        res.json({ message: "Employee form rejected" });
      }
    } catch (error) {
      console.error("Approve employee error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        params: { id, status, managerId, employeeId, companyEmail },
      });
      res.status(500).json({ error: "Failed to approve employee" });
    }
  }
);

// Get employee master table
router.get("/master", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM employee_master
      ORDER BY created_at DESC
    `);

    res.json({ employees: result.rows });
  } catch (error) {
    console.error("Get master table error:", error);
    res.status(500).json({ error: "Failed to get master table" });
  }
});

// Get onboarded employees (pending assignment) with comprehensive details
router.get("/onboarded", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        oe.id,
        oe.user_id,
        oe.employee_id,
        oe.company_email,
        oe.manager_id,
        oe.manager_name,
        oe.status,
        oe.notes,
        oe.assigned_by,
        oe.assigned_at,
        oe.created_at,
        oe.updated_at,
        u.email as user_email,
        u.first_name,
        u.last_name,
        u.phone,
        u.address,
        u.emergency_contact_name,
        u.emergency_contact_phone,
        u.emergency_contact_relationship,
        ef.type as employee_type,
        ef.form_data,
        ef.submitted_at,
        ef.reviewed_by,
        ef.reviewed_at,
        ef.review_notes
      FROM onboarded_employees oe
      JOIN users u ON oe.user_id = u.id
      JOIN employee_forms ef ON oe.user_id = ef.employee_id
      ORDER BY oe.created_at DESC
    `);

    res.json({ onboardedEmployees: result.rows });
  } catch (error) {
    console.error("Get onboarded employees error:", error);
    res.status(500).json({ error: "Failed to get onboarded employees" });
  }
});

// Assign details to onboarded employee and move to master table
router.put(
  "/onboarded/:id/assign",
  [
    body("name").notEmpty().withMessage("Employee name is required"),
    body("companyEmail")
      .isEmail()
      .withMessage("Valid company email is required"),
    body("manager").notEmpty().withMessage("Manager is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, companyEmail, manager } = req.body;

      console.log("🔍 Assigning details to onboarded employee:", {
        id,
        name,
        companyEmail,
        manager,
      });

      // Get onboarded employee details
      const onboardedResult = await pool.query(
        `
      SELECT 
        oe.user_id,
        oe.status,
        u.email as user_email,
        ef.type as employee_type,
        ef.form_data
      FROM onboarded_employees oe
      JOIN users u ON oe.user_id = u.id
      JOIN employee_forms ef ON oe.user_id = ef.employee_id
      WHERE oe.id = $1
    `,
        [id]
      );

      if (onboardedResult.rows.length === 0) {
        return res.status(404).json({ error: "Onboarded employee not found" });
      }

      const onboarded = onboardedResult.rows[0];
      const formData = onboarded.form_data || {};

      // Check if company email already exists in master table
      const existingMaster = await pool.query(
        "SELECT id FROM employee_master WHERE company_email = $1",
        [companyEmail]
      );

      if (existingMaster.rows.length > 0) {
        return res.status(400).json({
          error: "Company email already exists in master table",
        });
      }

      // Update onboarded employee with assigned details
      await pool.query(
        `
        UPDATE onboarded_employees 
        SET 
          company_email = $1,
          status = 'assigned',
          notes = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `,
        [companyEmail, `Assigned to manager: ${manager}`, id]
      );

      // Generate unique employee ID
      const timestamp = Date.now();
      const uniqueEmployeeId = `EMP${timestamp}`;

      // Add to employee master table
      await pool.query(
        `
        INSERT INTO employee_master (employee_id, employee_name, company_email, manager_id, type, doj)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          uniqueEmployeeId,
          name,
          companyEmail,
          manager, // Use the selected manager
          onboarded.employee_type,
          formData.doj || new Date(),
        ]
      );

      console.log("✅ Employee moved to master table successfully");

      res.json({
        message:
          "Employee details assigned and moved to master table successfully",
        employee: {
          employeeId: uniqueEmployeeId,
          companyEmail,
          name: name,
          manager: manager,
        },
      });
    } catch (error) {
      console.error("Assign employee details error:", error);
      res.status(500).json({ error: "Failed to assign employee details" });
    }
  }
);

// Debug endpoint to check database state
router.get("/debug/employees", async (req, res) => {
  try {
    console.log("🔍 Debug: Checking database state...");

    // Check users table
    const usersResult = await pool.query(
      "SELECT id, email, role FROM users ORDER BY id"
    );
    console.log("🔍 Users:", usersResult.rows);

    // Check employee_forms table
    const formsResult = await pool.query(
      "SELECT employee_id, status, type, form_data FROM employee_forms ORDER BY employee_id"
    );
    console.log("🔍 Employee Forms:", formsResult.rows);

    // Check employee_master table
    const masterResult = await pool.query(
      "SELECT * FROM employee_master ORDER BY id"
    );
    console.log("🔍 Employee Master:", masterResult.rows);

    res.json({
      users: usersResult.rows,
      forms: formsResult.rows,
      master: masterResult.rows,
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    res.status(500).json({ error: "Debug failed" });
  }
});

// Manually add employee to master table
router.post(
  "/master",
  [
    body("employeeId").notEmpty(),
    body("employeeName").notEmpty(),
    body("companyEmail").isEmail(),
    body("type").isIn(["Intern", "Contract", "Full-Time"]),
    body("doj").isISO8601().toDate(),
    body("managerId").optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { employeeId, employeeName, companyEmail, type, doj, managerId } =
        req.body;

      // Check if employee ID already exists
      const existing = await pool.query(
        "SELECT id FROM employee_master WHERE employee_id = $1",
        [employeeId]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: "Employee ID already exists" });
      }

      // Add to master table
      await pool.query(
        `
      INSERT INTO employee_master (employee_id, employee_name, company_email, manager_id, type, doj)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
        [employeeId, employeeName, companyEmail, managerId, type, doj]
      );

      res
        .status(201)
        .json({ message: "Employee added to master table successfully" });
    } catch (error) {
      console.error("Add to master table error:", error);
      res.status(500).json({ error: "Failed to add employee to master table" });
    }
  }
);

// Get all leave requests (for HR)
router.get("/leave-requests", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        lr.id,
        lr.start_date,
        lr.end_date,
        lr.leave_type,
        lr.reason,
        lr.status,
        lr.created_at,
        u.id as employee_id,
        u.email as employee_email,
        em.employee_name,
        em.employee_id as employee_id_code,
        em.manager_id,
        m.employee_name as manager_name
      FROM leave_requests lr
      JOIN users u ON lr.employee_id = u.id
      JOIN employee_master em ON u.email = em.company_email
      LEFT JOIN employee_master m ON em.manager_id = m.employee_id
      ORDER BY lr.created_at DESC
    `);

    res.json({ leaveRequests: result.rows });
  } catch (error) {
    console.error("Get leave requests error:", error);
    res.status(500).json({ error: "Failed to get leave requests" });
  }
});

// Update leave request status (approve/reject)
router.put(
  "/leave-requests/:id",
  [body("status").isIn(["Approved", "Rejected", "Pending"])],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { status } = req.body;

      // Update leave request status
      const result = await pool.query(
        "UPDATE leave_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
        [status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Leave request not found" });
      }

      res.json({
        message: "Leave request status updated successfully",
        leaveRequest: result.rows[0],
      });
    } catch (error) {
      console.error("Update leave request error:", error);
      res.status(500).json({ error: "Failed to update leave request status" });
    }
  }
);

// Delete employee
router.delete("/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Delete from all related tables
    await pool.query("DELETE FROM attendance WHERE employee_id = $1", [id]);
    await pool.query("DELETE FROM leave_requests WHERE employee_id = $1", [id]);
    await pool.query("DELETE FROM employee_forms WHERE employee_id = $1", [id]);
    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

// Get all managers
router.get("/managers", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        manager_id,
        manager_name,
        email,
        department,
        designation,
        status,
        created_at,
        updated_at
      FROM managers
      WHERE status = 'active'
      ORDER BY manager_name
    `);

    res.json({ managers: result.rows });
  } catch (error) {
    console.error("Get managers error:", error);
    res.status(500).json({ error: "Failed to get managers" });
  }
});

module.exports = router;
