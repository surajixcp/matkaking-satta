/**
 * Manual script to add withdrawal columns
 * Run this on Render Shell: node scripts/add_withdrawal_columns.js
 */

const { sequelize } = require('../src/db/models');

async function addWithdrawalColumns() {
    try {
        console.log('🔄 Adding withdrawal columns...');

        // Add approved_by column
        await sequelize.query(`
            ALTER TABLE "WithdrawRequests" 
            ADD COLUMN IF NOT EXISTS "approved_by" INTEGER REFERENCES "Users"(id);
        `);
        console.log('✅ Added approved_by column');

        // Add admin_remark column
        await sequelize.query(`
            ALTER TABLE "WithdrawRequests" 
            ADD COLUMN IF NOT EXISTS "admin_remark" VARCHAR(255);
        `);
        console.log('✅ Added admin_remark column');

        console.log('🎉 Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

addWithdrawalColumns();
