const express = require("express");
const { body, validationResult } = require("express-validator");
const { pool } = require("../config/database");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Field mapping for validation and type casting
const FIELD_MAPPING = {
  "Employee ID": "employee_id",
  NamePrefix: "name_prefix",
  "Employee Full Name": "employee_full_name",
  GivenOrFirstName: "given_or_first_name",
  MiddleName: "middle_name",
  LastName: "last_name",
  "Joining date": "joining_date",
  PayrollStartingMonth: "payroll_starting_month",
  DOB: "dob",
  Aadhar: "aadhar",
  NameAsPerAadhar: "name_as_per_aadhar",
  Designationdescription: "designation_description",
  Email: "email",
  AlternateEmail: "alternate_email",
  PAN: "pan",
  NameAsPerPAN: "name_as_per_pan",
  Gender: "gender",
  Departmentdescription: "department_description",
  "Work Location": "work_location",
  LabourStateDescription: "labour_state_description",
  LWFDesignation: "lwf_designation",
  LWFRelationship: "lwf_relationship",
  LWFID: "lwf_id",
  ProfessionaltaxgroupDescription: "professional_tax_group_description",
  PFComputationalGroup: "pf_computational_group",
  "Mobile Number": "mobile_number",
  PhoneNumber1: "phone_number1",
  PhoneNumber2: "phone_number2",
  Address1: "address1",
  Address2: "address2",
  Address3: "address3",
  City: "city",
  State: "state",
  PinCode: "pincode",
  Country: "country",
  Nationality: "nationality",
  IWNationality: "iw_nationality",
  IWCity: "iw_city",
  IWCountry: "iw_country",
  COCIssuingAuthority: "coc_issuing_authority",
  COCIssueDate: "coc_issue_date",
  COCFromDate: "coc_from_date",
  COCUptoDate: "coc_upto_date",
  BankName: "bank_name",
  NameAsPerBank: "name_as_per_bank",
  Accountno: "account_no",
  BankIFSCCode: "bank_ifsc_code",
  PaymentMode: "payment_mode",
  PFaccountno: "pf_account_no",
  ESIaccountno: "esi_account_no",
  ESIAboveWageLimit: "esi_above_wage_limit",
  UAN: "uan",
  Branchdescription: "branch_description",
  EnrollmentID: "enrollment_id",
  ManagerEmployeeID: "manager_employee_id",
  Taxregime: "tax_regime",
  Fathername: "father_name",
  MotherName: "mother_name",
  SpouseName: "spouse_name",
  MaritalStatus: "marital_status",
  NumberOfChildren: "number_of_children",
  DisabilityStatus: "disability_status",
  TypeOfDisability: "type_of_disability",
  "Employment Type": "employment_type",
  Gradedescription: "grade_description",
  Cadredescription: "cadre_description",
  Paymentdescription: "payment_description",
  Attendancedescription: "attendance_description",
  Workplacedescription: "workplace_description",
  Band: "band",
  Level: "level",
  WorkCostCenter: "work_cost_center",
  "Custom Group 1": "custom_group_1",
  "Custom Group 2": "custom_group_2",
  "Custom Group 3": "custom_group_3",
  "Custom Group 4": "custom_group_4",
  "Custom Group 5": "custom_group_5",
  PassportNumber: "passport_number",
  PassportIssueDate: "passport_issue_date",
  PassportValidUpto: "passport_valid_upto",
  PassportIssuedcountry: "passport_issued_country",
  VisaIssuingAuthority: "visa_issuing_authority",
  VisaFromDate: "visa_from_date",
  VisaUptoDate: "visa_upto_date",
  AlreadyMemberInPF: "already_member_in_pf",
  AlreadyMemberInPension: "already_member_in_pension",
  WithdrawnPFandPension: "withdrawn_pf_and_pension",
  InternationalWorkerStatus: "international_worker_status",
  RelationshipForPF: "relationship_for_pf",
  Qualification: "qualification",
  DrivingLicenceNumber: "driving_licence_number",
  DrivingLicenceValidDate: "driving_licence_valid_date",
  PRANNumber: "pran_number",
  Rehire: "rehire",
  OldEmployeeID: "old_employee_id",
  IsNonPayrollEmployee: "is_non_payroll_employee",
  CategoryName: "category_name",
  CustomMasterName: "custom_master_name",
  CustomMasterName2: "custom_master_name2",
  CustomMasterName3: "custom_master_name3",
  OtEligibility: "ot_eligibility",
  AutoShiftEligibility: "auto_shift_eligibility",
  MobileUser: "mobile_user",
  WebPunch: "web_punch",
  AttendanceExceptionEligibility: "attendance_exception_eligibility",
  AttendanceExceptionType: "attendance_exception_type",
};

