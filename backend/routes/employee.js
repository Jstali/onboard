const express = require("express");
const { body, validationResult } = require("express-validator");
const { pool } = require("../config/database");
const { authenticateToken, requireEmployee } = require("../middleware/auth");

const router = express.Router();

// Apply authentication to all employee routes
router.use(authenticateToken, requireEmployee);

// Get employee onboarding status
router.get("/onboarding-status", async (req, res) => {
  try {
    console.log("🔍 Checking onboarding status for user ID:", req.user.userId);

    const result = await pool.query(
      `
      SELECT ef.*, em.status as master_status
      FROM employee_forms ef
      LEFT JOIN users u ON ef.employee_id = u.id
      LEFT JOIN employee_master em ON u.email = em.company_email
      WHERE ef.employee_id = $1
    `,
      [req.user.userId]
    );

    console.log("🔍 Query result:", result.rows);

    if (result.rows.length === 0) {
      return res.json({
        hasForm: false,
        message: "No onboarding form found. Please complete the form.",
      });
    }

    const form = result.rows[0];
    console.log("🔍 Form found:", form);

    if (form.status === "submitted" && !form.master_status) {
      // Check if documents are uploaded
      try {
        const docValidationResponse = await pool.query(
          `
          SELECT 
            ed.document_type,
            COUNT(*) as count
          FROM employee_documents ed
          WHERE ed.employee_id = $1
          GROUP BY ed.document_type
        `,
          [req.user.userId]
        );

        const uploadedDocs = docValidationResponse.rows.reduce((acc, doc) => {
          acc[doc.document_type] = doc.count;
          return acc;
        }, {});

        // Check if all required documents are uploaded based on employment type
        const requirements = {
          "Full-Time": [
            "resume",
            "id_proof",
            "address_proof",
            "education_certificate",
            "experience_certificate",
          ],
          Contract: ["resume", "id_proof", "address_proof"],
          Intern: ["resume", "id_proof", "education_certificate"],
        };

        const requiredDocs = requirements[form.type] || [];
        const allDocsUploaded = requiredDocs.every(
          (docType) => uploadedDocs[docType] > 0
        );

        if (allDocsUploaded) {
          return res.json({
            hasForm: true,
            status: "submitted",
            message:
              "Your form and documents are submitted, awaiting HR approval.",
            documentsUploaded: true,
            documentStatus: "All required documents uploaded",
          });
        } else {
          return res.json({
            hasForm: true,
            status: "submitted",
            message:
              "Your form is submitted, but documents are pending. Please upload required documents.",
            documentsUploaded: false,
            documentStatus: "Documents pending upload",
          });
        }
      } catch (docError) {
        console.error("Error checking documents:", docError);
        return res.json({
          hasForm: true,
          status: "submitted",
          message: "Your form is submitted, awaiting HR approval.",
          documentsUploaded: false,
          documentStatus: "Document status unknown",
        });
      }
    }

    if (form.master_status === "active" || form.status === "approved") {
      return res.json({
        hasForm: true,
        status: "approved",
        message:
          "Onboarding completed. You can now access the attendance portal.",
      });
    }

    res.json({
      hasForm: true,
      status: form.status,
      message: `Form status: ${form.status}`,
    });
  } catch (error) {
    console.error("Get onboarding status error:", error);
    res.status(500).json({ error: "Failed to get onboarding status" });
  }
});

// Submit onboarding form
router.post(
  "/onboarding-form",
  [
    body("type").isIn(["Intern", "Contract", "Full-Time", "Manager"]),
    body("formData").isObject(),
    body("files").optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, formData, files = [] } = req.body;

      // Check if form already exists
      const existingForm = await pool.query(
        "SELECT id FROM employee_forms WHERE employee_id = $1",
        [req.user.userId]
      );

      if (existingForm.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Onboarding form already submitted" });
      }

      // Insert form
      await pool.query(
        `
      INSERT INTO employee_forms (employee_id, type, form_data, files, status)
      VALUES ($1, $2, $3, $4, 'submitted')
    `,
        [req.user.userId, type, formData, files]
      );

      res.status(201).json({
        message: "Onboarding form submitted successfully",
        status: "submitted",
        userId: req.user.userId,
      });
    } catch (error) {
      console.error("Submit form error:", error);
      res.status(500).json({ error: "Failed to submit form" });
    }
  }
);

// Get onboarding form
router.get("/onboarding-form", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT * FROM employee_forms WHERE employee_id = $1
    `,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Form not found" });
    }

    res.json({ form: result.rows[0] });
  } catch (error) {
    console.error("Get form error:", error);
    res.status(500).json({ error: "Failed to get form" });
  }
});

// Update onboarding form (only if not submitted)
router.put(
  "/onboarding-form",
  [
    body("type").isIn(["Intern", "Contract", "Full-Time", "Manager"]),
    body("formData").isObject(),
    body("files").optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, formData, files = [] } = req.body;

      // Check if form exists and is not submitted
      const existingForm = await pool.query(
        `
      SELECT id, status FROM employee_forms WHERE employee_id = $1
    `,
        [req.user.userId]
      );

      if (existingForm.rows.length === 0) {
        return res.status(404).json({ error: "Form not found" });
      }

      if (existingForm.rows[0].status === "submitted") {
        return res.status(400).json({ error: "Cannot update submitted form" });
      }

      // Update form
      await pool.query(
        `
      UPDATE employee_forms 
      SET type = $1, form_data = $2, files = $3, updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = $4
    `,
        [type, formData, files, req.user.userId]
      );

      res.json({ message: "Form updated successfully" });
    } catch (error) {
      console.error("Update form error:", error);
      res.status(500).json({ error: "Failed to update form" });
    }
  }
);

// Check if employee is in master table (onboarded)
router.get("/is-onboarded", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT em.* FROM employee_master em
      JOIN users u ON em.company_email = u.email
      WHERE u.id = $1
    `,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.json({ isOnboarded: false });
    }

    res.json({
      isOnboarded: true,
      employee: result.rows[0],
    });
  } catch (error) {
    console.error("Check onboarded error:", error);
    res.status(500).json({ error: "Failed to check onboarding status" });
  }
});

// Get employee profile
router.get("/profile", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT u.id, u.email, u.created_at, ef.type, ef.form_data
      FROM users u
      LEFT JOIN employee_forms ef ON u.id = ef.employee_id
      WHERE u.id = $1
    `,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json({ profile: result.rows[0] });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

module.exports = router;
