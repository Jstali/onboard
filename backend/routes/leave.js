const express = require("express");
const { body, validationResult } = require("express-validator");
const { pool } = require("../config/database.js");
const {
  sendLeaveRequestToManager,
  sendManagerApprovalToHR,
  sendLeaveApprovalToEmployee,
} = require("../utils/mailer.js");
const { authenticateToken } = require("../middleware/auth.js");

const router = express.Router();

// Helper function to generate unique series ID
const generateSeriesId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `LR-${timestamp}-${random}`.toUpperCase();
};

// Helper function to calculate leave days
const calculateLeaveDays = (fromDate, toDate, halfDay) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return halfDay ? diffDays - 0.5 : diffDays;
};

// Helper function to get employee's manager
const getEmployeeManager = async (employeeId) => {
  try {
    // Get the manager information from employee_master table
    // Use the same email for both user account and company email
    const employeeResult = await pool.query(
      `SELECT em.manager_name, em.manager_id, m.email
       FROM employee_master em
       LEFT JOIN managers m ON em.manager_id = m.manager_id
       WHERE em.company_email = (
         SELECT email FROM users WHERE id = $1
       )`,
      [employeeId]
    );

    if (
      employeeResult.rows.length === 0 ||
      !employeeResult.rows[0].manager_name
    ) {
      console.log("🔍 No manager found for employee", employeeId);
      return null;
    }

    const employee = employeeResult.rows[0];

    // Then get the manager details from managers table and users table
    const managerResult = await pool.query(
      `SELECT m.manager_name, m.email, u.id as user_id
       FROM managers m
       LEFT JOIN users u ON u.email = m.email
       WHERE m.manager_id = $1 AND m.status = 'active'`,
      [employee.manager_id]
    );

    console.log(
      "🔍 Manager lookup for employee",
      employeeId,
      "Manager ID:",
      employee.manager_id,
      "Manager name:",
      employee.manager_name,
      "Result:",
      managerResult.rows
    );

    if (managerResult.rows.length > 0) {
      const manager = managerResult.rows[0];
      return {
        id: manager.user_id,
        manager_name: manager.manager_name,
        email: manager.email,
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting employee manager:", error);
    return null;
  }
};

// Helper function to get HR users
const getHRUsers = async () => {
  try {
    const result = await pool.query(`
      SELECT id, email, first_name, last_name
      FROM users
      WHERE role = 'hr'
    `);
    return result.rows;
  } catch (error) {
    console.error("Error getting HR users:", error);
    return [];
  }
};

// Get leave types
router.get("/types", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM leave_types ORDER BY type_name"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching leave types:", error);
    res.status(500).json({ error: "Failed to fetch leave types" });
  }
});

// Get employee leave balance
router.get("/balance", authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const currentYear = new Date().getFullYear();
    const result = await pool.query(
      `
      SELECT * FROM leave_balances 
      WHERE employee_id = $1 AND year = $2
    `,
      [req.user.userId, currentYear]
    );

    if (result.rows.length === 0) {
      // Initialize balance if not exists
      await pool.query(
        `
        INSERT INTO leave_balances (employee_id, year, total_allocated, leaves_taken, leaves_remaining)
        VALUES ($1, $2, 27, 0, 27)
      `,
        [req.user.userId, currentYear]
      );

      res.json({
        total_allocated: 27,
        leaves_taken: 0,
        leaves_remaining: 27,
        year: currentYear,
      });
    } else {
      // Ensure numeric values are returned as numbers
      const balance = result.rows[0];
      res.json({
        total_allocated: parseInt(balance.total_allocated) || 0,
        leaves_taken: parseInt(balance.leaves_taken) || 0,
        leaves_remaining: parseInt(balance.leaves_remaining) || 0,
        year: balance.year,
      });
    }
  } catch (error) {
    console.error("Error fetching leave balance:", error);
    res.status(500).json({ error: "Failed to fetch leave balance" });
  }
});

