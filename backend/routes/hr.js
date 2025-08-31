const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const { pool } = require("../config/database");
const { authenticateToken, requireHR } = require("../middleware/auth");
const { sendOnboardingEmail } = require("../utils/mailer");
const {
  generateEmployeeId,
  validateEmployeeId,
} = require("../utils/employeeIdGenerator");

const router = express.Router();

// Apply authentication to all HR routes
router.use(authenticateToken, requireHR);

// Get available managers for assignment
router.get("/managers", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT employee_name, company_email 
      FROM employee_master 
      WHERE status = 'active' 
      AND employee_name IN ('Pradeep', 'Vinod', 'Vamshi', 'Rakesh')
      ORDER BY employee_name
    `);

    res.json({
      success: true,
      managers: result.rows,
    });
  } catch (error) {
    console.error("Error fetching managers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch managers",
    });
  }
});

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
    body("email").isEmail().withMessage("Valid email is required"),
    body("name").notEmpty().trim().withMessage("Employee name is required"),
    body("type")
      .isIn(["Intern", "Contract", "Full-Time", "Manager"])
      .withMessage("Valid employment type is required"),
    body("doj")
      .isISO8601()
      .toDate()
      .withMessage("Valid date of joining is required"),
  ],
  async (req, res) => {
    try {
      console.log("🔍 Employee creation request received:", req.body);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, name, type, doj } = req.body;
      console.log("✅ Validated data:", { email, name, type, doj });

      // Check if email already exists
      console.log("🔍 Checking if email exists:", email);
      const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        console.log("❌ Email already exists:", email);
        return res.status(400).json({ error: "Email already exists" });
      }
      console.log("✅ Email is unique");

      // Generate temporary password
      const tempPassword = generateTempPassword();
      console.log("🔍 Generated temp password:", tempPassword);

      // Split name into first and last name
      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Create user with the provided email
      console.log("🔍 Creating user in database...");
      const userResult = await pool.query(
        "INSERT INTO users (email, password, role, temp_password, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [email, "", "employee", tempPassword, firstName, lastName]
      );

      const userId = userResult.rows[0].id;
      console.log("✅ User created with ID:", userId);

      // Send onboarding email
      console.log("🔍 Sending onboarding email to:", email);
      const emailSent = await sendOnboardingEmail(email, tempPassword);

      if (!emailSent) {
        console.log("❌ Email sending failed, deleting user");
        // If email fails, delete the user and return error
        await pool.query("DELETE FROM users WHERE id = $1", [userId]);
        return res
          .status(500)
          .json({ error: "Failed to send onboarding email" });
      }
      console.log("✅ Email sent successfully");

      res.status(201).json({
        message: "Employee added successfully",
        employee: {
          id: userId,
          email: email,
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
        em.manager_id,
        em.manager_name as assigned_manager,
        em.manager2_id,
        em.manager2_name,
        em.manager3_id,
        em.manager3_name,
        em.department,
        em.designation,
        em.salary_band,
        em.location,
        COALESCE(ef.type, em.role, 'Not Assigned') as assigned_job_role
      FROM users u
      LEFT JOIN employee_forms ef ON u.id = ef.employee_id
      LEFT JOIN employee_master em ON u.email = em.company_email
      WHERE u.role = 'employee' 
        AND ef.id IS NOT NULL
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

// Approve or reject employee form
router.put("/employee-forms/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!action || !["approve", "reject"].includes(action)) {
      return res
        .status(400)
        .json({ error: "Action must be 'approve' or 'reject'" });
    }

    // Get the employee form details (employee_forms uses employee_id -> users.id)
    const formResult = await pool.query(
      `SELECT ef.id,
              ef.employee_id,           -- FK to users.id
              ef.type as employee_type,
              ef.status as form_status,
              u.email as user_email
       FROM employee_forms ef
       JOIN users u ON ef.employee_id = u.id
       WHERE ef.id = $1`,
      [id]
    );

    if (formResult.rows.length === 0) {
      return res.status(404).json({ error: "Employee form not found" });
    }

    const form = formResult.rows[0];

    if (action === "approve") {
      // Update form status to approved
      await pool.query(
        "UPDATE employee_forms SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [id]
      );

      // Insert minimal required data into onboarded_employees for assignment step
      await pool.query(
        `INSERT INTO onboarded_employees (
           user_id, company_email, status, created_at
         ) VALUES ($1, $2, 'pending_assignment', CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET
           company_email = EXCLUDED.company_email,
           status = 'pending_assignment',
           updated_at = CURRENT_TIMESTAMP`,
        [form.employee_id, form.user_email]
      );

      res.json({
        message:
          "Employee form approved successfully. Employee moved to onboarded list.",
        status: "approved",
      });
    } else if (action === "reject") {
      // Update form status to rejected
      await pool.query(
        "UPDATE employee_forms SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [id]
      );

      res.json({
        message: "Employee form rejected successfully.",
        status: "rejected",
      });
    }
  } catch (error) {
    console.error("Form approval error:", error);
    res.status(500).json({ error: "Failed to process form approval" });
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
      SELECT 
        em.*,
        CASE 
          WHEN m.manager_name IS NOT NULL THEN m.manager_name
          WHEN em.manager_name IS NOT NULL AND em.manager_name != '' THEN em.manager_name
          ELSE 'Not Assigned'
        END as display_manager_name
      FROM employee_master em
      LEFT JOIN managers m ON em.manager_id = m.manager_id
      ORDER BY em.created_at DESC
    `);

    res.json({ employees: result.rows });
  } catch (error) {
    console.error("Get master table error:", error);
    res.status(500).json({ error: "Failed to get master table" });
  }
});

