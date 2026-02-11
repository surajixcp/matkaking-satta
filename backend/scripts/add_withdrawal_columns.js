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

        // Add Bank Details to User
        console.log('🔄 Adding User bank columns...');
        await sequelize.query(`ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "bank_name" VARCHAR(255);`);
        await sequelize.query(`ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "account_number" VARCHAR(255);`);
        await sequelize.query(`ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "ifsc_code" VARCHAR(255);`);
        await sequelize.query(`ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "account_holder_name" VARCHAR(255);`);
        await sequelize.query(`ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "upi_id" VARCHAR(255);`);
        console.log('✅ Added User bank columns');


        console.log('🎉 Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

addWithdrawalColumns();
