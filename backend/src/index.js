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
const { startHeartbeat, sequelize, User, Wallet, Admin, Role } = require('./db/models');
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

// Temporary Route to fix old results (Run once then remove)
app.get('/fix-old-results-temp', async (req, res) => {
    const resultsService = require('./app/services/results.service');
    const { Market } = require('./db/models');

    try {
        const sridevi = await Market.findOne({ where: { name: 'SRIDEVI' } });
        const milanDay = await Market.findOne({ where: { name: 'MILAN DAY' } });

        const results = [];

        if (sridevi) {
            await resultsService.reprocessResults(sridevi.id, '2026-02-16');
            await resultsService.reprocessResults(sridevi.id, '2026-02-13');
            results.push('Processed SRIDEVI for 16th and 13th');
        }

        if (milanDay) {
            await resultsService.reprocessResults(milanDay.id, '2026-02-12');
            results.push('Processed MILAN DAY for 12th');
        }

        res.json({ success: true, message: 'Batch reprocess complete', details: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
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

        // Add withdrawal columns if they don't exist
        try {
            console.log('🔄 Checking withdrawal columns...');
            await sequelize.query(`
                ALTER TABLE "WithdrawRequests" 
                ADD COLUMN IF NOT EXISTS "approved_by" INTEGER REFERENCES "Users"(id);
            `);
            await sequelize.query(`
                ALTER TABLE "WithdrawRequests" 
                ADD COLUMN IF NOT EXISTS "admin_remark" VARCHAR(255);
            `);
            console.log('✅ Withdrawal columns ready');

            console.log('🔄 Checking User bank columns...');
            await sequelize.query(`ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "bank_name" VARCHAR(255);`);
            await sequelize.query(`ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "account_number" VARCHAR(255);`);
            await sequelize.query(`ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "ifsc_code" VARCHAR(255);`);
            await sequelize.query(`ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "account_holder_name" VARCHAR(255);`);
            await sequelize.query(`ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "upi_id" VARCHAR(255);`);
            console.log('✅ User bank columns ready');

            console.log('🔄 Checking User referral columns...');
            await sequelize.query(`ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "referral_code" VARCHAR(255) UNIQUE;`);
            await sequelize.query(`ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "referred_by" INTEGER REFERENCES "Users"(id);`);
            console.log('✅ User referral columns ready');
        } catch (colError) {
            console.log('⚠️  Column check error:', colError.message);
        }

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

        // --- New RBAC Seeding ---
        console.log('🔗 Checking RBAC system...');
        let [superAdminRole] = await Role.findOrCreate({
            where: { name: 'Super Admin' },
            defaults: {
                permissions: {
                    user_view: true,
                    user_edit: true,
                    user_delete: true,
                    market_manage: true,
                    result_declare: true,
                    withdraw_approve: true,
                    deposit_approve: true,
                    settings_edit: true,
                    rbac_manage: true
                },
                description: 'Full system access'
            }
        });

        const rbacAdminPhone = '9999999999';
        const existingRbacAdmin = await Admin.findOne({ where: { phone: rbacAdminPhone } });

        if (!existingRbacAdmin) {
            console.log('👤 Seeding Super Admin role account...');
            const pinHash = await bcrypt.hash('1234', 10);
            await Admin.create({
                full_name: 'Super Admin',
                phone: rbacAdminPhone,
                pin_hash: pinHash,
                role_id: superAdminRole.id,
                status: 'active'
            });
            console.log('✅ RBAC Super Admin seeded: 9999999999 / 1234');
        } else {
            console.log('✅ RBAC Super Admin already exists');
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

        // Delay cron jobs to ensure server is fully up and ready to handle requests
        setTimeout(() => {
            console.log('⏰ Starting Cron Jobs...');
            resultFetcherService.init(); // Start Cron Jobs
            startHeartbeat(); // Start DB heartbeat to prevent sleep

            // Start OTP cleanup cron
            const { startOTPCleanupCron } = require('./cron/cleanup-otp.cron');
            startOTPCleanupCron();

            // Start DPBoss Result Fetcher Cron
            const startResultFetcher = require('./cron/fetch-results.cron');
            startResultFetcher();
        }, 10000); // 10 second delay
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
