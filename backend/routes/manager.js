const express = require("express");
const { body, validationResult } = require("express-validator");
const { pool } = require("../config/database");
const { authenticateToken, requireManager } = require("../middleware/auth");

const router = express.Router();

// Apply authentication to all manager routes
router.use(authenticateToken, requireManager);

// Get manager dashboard data
router.get("/dashboard", async (req, res) => {
  try {
    const managerId = req.user.userId;

    // Get team count
    const teamCountResult = await pool.query(
      `
      SELECT COUNT(*) as team_count
      FROM users u
      JOIN manager_employee_mapping mem ON u.id = mem.employee_id
      WHERE mem.manager_id = $1 AND mem.is_active = true AND u.role = 'employee'
    `,
      [managerId]
    );

    // Get today's attendance summary
    const today = new Date().toISOString().split("T")[0];
    const todayAttendanceResult = await pool.query(
      `
      SELECT 
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'wfh' THEN 1 END) as wfh_count,
        COUNT(CASE WHEN a.status = 'leave' THEN 1 END) as leave_count,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
        COUNT(a.id) as total_marked
      FROM attendance a
      JOIN users u ON a.employee_id = u.id
      JOIN manager_employee_mapping mem ON u.id = mem.employee_id
      WHERE mem.manager_id = $1 AND mem.is_active = true AND a.date = $2
    `,
      [managerId, today]
    );

    // Get this week's attendance summary
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const weekAttendanceResult = await pool.query(
      `
      SELECT 
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'wfh' THEN 1 END) as wfh_count,
        COUNT(CASE WHEN a.status = 'leave' THEN 1 END) as leave_count,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
        COUNT(a.id) as total_marked
      FROM attendance a
      JOIN users u ON a.employee_id = u.id
      JOIN manager_employee_mapping mem ON u.id = mem.employee_id
      WHERE mem.manager_id = $1 AND mem.is_active = true 
        AND a.date BETWEEN $2 AND $3
    `,
      [
        managerId,
        startOfWeek.toISOString().split("T")[0],
        endOfWeek.toISOString().split("T")[0],
      ]
    );

    // Get recent attendance activities
    const recentActivitiesResult = await pool.query(
      `
      SELECT 
        a.date, a.status, a.updated_at,
        u.first_name, u.last_name, u.email,
        em.employee_id as emp_id
      FROM attendance a
      JOIN users u ON a.employee_id = u.id
      JOIN manager_employee_mapping mem ON u.id = mem.employee_id
      LEFT JOIN employee_master em ON u.email = em.company_email
      WHERE mem.manager_id = $1 AND mem.is_active = true
      ORDER BY a.updated_at DESC
      LIMIT 10
    `,
      [managerId]
    );

    res.json({
      dashboard: {
        team_count: parseInt(teamCountResult.rows[0].team_count),
        today_attendance: todayAttendanceResult.rows[0],
        week_attendance: weekAttendanceResult.rows[0],
        recent_activities: recentActivitiesResult.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching manager dashboard:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// Get manager's team with detailed information
router.get("/team", async (req, res) => {
  try {
    const managerId = req.user.userId;

    const result = await pool.query(
      `
      SELECT 
        u.id, u.email, u.first_name, u.last_name,
        em.employee_id as emp_id, em.department, em.designation,
        em.type as employment_type, em.status as employee_status,
        em.doj as join_date, em.location,
        mem.mapping_type as manager_type
      FROM users u
      JOIN manager_employee_mapping mem ON u.id = mem.employee_id
      LEFT JOIN employee_master em ON u.email = em.company_email
      WHERE mem.manager_id = $1 AND mem.is_active = true AND u.role = 'employee'
      ORDER BY u.first_name, u.last_name
    `,
      [managerId]
    );

    res.json({ team: result.rows });
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({ error: "Failed to fetch team" });
  }
});

// Get team attendance for a specific date range
router.get("/team-attendance", async (req, res) => {
  try {
    const { start_date, end_date, employee_id } = req.query;
    const managerId = req.user.userId;

    if (!start_date || !end_date) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required" });
    }

    let query = `
      SELECT 
        a.id, a.employee_id, a.date, a.status, a.check_in_time, a.check_out_time, 
        a.total_hours, a.notes, a.marked_at, a.updated_at,
        u.first_name, u.last_name, u.email,
        em.employee_id as emp_id, em.department
      FROM attendance a
      JOIN users u ON a.employee_id = u.id
      JOIN manager_employee_mapping mem ON u.id = mem.employee_id
      LEFT JOIN employee_master em ON u.email = em.company_email
      WHERE mem.manager_id = $1 AND mem.is_active = true 
        AND a.date BETWEEN $2 AND $3
    `;
    let params = [managerId, start_date, end_date];

    if (employee_id) {
      query += ` AND a.employee_id = $${params.length + 1}`;
      params.push(employee_id);
    }

    query += ` ORDER BY a.date DESC, u.first_name, u.last_name`;

    const result = await pool.query(query, params);
    res.json({ attendance: result.rows });
  } catch (error) {
    console.error("Error fetching team attendance:", error);
    res.status(500).json({ error: "Failed to fetch team attendance" });
  }
});

// Get attendance summary for team
router.get("/attendance-summary", async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const managerId = req.user.userId;

    if (!start_date || !end_date) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required" });
    }

    const result = await pool.query(
      `
      SELECT 
        u.id, u.first_name, u.last_name, u.email,
        em.employee_id as emp_id, em.department,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'wfh' THEN 1 END) as wfh_days,
        COUNT(CASE WHEN a.status = 'leave' THEN 1 END) as leave_days,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status = 'half_day' THEN 1 END) as half_days,
        COUNT(a.id) as total_days,
        ROUND(AVG(CASE WHEN a.total_hours IS NOT NULL THEN a.total_hours END), 2) as avg_hours
      FROM users u
      JOIN manager_employee_mapping mem ON u.id = mem.employee_id
      LEFT JOIN employee_master em ON u.email = em.company_email
      LEFT JOIN attendance a ON u.id = a.employee_id AND a.date BETWEEN $2 AND $3
      WHERE mem.manager_id = $1 AND mem.is_active = true AND u.role = 'employee'
      GROUP BY u.id, u.first_name, u.last_name, u.email, em.employee_id, em.department
      ORDER BY u.first_name, u.last_name
    `,
      [managerId, start_date, end_date]
    );

    res.json({ summary: result.rows });
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    res.status(500).json({ error: "Failed to fetch attendance summary" });
  }
});

// Add new employee to manager's team
router.post(
  "/add-team-member",
  [
    body("employee_id").isInt().withMessage("Valid employee ID is required"),
    body("mapping_type")
      .optional()
      .isIn(["primary", "secondary", "tertiary"])
      .withMessage("Valid mapping type is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { employee_id, mapping_type = "primary" } = req.body;
      const managerId = req.user.userId;

      // Check if employee exists and is not already in the team
      const existingMapping = await pool.query(
        `
      SELECT id FROM manager_employee_mapping 
      WHERE manager_id = $1 AND employee_id = $2 AND mapping_type = $3
    `,
        [managerId, employee_id, mapping_type]
      );

      if (existingMapping.rows.length > 0) {
        return res
          .status(400)
          .json({
            error: "Employee is already in your team with this mapping type",
          });
      }

      // Add employee to team
      await pool.query(
        `
      INSERT INTO manager_employee_mapping (manager_id, employee_id, mapping_type)
      VALUES ($1, $2, $3)
    `,
        [managerId, employee_id, mapping_type]
      );

      res.json({ message: "Employee added to team successfully" });
    } catch (error) {
      console.error("Error adding team member:", error);
      res.status(500).json({ error: "Failed to add team member" });
    }
  }
);

// Remove employee from manager's team
router.delete("/remove-team-member/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const managerId = req.user.userId;

    // Check if mapping exists
    const existingMapping = await pool.query(
      `
      SELECT id FROM manager_employee_mapping 
      WHERE manager_id = $1 AND employee_id = $2
    `,
      [managerId, employeeId]
    );

    if (existingMapping.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found in your team" });
    }

    // Remove employee from team (soft delete)
    await pool.query(
      `
      UPDATE manager_employee_mapping 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE manager_id = $1 AND employee_id = $2
    `,
      [managerId, employeeId]
    );

    res.json({ message: "Employee removed from team successfully" });
  } catch (error) {
    console.error("Error removing team member:", error);
    res.status(500).json({ error: "Failed to remove team member" });
  }
});

