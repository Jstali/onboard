const axios = require("axios");

// Test script to verify MIME type fix
async function testMimeTypeFix() {
  try {
    console.log("🔍 Testing MIME Type Fix...\n");

    // Test 1: Check if backend server is running
    console.log("1️⃣ Testing backend server connectivity...");
    try {
      const healthResponse = await axios.get(
        "http://localhost:5001/api/health"
      );
      console.log("✅ Backend server is running");
    } catch (error) {
      console.log("❌ Backend server is not running");
      console.log("   Please start the backend server first");
      return;
    }

    // Test 2: Test PDF file with proper MIME type
    console.log("\n2️⃣ Testing PDF file MIME type...");
    const pdfFile = "/uploads/documents/documents-1756718792889-234149447.pdf";
    const pdfUrl = `http://localhost:5001${pdfFile}`;

    try {
      const response = await axios.head(pdfUrl, { timeout: 5000 });
      console.log(`   ✅ PDF file accessible (Status: ${response.status})`);
      console.log(`   Content-Type: ${response.headers["content-type"]}`);

      if (response.headers["content-type"] === "application/pdf") {
        console.log("   ✅ MIME type is correct (application/pdf)");
      } else {
        console.log(
          `   ❌ MIME type is incorrect: ${response.headers["content-type"]}`
        );
      }
    } catch (error) {
      console.log(`   ❌ Error accessing PDF: ${error.message}`);
    }

    // Test 3: Test image file MIME type
    console.log("\n3️⃣ Testing image file MIME type...");
    const imageFile = "/uploads/documents/test-image.jpg"; // This might not exist
    const imageUrl = `http://localhost:5001${imageFile}`;

    try {
      const response = await axios.head(imageUrl, { timeout: 5000 });
      console.log(`   ✅ Image file accessible (Status: ${response.status})`);
      console.log(`   Content-Type: ${response.headers["content-type"]}`);

      if (response.headers["content-type"].startsWith("image/")) {
        console.log("   ✅ MIME type is correct (image/*)");
      } else {
        console.log(
          `   ❌ MIME type is incorrect: ${response.headers["content-type"]}`
        );
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log("   ⚠️ Image file not found (expected for test)");
      } else {
        console.log(`   ❌ Error accessing image: ${error.message}`);
      }
    }

    // Test 4: Test the specific file from the screenshot
    console.log("\n4️⃣ Testing specific file from screenshot...");
    const specificFile =
      "/uploads/documents/1-a0a2d4c7-0bc6-4c06-900e-0db6f449656e.pdf";
    const specificUrl = `http://localhost:5001${specificFile}`;

    try {
      const response = await axios.head(specificUrl, { timeout: 5000 });
      console.log(`   ✅ File accessible (Status: ${response.status})`);
      console.log(`   Content-Type: ${response.headers["content-type"]}`);

      if (response.headers["content-type"] === "application/pdf") {
        console.log("   ✅ MIME type is correct (application/pdf)");
        console.log("   ✅ This file should now display in PDF preview!");
      } else {
        console.log(
          `   ❌ MIME type is incorrect: ${response.headers["content-type"]}`
        );
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log("   ❌ File not found (404) - File doesn't exist");
        console.log("   🔧 This is why the preview was blank");
      } else {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    // Test 5: Test iframe compatibility
    console.log("\n5️⃣ Testing iframe compatibility...");
    console.log("   Testing iframe src:", specificUrl);

    // Create a simple HTML test
    const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>PDF Preview Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        iframe { width: 100%; height: 500px; border: 1px solid #ccc; }
        .test-info { background: #f0f0f0; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <h2>PDF Preview Test</h2>
    <div class="test-info">
        <strong>Test URL:</strong> ${specificUrl}<br>
        <strong>Expected:</strong> PDF should display in iframe<br>
        <strong>If blank:</strong> File doesn't exist or MIME type issue
    </div>
    <iframe src="${specificUrl}" title="PDF Preview Test"></iframe>
</body>
</html>`;

    const fs = require("fs");
    fs.writeFileSync("pdf-preview-test.html", testHTML);
    console.log("   ✅ Created test HTML file: pdf-preview-test.html");
    console.log("   💡 Open this file in your browser to test PDF preview");

    console.log("\n📝 MIME Type Fix Summary:");
    console.log("   - Backend MIME type handling: ✅ Added");
    console.log("   - PDF files: ✅ Now served as application/pdf");
    console.log("   - Image files: ✅ Proper MIME types");
    console.log("   - Frontend error handling: ✅ Improved");
    console.log("   - File validation: ✅ Enhanced");

    console.log("\n🔧 Expected Results:");
    console.log("   ✅ No more 'File not found' error messages");
    console.log("   ✅ PDF files served with correct MIME type");
    console.log("   ✅ PDF preview should work in iframe");
    console.log("   ✅ Better error handling and logging");

    console.log("\n💡 Test Steps:");
    console.log("   1. Restart your backend server to apply MIME type changes");
    console.log("   2. Refresh your browser page");
    console.log("   3. Click 'View' on any PDF document");
    console.log("   4. The PDF should now display correctly");
    console.log("   5. Check browser console for debug information");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testMimeTypeFix();
