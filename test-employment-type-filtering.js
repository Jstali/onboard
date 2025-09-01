const axios = require("axios");

// Test the employment type filtering fix
async function testEmploymentTypeFiltering() {
  try {
    console.log("🧪 Testing Employment Type Filtering Fix...\n");

    // Test 1: Check document collection endpoint
    console.log("1️⃣ Testing GET /hr/document-collection...");
    const response = await axios.get(
      "http://localhost:5001/api/hr/document-collection"
    );
    console.log("✅ Document collection endpoint working");
    console.log(`📊 Found ${response.data.documents.length} total documents\n`);

    // Test 2: Check employee forms to get employment types
    console.log("2️⃣ Testing GET /hr/employee-forms...");
    const formsResponse = await axios.get(
      "http://localhost:5001/api/hr/employee-forms"
    );
    console.log("✅ Employee forms endpoint working");
    console.log(`📊 Found ${formsResponse.data.forms.length} employee forms\n`);

    // Test 3: Analyze documents by employment type
    if (
      response.data.documents.length > 0 &&
      formsResponse.data.forms.length > 0
    ) {
      console.log("3️⃣ Analyzing documents by employment type...");

      // Create a map of employee forms by employee_id
      const employeeForms = {};
      formsResponse.data.forms.forEach((form) => {
        employeeForms[form.employee_id] = form;
      });

      // Group documents by employee and analyze
      const employeeDocs = {};
      response.data.documents.forEach((doc) => {
        if (!employeeDocs[doc.employee_id]) {
          employeeDocs[doc.employee_id] = [];
        }
        employeeDocs[doc.employee_id].push(doc);
      });

      console.log(
        `📊 Found ${Object.keys(employeeDocs).length} employees with documents`
      );

      // Show document count for each employee by employment type
      Object.keys(employeeDocs).forEach((employeeId) => {
        const docs = employeeDocs[employeeId];
        const form = employeeForms[employeeId];
        const employmentType =
          form?.form_data?.employmentType || form?.employee_type || "Unknown";

        const receivedCount = docs.filter(
          (doc) => doc.effective_status === "Received"
        ).length;
        const pendingCount = docs.filter(
          (doc) => doc.effective_status === "Pending"
        ).length;

        console.log(
          `👤 Employee ${employeeId} (${employmentType}): ${docs.length} total documents (${receivedCount} received, ${pendingCount} pending)`
        );

        // Show expected vs actual document count
        const expectedCount = getExpectedDocumentCount(employmentType);
        const status = docs.length === expectedCount ? "✅" : "❌";
        console.log(
          `   ${status} Expected: ${expectedCount}, Actual: ${docs.length}`
        );

        // Show document names
        docs.forEach((doc) => {
          console.log(
            `   📄 ${doc.document_name} - ${doc.effective_status || doc.status}`
          );
        });
        console.log("");
      });
    }

    console.log("🎉 Employment type filtering test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

// Helper function to get expected document count by employment type
function getExpectedDocumentCount(employmentType) {
  switch (employmentType) {
    case "Intern":
      return 9;
    case "Full-Time":
    case "Manager":
      return 15;
    case "Contract":
      return 13;
    default:
      return 9; // Default to Intern count
  }
}

// Run the test
testEmploymentTypeFiltering();
