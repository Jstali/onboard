const axios = require("axios");

// Test the document status fix
async function testDocumentStatusFix() {
  try {
    console.log("🧪 Testing Document Status Fix...\n");

    // Test 1: Check document collection endpoint
    console.log("1️⃣ Testing GET /hr/document-collection...");
    const response = await axios.get(
      "http://localhost:5001/api/hr/document-collection"
    );
    console.log("✅ Document collection endpoint working");
    console.log(`📊 Found ${response.data.documents.length} documents\n`);

    // Test 2: Check if effective_status is included
    if (response.data.documents.length > 0) {
      const firstDoc = response.data.documents[0];
      console.log("2️⃣ Checking effective_status field...");
      if (firstDoc.effective_status) {
        console.log("✅ effective_status field is present");
        console.log(`📄 Document: ${firstDoc.document_name}`);
        console.log(`📊 Original status: ${firstDoc.status}`);
        console.log(`📊 Effective status: ${firstDoc.effective_status}\n`);
      } else {
        console.log("⚠️ effective_status field not found\n");
      }
    }

    // Test 3: Test sync documents endpoint
    console.log("3️⃣ Testing POST /hr/sync-document-collection...");
    const syncResponse = await axios.post(
      "http://localhost:5001/api/hr/sync-document-collection"
    );
    console.log("✅ Sync documents endpoint working");
    console.log(`📊 ${syncResponse.data.message}\n`);

    // Test 4: Check document collection again after sync
    console.log("4️⃣ Checking document collection after sync...");
    const responseAfterSync = await axios.get(
      "http://localhost:5001/api/hr/document-collection"
    );
    console.log(
      `📊 Found ${responseAfterSync.data.documents.length} documents after sync`
    );

    if (responseAfterSync.data.documents.length > 0) {
      const receivedDocs = responseAfterSync.data.documents.filter(
        (doc) => doc.effective_status === "Received"
      );
      const pendingDocs = responseAfterSync.data.documents.filter(
        (doc) => doc.effective_status === "Pending"
      );

      console.log(`📊 Received documents: ${receivedDocs.length}`);
      console.log(`📊 Pending documents: ${pendingDocs.length}`);

      if (receivedDocs.length > 0) {
        console.log('✅ Found documents with "Received" status');
        console.log("📄 Sample received documents:");
        receivedDocs.slice(0, 3).forEach((doc) => {
          console.log(`   - ${doc.document_name} (${doc.employee_name})`);
        });
      }
    }

    console.log("\n🎉 Document status fix test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

// Run the test
testDocumentStatusFix();
