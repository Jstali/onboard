const express = require("express");
const { body, validationResult } = require("express-validator");
const { pool } = require("../config/database.js");
const { sendEmail } = require("../utils/mailer.js");
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
    const result = await pool.query(
      `
      SELECT m.manager_name, m.email
      FROM managers m
      JOIN onboarded_employees oe ON oe.manager_name = m.manager_name
      JOIN users u ON u.email = oe.company_email
      WHERE u.id = $1 AND m.status = 'active'
    `,
      [employeeId]
    );
    return result.rows[0] || null;
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
      WHERE role = 'hr' AND status = 'active'
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
      res.json(result.rows[0]);
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
    body("fromDate").isDate().withMessage("From date is required"),
    body("toDate")
      .optional()
      .isDate()
      .withMessage("To date must be a valid date if provided"),
    body("reason").notEmpty().withMessage("Reason is required"),
    body("halfDay").isBoolean().optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { leaveType, fromDate, toDate, reason, halfDay = false } = req.body;
      const employeeId = req.user.userId;

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
        ? calculateLeaveDays(fromDate, toDate, halfDay)
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

      // Get employee's manager
      const manager = await getEmployeeManager(employeeId);

      // Insert leave request
      const insertResult = await pool.query(
        `
      INSERT INTO leave_requests (
        series, employee_id, employee_name, leave_type, leave_balance_before,
        from_date, to_date, half_day, total_leave_days, reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
        [
          series,
          employeeId,
          employeeName,
          leaveType,
          leaveBalanceBefore,
          fromDate,
          toDate,
          halfDay,
          totalLeaveDays,
          reason,
        ]
      );

      const leaveRequest = insertResult.rows[0];

      // Send email notification to manager
      if (manager) {
        const managerEmailContent = `
        <h2>Leave Request Notification</h2>
        <p><strong>Employee:</strong> ${employeeName}</p>
        <p><strong>Leave Type:</strong> ${leaveType}</p>
        <p><strong>From:</strong> ${fromDate}</p>
        ${
          toDate
            ? `<p><strong>To:</strong> ${toDate}</p>`
            : "<p><strong>Type:</strong> Single Day Leave</p>"
        }
        <p><strong>Total Days:</strong> ${totalLeaveDays}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Leave Balance:</strong> ${leaveBalanceBefore} days remaining</p>
        <br>
        <p>Please review and take action:</p>
        <a href="http://localhost:3001/manager/leave-requests" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Request</a>
      `;

        await sendEmail(
          manager.email,
          `Leave Request from ${employeeName} - ${series}`,
          managerEmailContent
        );
      }

      res.status(201).json({
        message: "Leave request submitted successfully",
        leaveRequest,
        series,
      });
    } catch (error) {
      console.error("Error submitting leave request:", error);
      res.status(500).json({ error: "Failed to submit leave request" });
    }
  }
);

// Get employee's leave requests
router.get("/my-requests", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT * FROM leave_requests 
      WHERE employee_id = $1 
      ORDER BY created_at DESC
    `,
      [req.user.userId]
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

    const result = await pool.query(`
      SELECT lr.*, u.email as employee_email
      FROM leave_requests lr
      JOIN users u ON lr.employee_id = u.id
      WHERE lr.status = 'Pending'
      ORDER BY lr.created_at ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching pending leave requests:", error);
    res.status(500).json({ error: "Failed to fetch pending leave requests" });
  }
});

// Manager approval/rejection
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

      // Update leave request
      const status = action === "approve" ? "Manager Approved" : "Rejected";
      const updateResult = await pool.query(
        `
      UPDATE leave_requests 
      SET 
        status = $1,
        manager_id = $2,
        manager_name = $3,
        manager_approved_at = CURRENT_TIMESTAMP,
        manager_approval_notes = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `,
        [status, managerId, managerName, notes, id]
      );

      if (updateResult.rows.length === 0) {
        return res.status(404).json({ error: "Leave request not found" });
      }

      const leaveRequest = updateResult.rows[0];

      // If approved, notify HR
      if (action === "approve") {
        const hrUsers = await getHRUsers();

        for (const hr of hrUsers) {
          const hrEmailContent = `
          <h2>Leave Request Approved by Manager</h2>
          <p><strong>Employee:</strong> ${leaveRequest.employee_name}</p>
          <p><strong>Leave Type:</strong> ${leaveRequest.leave_type}</p>
          <p><strong>From:</strong> ${leaveRequest.from_date}</p>
          ${
            leaveRequest.to_date
              ? `<p><strong>To:</strong> ${leaveRequest.to_date}</p>`
              : "<p><strong>Type:</strong> Single Day Leave</p>"
          }
          <p><strong>Total Days:</strong> ${leaveRequest.total_leave_days}</p>
          <p><strong>Reason:</strong> ${leaveRequest.reason}</p>
          <p><strong>Approved by:</strong> ${managerName}</p>
          <br>
          <p>Please review and take final action:</p>
          <a href="http://localhost:3001/hr/leave-requests" style="background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Request</a>
        `;

          await sendEmail(
            hr.email,
            `Leave Request Approved by Manager - ${leaveRequest.series}`,
            hrEmailContent
          );
        }
      }

      res.json({
        message: `Leave request ${action}d successfully`,
        leaveRequest,
      });
    } catch (error) {
      console.error("Error processing manager approval:", error);
      res.status(500).json({ error: "Failed to process approval" });
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
      WHERE lr.status = 'Manager Approved'
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
      const status = action === "approve" ? "Approved" : "Rejected";
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
        // Update leave balance
        const currentYear = new Date().getFullYear();
        await pool.query(
          `
        UPDATE leave_balances 
        SET 
          leaves_taken = leaves_taken + $1,
          leaves_remaining = leaves_remaining - $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $2 AND year = $3
      `,
          [leaveRequest.total_leave_days, leaveRequest.employee_id, currentYear]
        );

        // Add to attendance table
        const fromDate = new Date(leaveRequest.from_date);
        const toDate = leaveRequest.to_date
          ? new Date(leaveRequest.to_date)
          : fromDate;

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

        // Notify employee
        const employeeResult = await pool.query(
          `
        SELECT email FROM users WHERE id = $1
      `,
          [leaveRequest.employee_id]
        );

        if (employeeResult.rows.length > 0) {
          const employeeEmailContent = `
          <h2>Leave Request Approved! 🎉</h2>
          <p>Your leave request has been approved by HR.</p>
          <p><strong>Details:</strong></p>
          <ul>
            <li><strong>Series:</strong> ${leaveRequest.series}</li>
            <li><strong>Leave Type:</strong> ${leaveRequest.leave_type}</li>
            <li><strong>From:</strong> ${leaveRequest.from_date}</li>
            ${
              leaveRequest.to_date
                ? `<li><strong>To:</strong> ${leaveRequest.to_date}</li>`
                : "<li><strong>Type:</strong> Single Day Leave</li>"
            }
            <li><strong>Total Days:</strong> ${
              leaveRequest.total_leave_days
            }</li>
            <li><strong>Status:</strong> Approved</li>
          </ul>
          <p>Your leave balance has been updated accordingly.</p>
        `;

          await sendEmail(
            employeeResult.rows[0].email,
            `Leave Request Approved - ${leaveRequest.series}`,
            employeeEmailContent
          );
        }
      }

      res.json({
        message: `Leave request ${action}d successfully`,
        leaveRequest,
      });
    } catch (error) {
      console.error("Error processing HR approval:", error);
      res.status(500).json({ error: "Failed to process approval" });
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
      SELECT lr.*, u.email as employee_email
      FROM leave_requests lr
      JOIN users u ON lr.employee_id = u.id
      ORDER BY lr.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching all leave requests:", error);
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
});

module.exports = router;
