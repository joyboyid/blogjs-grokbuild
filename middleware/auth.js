/**
 * middleware/auth.js
 * Authentication & Authorization middleware
 * Supports roles: 'admin' (full access) and 'author' (only posts CRUD)
 */

const requireLogin = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    req.flash('error', 'Please login to access the admin area.');
    return res.redirect('/auth/login');
};

/**
 * Require specific role(s)
 * Usage: requireRole('admin') or requireRole(['admin', 'author'])
 */
const requireRole = (roles) => {
    const allowed = Array.isArray(roles) ? roles : [roles];
    
    return (req, res, next) => {
        const user = req.session && req.session.user;
        
        if (user && allowed.includes(user.role)) {
            return next();
        }
        
        req.flash('error', 'You do not have permission to access this page.');
        return res.redirect('/admin/dashboard');
    };
};

// Convenience middleware for admin only
const requireAdmin = requireRole('admin');

// For authors and admins (post management)
const requireAuthorOrAdmin = requireRole(['admin', 'author']);

/**
 * Middleware to prevent logged-in users from accessing login/register pages
 */
const redirectIfAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return res.redirect('/admin/dashboard');
    }
    next();
};

module.exports = {
    requireLogin,
    requireRole,
    requireAdmin,
    requireAuthorOrAdmin,
    redirectIfAuthenticated
};
