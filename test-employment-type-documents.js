const axios = require("axios");

// Test that each employment type shows the correct number of documents
async function testEmploymentTypeDocuments() {
  try {
    console.log("🧪 Testing Employment Type Document Counts...\n");

    // Test 1: Get approved employee forms
    console.log("1️⃣ Testing GET /hr/approved-employee-forms...");
    const approvedFormsResponse = await axios.get(
      "http://localhost:5001/api/hr/approved-employee-forms"
    );
    console.log("✅ Approved employee forms loaded");
    console.log(
      `📊 Found ${approvedFormsResponse.data.forms.length} approved employee forms\n`
    );

    // Test 2: Get document collection
    console.log("2️⃣ Testing GET /hr/document-collection...");
    const collectionResponse = await axios.get(
      "http://localhost:5001/api/hr/document-collection"
    );
    console.log("✅ Document collection loaded");
    console.log(
      `📊 Found ${collectionResponse.data.documents.length} document collection records\n`
    );

    // Analysis
    console.log("📊 EMPLOYMENT TYPE DOCUMENT ANALYSIS\n");

    // Group documents by employee
    const collectionByEmployee = {};
    collectionResponse.data.documents.forEach((doc) => {
      if (!collectionByEmployee[doc.employee_id]) {
        collectionByEmployee[doc.employee_id] = [];
      }
      collectionByEmployee[doc.employee_id].push(doc);
    });

    // Expected document counts by employment type
    const expectedCounts = {
      Intern: 9,
      "Full-Time": 15,
      Manager: 15,
      Contract: 13,
    };

    // Analyze each approved employee
    console.log("👥 EMPLOYMENT TYPE DOCUMENT COUNT ANALYSIS:");

    if (approvedFormsResponse.data.forms.length === 0) {
      console.log("   ⚠️ No approved employees found");
    } else {
      approvedFormsResponse.data.forms.forEach((form, index) => {
        const employeeId = form.employee_id;
        const employmentType =
          form.employee_type || form.form_data?.employmentType || "Unknown";
        const collectionDocs = collectionByEmployee[employeeId] || [];
        const expectedCount = expectedCounts[employmentType] || 9;

        console.log(
          `\n${index + 1}. 👤 Employee ${employeeId} (${employmentType}):`
        );
        console.log(`   📝 Form Status: ${form.status || "Unknown"}`);
        console.log(`   📄 Actual Documents: ${collectionDocs.length}`);
        console.log(`   🎯 Expected Documents: ${expectedCount}`);

        // Check if count matches
        const status = collectionDocs.length === expectedCount ? "✅" : "❌";
        console.log(
          `   ${status} Count Match: ${
            collectionDocs.length === expectedCount ? "Yes" : "No"
          }`
        );

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

    // Summary by employment type
    console.log("\n📊 SUMMARY BY EMPLOYMENT TYPE:");

    const employmentTypeStats = {};

    approvedFormsResponse.data.forms.forEach((form) => {
      const employmentType =
        form.employee_type || form.form_data?.employmentType || "Unknown";
      const employeeId = form.employee_id;
      const collectionDocs = collectionByEmployee[employeeId] || [];

      if (!employmentTypeStats[employmentType]) {
        employmentTypeStats[employmentType] = {
          count: 0,
          totalDocs: 0,
          expectedDocs: expectedCounts[employmentType] || 9,
        };
      }

      employmentTypeStats[employmentType].count++;
      employmentTypeStats[employmentType].totalDocs += collectionDocs.length;
    });

    Object.keys(employmentTypeStats).forEach((type) => {
      const stats = employmentTypeStats[type];
      const avgDocs =
        stats.count > 0 ? (stats.totalDocs / stats.count).toFixed(1) : 0;
      const status = avgDocs == stats.expectedDocs ? "✅" : "❌";

      console.log(`   ${type}:`);
      console.log(`     👥 Employees: ${stats.count}`);
      console.log(`     📄 Average Documents: ${avgDocs}`);
      console.log(`     🎯 Expected Documents: ${stats.expectedDocs}`);
      console.log(
        `     ${status} Match: ${avgDocs == stats.expectedDocs ? "Yes" : "No"}`
      );
    });

    console.log("\n🎉 Employment type document count test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

// Run the test
testEmploymentTypeDocuments();
