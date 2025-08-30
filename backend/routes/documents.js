const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { pool } = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads/documents");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept PDF, DOC, DOCX, JPG, JPEG, PNG files
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Document type configurations based on employment type
const DOCUMENT_REQUIREMENTS = {
  "Full-Time": {
    employment: [
      { type: "resume", name: "Updated Resume", required: true },
      {
        type: "offer_letter",
        name: "Offer & Appointment Letter",
        required: false,
      },
      {
        type: "compensation_letter",
        name: "Latest Compensation Letter",
        required: false,
      },
      {
        type: "experience_letter",
        name: "Experience & Relieving Letter",
        required: false,
      },
      {
        type: "payslip",
        name: "Latest 3 Months Pay Slips",
        required: true,
        multiple: true,
      },
      {
        type: "form16",
        name: "Form 16 / Form 12B / Taxable Income Statement",
        required: false,
      },
    ],
    education: [
      {
        type: "ssc_certificate",
        name: "SSC Certificate (10th)",
        required: true,
      },
      { type: "ssc_marksheet", name: "SSC Marksheet (10th)", required: true },
      {
        type: "hsc_certificate",
        name: "HSC Certificate (12th)",
        required: true,
      },
      { type: "hsc_marksheet", name: "HSC Marksheet (12th)", required: true },
      {
        type: "graduation_marksheet",
        name: "Graduation Consolidated Marksheet",
        required: true,
      },
      {
        type: "graduation_certificate",
        name: "Graduation Original/Provisional Certificate",
        required: true,
      },
      {
        type: "postgrad_marksheet",
        name: "Post-Graduation Marksheet",
        required: false,
      },
      {
        type: "postgrad_certificate",
        name: "Post-Graduation Certificate",
        required: false,
      },
    ],
    identity: [
      { type: "aadhaar", name: "Aadhaar Card", required: true },
      { type: "pan", name: "PAN Card", required: true },
      { type: "passport", name: "Passport", required: true },
    ],
  },
  Contract: {
    employment: [
      { type: "resume", name: "Updated Resume", required: true },
      {
        type: "offer_letter",
        name: "Offer & Appointment Letter",
        required: false,
      },
      {
        type: "compensation_letter",
        name: "Latest Compensation Letter",
        required: false,
      },
      {
        type: "experience_letter",
        name: "Experience & Relieving Letter",
        required: false,
      },
      {
        type: "payslip",
        name: "Latest 3 Months Pay Slips",
        required: true,
        multiple: true,
      },
      {
        type: "form16",
        name: "Form 16 / Form 12B / Taxable Income Statement",
        required: false,
      },
    ],
    education: [
      {
        type: "ssc_certificate",
        name: "SSC Certificate (10th)",
        required: true,
      },
      { type: "ssc_marksheet", name: "SSC Marksheet (10th)", required: true },
      {
        type: "hsc_certificate",
        name: "HSC Certificate (12th)",
        required: true,
      },
      { type: "hsc_marksheet", name: "HSC Marksheet (12th)", required: true },
      {
        type: "graduation_marksheet",
        name: "Graduation Consolidated Marksheet",
        required: true,
      },
      {
        type: "graduation_certificate",
        name: "Graduation Original/Provisional Certificate",
        required: true,
      },
      {
        type: "postgrad_marksheet",
        name: "Post-Graduation Marksheet",
        required: false,
      },
      {
        type: "postgrad_certificate",
        name: "Post-Graduation Certificate",
        required: false,
      },
    ],
    identity: [
      { type: "aadhaar", name: "Aadhaar Card", required: true },
      { type: "pan", name: "PAN Card", required: true },
      { type: "passport", name: "Passport", required: true },
    ],
  },
  Intern: {
    employment: [{ type: "resume", name: "Updated Resume", required: true }],
    education: [
      {
        type: "ssc_certificate",
        name: "SSC Certificate (10th)",
        required: true,
      },
      { type: "ssc_marksheet", name: "SSC Marksheet (10th)", required: true },
      {
        type: "hsc_certificate",
        name: "HSC Certificate (12th)",
        required: true,
      },
      { type: "hsc_marksheet", name: "HSC Marksheet (12th)", required: true },
      {
        type: "graduation_marksheet",
        name: "Graduation Consolidated Marksheet",
        required: true,
      },
      {
        type: "graduation_certificate",
        name: "Graduation Original/Provisional Certificate",
        required: true,
      },
      {
        type: "postgrad_marksheet",
        name: "Post-Graduation Marksheet",
        required: false,
      },
      {
        type: "postgrad_certificate",
        name: "Post-Graduation Certificate",
        required: false,
      },
    ],
    identity: [
      { type: "aadhaar", name: "Aadhaar Card", required: true },
      { type: "pan", name: "PAN Card", required: true },
    ],
  },
};

// Get document requirements based on employment type
router.get("/requirements/:employmentType", (req, res) => {
  const { employmentType } = req.params;
  const requirements = DOCUMENT_REQUIREMENTS[employmentType];

  if (!requirements) {
    return res.status(400).json({ error: "Invalid employment type" });
  }

  res.json(requirements);
});