// Submit leave request
router.post(
  "/submit",
  authenticateToken,
  [
    body("leaveType").notEmpty().withMessage("Leave type is required"),
    body("fromDate").notEmpty().withMessage("From date is required"),
    body("toDate")
      .optional()
      .notEmpty()
      .withMessage("To date must not be empty if provided"),
    body("reason").notEmpty().withMessage("Reason is required"),
    body("halfDay").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      console.log("🔍 Leave request received:", req.body);
      console.log("🔍 Request body types:", {
        leaveType: typeof req.body.leaveType,
        fromDate: typeof req.body.fromDate,
        toDate: typeof req.body.toDate,
        reason: typeof req.body.reason,
        halfDay: typeof req.body.halfDay,
      });
      console.log("🔍 User:", req.user);

      // Manual validation instead of express-validator
      const errors = [];

      if (!req.body.leaveType || req.body.leaveType.trim() === "") {
        errors.push({ field: "leaveType", message: "Leave type is required" });
      }

      if (!req.body.fromDate || req.body.fromDate.trim() === "") {
        errors.push({ field: "fromDate", message: "From date is required" });
      }

      if (req.body.toDate && req.body.toDate.trim() === "") {
        errors.push({
          field: "toDate",
          message: "To date must not be empty if provided",
        });
      }

      if (!req.body.reason || req.body.reason.trim() === "") {
        errors.push({ field: "reason", message: "Reason is required" });
      }

      if (errors.length > 0) {
        console.log("❌ Manual validation errors:", errors);
        return res.status(400).json({ errors: errors });
      }

      const { leaveType, fromDate, toDate, reason, halfDay = false } = req.body;
      const employeeId = req.user.userId;

      // Validate and convert dates
      let validatedFromDate, validatedToDate;

      try {
        validatedFromDate = new Date(fromDate);
        if (isNaN(validatedFromDate.getTime())) {
          return res.status(400).json({
            error: "Invalid from date format. Please use YYYY-MM-DD format.",
          });
        }

        if (toDate) {
          validatedToDate = new Date(toDate);
          if (isNaN(validatedToDate.getTime())) {
            return res.status(400).json({
              error: "Invalid to date format. Please use YYYY-MM-DD format.",
            });
          }
        }
      } catch (error) {
        return res.status(400).json({
          error: "Invalid date format. Please use YYYY-MM-DD format.",
        });
      }

      // Get employee details
      const employeeResult = await pool.query(
        `
      SELECT u.first_name, u.last_name, u.email
      FROM users u
      WHERE u.id = $1
    `,
        [employeeId]
      );

      if (employeeResult.rows.length === 0) {
        return res.status(404).json({ error: "Employee not found" });
      }

      const employee = employeeResult.rows[0];
      const employeeName = `${employee.first_name} ${employee.last_name}`;

      // Get current leave balance
      const currentYear = new Date().getFullYear();
      const balanceResult = await pool.query(
        `
      SELECT leaves_remaining FROM leave_balances 
      WHERE employee_id = $1 AND year = $2
    `,
        [employeeId, currentYear]
      );

      const leaveBalanceBefore = balanceResult.rows[0]?.leaves_remaining || 27;

      // Calculate total leave days
      const totalLeaveDays = toDate
        ? calculateLeaveDays(
            validatedFromDate.toISOString().split("T")[0],
            validatedToDate.toISOString().split("T")[0],
            halfDay
          )
        : halfDay
        ? 0.5
        : 1;

      // Check if employee has enough leave balance
      if (totalLeaveDays > leaveBalanceBefore) {
        return res.status(400).json({
          error: `Insufficient leave balance. You have ${leaveBalanceBefore} days remaining, but requesting ${totalLeaveDays} days.`,
        });
      }

      // Generate unique series ID
      const series = generateSeriesId();

      // Generate approval token for email links
      const approvalToken = require("crypto").randomBytes(32).toString("hex");

      // Get employee's manager
      const manager = await getEmployeeManager(employeeId);

      // Insert leave request without storing manager info (will fetch from employee_master)
      const insertResult = await pool.query(
        `
      INSERT INTO leave_requests (
        series, employee_id, employee_name, leave_type, leave_balance_before,
        from_date, to_date, half_day, total_leave_days, reason, 
        status, approval_token
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `,
        [
          series,
          employeeId,
          employeeName,
          leaveType,
          leaveBalanceBefore,
          validatedFromDate.toISOString().split("T")[0],
          validatedToDate ? validatedToDate.toISOString().split("T")[0] : null,
          halfDay,
          totalLeaveDays,
          reason,
          "pending_manager_approval", // Start with manager approval
          approvalToken,
        ]
      );

      const leaveRequest = insertResult.rows[0];

      // Send email notification to manager with approval buttons
      console.log("🔍 Manager found:", manager);
      if (manager) {
        const emailData = {
          id: leaveRequest.id,
          employeeName,
          employeeEmail: employee.email, // Add employee email for reply-to functionality
          leaveType,
          fromDate,
          toDate,
          totalDays: totalLeaveDays,
          reason,
          approvalToken,
        };

        console.log("📧 Sending email to manager:", manager.email);
        console.log("📧 Email data:", emailData);

        try {
          const emailResult = await sendLeaveRequestToManager(
            manager.email,
            emailData
          );
          console.log("📧 Email send result:", emailResult);
        } catch (emailError) {
          console.error("❌ Email sending failed:", emailError);
        }
      } else {
        console.log("❌ No manager found for employee:", employeeId);
      }

      res.status(201).json({
        message: "Leave request submitted successfully",
        leaveRequest,
        series,
      });
    } catch (error) {
      console.error("❌ Error submitting leave request:", error);
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail,
      });
      res.status(500).json({
        error: "Failed to submit leave request",
        details: error.message,
      });
    }
  }
);

