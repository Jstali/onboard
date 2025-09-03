const { pool } = require("./config/database");

async function testManualEmployeeAddition() {
  try {
    console.log("🧪 Testing manual employee addition function...");
    
    // Test the function directly
    const result = await pool.query(
      "SELECT manually_add_employee($1, $2, $3, $4, $5) as user_id",
      ["test.new.employee@company.com", "Test", "NewEmployee", "Full-Time", ""]
    );
    
    const userId = result.rows[0].user_id;
    console.log("✅ User created with ID:", userId);
    
    // Check if user was created
    const userResult = await pool.query(
      "SELECT id, email, first_name, last_name, role FROM users WHERE id = $1",
      [userId]
    );
    
    if (userResult.rows.length > 0) {
      console.log("✅ User record created:", userResult.rows[0]);
    } else {
      console.log("❌ User record not found");
    }
    
    // Check if employee form was created
    const formResult = await pool.query(
      "SELECT id, employee_id, type, status FROM employee_forms WHERE employee_id = $1",
      [userId]
    );
    
    if (formResult.rows.length > 0) {
      console.log("✅ Employee form created:", formResult.rows[0]);
    } else {
      console.log("❌ Employee form not found");
    }
    
    // Check if employee master record was created
    const masterResult = await pool.query(
      "SELECT id, employee_id, employee_name, company_email, type, status FROM employee_master WHERE company_email = $1",
      ["test.new.employee@company.com"]
    );
    
    if (masterResult.rows.length > 0) {
      console.log("✅ Employee master record created:", masterResult.rows[0]);
    } else {
      console.log("❌ Employee master record not found");
    }
    
    // Show all recent employee master records
    const recentEmployees = await pool.query(
      "SELECT id, employee_id, employee_name, company_email, type, status, created_at FROM employee_master ORDER BY created_at DESC LIMIT 3"
    );
    
    console.log("\n📋 Recent employee master records:");
    recentEmployees.rows.forEach(emp => {
      console.log(`  - ${emp.employee_name} (${emp.employee_id}) - ${emp.company_email} - ${emp.type} - ${emp.status}`);
    });
    
  } catch (error) {
    console.error("❌ Error testing manual employee addition:", error);
  } finally {
    await pool.end();
  }
}

testManualEmployeeAddition();
