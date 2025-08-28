const express = require("express");
const { body, validationResult } = require("express-validator");
const { pool } = require("../config/database");
const {
  authenticateToken,
  requireEmployee,
  requireHR,
} = require("../middleware/auth");

const router = express.Router();

// Helper function to check employee onboarding status
const checkEmployeeOnboardingStatus = async (userId) => {
  const result = await pool.query(
    `
    SELECT 
      CASE 
        WHEN em.id IS NOT NULL THEN 'onboarded'
        WHEN oe.id IS NOT NULL AND oe.status = 'pending_assignment' THEN 'approved_pending'
        WHEN oe.id IS NOT NULL AND oe.status = 'assigned' THEN 'assigned'
        ELSE 'not_onboarded'
      END as status,
      em.id as master_id,
      oe.id as onboarded_id,
      oe.status as onboarded_status
    FROM users u
    LEFT JOIN employee_master em ON em.company_email = u.email
    LEFT JOIN onboarded_employees oe ON oe.user_id = u.id
    WHERE u.id = $1
  `,
    [userId]
  );

  console.log(
    "🔍 Employee onboarding status check for user",
    userId,
    "Result:",
    result.rows[0]
  );
  return result.rows[0] || { status: "not_onboarded" };
};

// Mark attendance (employees only)
router.post(
  "/mark",
  [
    authenticateToken,
    requireEmployee,
    body("date").isDate().withMessage("Date must be in YYYY-MM-DD format"),
    body("status").isIn(["Present", "Work From Home", "Leave"]),
    body("reason").optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ Mark attendance validation errors:", errors.array());
        console.log("📝 Mark attendance request body:", req.body);
        return res.status(400).json({ errors: errors.array() });
      }

      const { date, status, reason } = req.body;

      // Check if employee is onboarded or approved and waiting for assignment
      const employeeStatus = await checkEmployeeOnboardingStatus(
        req.user.userId
      );

      if (
        employeeStatus.status !== "onboarded" &&
        employeeStatus.status !== "approved_pending" &&
        employeeStatus.status !== "assigned"
      ) {
        return res.status(403).json({
          error: "Only approved or onboarded employees can mark attendance",
          details: "Please complete your onboarding process or contact HR",
        });
      }

      // Check if attendance already exists for this date
      const existingAttendance = await pool.query(
        "SELECT id FROM attendance WHERE employee_id = $1 AND date = $2",
        [req.user.userId, date]
      );

      if (existingAttendance.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Attendance already marked for this date" });
      }

      // Mark attendance
      const clockInTime = status === "Present" ? new Date() : null;

      await pool.query(
        `
      INSERT INTO attendance (employee_id, date, status, reason, clock_in_time)
      VALUES ($1, $2, $3, $4, $5)
    `,
        [req.user.userId, date, status, reason, clockInTime]
      );

      res.status(201).json({
        message: "Attendance marked successfully",
        attendance: { date, status, reason, clockInTime },
      });
    } catch (error) {
      console.error("Mark attendance error:", error);
      res.status(500).json({ error: "Failed to mark attendance" });
    }
  }
);

// Clock out (for present employees)
router.put(
  "/clock-out",
  [
    authenticateToken,
    requireEmployee,
    body("date").isDate().withMessage("Date must be in YYYY-MM-DD format"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { date } = req.body;

      // Check if attendance exists and is present
      const attendanceResult = await pool.query(
        "SELECT id, status FROM attendance WHERE employee_id = $1 AND date = $2",
        [req.user.userId, date]
      );

      if (attendanceResult.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Attendance not found for this date" });
      }

      if (attendanceResult.rows[0].status !== "Present") {
        return res
          .status(400)
          .json({ error: "Can only clock out for present status" });
      }

      // Update clock out time
      await pool.query(
        "UPDATE attendance SET clock_out_time = CURRENT_TIMESTAMP WHERE id = $1",
        [attendanceResult.rows[0].id]
      );

      res.json({ message: "Clock out recorded successfully" });
    } catch (error) {
      console.error("Clock out error:", error);
      res.status(500).json({ error: "Failed to record clock out" });
    }
  }
);

