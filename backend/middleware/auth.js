const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const result = await pool.query(
      "SELECT id, email, role FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = {
      userId: result.rows[0].id,
      email: result.rows[0].email,
      role: result.rows[0].role,
    };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.status(500).json({ error: "Authentication failed" });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

const requireHR = requireRole(["hr"]);
const requireEmployee = requireRole(["employee"]);

module.exports = {
  authenticateToken,
  requireRole,
  requireHR,
  requireEmployee,
};