// Validation rules for ADP Payroll fields (using frontend field names)
const adpPayrollValidation = [
  body("Employee ID").notEmpty().withMessage("Employee ID is required"),
  body("GivenOrFirstName")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("First name must be 1-100 characters"),
  body("LastName")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Last name must be 1-100 characters"),
  body("Email").optional().isEmail().withMessage("Valid email is required"),
  body("AlternateEmail")
    .optional()
    .isEmail()
    .withMessage("Valid alternate email is required"),
  body("Mobile Number")
    .optional()
    .isMobilePhone("any")
    .withMessage("Valid mobile number is required"),
  body("PAN")
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage("Valid PAN format required"),
  body("Aadhar")
    .optional()
    .matches(/^[0-9]{12}$/)
    .withMessage("Valid Aadhar number required"),
  body("Gender")
    .optional()
    .isIn(["Male", "Female", "Other"])
    .withMessage("Gender must be Male, Female, or Other"),
  body("MaritalStatus")
    .optional()
    .isIn(["Single", "Married", "Divorced", "Widowed"])
    .withMessage("Invalid marital status"),
  body("NumberOfChildren")
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage("Number of children must be 0-20"),
  body("PinCode")
    .optional()
    .matches(/^[0-9]{6}$/)
    .withMessage("Valid 6-digit pincode required"),
  body("BankIFSCCode")
    .optional()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage("Valid IFSC code required"),
  body("Joining date")
    .optional()
    .isISO8601()
    .withMessage("Valid joining date required"),
  body("DOB")
    .optional()
    .isISO8601()
    .withMessage("Valid date of birth required"),
  body("PayrollStartingMonth")
    .optional()
    .isISO8601()
    .withMessage("Valid payroll starting month required"),
  body("ESIAboveWageLimit")
    .optional()
    .isBoolean()
    .withMessage("ESI above wage limit must be boolean"),
  body("DisabilityStatus")
    .optional()
    .isBoolean()
    .withMessage("Disability status must be boolean"),
  body("AlreadyMemberInPF")
    .optional()
    .isBoolean()
    .withMessage("Already member in PF must be boolean"),
  body("AlreadyMemberInPension")
    .optional()
    .isBoolean()
    .withMessage("Already member in pension must be boolean"),
  body("WithdrawnPFandPension")
    .optional()
    .isBoolean()
    .withMessage("Withdrawn PF and pension must be boolean"),
  body("InternationalWorkerStatus")
    .optional()
    .isBoolean()
    .withMessage("International worker status must be boolean"),
  body("Rehire").optional().isBoolean().withMessage("Rehire must be boolean"),
  body("IsNonPayrollEmployee")
    .optional()
    .isBoolean()
    .withMessage("Is non payroll employee must be boolean"),
  body("OtEligibility")
    .optional()
    .isBoolean()
    .withMessage("OT eligibility must be boolean"),
  body("AutoShiftEligibility")
    .optional()
    .isBoolean()
    .withMessage("Auto shift eligibility must be boolean"),
  body("MobileUser")
    .optional()
    .isBoolean()
    .withMessage("Mobile user must be boolean"),
  body("WebPunch")
    .optional()
    .isBoolean()
    .withMessage("Web punch must be boolean"),
  body("AttendanceExceptionEligibility")
    .optional()
    .isBoolean()
    .withMessage("Attendance exception eligibility must be boolean"),
];

// Helper function to map frontend fields to database columns
const mapFieldsToColumns = (data) => {
  const mappedData = {};
  Object.keys(data).forEach((frontendField) => {
    const dbColumn = FIELD_MAPPING[frontendField];
    if (dbColumn) {
      mappedData[dbColumn] = data[frontendField];
    }
  });
  return mappedData;
};