// Get employee's leave requests with current manager info from employee_master
router.get("/my-requests", authenticateToken, async (req, res) => {
  try {
    console.log("🔍 Fetching leave requests for user ID:", req.user.userId);

    const result = await pool.query(
      `
      SELECT 
        *,
        current_manager_name as manager_name
      FROM leave_requests_with_manager
      WHERE employee_id = $1 
      ORDER BY created_at DESC
    `,
      [req.user.userId]
    );

    console.log(
      "🔍 Leave requests with manager data:",
      result.rows.map((r) => ({
        id: r.id,
        from_date: r.from_date,
        manager_name: r.manager_name,
        current_manager_name: r.current_manager_name,
      }))
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
});

// Get pending leave requests for manager
router.get("/manager/pending", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res
        .status(403)
        .json({ error: "Access denied. Manager role required." });
    }

    // Get manager ID from current user
    const managerResult = await pool.query(
      "SELECT manager_id FROM managers WHERE email = $1 AND status = 'active'",
      [req.user.email]
    );

    if (managerResult.rows.length === 0) {
      return res.status(403).json({ error: "Manager not found or inactive" });
    }

    const managerId = managerResult.rows[0].manager_id;

    const result = await pool.query(
      `
      SELECT 
        lrm.*, 
        u.email as employee_email,
        lrm.current_manager_name as manager_name
      FROM leave_requests_with_manager lrm
      JOIN users u ON lrm.employee_id = u.id
      WHERE lrm.status = 'pending_manager_approval' 
        AND lrm.current_manager_id = $1
      ORDER BY lrm.created_at ASC
    `,
      [managerId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching pending leave requests:", error);
    res.status(500).json({ error: "Failed to fetch pending leave requests" });
  }
});

// Email-based approval endpoint (for managers clicking from email)
router.get("/approve/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { action, token } = req.query;

    if (!action || !token) {
      return res.status(400).json({
        error: "Missing action or token",
        message:
          "Please provide both action (approve/reject) and token parameters",
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        error: "Invalid action",
        message: "Action must be either 'approve' or 'reject'",
      });
    }

    // Verify the approval token
    const tokenResult = await pool.query(
      `SELECT * FROM leave_requests WHERE id = $1 AND approval_token = $2`,
      [id, token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        error: "Invalid or expired token",
        message: "The approval link is invalid or has expired",
      });
    }

    const leaveRequest = tokenResult.rows[0];

    // Check if already processed
    if (leaveRequest.status !== "pending_manager_approval") {
      return res.status(400).json({
        error: "Request already processed",
        message: `This request has already been ${leaveRequest.status.toLowerCase()}`,
      });
    }

    // Update the request status
    const newStatus = action === "approve" ? "manager_approved" : "rejected";
    const updateResult = await pool.query(
      `UPDATE leave_requests 
       SET status = $1, 
           manager_approved_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [newStatus, id]
    );

    const updatedRequest = updateResult.rows[0];

    if (action === "approve") {
      // Send notification to HR
      const hrUsers = await getHRUsers();
      for (const hrUser of hrUsers) {
        await sendManagerApprovalToHR(
          hrUser.email,
          updatedRequest,
          leaveRequest.manager_name || "Manager"
        );
      }

      // Return success page for manager approval
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Leave Request Approved</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
            .info { color: #666; margin-bottom: 30px; }
            .button { background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="success">✅ Leave Request Approved!</div>
          <div class="info">
            <p>You have successfully approved the leave request from <strong>${leaveRequest.employee_name}</strong>.</p>
            <p>The request has been forwarded to HR for final approval.</p>
          </div>
          <a href="http://localhost:3001/manager/leave-requests" class="button">View All Requests</a>
        </body>
        </html>
      `);
    } else {
      // Send rejection notification to employee
      const employeeResult = await pool.query(
        `SELECT email FROM users WHERE id = $1`,
        [leaveRequest.employee_id]
      );

      if (employeeResult.rows.length > 0) {
        await sendLeaveApprovalToEmployee(
          employeeResult.rows[0].email,
          updatedRequest,
          "rejected",
          leaveRequest.manager_name || "Manager"
        );
      }

      // Return success page for manager rejection
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Leave Request Rejected</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .rejected { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
            .info { color: #666; margin-bottom: 30px; }
            .button { background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="rejected">❌ Leave Request Rejected</div>
          <div class="info">
            <p>You have successfully rejected the leave request from <strong>${leaveRequest.employee_name}</strong>.</p>
            <p>The employee has been notified of the rejection.</p>
          </div>
          <a href="http://localhost:3001/manager/leave-requests" class="button">View All Requests</a>
        </body>
        </html>
      `);
    }
  } catch (error) {
    console.error("Email approval error:", error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="error">❌ Error Processing Request</div>
        <p>An error occurred while processing your request. Please try again or contact support.</p>
      </body>
      </html>
    `);
  }
});

