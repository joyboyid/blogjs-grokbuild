/**
 * controllers/adminController.js
 * Admin Dashboard
 */

const Post = require('../models/Post');
const Category = require('../models/Category');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

const adminController = {
    async dashboard(req, res) {
        try {
            const user = req.session.user;
            const isAuthor = user && user.role === 'author';

            let posts, recentPosts, totalPosts;
            if (isAuthor) {
                posts = await Post.getByUserId(user.id);
                totalPosts = posts.length;
                recentPosts = posts.slice(0, 5);
            } else {
                posts = await Post.getAllForAdmin();
                totalPosts = posts.length;
                recentPosts = posts.slice(0, 5);
            }

            const categories = isAuthor ? [] : await Category.getAll();

            // Simple stats
            const stats = {
                totalPosts: totalPosts,
                totalCategories: categories.length,
                recentPosts: recentPosts
            };

            res.render('admin/dashboard', {
                title: 'Admin Dashboard - BlogJS',
                stats,
                user: user || null,
                userRole: user ? user.role : 'admin'
            });
        } catch (err) {
            console.error('Dashboard error:', err);
            req.flash('error', 'Failed to load dashboard.');
            res.render('admin/dashboard', {
                title: 'Admin Dashboard',
                stats: { totalPosts: 0, totalCategories: 0, recentPosts: [] },
                user: req.session.user || null,
                userRole: req.session.user ? req.session.user.role : 'admin'
            });
        }
    },

    // List all users (admin only)
    async usersList(req, res) {
        try {
            const users = await User.getAll();
            res.render('admin/users', {
                title: 'All Users - Admin',
                users,
                user: req.session.user || null
            });
        } catch (err) {
            console.error(err);
            req.flash('error', 'Failed to load users.');
            res.redirect('/admin/dashboard');
        }
    },

    async deleteUser(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const currentUser = req.session.user;

            if (userId === currentUser.id) {
                req.flash('error', 'You cannot delete your own account.');
                return res.redirect('/admin/users');
            }

            await User.delete(userId);
            req.flash('success', 'User deleted successfully.');
        } catch (err) {
            console.error(err);
            req.flash('error', 'Failed to delete user.');
        }
        res.redirect('/admin/users');
    },

    // Show form to create new admin user (only accessible by logged-in admins)
    showCreateUserForm(req, res) {
        res.render('admin/user-form', {
            title: 'Create New User',
            errors: [],
            oldInput: {},
            user: req.session.user || null
        });
    },

    // Create new admin user
    createUser: [
        body('name')
            .trim()
            .notEmpty().withMessage('Name is required')
            .isLength({ min: 2, max: 100 }),
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
            }),

        async (req, res) => {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.render('admin/user-form', {
                    title: 'Create New Admin User',
                    errors: errors.array(),
                    oldInput: req.body,
                    user: req.session.user || null
                });
            }

            try {
                const { name, email, password, role } = req.body;
                const finalRole = (role === 'author') ? 'author' : 'admin';

                // Basic validation for role
                if (!['admin', 'author'].includes(finalRole)) {
                    return res.render('admin/user-form', {
                        title: 'Create New User',
                        errors: [{ msg: 'Invalid role selected' }],
                        oldInput: req.body,
                        user: req.session.user || null
                    });
                }

                // Check if email already exists
                const existing = await User.findByEmail(email);
                if (existing) {
                    return res.render('admin/user-form', {
                        title: 'Create New User',
                        errors: [{ msg: 'Email is already registered' }],
                        oldInput: req.body,
                        user: req.session.user || null
                    });
                }

                // Create the new user (password will be hashed in model)
                await User.create({ name, email, password, role: finalRole });

                const roleLabel = finalRole === 'author' ? 'Author' : 'Admin';
                req.flash('success', `New ${roleLabel} user "${name}" has been created successfully!`);
                res.redirect('/admin/users');
            } catch (err) {
                console.error('Create user error:', err);
                if (err.code === 'WARN_DATA_TRUNCATED' || err.sqlMessage.includes('truncated')) {
                    req.flash('error', 'Failed to create user. The database ENUM for role might be outdated. Please run the ALTER TABLE command to add "author" to the role ENUM.');
                } else {
                    req.flash('error', 'Failed to create new user.');
                }
                res.redirect('/admin/users/create');
            }
        }
    ]
};

module.exports = adminController;
