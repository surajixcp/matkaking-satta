const adminService = require('../services/admin.service');
const { User } = require('../../db/models');
const jwt = require('jsonwebtoken');

exports.adminLogin = async (req, res, next) => {
    try {
        const { phone, password, mpin } = req.body;

        // Simple check for now - In production use proper password hashing
        // This assumes you manually seeded an admin user with role='admin'
        const admin = await User.findOne({ where: { phone, role: 'admin' } });

        if (!admin) {
            return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
        }

        // Verify password/MPIN using the model instance method (which handles bcrypt)
        // Note: The input field from frontend is 'password' but mapped to 'mpin' in the API call currently.
        // We will check against the hash.
        const isValid = await admin.validateMpin(mpin || password); // Check mpin or password field

        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: admin.id, role: admin.role }, process.env.JWT_SECRET, {
            expiresIn: '1d'
        });

        res.status(200).json({
            success: true,
            token,
            admin: {
                id: admin.id,
                name: admin.full_name,
                role: admin.role
            }
        });

    } catch (error) {
        next(error);
    }
};

exports.getDashboardStats = async (req, res, next) => {
    try {
        const stats = await adminService.getDashboardStats();
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

exports.getUsers = async (req, res, next) => {
    try {
        const { page, limit, search } = req.query;
        console.log(`[Admin] getUsers called. Page: ${page}, Limit: ${limit}, Search: ${search}`);
        const result = await adminService.getAllUsers(Number(page), Number(limit), search);
        console.log(`[Admin] Found ${result.users.length} users`);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('[Admin] getUsers Error:', error);
        next(error);
    }
};

exports.updateUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user = await adminService.updateUserStatus(id, status);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

exports.getPendingWithdrawals = async (req, res, next) => {
    try {
        const withdrawals = await adminService.getPendingWithdrawals();
        res.status(200).json({ success: true, data: withdrawals });
    } catch (error) {
        next(error);
    }
};
