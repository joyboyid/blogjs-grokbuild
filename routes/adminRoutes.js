/**
 * routes/adminRoutes.js
 * Protected admin routes (dashboard + post/category management)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { requireLogin } = require('../middleware/auth');
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

// Dashboard
router.get('/dashboard', adminController.dashboard);

// Posts management
router.get('/posts', postController.adminList);
router.get('/posts/create', postController.showCreateForm);

// Multer upload for create and update (featured image)
router.post('/posts/create', upload.single('featured_image'), postController.create);
router.get('/posts/:id/edit', postController.showEditForm);
router.post('/posts/:id/update', upload.single('featured_image'), postController.update);
router.post('/posts/:id/delete', postController.delete);

// Categories management
router.get('/categories', categoryController.adminList);
router.get('/categories/create', categoryController.showCreateForm);
router.post('/categories/create', categoryController.create);
router.get('/categories/:id/edit', categoryController.showEditForm);
router.post('/categories/:id/update', categoryController.update);
router.post('/categories/:id/delete', categoryController.delete);

module.exports = router;
