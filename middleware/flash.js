/**
 * middleware/flash.js
 * Makes flash messages + current user available to all EJS views
 * Also provides success/error helpers
 */

const setLocals = (req, res, next) => {
    // Flash messages (connect-flash)
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.warning = req.flash('warning');

    // Current logged in user (for navbar, etc.)
    res.locals.user = req.session.user || null;

    // Current path (useful for active nav links)
    res.locals.currentPath = req.path;

    // Site meta for SEO (can be overridden per page)
    res.locals.siteName = 'BlogJS';
    res.locals.siteDescription = 'A clean and modern blog built with Node.js, Express, MariaDB, and Bootstrap 5';

    next();
};

module.exports = { setLocals };
