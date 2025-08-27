require('dotenv').config({ path: './config.env' });
const { pool } = require('../config/database.js');

async function fixLeaveBalances() {
  try {
    console.log('🔄 Fixing leave balances table...');

    // Remove records with null employee_id
    const deleteResult = await pool.query(`
      DELETE FROM leave_balances 
      WHERE employee_id IS NULL
    `);
    console.log(`✅ Removed ${deleteResult.rowCount} invalid records`);

    // Check current leave_balances
    const currentBalances = await pool.query(`
      SELECT lb.*, u.email, u.role 
      FROM leave_balances lb 
      JOIN users u ON lb.employee_id = u.id
      ORDER BY lb.id
    `);
    
    console.log('\n📋 Current leave balances:');
    currentBalances.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Employee: ${row.employee_id} (${row.email}), Role: ${row.role}, Year: ${row.year}, Remaining: ${row.leaves_remaining}`);
    });

    // Get all employee users
    const employees = await pool.query(`
      SELECT id, email, role FROM users WHERE role = 'employee'
    `);
    
    console.log(`\n👥 Found ${employees.rows.length} employees`);

    // Create leave balances for employees who don't have them
    const currentYear = new Date().getFullYear();
    let createdCount = 0;
    
    for (const employee of employees.rows) {
      const existingBalance = await pool.query(`
        SELECT id FROM leave_balances 
        WHERE employee_id = $1 AND year = $2
      `, [employee.id, currentYear]);
      
      if (existingBalance.rows.length === 0) {
        await pool.query(`
          INSERT INTO leave_balances (employee_id, year, total_allocated, leaves_taken, leaves_remaining)
          VALUES ($1, $2, 27, 0, 27)
        `, [employee.id, currentYear]);
        createdCount++;
        console.log(`✅ Created leave balance for employee ${employee.email}`);
      }
    }
    
    console.log(`\n🎉 Created ${createdCount} new leave balances`);
    console.log('Leave balances table fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing leave balances:', error);
  } finally {
    await pool.end();
  }
}

fixLeaveBalances();
