const jwt = require('jsonwebtoken');
const { User } = require('../../db/models');

/**
 * Protect routes - Verify JWT
 */
exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    console.log('[Auth Middleware] Token present:', !!token);

    if (!token) {
        console.log('[Auth Middleware] No token provided');
        return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[Auth Middleware] Token decoded, user ID:', decoded.id);
        req.user = await User.findByPk(decoded.id);

        if (!req.user) {
            console.log('[Auth Middleware] User not found for ID:', decoded.id);
            return res.status(401).json({ success: false, error: 'User not found with this id' });
        }

        console.log('[Auth Middleware] User found:', req.user.id, req.user.role);
        next();
    } catch (error) {
        console.log('[Auth Middleware] Token verification failed:', error.message);
        return res.status(401).json({ success: false, error: 'Not authorized token failed' });
    }
};

/**
 * Grant access to specific roles
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};
