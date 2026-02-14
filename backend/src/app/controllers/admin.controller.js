const adminService = require('../services/admin.service');
const { Admin, Role, User, sequelize } = require('../../db/models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * Admin Login using Phone and PIN
 */
exports.adminLogin = async (req, res, next) => {
    try {
        const { phone, pin } = req.body;

        if (!phone || !pin) {
            return res.status(400).json({ success: false, error: 'Phone and PIN are required' });
        }

        // 1. Find Admin by Phone
        let admin;
        try {
            admin = await Admin.findOne({
                where: { phone },
                include: [{ model: Role, as: 'role' }]
            });
        } catch (dbError) {
            console.error('Login DB Error:', dbError.message);
            // If table missing, we'll handle it in the fail-safe below
            admin = null;
        }

        // 1.1 Fail-safe: Auto-seed if Admins table is empty and trying default credentials
        if (!admin && phone === '9999999999' && pin === '1234') {
            try {
                // Ensure tables exist before counting
                await Role.sync({ alter: false });
                await Admin.sync({ alter: false });

                const adminCount = await Admin.count();
                if (adminCount === 0) {
                    console.log('Fail-safe: Auto-seeding Super Admin...');
                    let [superAdminRole] = await Role.findOrCreate({
                        where: { name: 'Super Admin' },
                        defaults: {
                            permissions: { rbac_manage: true, user_view: true, user_edit: true, user_delete: true, market_manage: true, result_declare: true, withdraw_approve: true, deposit_approve: true, settings_edit: true },
                            description: 'Full system access'
                        }
                    });

                    const pinHash = await bcrypt.hash('1234', 10);
                    admin = await Admin.create({
                        full_name: 'Super Admin',
                        phone: '9999999999',
                        pin_hash: pinHash,
                        role_id: superAdminRole.id,
                        status: 'active'
                    });

                    // Refresh admin with role
                    admin = await Admin.findOne({
                        where: { id: admin.id },
                        include: [{ model: Role, as: 'role' }]
                    });
                }
            } catch (seedError) {
                console.error('Fail-safe seeding failed:', seedError.message);
            }
        }

        if (!admin) {
            return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
        }

        if (admin.status === 'blocked') {
            return res.status(403).json({ success: false, error: 'Your admin account has been blocked' });
        }

        // 2. Verify PIN
        const isValid = await admin.validatePin(pin);

        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // 3. Generate Token
        const token = jwt.sign(
            { id: admin.id, role: admin.role?.name || 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            success: true,
            token,
            admin: {
                id: admin.id,
                name: admin.full_name,
                role: admin.role?.name,
                permissions: admin.role?.permissions || {}
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * --- ROLE MANAGEMENT ---
 */

exports.getRoles = async (req, res, next) => {
    try {
        const roles = await Role.findAll({
            include: [{
                model: Admin,
                as: 'admins',
                attributes: [[sequelize.fn('COUNT', sequelize.col('admins.id')), 'count']]
            }],
            group: ['Role.id']
        });
        res.status(200).json({ success: true, data: roles });
    } catch (error) {
        next(error);
    }
};

exports.createRole = async (req, res, next) => {
    try {
        const role = await Role.create(req.body);
        res.status(201).json({ success: true, data: role });
    } catch (error) {
        next(error);
    }
};

exports.updateRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const role = await Role.findByPk(id);
        if (!role) return res.status(404).json({ success: false, error: 'Role not found' });

        await role.update(req.body);
        res.status(200).json({ success: true, data: role });
    } catch (error) {
        next(error);
    }
};

exports.deleteRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const role = await Role.findByPk(id);
        if (!role) return res.status(404).json({ success: false, error: 'Role not found' });

        // Check if role has assigned admins
        const adminCount = await Admin.count({ where: { role_id: id } });
        if (adminCount > 0) {
            return res.status(400).json({ success: false, error: 'Cannot delete role with assigned admins' });
        }

        await role.destroy();
        res.status(200).json({ success: true, message: 'Role deleted' });
    } catch (error) {
        next(error);
    }
};

/**
 * --- ADMIN MANAGEMENT ---
 */

exports.getAdmins = async (req, res, next) => {
    try {
        const admins = await Admin.findAll({
            include: [{ model: Role, as: 'role', attributes: ['name'] }],
            attributes: { exclude: ['pin_hash'] }
        });
        res.status(200).json({ success: true, data: admins });
    } catch (error) {
        next(error);
    }
};

exports.createAdminAccount = async (req, res, next) => {
    try {
        const { phone, pin, role_id, full_name } = req.body;

        const pin_hash = await bcrypt.hash(pin, 10);

        const admin = await Admin.create({
            phone,
            pin_hash,
            role_id,
            full_name,
            created_by: req.admin?.id
        });

        res.status(201).json({ success: true, data: admin });
    } catch (error) {
        next(error);
    }
};

exports.updateAdminStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const admin = await Admin.findByPk(id);
        if (!admin) return res.status(404).json({ success: false, error: 'Admin not found' });

        admin.status = status;
        await admin.save();
        res.status(200).json({ success: true, data: admin });
    } catch (error) {
        next(error);
    }
};

exports.resetAdminPin = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { pin } = req.body;
        const admin = await Admin.findByPk(id);
        if (!admin) return res.status(404).json({ success: false, error: 'Admin not found' });

        admin.pin_hash = await bcrypt.hash(pin, 10);
        await admin.save();
        res.status(200).json({ success: true, message: 'PIN reset successful' });
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

exports.updateUserInfoByAdmin = async (req, res, next) => {
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

exports.getUserHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const history = await adminService.getUserHistory(id);
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        next(error);
    }
};
exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await adminService.deleteUser(id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};