// Delete employee from master table
router.delete("/master/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    // Find master row and user by company email
    const masterRow = await client.query(
      "SELECT id, company_email FROM employee_master WHERE id = $1",
      [id]
    );
    if (masterRow.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found in master" });
    }

    const companyEmail = masterRow.rows[0].company_email;

    const userRow = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [companyEmail]
    );
    const userId = userRow.rows[0]?.id;

    await client.query("BEGIN");

    // Delete dependent data first
    if (userId) {
      await client.query("DELETE FROM attendance WHERE employee_id = $1", [
        userId,
      ]);
      await client.query("DELETE FROM leave_requests WHERE employee_id = $1", [
        userId,
      ]);
      await client.query("DELETE FROM leave_balances WHERE employee_id = $1", [
        userId,
      ]);
      await client.query("DELETE FROM employee_forms WHERE employee_id = $1", [
        userId,
      ]);
      await client.query("DELETE FROM onboarded_employees WHERE user_id = $1", [
        userId,
      ]);
      await client.query("DELETE FROM company_emails WHERE user_id = $1", [
        userId,
      ]);
    }

    // Delete from master
    await client.query("DELETE FROM employee_master WHERE id = $1", [id]);

    // Finally delete user to free up email for re-adding
    if (userId) {
      await client.query("DELETE FROM users WHERE id = $1", [userId]);
    }

    await client.query("COMMIT");
    res.json({ message: "Employee and related data deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Delete master employee error:", error);
    res
      .status(500)
      .json({ error: "Failed to delete employee and related data" });
  } finally {
    client.release();
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

// Delete onboarded employee (cleanup staged record)
router.delete("/onboarded/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure the record exists
    const exists = await pool.query(
      "SELECT id FROM onboarded_employees WHERE id = $1",
      [id]
    );
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: "Onboarded employee not found" });
    }

    // Safe delete: only allow delete if not yet in master table
    // Find the user id to check master linkage (if any)
    const details = await pool.query(
      "SELECT user_id, company_email FROM onboarded_employees WHERE id = $1",
      [id]
    );
    const userId = details.rows[0].user_id;
    const companyEmail = details.rows[0].company_email;

    if (companyEmail) {
      const inMaster = await pool.query(
        "SELECT id FROM employee_master WHERE company_email = $1",
        [companyEmail]
      );
      if (inMaster.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Cannot delete: employee already moved to master" });
      }
    }

    await pool.query("DELETE FROM onboarded_employees WHERE id = $1", [id]);

    res.json({ message: "Onboarded employee deleted" });
  } catch (error) {
    console.error("Delete onboarded employee error:", error);
    res.status(500).json({ error: "Failed to delete onboarded employee" });
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
    body("manager").notEmpty().withMessage("Manager 1 is required"),
    body("manager2").optional(),
    body("manager3").optional(),
  ],
  async (req, res) => {
    try {
      console.log("🔍 Assignment request body:", req.body);
      console.log("🔍 Assignment request params:", req.params);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("🔍 Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, companyEmail, manager, manager2, manager3 } = req.body;

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

      // Get manager details from managers table
      const managerResult = await pool.query(
        "SELECT manager_id, manager_name FROM managers WHERE manager_name ILIKE $1 AND status = 'active'",
        [manager]
      );

      if (managerResult.rows.length === 0) {
        return res.status(400).json({
          error: "Manager not found or inactive",
        });
      }

      const managerInfo = managerResult.rows[0];

      // Generate unique 6-digit employee ID
      const employeeId = await generateEmployeeId();
      console.log("🔢 Generated Employee ID:", employeeId);

      // Update the user's email to the company email (keep same password)
      await pool.query(
        "UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [companyEmail, onboarded.user_id]
      );

      // Update onboarded employee with assigned details
      await pool.query(
        `
        UPDATE onboarded_employees 
        SET 
          company_email = $1,
          manager_id = $2,
          manager_name = $3,
          status = 'assigned',
          notes = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `,
        [
          companyEmail,
          managerInfo.manager_id,
          managerInfo.manager_name,
          `Assigned to manager: ${managerInfo.manager_name}`,
          id,
        ]
      );

      // Get manager information for manager2 and manager3 if provided
      let manager2Info = null;
      let manager3Info = null;

      if (manager2) {
        const manager2Result = await pool.query(
          "SELECT manager_id, manager_name FROM managers WHERE manager_id = $1",
          [manager2]
        );
        if (manager2Result.rows.length > 0) {
          manager2Info = manager2Result.rows[0];
        }
      }

      if (manager3) {
        const manager3Result = await pool.query(
          "SELECT manager_id, manager_name FROM managers WHERE manager_id = $1",
          [manager3]
        );
        if (manager3Result.rows.length > 0) {
          manager3Info = manager3Result.rows[0];
        }
      }

      // Add to employee master table with multiple managers
      await pool.query(
        `
        INSERT INTO employee_master (
          employee_id, employee_name, company_email, 
          manager_id, manager_name, 
          manager2_id, manager2_name, 
          manager3_id, manager3_name, 
          type, doj
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
        [
          employeeId,
          name,
          companyEmail,
          managerInfo.manager_id, // Manager 1 ID
          managerInfo.manager_name, // Manager 1 name
          manager2Info?.manager_id || null, // Manager 2 ID
          manager2Info?.manager_name || null, // Manager 2 name
          manager3Info?.manager_id || null, // Manager 3 ID
          manager3Info?.manager_name || null, // Manager 3 name
          onboarded.employee_type,
          formData.doj || new Date(),
        ]
      );

      console.log("✅ Employee moved to master table successfully");

      res.json({
        message:
          "Employee details assigned and moved to master table successfully",
        employee: {
          employeeId: employeeId,
          companyEmail,
          name: name,
          manager: manager,
        },
      });
    } catch (error) {
      console.error("❌ Assign employee details error:", error);

      // Provide specific error messages for common issues
      let errorMessage = "Failed to assign employee details";
      if (error.code === "23505") {
        if (error.detail && error.detail.includes("company_email")) {
          errorMessage = "Company email already exists in master table";
        } else if (error.detail && error.detail.includes("employee_id")) {
          errorMessage = "Employee ID already exists in master table";
        } else if (error.detail && error.detail.includes("name")) {
          errorMessage = "Employee name and email combination already exists";
        } else {
          errorMessage = "Duplicate entry detected - please check all fields";
        }
      } else if (error.code === "23503") {
        errorMessage = "Invalid manager reference";
      }

      res.status(500).json({
        error: errorMessage,
        details: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
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
    const masterResult = await pool.query(`
      SELECT 
        em.*,
        COALESCE(m.manager_name, em.manager_name, em.manager_id) as display_manager_name
      FROM employee_master em
      LEFT JOIN managers m ON em.manager_id = m.manager_id
      ORDER BY em.id
    `);
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
    body("employeeName").notEmpty(),
    body("companyEmail").isEmail(),
    body("type").isIn(["Intern", "Contract", "Full-Time", "Manager"]),
    body("doj").isISO8601().toDate(),
    body("managerId").optional(),
    body("manager2Id").optional(),
    body("manager3Id").optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        employeeName,
        companyEmail,
        type,
        doj,
        managerId,
        manager2Id,
        manager3Id,
      } = req.body;

      // Generate unique 6-digit employee ID
      const employeeId = await generateEmployeeId();
      console.log("🔢 Generated Employee ID for manual add:", employeeId);

      // Check if employee ID already exists (should not happen with generated ID)
      const existing = await pool.query(
        "SELECT id FROM employee_master WHERE employee_id = $1",
        [employeeId]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: "Employee ID already exists" });
      }

      // Get manager information for manager2 and manager3 if provided
      let manager2Name = null;
      let manager3Name = null;

      if (manager2Id) {
        const manager2Result = await pool.query(
          "SELECT manager_name FROM managers WHERE manager_id = $1",
          [manager2Id]
        );
        if (manager2Result.rows.length > 0) {
          manager2Name = manager2Result.rows[0].manager_name;
        }
      }

      if (manager3Id) {
        const manager3Result = await pool.query(
          "SELECT manager_name FROM managers WHERE manager_id = $1",
          [manager3Id]
        );
        if (manager3Result.rows.length > 0) {
          manager3Name = manager3Result.rows[0].manager_name;
        }
      }

      // Add to master table with multiple managers
      await pool.query(
        `
      INSERT INTO employee_master (
        employee_id, employee_name, company_email, 
        manager_id, manager2_id, manager2_name, 
        manager3_id, manager3_name, 
        type, doj
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
        [
          employeeId,
          employeeName,
          companyEmail,
          managerId,
          manager2Id,
          manager2Name,
          manager3Id,
          manager3Name,
          type,
          doj,
        ]
      );

      // Synchronize with other database tables
      console.log("🔄 Synchronizing new employee with database tables...");

      // 1. Create user account if it doesn't exist
      const userExistsResult = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [companyEmail]
      );

      if (userExistsResult.rows.length === 0) {
        // Create new user account
        const bcrypt = require("bcryptjs");
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        await pool.query(
          `INSERT INTO users (email, password, role, first_name, last_name, temp_password, created_at, updated_at) 
           VALUES ($1, $2, 'employee', $3, 'Employee', $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [companyEmail, hashedPassword, employeeName, tempPassword]
        );
        console.log(
          `✅ Created new user account: ${companyEmail} with temp password: ${tempPassword}`
        );
      } else {
        console.log(`✅ User account already exists: ${companyEmail}`);
      }

      // 2. Add to company_emails table if not exists
      const companyEmailExists = await pool.query(
        "SELECT id FROM company_emails WHERE company_email = $1",
        [companyEmail]
      );

      if (companyEmailExists.rows.length === 0) {
        const userId =
          userExistsResult.rows[0]?.id ||
          (
            await pool.query("SELECT id FROM users WHERE email = $1", [
              companyEmail,
            ])
          ).rows[0].id;
        await pool.query(
          "INSERT INTO company_emails (user_id, company_email, is_primary, is_active) VALUES ($1, $2, $3, $4)",
          [userId, companyEmail, true, true]
        );
        console.log(`✅ Added to company_emails table: ${companyEmail}`);
      } else {
        console.log(`✅ Company email already exists: ${companyEmail}`);
      }

      console.log("✅ Employee Master synchronization completed successfully");

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
    console.log("🔍 Deleting employee with ID:", id);

    // Check if employee exists first
    const employeeCheck = await pool.query(
      "SELECT id, email FROM users WHERE id = $1",
      [id]
    );
    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    console.log("🔍 Employee found:", employeeCheck.rows[0]);

    // Delete from all related tables in the correct order
    try {
      // Delete from attendance table
      const attendanceResult = await pool.query(
        "DELETE FROM attendance WHERE employee_id = $1",
        [id]
      );
      console.log("✅ Attendance records deleted:", attendanceResult.rowCount);

      // Delete from leave_requests table
      const leaveResult = await pool.query(
        "DELETE FROM leave_requests WHERE employee_id = $1",
        [id]
      );
      console.log("✅ Leave requests deleted:", leaveResult.rowCount);

      // Delete from leave_balances table (using user ID directly)
      const balanceResult = await pool.query(
        "DELETE FROM leave_balances WHERE employee_id = $1",
        [id]
      );
      console.log("✅ Leave balances deleted:", balanceResult.rowCount);

      // Delete from employee_forms table
      const formsResult = await pool.query(
        "DELETE FROM employee_forms WHERE employee_id = $1",
        [id]
      );
      console.log("✅ Employee forms deleted:", formsResult.rowCount);

      // Delete from onboarded_employees table
      const onboardedResult = await pool.query(
        "DELETE FROM onboarded_employees WHERE user_id = $1",
        [id]
      );
      console.log("✅ Onboarded records deleted:", onboardedResult.rowCount);

      // Delete from employee_master table (if exists)
      const masterResult = await pool.query(
        "DELETE FROM employee_master WHERE company_email = (SELECT email FROM users WHERE id = $1)",
        [id]
      );
      console.log("✅ Master records deleted:", masterResult.rowCount);

      // Finally delete from users table
      const userResult = await pool.query("DELETE FROM users WHERE id = $1", [
        id,
      ]);
      console.log("✅ User deleted:", userResult.rowCount);
    } catch (deleteError) {
      console.error("❌ Error during deletion process:", deleteError);
      throw deleteError;
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("❌ Delete employee error:", error);
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
    });
    res.status(500).json({
      error: "Failed to delete employee",
      details: error.message,
    });
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

// Manually add employee to master table
router.post(
  "/master-employees",
  [
    body("email").isEmail().normalizeEmail(),
    body("employeeName").notEmpty().trim(),
    body("employeeId").notEmpty().trim(),
    body("companyEmail").isEmail().normalizeEmail(),
    body("managerId").optional().trim(),
    body("managerName").optional().trim(),
    body("department").optional().trim(),
    body("location").optional().trim(),
    body("role").notEmpty().trim(),
    body("doj").isISO8601().toDate(),
  ],
  async (req, res) => {
    try {
      console.log("🔍 Received request body:", req.body);
      console.log(
        "🔍 Date of joining:",
        req.body.doj,
        "Type:",
        typeof req.body.doj
      );

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        email,
        employeeName,
        employeeId,
        companyEmail,
        managerId,
        managerName,
        department,
        location,
        role,
        doj,
      } = req.body;

      // Check if email already exists in users table
      const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Email already exists in users table" });
      }

      // Check if company email already exists in employee_master
      const existingCompanyEmail = await pool.query(
        "SELECT id FROM employee_master WHERE company_email = $1",
        [companyEmail]
      );

      if (existingCompanyEmail.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Company email already exists in employee master" });
      }

      // Check if employee ID already exists
      const existingEmployeeId = await pool.query(
        "SELECT id FROM employee_master WHERE employee_id = $1",
        [employeeId]
      );

      if (existingEmployeeId.rows.length > 0) {
        return res.status(400).json({ error: "Employee ID already exists" });
      }

      // Generate temporary password
      const tempPassword = generateTempPassword();

      // Create user account
      const userResult = await pool.query(
        `INSERT INTO users (
        email, 
        password, 
        role, 
        temp_password,
        first_name,
        last_name,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id`,
        [
          email,
          "",
          "employee",
          tempPassword,
          employeeName.split(" ")[0],
          employeeName.split(" ").slice(1).join(" ") || "",
        ]
      );

      const userId = userResult.rows[0].id;

      // Add to employee_master table
      await pool.query(
        `INSERT INTO employee_master (
        employee_id,
        employee_name,
        company_email,
        manager_id,
        manager_name,
        type,
        role,
        doj,
        status,
        department,
        location,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          employeeId,
          employeeName,
          companyEmail,
          managerId,
          managerName,
          "Full-Time", // Default type
          role,
          doj,
          "active", // Default status
          department,
          location || null,
        ]
      );

      // Initialize leave balance for the new employee
      const currentYear = new Date().getFullYear();

      // Insert leave balance using the user ID (since leave_balances.employee_id references users.id)
      await pool.query(
        `INSERT INTO leave_balances (
        employee_id, 
        year, 
        total_allocated, 
        leaves_taken, 
        leaves_remaining
      ) VALUES ($1, $2, 27, 0, 27)`,
        [userId, currentYear]
      );

      // Send onboarding email with temporary password
      const emailSent = await sendOnboardingEmail(email, tempPassword);

      if (!emailSent) {
        console.warn(
          "Failed to send onboarding email, but employee was created"
        );
      }

      res.status(201).json({
        message: "Employee added to master table successfully",
        employee: {
          id: userId,
          email,
          employeeName,
          employeeId,
          companyEmail,
          managerName,
          department,
          tempPassword,
        },
      });
    } catch (error) {
      console.error("Add master employee error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        code: error.code,
      });
      res.status(500).json({
        error: "Failed to add employee to master table",
        details: error.message,
      });
    }
  }
);

// Update employee information
router.put(
  "/employees/:id",
  [
    body("first_name").optional().trim(),
    body("last_name").optional().trim(),
    body("email").optional().isEmail().normalizeEmail(),
    body("job_role").optional().trim(), // Job role (Product Developer, SAP, etc.)
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { first_name, last_name, email, job_role } = req.body;

      // Start a transaction
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Update users table
        const userUpdates = [];
        const userValues = [];
        let userParamCounter = 1;

        if (first_name !== undefined) {
          userUpdates.push(`first_name = $${userParamCounter}`);
          userValues.push(first_name);
          userParamCounter++;
        }
        if (last_name !== undefined) {
          userUpdates.push(`last_name = $${userParamCounter}`);
          userValues.push(last_name);
          userParamCounter++;
        }
        if (email !== undefined) {
          userUpdates.push(`email = $${userParamCounter}`);
          userValues.push(email);
          userParamCounter++;
        }

        if (userUpdates.length > 0) {
          userUpdates.push(`updated_at = CURRENT_TIMESTAMP`);
          const userQuery = `
            UPDATE users 
            SET ${userUpdates.join(", ")}
            WHERE id = $${userParamCounter}
            RETURNING id, first_name, last_name, email, role, created_at, updated_at
          `;
          userValues.push(id);

          const userResult = await client.query(userQuery, userValues);
          if (userResult.rows.length === 0) {
            throw new Error("Employee not found");
          }
        }

        // Update employee_master table if job_role is provided
        if (job_role !== undefined) {
          const masterQuery = `
            UPDATE employee_master 
            SET role = $1, updated_at = CURRENT_TIMESTAMP
            WHERE company_email = (SELECT email FROM users WHERE id = $2)
            RETURNING id
          `;

          const masterResult = await client.query(masterQuery, [job_role, id]);
          console.log(
            `Updated employee_master role for user ${id}: ${masterResult.rowCount} rows affected`
          );
        }

        await client.query("COMMIT");

        // Get updated employee data
        const finalResult = await client.query(
          `
          SELECT 
            u.id, 
            u.first_name, 
            u.last_name, 
            u.email, 
            u.role, 
            u.created_at, 
            u.updated_at,
            em.role as job_role
          FROM users u
          LEFT JOIN employee_master em ON u.email = em.company_email
          WHERE u.id = $1
        `,
          [id]
        );

        res.json({
          message: "Employee updated successfully",
          employee: finalResult.rows[0],
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Update employee error:", error);
      res.status(500).json({ error: "Failed to update employee" });
    }
  }
);

// Get single employee details
router.get("/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        u.id, 
        u.email, 
        u.first_name,
        u.last_name,
        u.role,
        u.created_at,
        u.updated_at,
        oe.employee_id as form_employee_id,
        oe.manager_name as form_manager_name,
        oe.status as form_status,
        oe.assigned_at as form_submitted_at,
        em.employee_id as master_employee_id,
        em.company_email,
        em.department,
        em.designation,
        em.manager_name,
        em.salary_band,
        em.type as employment_type,
        em.doj,
        em.status as master_status
      FROM users u
      LEFT JOIN onboarded_employees oe ON u.id = oe.user_id
      LEFT JOIN employee_master em ON u.email = em.company_email
      WHERE u.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({
      employee: result.rows[0],
    });
  } catch (error) {
    console.error("Get employee error:", error);
    res.status(500).json({ error: "Failed to fetch employee" });
  }
});

