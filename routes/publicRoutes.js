/**
 * routes/publicRoutes.js
 * Public-facing blog routes (no auth required)
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const postController = require('../controllers/postController');
const Category = require('../models/Category');

// Home page - list latest posts with pagination
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const data = await postController.getHomePosts(page);

    const categories = await Category.getAll();

    res.render('pages/home', {
        title: 'BlogJS - Modern Blog',
        posts: data.posts,
        pagination: data.pagination,
        categories,
        currentCategory: null
    });
});

// Category filter page
router.get('/category/:slug', async (req, res) => {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;

    const category = await Category.findBySlug(slug);
    if (!category) {
        req.flash('error', 'Category not found.');
        return res.redirect('/');
    }

    const data = await postController.getCategoryPosts(slug, page);
    const categories = await Category.getAll();

    res.render('pages/home', {
        title: `${category.name} - BlogJS`,
        posts: data.posts,
        pagination: data.pagination,
        categories,
        currentCategory: category
    });
});

// Single post detail (SEO friendly with slug)
router.get('/post/:slug', async (req, res) => {
    const post = await postController.getPostBySlug(req.params.slug);

    if (!post) {
        return res.status(404).render('pages/404', {
            title: 'Post Not Found'
        });
    }

    const categories = await Category.getAll();

    res.render('pages/post-detail', {
        title: post.title,
        post,
        categories,
        metaDescription: post.content.replace(/<[^>]+>/g, '').substring(0, 160) // basic excerpt
    });
});

// =====================================================
// About Page
// =====================================================
router.get('/about', (req, res) => {
    res.render('pages/about', {
        title: 'About Us - BlogJS'
    });
});

// =====================================================
// Contact Us Page + Form Handler
// =====================================================
router.get('/contact', (req, res) => {
    res.render('pages/contact', {
        title: 'Contact Us - BlogJS',
        oldInput: {}
    });
});

// Handle contact form submission
const contactValidation = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 150 }),
    body('message').trim().notEmpty().withMessage('Message cannot be empty').isLength({ min: 10, max: 2000 })
];

router.post('/contact', contactValidation, (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.render('pages/contact', {
            title: 'Contact Us - BlogJS',
            oldInput: req.body,
            errors: errors.array()
        });
    }

    // In a real app you would send email here (nodemailer, etc.)
    // For now we just show a success flash message
    req.flash('success', 'Thank you! Your message has been received. We will get back to you soon.');
    
    // Redirect back to contact page (or home)
    res.redirect('/contact');
});

module.exports = router;