// Upload documents for an employee
router.post(
  "/upload/:employeeId",
  [authenticateToken, upload.array("documents", 20)],
  async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { documentTypes, documentCategories } = req.body;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      // Parse document types and categories (sent as JSON strings)
      const types = JSON.parse(documentTypes);
      const categories = JSON.parse(documentCategories);

      // Verify user can upload for this employee (own documents or HR)
      if (
        req.user.role !== "hr" &&
        req.user.role !== "admin" &&
        req.user.userId !== parseInt(employeeId)
      ) {
        return res.status(403).json({ error: "Access denied" });
      }

      const uploadedDocuments = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const documentType = types[i];
        const documentCategory = categories[i];

        // Check if document type already exists (for non-multiple types)
        const existingDoc = await pool.query(
          "SELECT id FROM employee_documents WHERE employee_id = $1 AND document_type = $2",
          [employeeId, documentType]
        );

        // If document exists and it's not a multiple type, delete the old one
        const multipleTypes = ["payslip"];
        if (
          existingDoc.rows.length > 0 &&
          !multipleTypes.includes(documentType)
        ) {
          // Delete old file
          const oldDoc = await pool.query(
            "SELECT file_url FROM employee_documents WHERE id = $1",
            [existingDoc.rows[0].id]
          );

          if (oldDoc.rows.length > 0) {
            const oldFilePath = path.join(
              __dirname,
              "..",
              oldDoc.rows[0].file_url
            );
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          }

          // Delete from database
          await pool.query("DELETE FROM employee_documents WHERE id = $1", [
            existingDoc.rows[0].id,
          ]);
        }

        // Insert new document record
        const result = await pool.query(
          `
        INSERT INTO employee_documents (
          employee_id, document_type, document_category, file_name, 
          file_url, file_size, mime_type, is_required
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
          [
            employeeId,
            documentType,
            documentCategory,
            file.originalname,
            `uploads/documents/${file.filename}`,
            file.size,
            file.mimetype,
            false, // Will be updated based on requirements
          ]
        );

        uploadedDocuments.push(result.rows[0]);
      }

      res.status(201).json({
        message: "Documents uploaded successfully",
        documents: uploadedDocuments,
      });
    } catch (error) {
      console.error("Error uploading documents:", error);
      res.status(500).json({ error: "Failed to upload documents" });
    }
  }
);

// Get documents for an employee
router.get("/employee/:employeeId", authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Verify user can view these documents (own documents or HR)
    if (
      req.user.role !== "hr" &&
      req.user.role !== "admin" &&
      req.user.userId !== parseInt(employeeId)
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = await pool.query(
      `
      SELECT * FROM employee_documents 
      WHERE employee_id = $1 
      ORDER BY document_category, document_type, uploaded_at DESC
    `,
      [employeeId]
    );

    // Group documents by category
    const groupedDocuments = result.rows.reduce((acc, doc) => {
      if (!acc[doc.document_category]) {
        acc[doc.document_category] = [];
      }
      acc[doc.document_category].push(doc);
      return acc;
    }, {});

    res.json(groupedDocuments);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// Download a document
router.get("/download/:documentId", authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;

    const result = await pool.query(
      `
      SELECT ed.*, u.email 
      FROM employee_documents ed
      JOIN users u ON ed.employee_id = u.id
      WHERE ed.id = $1
    `,
      [documentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    const document = result.rows[0];

    // Verify user can download this document (own documents or HR)
    if (
      req.user.role !== "hr" &&
      req.user.role !== "admin" &&
      req.user.userId !== document.employee_id
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const filePath = path.join(__dirname, "..", document.file_url);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    res.download(filePath, document.file_name);
  } catch (error) {
    console.error("Error downloading document:", error);
    res.status(500).json({ error: "Failed to download document" });
  }
});

// Delete a document
router.delete("/:documentId", authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;

    const result = await pool.query(
      `
      SELECT * FROM employee_documents WHERE id = $1
    `,
      [documentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    const document = result.rows[0];

    // Verify user can delete this document (own documents or HR)
    if (
      req.user.role !== "hr" &&
      req.user.role !== "admin" &&
      req.user.userId !== document.employee_id
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, "..", document.file_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await pool.query("DELETE FROM employee_documents WHERE id = $1", [
      documentId,
    ]);

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

// Get document validation status for an employee
router.get(
  "/validation/:employeeId/:employmentType",
  authenticateToken,
  async (req, res) => {
    try {
      const { employeeId, employmentType } = req.params;

      // Verify user can view this validation (own documents or HR)
      if (
        req.user.role !== "hr" &&
        req.user.role !== "admin" &&
        req.user.userId !== parseInt(employeeId)
      ) {
        return res.status(403).json({ error: "Access denied" });
      }

      const requirements = DOCUMENT_REQUIREMENTS[employmentType];
      if (!requirements) {
        return res.status(400).json({ error: "Invalid employment type" });
      }

      // Get uploaded documents
      const uploadedDocs = await pool.query(
        `
      SELECT document_type, document_category, COUNT(*) as count
      FROM employee_documents 
      WHERE employee_id = $1 
      GROUP BY document_type, document_category
    `,
        [employeeId]
      );

      const uploadedMap = uploadedDocs.rows.reduce((acc, doc) => {
        acc[doc.document_type] = doc.count;
        return acc;
      }, {});

      // Check validation status
      const validation = {};
      let allRequired = true;

      Object.keys(requirements).forEach((category) => {
        validation[category] = requirements[category].map((req) => {
          const uploaded = uploadedMap[req.type] || 0;
          const isValid = req.required ? uploaded > 0 : true;

          if (req.required && uploaded === 0) {
            allRequired = false;
          }

          return {
            ...req,
            uploaded: uploaded,
            isValid: isValid,
          };
        });
      });

      res.json({
        validation,
        allRequiredUploaded: allRequired,
      });
    } catch (error) {
      console.error("Error validating documents:", error);
      res.status(500).json({ error: "Failed to validate documents" });
    }
  }
);

module.exports = router;
