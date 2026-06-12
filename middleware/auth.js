/**
 * middleware/auth.js
 * Authentication & Authorization middleware
 * Protects admin routes so only logged-in admins can access CRUD
 */

const requireLogin = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    // Flash message + redirect to login
    req.flash('error', 'Please login to access the admin area.');
    return res.redirect('/auth/login');
};

/**
 * Optional: Role-based check (currently only admin exists)
 */
const requireAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    req.flash('error', 'You do not have permission to perform this action.');
    return res.redirect('/auth/login');
};

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
    requireAdmin,
    redirectIfAuthenticated
};
