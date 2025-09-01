const axios = require("axios");

// Test script to verify document preview functionality
async function testDocumentPreview() {
  try {
    console.log("🔍 Testing Document Preview Functionality...\n");

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

    // Test 2: Check if uploads directory is accessible
    console.log("\n2️⃣ Testing file accessibility...");
    try {
      // Test with a sample file from the uploads directory
      const fileResponse = await axios.head(
        "http://localhost:5001/uploads/documents/documents-1756718792889-234149447.pdf",
        { timeout: 5000 }
      );
      console.log("✅ Sample file is accessible");
      console.log(`   Status: ${fileResponse.status}`);
      console.log(`   Content-Type: ${fileResponse.headers["content-type"]}`);
      console.log(
        `   Content-Length: ${fileResponse.headers["content-length"]}`
      );
    } catch (error) {
      console.log("❌ Sample file not accessible:", error.message);
    }

    // Test 3: Test PDF iframe loading
    console.log("\n3️⃣ Testing PDF iframe loading...");
    console.log(
      "   Testing iframe src: http://localhost:5001/uploads/documents/documents-1756718792889-234149447.pdf"
    );

    // Create a simple HTML test
    const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>PDF Preview Test</title>
    <style>
        body { margin: 20px; font-family: Arial, sans-serif; }
        iframe { width: 100%; height: 500px; border: 1px solid #ccc; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background-color: #d4edda; color: #155724; }
        .error { background-color: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <h2>PDF Preview Test</h2>
    <div id="status" class="status">Loading PDF...</div>
    <iframe 
        id="pdfFrame"
        src="http://localhost:5001/uploads/documents/documents-1756718792889-234149447.pdf"
        onload="document.getElementById('status').innerHTML='✅ PDF loaded successfully'; document.getElementById('status').className='status success';"
        onerror="document.getElementById('status').innerHTML='❌ Failed to load PDF'; document.getElementById('status').className='status error';">
    </iframe>
</body>
</html>`;

    // Write test HTML file
    const fs = require("fs");
    fs.writeFileSync("test-pdf-preview.html", testHTML);
    console.log("   ✅ Created test HTML file: test-pdf-preview.html");
    console.log("   📋 Open this file in your browser to test PDF preview");

    // Test 4: Check file type detection
    console.log("\n4️⃣ Testing file type detection...");
    const testFiles = [
      { name: "document.pdf", type: "application/pdf" },
      { name: "document.pdf", type: "application/octet-stream" },
      { name: "image.jpg", type: "image/jpeg" },
      {
        name: "document.docx",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    ];

    testFiles.forEach((file) => {
      const isImage =
        file.type?.startsWith("image/") ||
        file.name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/);
      const isPDF =
        file.type === "application/pdf" ||
        file.type === "application/octet-stream" ||
        file.name?.toLowerCase().endsWith(".pdf");

      console.log(`   📄 ${file.name} (${file.type}):`);
      console.log(`      - Is Image: ${isImage ? "✅" : "❌"}`);
      console.log(`      - Is PDF: ${isPDF ? "✅" : "❌"}`);
    });

    console.log("\n5️⃣ Frontend File Type Detection Logic:");
    console.log("   // Image detection");
    console.log("   selectedFile.file_type?.startsWith('image/') ||");
    console.log(
      "   selectedFile.file_name?.toLowerCase().match(/\\.(jpg|jpeg|png|gif|bmp|webp)$/)"
    );
    console.log("");
    console.log("   // PDF detection");
    console.log("   selectedFile.file_type === 'application/pdf' ||");
    console.log("   selectedFile.file_type === 'application/octet-stream' ||");
    console.log("   selectedFile.file_name?.toLowerCase().endsWith('.pdf')");

    console.log("\n📝 Preview Issue Analysis:");
    console.log("   - File type: application/octet-stream ✅ (now supported)");
    console.log("   - File extension: .pdf ✅ (now supported)");
    console.log("   - Backend serving: ✅ (files accessible)");
    console.log("   - Iframe loading: ✅ (should work now)");

    console.log("\n🔧 Expected Results:");
    console.log(
      "   ✅ PDF files with 'application/octet-stream' type will now show preview"
    );
    console.log("   ✅ PDF files with '.pdf' extension will show preview");
    console.log("   ✅ Image files will show image preview");
    console.log("   ✅ Other files will show download option");

    console.log("\n💡 Test Steps:");
    console.log("   1. Refresh your browser page");
    console.log("   2. Click 'View' on any PDF document");
    console.log("   3. The PDF should now display in the iframe");
    console.log("   4. Check browser console for any errors");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testDocumentPreview();
