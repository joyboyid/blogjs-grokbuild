/**
 * controllers/adminController.js
 * Admin Dashboard
 */

const Post = require('../models/Post');
const Category = require('../models/Category');

const adminController = {
    async dashboard(req, res) {
        try {
            const posts = await Post.getAllForAdmin();
            const categories = await Category.getAll();

            // Simple stats
            const stats = {
                totalPosts: posts.length,
                totalCategories: categories.length,
                recentPosts: posts.slice(0, 5)
            };

            res.render('admin/dashboard', {
                title: 'Admin Dashboard - BlogJS',
                stats,

            });
        } catch (err) {
            console.error('Dashboard error:', err);
            req.flash('error', 'Failed to load dashboard.');
            res.render('admin/dashboard', {
                title: 'Admin Dashboard',
                stats: { totalPosts: 0, totalCategories: 0, recentPosts: [] },

            });
        }
    }
};

module.exports = adminController;