// Manager approval/rejection (UI-based)
router.put(
  "/manager/:id/approve",
  authenticateToken,
  [
    body("action")
      .isIn(["approve", "reject"])
      .withMessage("Action must be approve or reject"),
    body("notes").optional(),
  ],
  async (req, res) => {
    try {
      if (req.user.role !== "manager") {
        return res
          .status(403)
          .json({ error: "Access denied. Manager role required." });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { action, notes } = req.body;
      const managerId = req.user.userId;

      // Get manager details
      const managerResult = await pool.query(
        `
      SELECT first_name, last_name FROM users WHERE id = $1
    `,
        [managerId]
      );
      const managerName = `${managerResult.rows[0].first_name} ${managerResult.rows[0].last_name}`;

      // Update leave request (manager info comes from employee_master)
      const status = action === "approve" ? "manager_approved" : "rejected";
      const updateResult = await pool.query(
        `
      UPDATE leave_requests 
      SET 
        status = $1,
        manager_approved_at = CURRENT_TIMESTAMP,
        manager_approval_notes = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `,
        [status, notes, id]
      );

      if (updateResult.rows.length === 0) {
        return res.status(404).json({ error: "Leave request not found" });
      }

      const leaveRequest = updateResult.rows[0];

      // If approved, notify HR
      if (action === "approve") {
        const hrUsers = await getHRUsers();

        for (const hr of hrUsers) {
          try {
            await sendManagerApprovalToHR(
              hr.email,
              {
                id: leaveRequest.id,
                employeeName: leaveRequest.employee_name,
                employeeEmail: leaveRequest.employee_email || "Not available",
                leaveType: leaveRequest.leave_type,
                fromDate: leaveRequest.from_date,
                toDate: leaveRequest.to_date,
                totalDays: leaveRequest.total_leave_days,
                reason: leaveRequest.reason,
              },
              managerName
            );
          } catch (emailError) {
            console.error(
              "❌ Failed to send HR notification email:",
              emailError
            );
            // Continue with other HR users even if one email fails
          }
        }
      }

      res.json({
        message: `Leave request ${action}d successfully`,
        leaveRequest,
      });
    } catch (error) {
      console.error("❌ Error processing manager approval:", error);
      console.error("❌ Error stack:", error.stack);
      console.error("❌ Error message:", error.message);
      if (error.code) {
        console.error("❌ Error code:", error.code);
      }
      if (error.detail) {
        console.error("❌ Error detail:", error.detail);
      }

      // Provide more specific error messages
      let errorMessage = "Failed to process approval";
      if (error.code === "23503") {
        errorMessage = "Invalid leave request reference";
      } else if (error.message.includes("email")) {
        errorMessage = "Failed to send notification email";
      }

      res.status(500).json({
        error: errorMessage,
        details: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
);

// Get HR-approved leave requests
router.get("/hr/pending", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res
        .status(403)
        .json({ error: "Access denied. HR role required." });
    }

    const result = await pool.query(`
      SELECT lr.*, u.email as employee_email
      FROM leave_requests lr
      JOIN users u ON lr.employee_id = u.id
      WHERE lr.status = 'manager_approved'
      ORDER BY lr.manager_approved_at ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching HR pending leave requests:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch HR pending leave requests" });
  }
});

// HR approval/rejection
router.put(
  "/hr/:id/approve",
  authenticateToken,
  [
    body("action")
      .isIn(["approve", "reject"])
      .withMessage("Action must be approve or reject"),
    body("notes").optional(),
  ],
  async (req, res) => {
    try {
      if (req.user.role !== "hr") {
        return res
          .status(403)
          .json({ error: "Access denied. HR role required." });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { action, notes } = req.body;
      const hrId = req.user.userId;

      // Get HR details
      const hrResult = await pool.query(
        `
      SELECT first_name, last_name FROM users WHERE id = $1
    `,
        [hrId]
      );
      const hrName = `${hrResult.rows[0].first_name} ${hrResult.rows[0].last_name}`;

      // Update leave request
      const status = action === "approve" ? "approved" : "rejected";
      const updateResult = await pool.query(
        `
      UPDATE leave_requests 
      SET 
        status = $1,
        hr_id = $2,
        hr_name = $3,
        hr_approved_at = CURRENT_TIMESTAMP,
        hr_approval_notes = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `,
        [status, hrId, hrName, notes, id]
      );

      if (updateResult.rows.length === 0) {
        return res.status(404).json({ error: "Leave request not found" });
      }

      const leaveRequest = updateResult.rows[0];

      // If approved, update leave balance and attendance
      if (action === "approve") {
        try {
          // Update leave balance - convert total_leave_days to integer
          const currentYear = new Date().getFullYear();
          const totalDays = Math.round(
            parseFloat(leaveRequest.total_leave_days) || 1
          );

          console.log("🔍 Updating leave balance:", {
            employeeId: leaveRequest.employee_id,
            year: currentYear,
            totalDays: totalDays,
            originalValue: leaveRequest.total_leave_days,
          });

          await pool.query(
            `
          UPDATE leave_balances 
          SET 
            leaves_taken = leaves_taken + $1,
            leaves_remaining = leaves_remaining - $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE employee_id = $2 AND year = $3
        `,
            [totalDays, leaveRequest.employee_id, currentYear]
          );

          console.log("✅ Leave balance updated successfully");
        } catch (balanceError) {
          console.error("❌ Error updating leave balance:", balanceError);
          // Continue with the approval process even if balance update fails
          // The leave request is still approved
        }

        // Add to attendance table
        const fromDate = new Date(leaveRequest.from_date);
        const toDate = leaveRequest.to_date
          ? new Date(leaveRequest.to_date)
          : fromDate; // Use from_date if to_date is NULL (single day leave)

        // Handle single day vs multi-day leaves
        if (leaveRequest.to_date) {
          // Multi-day leave: loop through dates
          for (
            let d = new Date(fromDate);
            d <= toDate;
            d.setDate(d.getDate() + 1)
          ) {
            // Skip weekends
            if (d.getDay() === 0 || d.getDay() === 6) continue;

            // Check if attendance already exists
            const existingAttendance = await pool.query(
              `
            SELECT id FROM attendance WHERE employee_id = $1 AND date = $2
          `,
              [leaveRequest.employee_id, d.toISOString().split("T")[0]]
            );

            if (existingAttendance.rows.length === 0) {
              await pool.query(
                `
              INSERT INTO attendance (employee_id, date, status, reason)
              VALUES ($1, $2, 'Leave', $3)
            `,
                [
                  leaveRequest.employee_id,
                  d.toISOString().split("T")[0],
                  `Approved leave: ${leaveRequest.reason}`,
                ]
              );
            }
          }
        } else {
          // Single day leave: just add one attendance record
          const existingAttendance = await pool.query(
            `
          SELECT id FROM attendance WHERE employee_id = $1 AND date = $2
        `,
            [leaveRequest.employee_id, fromDate.toISOString().split("T")[0]]
          );

          if (existingAttendance.rows.length === 0) {
            await pool.query(
              `
            INSERT INTO attendance (employee_id, date, status, reason)
            VALUES ($1, $2, 'Leave', $3)
          `,
              [
                leaveRequest.employee_id,
                fromDate.toISOString().split("T")[0],
                `Approved leave: ${leaveRequest.reason}`,
              ]
            );
          }
        }

        // Notify employee using new email system
        const employeeResult = await pool.query(
          `
        SELECT email FROM users WHERE id = $1
      `,
          [leaveRequest.employee_id]
        );

        if (employeeResult.rows.length > 0) {
          await sendLeaveApprovalToEmployee(
            employeeResult.rows[0].email,
            leaveRequest,
            "approved",
            hrName
          );
        }
      } else {
        // If rejected, notify employee
        const employeeResult = await pool.query(
          `
        SELECT email FROM users WHERE id = $1
      `,
          [leaveRequest.employee_id]
        );

        if (employeeResult.rows.length > 0) {
          await sendLeaveApprovalToEmployee(
            employeeResult.rows[0].email,
            leaveRequest,
            "rejected",
            hrName
          );
        }
      }

      res.json({
        message: `Leave request ${action}d successfully`,
        leaveRequest,
      });
    } catch (error) {
      console.error("❌ Error processing HR approval:", error);
      console.error("❌ Error stack:", error.stack);
      console.error("❌ Error message:", error.message);
      if (error.code) {
        console.error("❌ Error code:", error.code);
      }
      if (error.detail) {
        console.error("❌ Error detail:", error.detail);
      }

      // Provide more specific error messages
      let errorMessage = "Failed to process approval";
      if (error.code === "23505") {
        errorMessage =
          "Duplicate attendance record - leave may already be processed";
      } else if (error.code === "23503") {
        errorMessage = "Invalid employee or leave request reference";
      } else if (error.message.includes("date")) {
        errorMessage = "Invalid date format in leave request";
      }

      res.status(500).json({
        error: errorMessage,
        details: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
);

// Get all leave requests (for admin/HR overview)
router.get("/all", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res
        .status(403)
        .json({ error: "Access denied. HR role required." });
    }

    const result = await pool.query(`
      SELECT 
        lrm.*, 
        u.email as employee_email,
        lrm.current_manager_name as manager_name
      FROM leave_requests_with_manager lrm
      JOIN users u ON lrm.employee_id = u.id
      ORDER BY lrm.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching all leave requests:", error);
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
});

// Delete a leave request (HR only)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res
        .status(403)
        .json({ error: "Access denied. HR role required." });
    }

    const { id } = req.params;
    const exists = await pool.query(
      "SELECT id FROM leave_requests WHERE id = $1",
      [id]
    );
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    await pool.query("DELETE FROM leave_requests WHERE id = $1", [id]);
    res.json({ message: "Leave request deleted" });
  } catch (error) {
    console.error("Delete leave request error:", error);
    res.status(500).json({ error: "Failed to delete leave request" });
  }
});

module.exports = router;