// Update employee form
router.put(
  "/employee-forms/:id",
  [
    body("form_data").isObject(),
    body("employee_type").isIn(["Intern", "Contract", "Full-Time", "Manager"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { form_data, employee_type, manager1, manager2, manager3 } =
        req.body;

      // Check if form exists
      const existingForm = await pool.query(
        "SELECT * FROM employee_forms WHERE id = $1",
        [id]
      );

      if (existingForm.rows.length === 0) {
        return res.status(404).json({ error: "Employee form not found" });
      }

      // Update form with manager assignments
      await pool.query(
        `
        UPDATE employee_forms 
        SET form_data = $1, type = $2, assigned_manager = $3, manager2_name = $4, manager3_name = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
      `,
        [form_data, employee_type, manager1, manager2, manager3, id]
      );

      res.json({
        message: "Employee form updated successfully",
      });
    } catch (error) {
      console.error("Update employee form error:", error);
      res.status(500).json({ error: "Failed to update employee form" });
    }
  }
);

// Update employee in master table
router.put("/master/:id", async (req, res) => {
  try {
    console.log("🔍 Update employee master request:", req.params, req.body);
    const { id } = req.params;
    const {
      employee_name,
      company_email,
      type,
      doj,
      status,
      department,
      designation,
      salary_band,
      location,
      manager_id,
      manager2_id,
      manager3_id,
    } = req.body;

    // Validate required fields
    if (!employee_name || !company_email || !type || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if employee exists
    const existingEmployee = await pool.query(
      "SELECT id FROM employee_master WHERE id = $1",
      [id]
    );

    if (existingEmployee.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Get manager names
    let manager_name = null;
    let manager2_name = null;
    let manager3_name = null;

    if (manager_id) {
      const managerResult = await pool.query(
        "SELECT manager_name FROM managers WHERE manager_id = $1",
        [manager_id]
      );
      manager_name = managerResult.rows[0]?.manager_name;
    }

    if (manager2_id) {
      const manager2Result = await pool.query(
        "SELECT manager_name FROM managers WHERE manager_id = $1",
        [manager2_id]
      );
      manager2_name = manager2Result.rows[0]?.manager_name;
    }

    if (manager3_id) {
      const manager3Result = await pool.query(
        "SELECT manager_name FROM managers WHERE manager_id = $1",
        [manager3_id]
      );
      manager3_name = manager3Result.rows[0]?.manager_name;
    }

    // Get the old employee data to check what changed
    const oldEmployeeResult = await pool.query(
      "SELECT * FROM employee_master WHERE id = $1",
      [id]
    );
    const oldEmployee = oldEmployeeResult.rows[0];
    const oldCompanyEmail = oldEmployee?.company_email;

    // Update employee in master table
    const result = await pool.query(
      `UPDATE employee_master 
       SET employee_name = $1, company_email = $2, type = $3, doj = $4, 
           status = $5, department = $6, designation = $7, salary_band = $8, 
           location = $9, manager_id = $10, manager_name = $11, 
           manager2_id = $12, manager2_name = $13, 
           manager3_id = $14, manager3_name = $15, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $16
       RETURNING *`,
      [
        employee_name,
        company_email,
        type,
        doj,
        status,
        department || null,
        designation || null,
        salary_band || null,
        location || null,
        manager_id || null,
        manager_name,
        manager2_id || null,
        manager2_name,
        manager3_id || null,
        manager3_name,
        id,
      ]
    );

    // Synchronize changes with users table and other related tables
    console.log("🔄 Synchronizing Employee Master changes with database...");

    // 1. Handle company email changes
    if (oldCompanyEmail && oldCompanyEmail !== company_email) {
      console.log(
        `🔄 Company email changed from ${oldCompanyEmail} to ${company_email}`
      );

      // Check if user exists with old email
      const userExistsResult = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [oldCompanyEmail]
      );

      if (userExistsResult.rows.length > 0) {
        // Update existing user's email
        await pool.query(
          "UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2",
          [company_email, oldCompanyEmail]
        );
        console.log(
          `✅ Updated existing user: ${oldCompanyEmail} → ${company_email}`
        );
      } else {
        // Check if user already exists with new email
        const newUserExistsResult = await pool.query(
          "SELECT id FROM users WHERE email = $1",
          [company_email]
        );

        if (newUserExistsResult.rows.length === 0) {
          // Create new user account with the new email
          const bcrypt = require("bcryptjs");
          const tempPassword = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(tempPassword, 10);

          await pool.query(
            `INSERT INTO users (email, password, role, first_name, last_name, temp_password, created_at, updated_at) 
             VALUES ($1, $2, 'employee', $3, 'Employee', $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [company_email, hashedPassword, employee_name, tempPassword]
          );
          console.log(
            `✅ Created new user account: ${company_email} with temp password: ${tempPassword}`
          );
        }
      }
    }

    // 2. Update company_emails table if company email changed
    if (oldCompanyEmail && oldCompanyEmail !== company_email) {
      // Update company_emails table
      await pool.query(
        "UPDATE company_emails SET company_email = $1, updated_at = CURRENT_TIMESTAMP WHERE company_email = $2",
        [company_email, oldCompanyEmail]
      );
      console.log(
        `✅ Updated company_emails table: ${oldCompanyEmail} → ${company_email}`
      );
    }

    // 3. Update employee_forms table if employee name or email changed
    if (
      oldEmployee.employee_name !== employee_name ||
      oldCompanyEmail !== company_email
    ) {
      await pool.query(
        `UPDATE employee_forms 
         SET form_data = jsonb_set(
           jsonb_set(form_data, '{name}', $1::jsonb),
           '{email}', $2::jsonb
         ), updated_at = CURRENT_TIMESTAMP
         WHERE employee_id IN (
           SELECT id FROM users WHERE email = $3
         )`,
        [
          JSON.stringify(employee_name),
          JSON.stringify(company_email),
          company_email,
        ]
      );
      console.log(
        `✅ Updated employee_forms table for employee: ${employee_name}`
      );
    }

    // 4. Update onboarded_employees table if employee name changed
    if (oldEmployee.employee_name !== employee_name) {
      await pool.query(
        `UPDATE onboarded_employees 
         SET updated_at = CURRENT_TIMESTAMP
         WHERE user_id IN (
           SELECT id FROM users WHERE email = $1
         )`,
        [company_email]
      );
      console.log(
        `✅ Updated onboarded_employees table for employee: ${employee_name}`
      );
    }

    // 5. Update leave_requests table if employee name changed
    if (oldEmployee.employee_name !== employee_name) {
      await pool.query(
        `UPDATE leave_requests 
         SET employee_name = $1, updated_at = CURRENT_TIMESTAMP
         WHERE employee_id IN (
           SELECT id FROM users WHERE email = $2
         )`,
        [employee_name, company_email]
      );
      console.log(
        `✅ Updated leave_requests table for employee: ${employee_name}`
      );
    }

    console.log("✅ Employee Master synchronization completed successfully");

    res.json({
      message: "Employee updated successfully",
      employee: result.rows[0],
    });
  } catch (error) {
    console.error("Update employee master error:", error);
    res.status(500).json({ error: "Failed to update employee" });
  }
});

module.exports = router;