// Get available employees to add to team
router.get("/available-employees", async (req, res) => {
  try {
    const managerId = req.user.userId;

    const result = await pool.query(
      `
      SELECT 
        u.id, u.email, u.first_name, u.last_name,
        em.employee_id as emp_id, em.department, em.designation
      FROM users u
      LEFT JOIN employee_master em ON u.email = em.company_email
      WHERE u.role = 'employee' 
        AND u.id NOT IN (
          SELECT employee_id 
          FROM manager_employee_mapping 
          WHERE manager_id = $1 AND is_active = true
        )
      ORDER BY u.first_name, u.last_name
    `,
      [managerId]
    );

    res.json({ available_employees: result.rows });
  } catch (error) {
    console.error("Error fetching available employees:", error);
    res.status(500).json({ error: "Failed to fetch available employees" });
  }
});

// Get manager's own profile
router.get("/profile", async (req, res) => {
  try {
    const managerId = req.user.userId;

    const result = await pool.query(
      `
      SELECT 
        u.id, u.email, u.first_name, u.last_name,
        em.employee_id as emp_id, em.department, em.designation,
        em.type as employment_type, em.status as employee_status,
        em.doj as join_date, em.location
      FROM users u
      LEFT JOIN employee_master em ON u.email = em.company_email
      WHERE u.id = $1
    `,
      [managerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Manager profile not found" });
    }

    res.json({ profile: result.rows[0] });
  } catch (error) {
    console.error("Error fetching manager profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

module.exports = router;
