// Only load .env in non-production (local development)
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require("socket.io");
const resultFetcherService = require('./app/services/result-fetcher.service');
const { startHeartbeat, sequelize, User, Wallet } = require('./db/models');
const bcrypt = require('bcryptjs');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Configure this for production later
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Matka King Backend API', status: 'OK', timestamp: new Date() });
});

// Routes
app.use('/api/v1', require('./app/routes'));

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: err.message || 'Something went wrong!'
    });
});

/**
 * Initialize Database - Sync tables and seed admin
 * This runs on every startup (safe for production)
 */
async function initDatabase() {
    try {
        console.log('🔗 Initializing database...');

        // Sync all models (create tables if they don't exist)
        await sequelize.sync({ alter: false }); // Use alter: true to modify existing tables
        console.log('✅ All database tables synced');

        // Seed admin user if not exists
        const adminPhone = '9999999999';
        const adminMpin = '1234';

        const existingAdmin = await User.findOne({
            where: { phone: adminPhone, role: 'admin' }
        });

        if (!existingAdmin) {
            console.log('👤 Seeding admin user...');

            const mpinHash = await bcrypt.hash(String(adminMpin).trim(), 10);

            const admin = await User.create({
                phone: adminPhone,
                mpin_hash: mpinHash,
                full_name: 'Super Admin',
                role: 'admin',
                status: 'active',
                device_token: 'admin_device_token'
            });

            await Wallet.create({
                user_id: admin.id,
                balance: 1000000.00,
                bonus: 0
            });

            console.log('✅ Admin user seeded successfully');
            console.log('📋 Admin Credentials: Phone: 9999999999, MPIN: 1234');
        } else {
            console.log('✅ Admin user already exists');
        }

    } catch (error) {
        console.error('❌ Database initialization error:', error.message);
        // Don't exit - let the app try to start anyway
    }
}

const PORT = process.env.PORT || 5000;

// Initialize database then start server
initDatabase().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`[DEBUG] Backend Server Restarted at ${new Date().toISOString()}`);
        resultFetcherService.init(); // Start Cron Jobs
        startHeartbeat(); // Start DB heartbeat to prevent sleep
    });
});

// Socket.io connection (basic)
io.on("connection", (socket) => {
    console.log("New client connected", socket.id);
    socket.on("disconnect", () => {
        console.log("Client disconnected", socket.id);
    });
});

module.exports = { app, io };
