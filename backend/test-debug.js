const fs = require('fs');
const logStream = fs.createWriteStream('debug.log', { flags: 'w' });

function log(msg) {
    process.stdout.write(msg + '\n');
    logStream.write(msg + '\n');
}

function error(msg) {
    process.stderr.write(msg + '\n');
    logStream.write('ERROR: ' + msg + '\n');
}

log('Starting debug...');

try {
    log('Requiring models...');
    const models = require('./src/db/models');
    log('Models loaded. Sequelize instance: ' + (!!models.sequelize));
} catch (e) {
    error('Models failed: ' + e.message);
    error(e.stack);
}

try {
    log('Requiring result-fetcher...');
    require('./src/app/services/result-fetcher.service');
    log('Result fetcher loaded.');
} catch (e) {
    error('Result fetcher failed: ' + e.message);
    error(e.stack);
}

try {
    log('Requiring routes...');
    require('./src/app/routes');
    log('Routes loaded.');
} catch (e) {
    error('Routes failed: ' + e.message);
    error(e.stack);
}

log('Done.');
