const { pool } = require("./config/database");

async function deleteAllEmployees() {
  const client = await pool.connect();
  try {
    console.log("🔍 Deleting all employees...");

    // Get all employee IDs
    const employeesResult = await client.query(
      "SELECT id, email, first_name, last_name FROM users WHERE role = 'employee' ORDER BY id"
    );

    if (employeesResult.rows.length === 0) {
      console.log("✅ No employees found to delete");
      return;
    }

    console.log(`🔍 Found ${employeesResult.rows.length} employees to delete:`);
    employeesResult.rows.forEach((emp) => {
      console.log(
        `   - ${emp.first_name} ${emp.last_name} (${emp.email}) - ID: ${emp.id}`
      );
    });

    // Start transaction
    await client.query("BEGIN");

    let deletedCount = 0;

    for (const employee of employeesResult.rows) {
      try {
        console.log(
          `\n🔍 Deleting employee: ${employee.first_name} ${employee.last_name} (ID: ${employee.id})`
        );

        // Delete from all related tables
        const tables = [
          {
            name: "attendance",
            query: "DELETE FROM attendance WHERE employee_id = $1",
          },
          {
            name: "leave_requests",
            query: "DELETE FROM leave_requests WHERE employee_id = $1",
          },
          {
            name: "leave_balances",
            query: "DELETE FROM leave_balances WHERE employee_id = $1",
          },
          {
            name: "comp_off_balances",
            query: "DELETE FROM comp_off_balances WHERE employee_id = $1",
          },
          {
            name: "employee_documents",
            query: "DELETE FROM employee_documents WHERE employee_id = $1",
          },
          {
            name: "document_collection",
            query: "DELETE FROM document_collection WHERE employee_id = $1",
          },
          {
            name: "expenses",
            query: "DELETE FROM expenses WHERE employee_id = $1",
          },
          {
            name: "company_emails",
            query: "DELETE FROM company_emails WHERE user_id = $1",
          },
          {
            name: "manager_employee_mapping (as employee)",
            query:
              "DELETE FROM manager_employee_mapping WHERE employee_id = $1",
          },
          {
            name: "manager_employee_mapping (as manager)",
            query: "DELETE FROM manager_employee_mapping WHERE manager_id = $1",
          },
          {
            name: "employee_forms",
            query: "DELETE FROM employee_forms WHERE employee_id = $1",
          },
          {
            name: "onboarded_employees",
            query: "DELETE FROM onboarded_employees WHERE user_id = $1",
          },
          {
            name: "employee_master",
            query: "DELETE FROM employee_master WHERE company_email = $1",
          },
          { name: "users", query: "DELETE FROM users WHERE id = $1" },
        ];

        for (const table of tables) {
          const result = await client.query(table.query, [employee.id]);
          if (result.rowCount > 0) {
            console.log(
              `   ✅ ${table.name}: ${result.rowCount} records deleted`
            );
          }
        }

        deletedCount++;
        console.log(
          `✅ Employee ${employee.first_name} ${employee.last_name} deleted successfully`
        );
      } catch (error) {
        console.error(
          `❌ Error deleting employee ${employee.first_name} ${employee.last_name}:`,
          error.message
        );
        throw error;
      }
    }

    // Commit transaction
    await client.query("COMMIT");
    console.log(`\n🎉 Successfully deleted ${deletedCount} employees!`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error during deletion process:", error.message);
  } finally {
    client.release();
  }
}

deleteAllEmployees();
