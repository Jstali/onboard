require("dotenv").config({ path: "./config.env" });
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function testDocumentValidation() {
  try {
    console.log("🔍 Testing Document Validation with Manual Entries...");

    // Test with a specific employee (you can change this)
    const employeeId = 26; // Pradeep
    const employmentType = "Intern";

    console.log(
      `\n📊 Testing for Employee ID: ${employeeId}, Type: ${employmentType}`
    );

    // 1. Check uploaded documents
    const uploadedDocs = await pool.query(
      `SELECT document_type, document_category, COUNT(*) as count
       FROM employee_documents 
       WHERE employee_id = $1 
       GROUP BY document_type, document_category`,
      [employeeId]
    );

    console.log("\n📋 Uploaded Documents:");
    uploadedDocs.rows.forEach((doc) => {
      console.log(`   ${doc.document_type}: ${doc.count} files`);
    });

    // 2. Check manually entered documents
    const manualDocs = await pool.query(
      `SELECT document_name, status, uploaded_file_url
       FROM document_collection 
       WHERE employee_id = $1`,
      [employeeId]
    );

    console.log("\n📋 Manually Entered Documents:");
    manualDocs.rows.forEach((doc) => {
      console.log(`   ${doc.document_name}: ${doc.status}`);
    });

    // 3. Test the validation logic
    const requirements = {
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
        { type: "payslip", name: "Latest 3 Months Pay Slips", required: true },
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
          type: "graduation_certificate",
          name: "Graduation Certificate",
          required: true,
        },
        {
          type: "graduation_marksheet",
          name: "Graduation Marksheet",
          required: true,
        },
      ],
      identity: [
        { type: "aadhaar_card", name: "Aadhaar Card", required: true },
        { type: "pan_card", name: "PAN Card", required: true },
        {
          type: "passport_size_photos",
          name: "Passport Size Photographs",
          required: true,
        },
        { type: "address_proof", name: "Address Proof", required: true },
      ],
      additional: [
        {
          type: "professional_certifications",
          name: "Professional Certifications",
          required: false,
        },
        {
          type: "educational_certificates",
          name: "Educational Certificates",
          required: false,
        },
      ],
    };

    const uploadedMap = uploadedDocs.rows.reduce((acc, doc) => {
      acc[doc.document_type] = doc.count;
      return acc;
    }, {});

    const manualMap = {};
    manualDocs.rows.forEach((doc) => {
      const docName = doc.document_name.toLowerCase();
      let docType = null;

      if (docName.includes("resume")) docType = "resume";
      else if (docName.includes("offer") || docName.includes("appointment"))
        docType = "offer_letter";
      else if (docName.includes("compensation"))
        docType = "compensation_letter";
      else if (docName.includes("experience") || docName.includes("relieving"))
        docType = "experience_letter";
      else if (docName.includes("payslip") || docName.includes("pay slip"))
        docType = "payslip";
      else if (docName.includes("form 16") || docName.includes("form 12b"))
        docType = "form16";
      else if (docName.includes("ssc") && docName.includes("certificate"))
        docType = "ssc_certificate";
      else if (docName.includes("ssc") && docName.includes("marksheet"))
        docType = "ssc_marksheet";
      else if (docName.includes("hsc") && docName.includes("certificate"))
        docType = "hsc_certificate";
      else if (docName.includes("hsc") && docName.includes("marksheet"))
        docType = "hsc_marksheet";
      else if (
        docName.includes("graduation") &&
        docName.includes("certificate")
      )
        docType = "graduation_certificate";
      else if (docName.includes("graduation") && docName.includes("marksheet"))
        docType = "graduation_marksheet";
      else if (docName.includes("aadhaar")) docType = "aadhaar_card";
      else if (docName.includes("pan")) docType = "pan_card";
      else if (docName.includes("passport")) docType = "passport_size_photos";
      else if (docName.includes("address")) docType = "address_proof";
      else if (
        docName.includes("professional") ||
        docName.includes("certification")
      )
        docType = "professional_certifications";
      else if (
        docName.includes("educational") ||
        docName.includes("certificate")
      )
        docType = "educational_certificates";

      if (docType) {
        const isSubmitted =
          doc.status && !["pending", "n/a"].includes(doc.status.toLowerCase());
        if (isSubmitted) {
          manualMap[docType] = (manualMap[docType] || 0) + 1;
        }
      }
    });

    console.log("\n📋 Manual Document Mapping:");
    Object.keys(manualMap).forEach((docType) => {
      console.log(`   ${docType}: ${manualMap[docType]} entries`);
    });

    // 4. Show validation results
    console.log("\n📋 Validation Results:");
    let allRequired = true;

    Object.keys(requirements).forEach((category) => {
      console.log(`\n   ${category.toUpperCase()}:`);
      requirements[category].forEach((req) => {
        const uploaded = uploadedMap[req.type] || 0;
        const manual = manualMap[req.type] || 0;
        const totalUploaded = uploaded + manual;
        const isValid = req.required ? totalUploaded > 0 : true;

        if (req.required && totalUploaded === 0) {
          allRequired = false;
        }

        console.log(`     ${req.name}:`);
        console.log(`       Required: ${req.required}`);
        console.log(`       Uploaded Files: ${uploaded}`);
        console.log(`       Manual Entries: ${manual}`);
        console.log(`       Total: ${totalUploaded}`);
        console.log(`       Status: ${isValid ? "✅ Valid" : "❌ Missing"}`);
      });
    });

    console.log(
      `\n🎯 Overall Status: ${
        allRequired
          ? "✅ All Required Documents Complete"
          : "❌ Missing Required Documents"
      }`
    );
  } catch (error) {
    console.error("❌ Error testing document validation:", error);
  } finally {
    await pool.end();
  }
}

testDocumentValidation();