// Helper function to map database columns to frontend fields
const mapColumnsToFields = (data) => {
  const mappedData = {};
  const reverseMapping = Object.fromEntries(
    Object.entries(FIELD_MAPPING).map(([k, v]) => [v, k])
  );

  Object.keys(data).forEach((dbColumn) => {
    const frontendField = reverseMapping[dbColumn];
    if (frontendField) {
      mappedData[frontendField] = data[dbColumn];
    }
  });
  return mappedData;
};

// Get ADP Payroll data for an employee
router.get("/employee/:employeeId", authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;

    const result = await pool.query(
      "SELECT * FROM adp_payroll WHERE employee_id = $1",
      [employeeId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: "No ADP payroll data found for this employee",
      });
    }

    const mappedData = mapColumnsToFields(result.rows[0]);

    res.json({
      success: true,
      data: mappedData,
      isDraft: result.rows[0].is_draft,
    });
  } catch (error) {
    console.error("Error fetching ADP payroll data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch ADP payroll data",
    });
  }
});

// Create or update ADP Payroll data
router.post(
  "/employee/:employeeId",
  authenticateToken,
  adpPayrollValidation,
  async (req, res) => {
    try {
      const { employeeId } = req.params;
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      // Verify employee exists
      const employeeCheck = await pool.query(
        "SELECT employee_id FROM employee_master WHERE employee_id = $1",
        [employeeId]
      );

      if (employeeCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Employee not found",
        });
      }

      // Map frontend fields to database columns
      const mappedData = mapFieldsToColumns(req.body);
      mappedData.employee_id = employeeId;
      mappedData.updated_at = new Date();

      // Check if record exists
      const existingRecord = await pool.query(
        "SELECT id FROM adp_payroll WHERE employee_id = $1",
        [employeeId]
      );

      let result;
      if (existingRecord.rows.length > 0) {
        // Update existing record
        const updateFields = Object.keys(mappedData)
          .filter((key) => key !== "employee_id" && key !== "created_at")
          .map((key, index) => `${key} = $${index + 2}`)
          .join(", ");

        const updateValues = Object.values(mappedData).filter(
          (_, index) =>
            Object.keys(mappedData)[index] !== "employee_id" &&
            Object.keys(mappedData)[index] !== "created_at"
        );

        result = await pool.query(
          `UPDATE adp_payroll SET ${updateFields} WHERE employee_id = $1 RETURNING *`,
          [employeeId, ...updateValues]
        );
      } else {
        // Insert new record
        const insertFields = Object.keys(mappedData).join(", ");
        const insertValues = Object.values(mappedData);
        const placeholders = insertValues
          .map((_, index) => `$${index + 1}`)
          .join(", ");

        result = await pool.query(
          `INSERT INTO adp_payroll (${insertFields}) VALUES (${placeholders}) RETURNING *`,
          insertValues
        );
      }

      const mappedResponse = mapColumnsToFields(result.rows[0]);

      res.json({
        success: true,
        data: mappedResponse,
        message:
          existingRecord.rows.length > 0
            ? "ADP payroll data updated successfully"
            : "ADP payroll data created successfully",
      });
    } catch (error) {
      console.error("Error saving ADP payroll data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to save ADP payroll data",
      });
    }
  }
);

// Save as draft
router.post(
  "/employee/:employeeId/draft",
  authenticateToken,
  async (req, res) => {
    try {
      const { employeeId } = req.params;
      const mappedData = mapFieldsToColumns(req.body);
      mappedData.employee_id = employeeId;
      mappedData.is_draft = true;
      mappedData.updated_at = new Date();

      const existingRecord = await pool.query(
        "SELECT id FROM adp_payroll WHERE employee_id = $1",
        [employeeId]
      );

      let result;
      if (existingRecord.rows.length > 0) {
        const updateFields = Object.keys(mappedData)
          .filter((key) => key !== "employee_id" && key !== "created_at")
          .map((key, index) => `${key} = $${index + 2}`)
          .join(", ");

        const updateValues = Object.values(mappedData).filter(
          (_, index) =>
            Object.keys(mappedData)[index] !== "employee_id" &&
            Object.keys(mappedData)[index] !== "created_at"
        );

        result = await pool.query(
          `UPDATE adp_payroll SET ${updateFields} WHERE employee_id = $1 RETURNING *`,
          [employeeId, ...updateValues]
        );
      } else {
        const insertFields = Object.keys(mappedData).join(", ");
        const insertValues = Object.values(mappedData);
        const placeholders = insertValues
          .map((_, index) => `$${index + 1}`)
          .join(", ");

        result = await pool.query(
          `INSERT INTO adp_payroll (${insertFields}) VALUES (${placeholders}) RETURNING *`,
          insertValues
        );
      }

      res.json({
        success: true,
        message: "Draft saved successfully",
        isDraft: true,
      });
    } catch (error) {
      console.error("Error saving draft:", error);
      res.status(500).json({
        success: false,
        error: "Failed to save draft",
      });
    }
  }
);