// Get employee attendance (for employees)
router.get(
  "/my-attendance",
  [authenticateToken, requireEmployee],
  async (req, res) => {
    try {
      const { month, year } = req.query;

      let query = `
      SELECT date, status, reason, clock_in_time, clock_out_time
      FROM attendance 
      WHERE employee_id = $1
    `;
      let params = [req.user.userId];

      if (month && year) {
        query += ` AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`;
        params.push(parseInt(month), parseInt(year));
      }

      query += ` ORDER BY date DESC`;

      const result = await pool.query(query, params);
      res.json({ attendance: result.rows });
    } catch (error) {
      console.error("Get my attendance error:", error);
      res.status(500).json({ error: "Failed to get attendance" });
    }
  }
);

// Get attendance calendar data (for employees)
router.get(
  "/calendar",
  [authenticateToken, requireEmployee],
  async (req, res) => {
    try {
      const { month, year } = req.query;

      if (!month || !year) {
        return res.status(400).json({ error: "Month and year are required" });
      }

      const result = await pool.query(
        `
      SELECT date, status, reason
      FROM attendance 
      WHERE employee_id = $1 
      AND EXTRACT(MONTH FROM date) = $2 
      AND EXTRACT(YEAR FROM date) = $3
      ORDER BY date
    `,
        [req.user.userId, parseInt(month), parseInt(year)]
      );

      res.json({ calendar: result.rows });
    } catch (error) {
      console.error("Get calendar error:", error);
      res.status(500).json({ error: "Failed to get calendar data" });
    }
  }
);

// HR: Get all employees attendance
router.get("/all", [authenticateToken, requireHR], async (req, res) => {
  try {
    const { month, year, date } = req.query;

    let query = `
      SELECT 
        a.date, a.status, a.reason, a.clock_in_time, a.clock_out_time,
        u.email, em.employee_name, em.employee_id
      FROM attendance a
      JOIN users u ON a.employee_id = u.id
      JOIN employee_master em ON u.email = em.company_email
      WHERE 1=1
    `;
    let params = [];

    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM a.date) = $1 AND EXTRACT(YEAR FROM a.date) = $2`;
      params.push(parseInt(month), parseInt(year));
    }

    if (date) {
      query += ` AND a.date = $${params.length + 1}`;
      params.push(date);
    }

    query += ` ORDER BY a.date DESC, em.employee_name`;

    const result = await pool.query(query, params);
    res.json({ attendance: result.rows });
  } catch (error) {
    console.error("Get all attendance error:", error);
    res.status(500).json({ error: "Failed to get attendance data" });
  }
});

// HR: Get attendance statistics
router.get("/stats", [authenticateToken, requireHR], async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required" });
    }

    // Get attendance counts by status
    const statsResult = await pool.query(
      `
      SELECT 
        a.status,
        COUNT(*) as count
      FROM attendance a
      JOIN users u ON a.employee_id = u.id
      JOIN employee_master em ON u.email = em.company_email
      WHERE EXTRACT(MONTH FROM a.date) = $1 
      AND EXTRACT(YEAR FROM a.date) = $2
      GROUP BY a.status
    `,
      [parseInt(month), parseInt(year)]
    );

    // Get total employees
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total FROM employee_master WHERE status = 'active'
    `);

    const total = parseInt(totalResult.rows[0].total);
    const stats = {
      Present: 0,
      "Work From Home": 0,
      Leave: 0,
    };

    statsResult.rows.forEach((row) => {
      stats[row.status] = parseInt(row.count);
    });

    // Calculate percentages
    const percentages = {
      Present: total > 0 ? Math.round((stats.Present / total) * 100) : 0,
      "Work From Home":
        total > 0 ? Math.round((stats["Work From Home"] / total) * 100) : 0,
      Leave: total > 0 ? Math.round((stats.Leave / total) * 100) : 0,
    };

    res.json({
      stats,
      percentages,
      total,
      month: parseInt(month),
      year: parseInt(year),
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Failed to get attendance statistics" });
  }
});

