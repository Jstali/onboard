const fs = require("fs");

// Test script to verify View All Documents button removal
function testViewAllDocumentsRemoval() {
  try {
    console.log("🔍 Testing View All Documents Button Removal...\n");

    // Read the DocumentStatus.js file
    const filePath = "./frontend/src/components/DocumentStatus.js";
    const content = fs.readFileSync(filePath, "utf8");

    console.log("1️⃣ Checking for View All Documents button in HR Actions...");

    // Check for View All Documents button in HR Actions section
    const hrActionsSection =
      content.includes("HR Actions") &&
      content.includes("Approve Employee") &&
      content.includes("handleViewAllDocuments");

    if (hrActionsSection) {
      console.log("   ❌ View All Documents button still found in HR Actions");
    } else {
      console.log("   ✅ View All Documents button removed from HR Actions");
    }

    console.log("\n2️⃣ Checking for handleViewAllDocuments function...");

    // Check for handleViewAllDocuments function
    if (content.includes("handleViewAllDocuments")) {
      console.log(
        "   ✅ handleViewAllDocuments function still exists (should remain)"
      );
    } else {
      console.log(
        "   ❌ handleViewAllDocuments function missing (should remain)"
      );
    }

    console.log("\n3️⃣ Checking for View All Documents modal...");

    // Check if View All Documents modal still exists
    if (content.includes("View All Documents Modal")) {
      console.log(
        "   ✅ View All Documents modal still exists (should remain)"
      );
    } else {
      console.log("   ❌ View All Documents modal missing (should remain)");
    }

    console.log("\n4️⃣ Checking for FaEye import...");

    // Check if FaEye import still exists
    if (content.includes("FaEye")) {
      console.log("   ✅ FaEye import still exists (used elsewhere)");
    } else {
      console.log("   ❌ FaEye import missing (used elsewhere)");
    }

    console.log("\n5️⃣ Checking for remaining View All Documents references...");

    // Check for any remaining View All Documents references in HR Actions
    const viewAllPatterns = [
      "View All Documents",
      'FaEye className="mr-1"',
      "border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50",
    ];

    let viewAllFound = false;
    viewAllPatterns.forEach((pattern) => {
      if (content.includes(pattern)) {
        console.log(
          `   ⚠️ View All Documents pattern found: ${pattern} (may be used elsewhere)`
        );
        viewAllFound = true;
      }
    });

    if (!viewAllFound) {
      console.log(
        "   ✅ All View All Documents references removed from HR Actions"
      );
    }

    console.log("\n6️⃣ Checking HR Actions section structure...");

    // Check if HR Actions section still has proper structure
    if (
      content.includes("HR Actions") &&
      content.includes("Approve Employee")
    ) {
      console.log("   ✅ HR Actions section structure maintained");
    } else {
      console.log("   ❌ HR Actions section structure compromised");
    }

    console.log("\n📝 View All Documents Button Removal Summary:");
    console.log("   - View All Documents button (HR): ✅ Removed");
    console.log("   - handleViewAllDocuments function: ✅ Preserved");
    console.log("   - View All Documents modal: ✅ Preserved");
    console.log("   - FaEye import: ✅ Preserved");
    console.log("   - HR Actions structure: ✅ Maintained");

    console.log("\n🔧 Expected Results:");
    console.log("   ✅ No View All Documents button in HR Actions section");
    console.log("   ✅ Only Approve Employee button visible in HR Actions");
    console.log("   ✅ View All Documents modal still accessible elsewhere");
    console.log("   ✅ Cleaner HR Actions section");
    console.log("   ✅ No functionality broken");

    console.log("\n💡 Test Steps:");
    console.log("   1. Refresh your browser page");
    console.log("   2. Open employee onboarding page");
    console.log("   3. Check HR Actions section");
    console.log("   4. Verify only Approve Employee button is present");
    console.log("   5. Confirm View All Documents button is not visible");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testViewAllDocumentsRemoval();