// Mark as final (not draft)
router.put(
  "/employee/:employeeId/finalize",
  authenticateToken,
  async (req, res) => {
    try {
      const { employeeId } = req.params;

      const result = await pool.query(
        "UPDATE adp_payroll SET is_draft = false, updated_at = CURRENT_TIMESTAMP WHERE employee_id = $1 RETURNING *",
        [employeeId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "ADP payroll record not found",
        });
      }

      res.json({
        success: true,
        message: "ADP payroll data finalized successfully",
        isDraft: false,
      });
    } catch (error) {
      console.error("Error finalizing ADP payroll data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to finalize ADP payroll data",
      });
    }
  }
);

// Get all ADP Payroll data for HR Dashboard
router.get("/all", authenticateToken, requireRole(["hr"]), async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", isDraft = null } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (ap.employee_full_name ILIKE $${paramCount} OR ap.email ILIKE $${paramCount} OR ap.employee_id ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (isDraft !== null) {
      paramCount++;
      whereClause += ` AND ap.is_draft = $${paramCount}`;
      queryParams.push(isDraft === "true");
    }

    const result = await pool.query(
      `
      SELECT 
        ap.*,
        em.employee_name,
        em.company_email,
        em.department,
        em.designation,
        em.status as employee_status
      FROM adp_payroll ap
      LEFT JOIN employee_master em ON ap.employee_id = em.employee_id
      ${whereClause}
      ORDER BY ap.updated_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `,
      [...queryParams, limit, offset]
    );

    const countResult = await pool.query(
      `
      SELECT COUNT(*) as total
      FROM adp_payroll ap
      LEFT JOIN employee_master em ON ap.employee_id = em.employee_id
      ${whereClause}
    `,
      queryParams
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching all ADP payroll data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch ADP payroll data",
    });
  }
});

// Get merged employee data (onboarding + ADP payroll) for HR Dashboard
router.get(
  "/merged/:employeeId",
  authenticateToken,
  requireRole(["hr"]),
  async (req, res) => {
    try {
      const { employeeId } = req.params;

      const result = await pool.query(
        `
      SELECT 
        em.*,
        ap.*,
        CASE 
          WHEN ap.employee_id IS NOT NULL THEN true 
          ELSE false 
        END as has_adp_data,
        ap.is_draft as adp_is_draft
      FROM employee_master em
      LEFT JOIN adp_payroll ap ON em.employee_id = ap.employee_id
      WHERE em.employee_id = $1
    `,
        [employeeId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Employee not found",
        });
      }

      const employeeData = result.rows[0];
      const mappedAdpData = mapColumnsToFields(employeeData);

      res.json({
        success: true,
        data: {
          onboarding: {
            employee_id: employeeData.employee_id,
            employee_name: employeeData.employee_name,
            company_email: employeeData.company_email,
            department: employeeData.department,
            designation: employeeData.designation,
            type: employeeData.type,
            status: employeeData.status,
            doj: employeeData.doj,
            manager_name: employeeData.manager_name,
          },
          adp_payroll: mappedAdpData,
          has_adp_data: employeeData.has_adp_data,
          adp_is_draft: employeeData.adp_is_draft,
        },
      });
    } catch (error) {
      console.error("Error fetching merged employee data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch merged employee data",
      });
    }
  }
);

// Get field mapping for frontend
router.get("/field-mapping", authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      fieldMapping: FIELD_MAPPING,
    });
  } catch (error) {
    console.error("Error fetching field mapping:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch field mapping",
    });
  }
});

module.exports = router;
