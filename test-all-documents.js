const axios = require("axios");

// Test that all documents are created for approved employees
async function testAllDocuments() {
  try {
    console.log("🧪 Testing All Documents Creation...\n");

    // Test 1: Get document templates
    console.log("1️⃣ Testing GET /hr/document-templates...");
    const templatesResponse = await axios.get(
      "http://localhost:5001/api/hr/document-templates"
    );
    console.log("✅ Document templates loaded");
    console.log(
      `📊 Found ${templatesResponse.data.templates.length} document templates\n`
    );

    // Test 2: Get approved employee forms
    console.log("2️⃣ Testing GET /hr/approved-employee-forms...");
    const approvedFormsResponse = await axios.get(
      "http://localhost:5001/api/hr/approved-employee-forms"
    );
    console.log("✅ Approved employee forms loaded");
    console.log(
      `📊 Found ${approvedFormsResponse.data.forms.length} approved employee forms\n`
    );

    // Test 3: Get document collection
    console.log("3️⃣ Testing GET /hr/document-collection...");
    const collectionResponse = await axios.get(
      "http://localhost:5001/api/hr/document-collection"
    );
    console.log("✅ Document collection loaded");
    console.log(
      `📊 Found ${collectionResponse.data.documents.length} document collection records\n`
    );

    // Analysis
    console.log("📊 ALL DOCUMENTS ANALYSIS\n");

    // Show all available document templates
    console.log("📋 ALL AVAILABLE DOCUMENT TEMPLATES:");
    templatesResponse.data.templates.forEach((template, index) => {
      console.log(
        `   ${index + 1}. ${template.document_name} (${template.document_type})`
      );
    });

    console.log(
      `\n📊 Total document templates: ${templatesResponse.data.templates.length}\n`
    );

    // Group documents by employee
    const collectionByEmployee = {};
    collectionResponse.data.documents.forEach((doc) => {
      if (!collectionByEmployee[doc.employee_id]) {
        collectionByEmployee[doc.employee_id] = [];
      }
      collectionByEmployee[doc.employee_id].push(doc);
    });

    // Analyze each approved employee
    console.log("👥 APPROVED EMPLOYEES DOCUMENT ANALYSIS:");

    if (approvedFormsResponse.data.forms.length === 0) {
      console.log("   ⚠️ No approved employees found");
    } else {
      approvedFormsResponse.data.forms.forEach((form, index) => {
        const employeeId = form.employee_id;
        const employmentType =
          form.employee_type || form.form_data?.employmentType || "Unknown";
        const collectionDocs = collectionByEmployee[employeeId] || [];

        console.log(
          `\n${index + 1}. 👤 Employee ${employeeId} (${employmentType}):`
        );
        console.log(`   📝 Form Status: ${form.status || "Unknown"}`);
        console.log(`   📄 Documents in Collection: ${collectionDocs.length}`);
        console.log(
          `   🎯 Expected Documents: ${templatesResponse.data.templates.length}`
        );

        // Check if all templates are present
        const expectedDocNames = templatesResponse.data.templates.map(
          (t) => t.document_name
        );
        const actualDocNames = collectionDocs.map((d) => d.document_name);

        const missingDocs = expectedDocNames.filter(
          (name) => !actualDocNames.includes(name)
        );
        const extraDocs = actualDocNames.filter(
          (name) => !expectedDocNames.includes(name)
        );

        if (missingDocs.length > 0) {
          console.log(`   ❌ Missing Documents (${missingDocs.length}):`);
          missingDocs.forEach((doc) => {
            console.log(`      - ${doc}`);
          });
        }

        if (extraDocs.length > 0) {
          console.log(`   ⚠️ Extra Documents (${extraDocs.length}):`);
          extraDocs.forEach((doc) => {
            console.log(`      - ${doc}`);
          });
        }

        if (missingDocs.length === 0 && extraDocs.length === 0) {
          console.log(
            `   ✅ Perfect! All ${templatesResponse.data.templates.length} documents present`
          );
        }

        // Show document status breakdown
        const receivedCount = collectionDocs.filter(
          (doc) => doc.effective_status === "Received"
        ).length;
        const pendingCount = collectionDocs.filter(
          (doc) => doc.effective_status === "Pending"
        ).length;

        console.log(
          `   📊 Status: ${receivedCount} Received, ${pendingCount} Pending`
        );

        // Show actual documents
        if (collectionDocs.length > 0) {
          console.log(`   📋 Documents:`);
          collectionDocs.forEach((doc) => {
            const status = doc.effective_status || doc.status;
            const icon = status === "Received" ? "✅" : "⏳";
            console.log(`      ${icon} ${doc.document_name} - ${status}`);
          });
        }
      });
    }

    // Summary
    console.log("\n📊 SUMMARY:");
    console.log(
      `   📋 Total document templates: ${templatesResponse.data.templates.length}`
    );
    console.log(
      `   👥 Approved employees: ${approvedFormsResponse.data.forms.length}`
    );
    console.log(
      `   📄 Total document collection records: ${collectionResponse.data.documents.length}`
    );

    if (approvedFormsResponse.data.forms.length > 0) {
      const avgDocsPerEmployee =
        collectionResponse.data.documents.length /
        approvedFormsResponse.data.forms.length;
      console.log(
        `   📊 Average documents per employee: ${avgDocsPerEmployee.toFixed(1)}`
      );

      if (avgDocsPerEmployee === templatesResponse.data.templates.length) {
        console.log(
          `   ✅ Perfect! All employees have all ${templatesResponse.data.templates.length} documents`
        );
      } else {
        console.log(`   ⚠️ Some employees may be missing documents`);
      }
    }

    console.log("\n🎉 All documents test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

// Run the test
testAllDocuments();
