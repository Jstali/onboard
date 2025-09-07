const bcrypt = require("bcryptjs");
const { pool } = require("./config/database");

async function setLuffyManagerPassword() {
  try {
    console.log("🔧 Setting password for Luffy D manager...");

    const luffyEmail = "strawhatluff124@gmail.com";
    const newPassword = "luffy123";

    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update luffy's password
    const result = await pool.query(
      `UPDATE users 
       SET password = $1, temp_password = NULL
       WHERE email = $2 AND role = 'manager'
       RETURNING id, email, first_name, last_name`,
      [hashedPassword, luffyEmail]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log("✅ Updated Luffy D's password successfully!");
      console.log("\n🎉 Luffy D Login Credentials:");
      console.log("=" * 40);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔑 Password: ${newPassword}`);
      console.log(`👤 Name: ${user.first_name} ${user.last_name}`);
      console.log(`🎭 Role: manager`);
      console.log("=" * 40);
      console.log(
        "\n💡 You can now login as Luffy D to view manager dashboard!"
      );
    } else {
      console.log("❌ Manager account not found or not updated");
    }
  } catch (error) {
    console.error("❌ Error setting Luffy D's password:", error);
  } finally {
    await pool.end();
  }
}

setLuffyManagerPassword();
