const axios = require("axios");

// Test the document count fix
async function testDocumentCountFix() {
  try {
    console.log("🧪 Testing Document Count Fix...\n");

    // Test 1: Check document collection endpoint
    console.log("1️⃣ Testing GET /hr/document-collection...");
    const response = await axios.get(
      "http://localhost:5001/api/hr/document-collection"
    );
    console.log("✅ Document collection endpoint working");
    console.log(`📊 Found ${response.data.documents.length} total documents\n`);

    // Test 2: Check document templates
    console.log("2️⃣ Testing GET /hr/document-templates...");
    const templatesResponse = await axios.get(
      "http://localhost:5001/api/hr/document-templates"
    );
    console.log("✅ Document templates endpoint working");
    console.log(
      `📊 Found ${templatesResponse.data.templates.length} document templates\n`
    );

    // Test 3: Check employee forms
    console.log("3️⃣ Testing GET /hr/employee-forms...");
    const formsResponse = await axios.get(
      "http://localhost:5001/api/hr/employee-forms"
    );
    console.log("✅ Employee forms endpoint working");
    console.log(`📊 Found ${formsResponse.data.forms.length} employee forms\n`);

    // Test 4: Check documents per employee
    if (response.data.documents.length > 0) {
      console.log("4️⃣ Analyzing documents per employee...");

      // Group documents by employee
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

      // Show document count for each employee
      Object.keys(employeeDocs).forEach((employeeId) => {
        const docs = employeeDocs[employeeId];
        const receivedCount = docs.filter(
          (doc) => doc.effective_status === "Received"
        ).length;
        const pendingCount = docs.filter(
          (doc) => doc.effective_status === "Pending"
        ).length;

        console.log(
          `👤 Employee ${employeeId}: ${docs.length} total documents (${receivedCount} received, ${pendingCount} pending)`
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

    // Test 5: Check if all expected documents are present
    console.log("5️⃣ Checking for expected document types...");
    const expectedDocs = [
      "Updated Resume",
      "SSC Certificate (10th)",
      "SSC Marksheet (10th)",
      "HSC Certificate (12th)",
      "HSC Marksheet (12th)",
      "Graduation Consolidated Marksheet",
      "Graduation Original/Provisional Certificate",
      "Post-Graduation Marksheet",
      "Post-Graduation Certificate",
      "Aadhaar Card",
      "PAN Card",
      "Passport",
    ];

    const foundDocs = response.data.documents.map((doc) => doc.document_name);
    const uniqueFoundDocs = [...new Set(foundDocs)];

    console.log(`📊 Expected document types: ${expectedDocs.length}`);
    console.log(`📊 Found document types: ${uniqueFoundDocs.length}`);

    expectedDocs.forEach((expectedDoc) => {
      const found = uniqueFoundDocs.includes(expectedDoc);
      console.log(`   ${found ? "✅" : "❌"} ${expectedDoc}`);
    });

    console.log("\n🎉 Document count fix test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

// Run the test
testDocumentCountFix();
