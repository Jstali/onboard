const axios = require("axios");

// Test the complete workflow: Form submission → HR approval → Document collection
async function testCompleteWorkflow() {
  try {
    console.log("🧪 Testing Complete Workflow...\n");

    // Test 1: Check employee forms (all forms)
    console.log("1️⃣ Testing GET /hr/employee-forms (all forms)...");
    const allFormsResponse = await axios.get(
      "http://localhost:5001/api/hr/employee-forms"
    );
    console.log("✅ Employee forms endpoint working");
    console.log(
      `📊 Found ${allFormsResponse.data.forms.length} total employee forms`
    );

    // Show form status breakdown
    const statusCounts = {};
    allFormsResponse.data.forms.forEach((form) => {
      const status = form.status || "unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log("📊 Form status breakdown:");
    Object.keys(statusCounts).forEach((status) => {
      console.log(`   ${status}: ${statusCounts[status]} forms`);
    });
    console.log("");

    // Test 2: Check approved employee forms only
    console.log("2️⃣ Testing GET /hr/approved-employee-forms...");
    const approvedFormsResponse = await axios.get(
      "http://localhost:5001/api/hr/approved-employee-forms"
    );
    console.log("✅ Approved employee forms endpoint working");
    console.log(
      `📊 Found ${approvedFormsResponse.data.forms.length} approved employee forms\n`
    );

    // Test 3: Check document collection
    console.log("3️⃣ Testing GET /hr/document-collection...");
    const documentsResponse = await axios.get(
      "http://localhost:5001/api/hr/document-collection"
    );
    console.log("✅ Document collection endpoint working");
    console.log(
      `📊 Found ${documentsResponse.data.documents.length} total documents\n`
    );

    // Test 4: Analyze workflow
    if (
      approvedFormsResponse.data.forms.length > 0 &&
      documentsResponse.data.documents.length > 0
    ) {
      console.log("4️⃣ Analyzing workflow...");

      // Group documents by employee
      const employeeDocs = {};
      documentsResponse.data.documents.forEach((doc) => {
        if (!employeeDocs[doc.employee_id]) {
          employeeDocs[doc.employee_id] = [];
        }
        employeeDocs[doc.employee_id].push(doc);
      });

      console.log(
        `📊 Employees with documents: ${Object.keys(employeeDocs).length}`
      );
      console.log(
        `📊 Approved employees: ${approvedFormsResponse.data.forms.length}`
      );

      // Check if all approved employees have documents
      const approvedEmployeeIds = approvedFormsResponse.data.forms.map(
        (form) => form.employee_id
      );
      const employeesWithDocs = Object.keys(employeeDocs);

      console.log("\n📊 Workflow Analysis:");

      approvedEmployeeIds.forEach((employeeId) => {
        const hasDocuments = employeesWithDocs.includes(employeeId.toString());
        const form = approvedFormsResponse.data.forms.find(
          (f) => f.employee_id === employeeId
        );
        const docs = employeeDocs[employeeId] || [];
        const receivedCount = docs.filter(
          (doc) => doc.effective_status === "Received"
        ).length;
        const pendingCount = docs.filter(
          (doc) => doc.effective_status === "Pending"
        ).length;

        console.log(
          `👤 Employee ${employeeId} (${form?.employee_type || "Unknown"}):`
        );
        console.log(`   ✅ Form Status: ${form?.status || "Unknown"}`);
        console.log(
          `   ${hasDocuments ? "✅" : "❌"} Has Documents: ${
            hasDocuments ? "Yes" : "No"
          }`
        );
        if (hasDocuments) {
          console.log(`   📄 Document Count: ${docs.length}`);
          console.log(
            `   📊 Received: ${receivedCount}, Pending: ${pendingCount}`
          );
        }
        console.log("");
      });

      // Check for employees with documents but not approved
      const employeesWithDocsButNotApproved = employeesWithDocs.filter(
        (empId) => !approvedEmployeeIds.includes(parseInt(empId))
      );

      if (employeesWithDocsButNotApproved.length > 0) {
        console.log("⚠️ Employees with documents but not approved:");
        employeesWithDocsButNotApproved.forEach((empId) => {
          console.log(`   👤 Employee ${empId}`);
        });
      }
    }

    console.log("🎉 Complete workflow test finished!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

// Run the test
testCompleteWorkflow();
