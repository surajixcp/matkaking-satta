const jwt = require('jsonwebtoken');
const { Admin, Role } = require('../../db/models');

/**
 * Protect admin routes - Verify JWT and populate req.admin
 */
exports.protectAdmin = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch Admin with Role
        const admin = await Admin.findByPk(decoded.id, {
            include: [{ model: Role, as: 'role' }]
        });

        if (!admin) {
            return res.status(401).json({ success: false, error: 'Admin account no longer exists' });
        }

        if (admin.status === 'blocked') {
            return res.status(403).json({ success: false, error: 'Your admin account has been blocked' });
        }

        req.admin = admin;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Not authorized token failed' });
    }
};

/**
 * Check if the authenticated admin has a specific permission
 */
exports.checkPermission = (permissionKey) => {
    return (req, res, next) => {
        if (!req.admin || !req.admin.role) {
            return res.status(403).json({ success: false, error: 'Access denied: No role assigned' });
        }

        const permissions = req.admin.role.permissions || {};

        // Super Admin has all permissions
        if (req.admin.role.name === 'Super Admin') {
            return next();
        }

        if (!permissions[permissionKey]) {
            return res.status(403).json({
                success: false,
                error: `Permission denied: ${permissionKey} required`
            });
        }

        next();
    };
};
