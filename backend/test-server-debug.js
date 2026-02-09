const fs = require('fs');
const logStream = fs.createWriteStream('debug_server.log', { flags: 'w' });

function log(msg) {
    process.stdout.write(msg + '\n');
    logStream.write(msg + '\n');
}

function error(msg) {
    process.stderr.write(msg + '\n');
    logStream.write('ERROR: ' + msg + '\n');
}

log('Starting server debug...');

try {
    // Mock process.env
    process.env.PORT = 5001;
    process.env.DB_USERNAME = 'postgres';
    process.env.DB_PASSWORD = 'postgres'; // Default
    process.env.DB_NAME = 'matkaking_db';
    process.env.DB_HOST = '127.0.0.1';
    process.env.JWT_SECRET = 'test';

    const { app } = require('./src/index');
    log('App loaded.');

} catch (e) {
    error('Server startup failed: ' + e.message);
    error(e.stack);
}
