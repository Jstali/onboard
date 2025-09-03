const bcrypt = require("bcryptjs");
const { pool } = require("./config/database");

async function testHRLogin() {
  try {
    console.log("🔍 Testing HR login...");

    // Test with testhr@nxzen.com
    const email = "testhr@nxzen.com";
    const password = "hr123";

    console.log(`🔍 Attempting login with: ${email}`);

    // Get user from database
    const userResult = await pool.query(
      "SELECT id, email, password, role FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log("❌ User not found");
      return;
    }

    const user = userResult.rows[0];
    console.log("✅ User found:", {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log("🔍 Password check result:", isValidPassword);

    if (isValidPassword) {
      console.log("✅ Login successful!");
      console.log("📧 Use these credentials:");
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
    } else {
      console.log("❌ Password is incorrect");

      // Try common passwords
      const commonPasswords = ["password", "123456", "admin", "hr123", "test"];
      for (const testPassword of commonPasswords) {
        const isMatch = await bcrypt.compare(testPassword, user.password);
        if (isMatch) {
          console.log(`✅ Found correct password: ${testPassword}`);
          console.log("📧 Use these credentials:");
          console.log(`   Email: ${email}`);
          console.log(`   Password: ${testPassword}`);
          return;
        }
      }
      console.log("❌ Could not find correct password");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testHRLogin();
