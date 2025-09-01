const axios = require("axios");

// Test script to verify document viewing and download fixes
async function testDocumentViewFix() {
  try {
    console.log("🔍 Testing Document View and Download Fix...\n");

    // Test 1: Get employee documents
    console.log("1️⃣ Testing GET /documents/employee/:employeeId...");
    const documentsResponse = await axios.get(
      "http://localhost:5001/api/documents/employee/1"
    );
    console.log("✅ Employee documents loaded");
    console.log(
      `📊 Found ${
        Object.keys(documentsResponse.data).length
      } document categories`
    );

    // Check if documents have file_url field
    const allDocs = Object.values(documentsResponse.data).flat();
    console.log(`📄 Total documents: ${allDocs.length}`);

    if (allDocs.length > 0) {
      const sampleDoc = allDocs[0];
      console.log("📋 Sample document structure:");
      console.log(`   - Document Type: ${sampleDoc.document_type}`);
      console.log(`   - File Name: ${sampleDoc.file_name}`);
      console.log(`   - File URL: ${sampleDoc.file_url}`);
      console.log(`   - File Size: ${sampleDoc.file_size}`);
      console.log(`   - MIME Type: ${sampleDoc.mime_type}`);

      if (sampleDoc.file_url) {
        console.log(
          "✅ Document has file_url field - Frontend should work correctly"
        );
      } else {
        console.log("❌ Document missing file_url field");
      }
    }

    // Test 2: Check if files exist on server
    console.log("\n2️⃣ Testing file existence on server...");
    for (const doc of allDocs.slice(0, 3)) {
      // Test first 3 documents
      if (doc.file_url) {
        try {
          const fileResponse = await axios.head(
            `http://localhost:5001${doc.file_url}`,
            { timeout: 5000 }
          );
          console.log(
            `✅ File exists: ${doc.file_name} (${fileResponse.status})`
          );
        } catch (error) {
          console.log(`❌ File not found: ${doc.file_name} - ${error.message}`);
        }
      }
    }

    console.log("\n✅ Document view and download fix test completed!");
    console.log("\n📝 Summary:");
    console.log("   - Frontend now uses 'file_url' instead of 'file_path'");
    console.log("   - Document modal should display files correctly");
    console.log("   - Download buttons should work properly");
    console.log("   - Preview should work for supported file types");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("   Response status:", error.response.status);
      console.error("   Response data:", error.response.data);
    }
  }
}

// Run the test
testDocumentViewFix();
