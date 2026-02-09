const { sequelize, Deposit, User } = require('../src/db/models');
const fs = require('fs');

async function testFetch() {
    try {
        console.log('Authenticating...');
        await sequelize.authenticate();
        console.log('Connected to DB.');

        const result = await Deposit.findAndCountAll({
            where: { status: 'pending' },
            include: [
                { model: User, as: 'user', attributes: ['full_name', 'phone'] }
            ],
            distinct: true,
            limit: 50,
            offset: 0,
            order: [['createdAt', 'DESC']],
            logging: (msg) => {
                fs.appendFileSync('debug_error.log', 'SQL: ' + msg + '\n');
            }
        });

        console.log('Success');
    } catch (error) {
        fs.appendFileSync('debug_error.log', 'ERROR: ' + error.message + '\n');
        fs.appendFileSync('debug_error.log', 'STACK: ' + error.stack + '\n');
        console.error('ERROR:', error);
    } finally {
        await sequelize.close();
    }
}

fs.writeFileSync('debug_error.log', 'Starting Debug...\n');
testFetch();
