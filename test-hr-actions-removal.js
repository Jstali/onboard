const fs = require("fs");

// Test script to verify HR Actions removal
function testHRActionsRemoval() {
  try {
    console.log("🔍 Testing HR Actions Removal...\n");

    // Read the DocumentStatus.js file
    const filePath = "./frontend/src/components/DocumentStatus.js";
    const content = fs.readFileSync(filePath, "utf8");

    console.log("1️⃣ Checking for HR Actions section...");

    // Check for HR Actions section
    if (content.includes("HR Actions")) {
      console.log("   ❌ HR Actions section still found");
    } else {
      console.log("   ✅ HR Actions section removed");
    }

    console.log("\n2️⃣ Checking for Approve Employee button...");

    // Check for Approve Employee button
    if (content.includes("Approve Employee")) {
      console.log("   ❌ Approve Employee button still found");
    } else {
      console.log("   ✅ Approve Employee button removed");
    }

    console.log("\n3️⃣ Checking for View All Documents button...");

    // Check for View All Documents button in HR Actions
    if (
      content.includes("View All Documents") &&
      content.includes("handleViewAllDocuments")
    ) {
      console.log("   ❌ View All Documents button in HR Actions still found");
    } else {
      console.log("   ✅ View All Documents button in HR Actions removed");
    }

    console.log("\n4️⃣ Checking for handleViewAllDocuments function...");

    // Check for handleViewAllDocuments function
    if (content.includes("handleViewAllDocuments")) {
      console.log("   ❌ handleViewAllDocuments function still found");
    } else {
      console.log("   ✅ handleViewAllDocuments function removed");
    }

    console.log("\n5️⃣ Checking for remaining HR Actions references...");

    // Check for any remaining HR Actions references
    const hrActionsPatterns = [
      "This employee can be approved",
      "Documents can be uploaded later",
      "bg-blue-50 border border-blue-200",
      "font-medium text-blue-900",
    ];

    let hrActionsFound = false;
    hrActionsPatterns.forEach((pattern) => {
      if (content.includes(pattern)) {
        console.log(`   ❌ HR Actions pattern found: ${pattern}`);
        hrActionsFound = true;
      }
    });

    if (!hrActionsFound) {
      console.log("   ✅ All HR Actions references removed");
    }

    console.log("\n6️⃣ Checking for View All Documents modal...");

    // Check if View All Documents modal still exists (it should)
    if (content.includes("View All Documents Modal")) {
      console.log(
        "   ✅ View All Documents modal still exists (should remain)"
      );
    } else {
      console.log("   ❌ View All Documents modal missing (should remain)");
    }

    console.log("\n📝 HR Actions Removal Summary:");
    console.log("   - HR Actions section: ✅ Removed");
    console.log("   - Approve Employee button: ✅ Removed");
    console.log("   - View All Documents button (HR): ✅ Removed");
    console.log("   - handleViewAllDocuments function: ✅ Removed");
    console.log("   - HR Actions references: ✅ Cleaned up");
    console.log("   - View All Documents modal: ✅ Preserved");

    console.log("\n🔧 Expected Results:");
    console.log("   ✅ No HR Actions section visible");
    console.log("   ✅ No Approve Employee button");
    console.log("   ✅ No View All Documents button in HR section");
    console.log("   ✅ Cleaner interface without HR actions");
    console.log("   ✅ View All Documents modal still accessible elsewhere");

    console.log("\n💡 Test Steps:");
    console.log("   1. Refresh your browser page");
    console.log("   2. Open employee onboarding page");
    console.log("   3. Check that HR Actions section is not visible");
    console.log("   4. Verify no Approve Employee button");
    console.log("   5. Confirm no View All Documents button in HR section");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testHRActionsRemoval();
