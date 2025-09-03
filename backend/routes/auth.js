const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { pool } = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Login
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").optional()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Check if user exists
      const userResult = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = userResult.rows[0];

      // Check if this is a manager's first login
      if (user.role === "manager" && user.is_first_login === true) {
        // For first-time manager login, no password required
        if (!password) {
          return res.status(200).json({
            message: "First login detected",
            requiresPasswordSetup: true,
            userId: user.id,
            email: user.email,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name,
          });
        } else {
          // If password is provided but it's first login, still redirect to password setup
          return res.status(200).json({
            message: "First login detected",
            requiresPasswordSetup: true,
            userId: user.id,
            email: user.email,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name,
          });
        }
      }

      // For non-first-time logins, password is required
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }

      // Check if user has temp password (legacy first login)
      if (user.temp_password) {
        if (password === user.temp_password) {
          // First login with temp password - require password reset
          return res.status(200).json({
            message: "First login detected",
            requiresPasswordReset: true,
            userId: user.id,
            email: user.email,
            role: user.role,
          });
        } else {
          // If temp password exists but doesn't match, and user has a regular password, check that too
          if (user.password) {
            const isValidPassword = await bcrypt.compare(
              password,
              user.password
            );
            if (!isValidPassword) {
              return res.status(401).json({ error: "Invalid credentials" });
            }
            // If regular password is valid, continue to generate token
          } else {
            return res.status(401).json({ error: "Invalid credentials" });
          }
        }
      } else {
        // Regular password check
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  }
);

// Get current user info
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, role, first_name, last_name FROM users WHERE id = $1",
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user info" });
  }
});

// Set initial password (manager first login)
router.post(
  "/set-initial-password",
  [
    body("userId").isInt(),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("confirmPassword")
      .notEmpty()
      .withMessage("Please confirm your password"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId, newPassword, confirmPassword } = req.body;

      // Check if passwords match
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
      }

      // Get user details
      const userResult = await pool.query(
        "SELECT id, email, role, is_first_login FROM users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = userResult.rows[0];

      // Verify this is a manager's first login
      if (user.role !== "manager" || user.is_first_login !== true) {
        return res.status(403).json({ error: "Invalid request" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password and mark first login as complete
      await pool.query(
        "UPDATE users SET password = $1, is_first_login = false, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [hashedPassword, userId]
      );

      // Generate JWT token for immediate login
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        message: "Password set successfully",
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Set initial password error:", error);
      res.status(500).json({ error: "Failed to set password" });
    }
  }
);

// Reset password (first login)
router.post(
  "/reset-password",
  [body("userId").isInt(), body("newPassword").isLength({ min: 6 })],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId, newPassword } = req.body;

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password and remove temp password
      await pool.query(
        "UPDATE users SET password = $1, temp_password = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [hashedPassword, userId]
      );

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: "Password reset failed" });
    }
  }
);

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      "SELECT id, email, role, created_at FROM users WHERE id = $1",
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: userResult.rows[0] });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Change password
router.post(
  "/change-password",
  [
    authenticateToken,
    body("currentPassword").notEmpty(),
    body("newPassword").isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;

      // Get current user with password
      const userResult = await pool.query(
        "SELECT password FROM users WHERE id = $1",
        [req.user.userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        userResult.rows[0].password
      );
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await pool.query(
        "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [hashedPassword, req.user.userId]
      );

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  }
);

module.exports = router;
