/**
 * routes/adminRoutes.js
 * Protected admin routes (dashboard + post/category management)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { requireLogin, requireAdmin, requireAuthorOrAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const postController = require('../controllers/postController');
const categoryController = require('../controllers/categoryController');

// =====================================================
// Multer configuration for featured image uploads
// =====================================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'public', 'uploads'));
    },
    filename: function (req, file, cb) {
        // Create unique filename: timestamp-random-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'post-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: function (req, file, cb) {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const extname = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowed.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files (jpg, png, gif, webp) are allowed!'));
    }
});

// All routes below require login
router.use(requireLogin);

// Dashboard - accessible by both admin and author
router.get('/dashboard', adminController.dashboard);

// Posts management
// /admin/posts = all posts (admin only)
// /admin/myposts = own posts (author + admin)
router.get('/posts', requireAdmin, postController.adminList);
router.get('/myposts', requireAuthorOrAdmin, postController.myPostsList);

router.get('/posts/create', requireAuthorOrAdmin, postController.showCreateForm);
router.post('/posts/create', requireAuthorOrAdmin, upload.single('featured_image'), postController.create);
router.get('/posts/:id/edit', requireAuthorOrAdmin, postController.showEditForm);
router.post('/posts/:id/update', requireAuthorOrAdmin, upload.single('featured_image'), postController.update);
router.post('/posts/:id/delete', requireAuthorOrAdmin, postController.delete);

// Categories management - admin only
router.get('/categories', requireAdmin, categoryController.adminList);
router.get('/categories/create', requireAdmin, categoryController.showCreateForm);
router.post('/categories/create', requireAdmin, categoryController.create);
router.get('/categories/:id/edit', requireAdmin, categoryController.showEditForm);
router.post('/categories/:id/update', requireAdmin, categoryController.update);
router.post('/categories/:id/delete', requireAdmin, categoryController.delete);

// Admin User Management - admin only
router.get('/users', requireAdmin, adminController.usersList);
router.get('/users/create', requireAdmin, adminController.showCreateUserForm);
router.post('/users/create', requireAdmin, adminController.createUser);
router.post('/users/:id/delete', requireAdmin, adminController.deleteUser);

module.exports = router;
