/**
 * routes/authRoutes.js
 * Authentication routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { redirectIfAuthenticated } = require('../middleware/auth');

// Public registration is DISABLED
// Only existing admins can create new admin accounts via /admin/users/create
router.get('/register', (req, res) => {
    req.flash('warning', 'Public registration is disabled. Please ask an existing administrator to create an account for you.');
    res.redirect('/auth/login');
});

router.post('/register', (req, res) => {
    req.flash('warning', 'Public registration is disabled.');
    res.redirect('/auth/login');
});

// Login
router.get('/login', redirectIfAuthenticated, authController.showLogin);
router.post('/login', redirectIfAuthenticated, authController.login);

// Logout
router.get('/logout', authController.logout);

module.exports = router;
