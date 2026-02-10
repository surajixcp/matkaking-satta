/**
 * Run migration manually for Sequelize
 */

const { exec } = require('child_process');
const path = require('path');

async function runMigration() {
    console.log('🔄 Running Sequelize migrations...');

    const migrationCommand = `npx sequelize-cli db:migrate`;

    exec(migrationCommand, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Migration error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`⚠️ Migration stderr: ${stderr}`);
        }
        console.log(`✅ Migration stdout: ${stdout}`);
    });
}

runMigration();