// HR: Get employee attendance history
router.get(
  "/employee/:id",
  [authenticateToken, requireHR],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { month, year } = req.query;

      let query = `
      SELECT 
        a.date, a.status, a.reason, a.clock_in_time, a.clock_out_time
      FROM attendance a
      JOIN users u ON a.employee_id = u.id
      WHERE u.id = $1
    `;
      let params = [id];

      if (month && year) {
        query += ` AND EXTRACT(MONTH FROM a.date) = $2 AND EXTRACT(YEAR FROM a.date) = $3`;
        params.push(parseInt(month), parseInt(year));
      }

      query += ` ORDER BY a.date DESC`;

      const result = await pool.query(query, params);

      // Get employee info
      const employeeResult = await pool.query(
        `
      SELECT em.employee_name, em.employee_id, u.email
      FROM employee_master em
      JOIN users u ON em.company_email = u.email
      WHERE u.id = $1
    `,
        [id]
      );

      res.json({
        employee: employeeResult.rows[0] || {},
        attendance: result.rows,
      });
    } catch (error) {
      console.error("Get employee attendance error:", error);
      res.status(500).json({ error: "Failed to get employee attendance" });
    }
  }
);

// Submit leave request
router.post(
  "/leave-request",
  [
    authenticateToken,
    requireEmployee,
    body("startDate").isISO8601().toDate(),
    body("endDate").isISO8601().toDate(),
    body("leaveType").isIn([
      "Sick Leave",
      "Casual Leave",
      "Annual Leave",
      "Other",
    ]),
    body("reason").notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { startDate, endDate, leaveType, reason } = req.body;

      // Check if employee is onboarded
      const onboardedResult = await pool.query(
        `
      SELECT em.id FROM employee_master em
      JOIN users u ON em.company_email = u.email
      WHERE u.id = $1
    `,
        [req.user.userId]
      );

      if (onboardedResult.rows.length === 0) {
        return res.status(403).json({
          error: "Only onboarded employees can submit leave requests",
        });
      }

      // Insert leave request
      await pool.query(
        `
      INSERT INTO leave_requests (employee_id, start_date, end_date, leave_type, reason)
      VALUES ($1, $2, $3, $4, $5)
      `,
        [req.user.userId, startDate, endDate, leaveType, reason]
      );

      res.status(201).json({
        message: "Leave request submitted successfully",
        leaveRequest: { startDate, endDate, leaveType, reason },
      });
    } catch (error) {
      console.error("Submit leave request error:", error);
      res.status(500).json({ error: "Failed to submit leave request" });
    }
  }
);

// Get leave requests (for employees)
router.get(
  "/leave-requests",
  [authenticateToken, requireEmployee],
  async (req, res) => {
    try {
      const result = await pool.query(
        `
      SELECT * FROM leave_requests 
      WHERE employee_id = $1 
      ORDER BY created_at DESC
    `,
        [req.user.userId]
      );

      res.json({ leaveRequests: result.rows });
    } catch (error) {
      console.error("Get leave requests error:", error);
      res.status(500).json({ error: "Failed to get leave requests" });
    }
  }
);

// Get detailed attendance records for HR
router.get("/hr/details", [authenticateToken, requireHR], async (req, res) => {
  try {
    const { month, year } = req.query;

    let query = `
      SELECT 
        a.id,
        a.employee_id,
        a.date,
        a.status,
        a.reason,
        a.clock_in_time,
        a.clock_out_time,
        a.created_at,
        u.first_name,
        u.last_name,
        u.email as employee_email,
        CONCAT(u.first_name, ' ', u.last_name) as employee_name
      FROM attendance a
      JOIN users u ON a.employee_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM a.date) = $${params.length + 1}`;
      params.push(month);
      query += ` AND EXTRACT(YEAR FROM a.date) = $${params.length + 1}`;
      params.push(year);
    }

    query += ` ORDER BY a.date DESC, a.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      records: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching HR attendance details:", error);
    res.status(500).json({ error: "Failed to fetch attendance details" });
  }
});

module.exports = router;
