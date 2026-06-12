/**
 * controllers/authController.js
 * Handles Register, Login, Logout
 * Uses express-validator for input validation
 */

const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Validation rules for registration
const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
];

// Validation rules for login
const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email'),
    body('password')
        .notEmpty().withMessage('Password is required')
];

const authController = {
    // GET /auth/register
    showRegister: (req, res) => {
        res.render('pages/register', {
            title: 'Register - BlogJS',
            errors: [],
            oldInput: {}
        });
    },

    // POST /auth/register
    register: [
        ...registerValidation,
        async (req, res) => {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.render('pages/register', {
                    title: 'Register - BlogJS',
                    errors: errors.array(),
                    oldInput: req.body
                });
            }

            try {
                const { name, email, password } = req.body;

                // Check if email already registered
                const existing = await User.findByEmail(email);
                if (existing) {
                    req.flash('error', 'Email is already registered. Please login.');
                    return res.redirect('/auth/login');
                }

                // Create user (password hashed inside model)
                await User.create({ name, email, password });

                req.flash('success', 'Registration successful! Please login.');
                res.redirect('/auth/login');
            } catch (err) {
                console.error('Register error:', err);
                req.flash('error', 'Something went wrong during registration.');
                res.redirect('/auth/register');
            }
        }
    ],

    // GET /auth/login
    showLogin: (req, res) => {
        res.render('pages/login', {
            title: 'Login - BlogJS',
            errors: [],
            oldInput: {}
        });
    },

    // POST /auth/login
    login: [
        ...loginValidation,
        async (req, res) => {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.render('pages/login', {
                    title: 'Login - BlogJS',
                    errors: errors.array(),
                    oldInput: req.body
                });
            }

            try {
                const { email, password } = req.body;

                const user = await User.findByEmail(email);

                if (!user) {
                    return res.render('pages/login', {
                        title: 'Login - BlogJS',
                        errors: [{ msg: 'Invalid email or password' }],
                        oldInput: { email }
                    });
                }

                const isMatch = await User.verifyPassword(password, user.password);

                if (!isMatch) {
                    return res.render('pages/login', {
                        title: 'Login - BlogJS',
                        errors: [{ msg: 'Invalid email or password' }],
                        oldInput: { email }
                    });
                }

                // Save user in session (exclude password)
                req.session.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                };

                req.flash('success', `Welcome back, ${user.name}!`);
                res.redirect('/admin/dashboard');
            } catch (err) {
                console.error('Login error:', err);
                req.flash('error', 'Login failed. Please try again.');
                res.redirect('/auth/login');
            }
        }
    ],

    // GET /auth/logout
    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
            }
            res.redirect('/');
        });
    }
};

module.exports = authController;
