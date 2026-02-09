const { sequelize, Deposit, User } = require('../src/db/models');
const fs = require('fs');

async function testFetch() {
    try {
        await sequelize.authenticate();

        await Deposit.findAndCountAll({
            include: [{ model: User, as: 'user', attributes: ['id'] }],
            logging: (msg) => fs.appendFileSync('debug_error_v3.log', 'SQL: ' + msg + '\n')
        });

        console.log('Success');
    } catch (error) {
        console.error('Failed');
        fs.appendFileSync('debug_error_v3.log', 'ERROR: ' + error.message + '\n');
        fs.appendFileSync('debug_error_v3.log', 'STACK: ' + error.stack + '\n');
    } finally {
        await sequelize.close();
    }
}

fs.writeFileSync('debug_error_v3.log', 'Starting...\n');
testFetch();
