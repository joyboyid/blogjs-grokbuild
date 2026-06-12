/**
 * controllers/postController.js
 * Handles Post CRUD operations + public listing helpers
 * Uses Multer for featured image upload (handled in routes)
 * Uses express-validator
 */

const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const Category = require('../models/Category');
const path = require('path');
const fs = require('fs');

// Validation for create/update post
const postValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 255 }).withMessage('Title is too long'),
    body('content')
        .notEmpty().withMessage('Content is required'),
    body('category_id')
        .optional({ checkFalsy: true })
        .isInt().withMessage('Invalid category')
];

const postController = {
    // =====================================================
    // PUBLIC
    // =====================================================

    // Used by publicRoutes for home page
    async getHomePosts(page = 1) {
        return await Post.getLatest(page, 6);
    },

    async getCategoryPosts(categorySlug, page = 1) {
        return await Post.getByCategory(categorySlug, page, 6);
    },

    async getPostBySlug(slug) {
        return await Post.findBySlug(slug);
    },

    // =====================================================
    // ADMIN - LIST ALL POSTS
    // =====================================================
    async adminList(req, res) {
        try {
            const posts = await Post.getAllForAdmin();
            const categories = await Category.getAll();

            res.render('admin/posts', {
                title: 'Manage Posts - Admin',
                posts,
                categories,

            });
        } catch (err) {
            console.error(err);
            req.flash('error', 'Failed to load posts.');
            res.redirect('/admin/dashboard');
        }
    },

    // =====================================================
    // ADMIN - SHOW CREATE FORM
    // =====================================================
    async showCreateForm(req, res) {
        const categories = await Category.getAll();
        res.render('admin/post-form', {
            title: 'Create New Post',
            post: null,
            categories,
            errors: [],
            oldInput: {},
            layout: 'admin/layout'
        });
    },

    // =====================================================
    // ADMIN - CREATE POST
    // =====================================================
    create: [
        ...postValidation,
        async (req, res) => {
            const errors = validationResult(req);
            const categories = await Category.getAll();

            if (!errors.isEmpty()) {
                return res.render('admin/post-form', {
                    title: 'Create New Post',
                    post: null,
                    categories,
                    errors: errors.array(),
                    oldInput: req.body,
    
                });
            }

            try {
                const { title, content, category_id, tags } = req.body;

                // Handle featured image (uploaded by multer)
                let featured_image = null;
                if (req.file) {
                    featured_image = `/uploads/${req.file.filename}`;
                }

                // Check slug uniqueness (auto-generated in model)
                await Post.create({
                    title,
                    content,
                    featured_image,
                    category_id: category_id || null,
                    tags: tags || null
                });

                req.flash('success', 'Post created successfully!');
                res.redirect('/admin/posts');
            } catch (err) {
                console.error('Create post error:', err);
                req.flash('error', 'Failed to create post.');
                res.redirect('/admin/posts/create');
            }
        }
    ],

    // =====================================================
    // ADMIN - SHOW EDIT FORM
    // =====================================================
    async showEditForm(req, res) {
        try {
            const post = await Post.findById(req.params.id);
            if (!post) {
                req.flash('error', 'Post not found.');
                return res.redirect('/admin/posts');
            }

            const categories = await Category.getAll();

            res.render('admin/post-form', {
                title: 'Edit Post',
                post,
                categories,
                errors: [],
                oldInput: post,

            });
        } catch (err) {
            console.error(err);
            req.flash('error', 'Failed to load post.');
            res.redirect('/admin/posts');
        }
    },

    // =====================================================
    // ADMIN - UPDATE POST
    // =====================================================
    update: [
        ...postValidation,
        async (req, res) => {
            const { id } = req.params;
            const errors = validationResult(req);
            const categories = await Category.getAll();

            if (!errors.isEmpty()) {
                const post = await Post.findById(id);
                return res.render('admin/post-form', {
                    title: 'Edit Post',
                    post: post || { id },
                    categories,
                    errors: errors.array(),
                    oldInput: req.body,
    
                });
            }

            try {
                const { title, content, category_id, tags } = req.body;
                const existingPost = await Post.findById(id);

                if (!existingPost) {
                    req.flash('error', 'Post not found.');
                    return res.redirect('/admin/posts');
                }

                let featured_image = null;
                if (req.file) {
                    // Delete old image if exists
                    if (existingPost.featured_image) {
                        const oldPath = path.join(__dirname, '..', 'public', existingPost.featured_image);
                        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                    }
                    featured_image = `/uploads/${req.file.filename}`;
                }

                await Post.update(id, {
                    title,
                    content,
                    featured_image,
                    category_id: category_id || null,
                    tags: tags || null
                });

                req.flash('success', 'Post updated successfully!');
                res.redirect('/admin/posts');
            } catch (err) {
                console.error('Update post error:', err);
                req.flash('error', 'Failed to update post.');
                res.redirect(`/admin/posts/${id}/edit`);
            }
        }
    ],

    // =====================================================
    // ADMIN - DELETE POST
    // =====================================================
    async delete(req, res) {
        try {
            const post = await Post.findById(req.params.id);
            if (post && post.featured_image) {
                const imagePath = path.join(__dirname, '..', 'public', post.featured_image);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            await Post.delete(req.params.id);
            req.flash('success', 'Post deleted successfully.');
        } catch (err) {
            console.error('Delete post error:', err);
            req.flash('error', 'Failed to delete post.');
        }
        res.redirect('/admin/posts');
    }
};

module.exports = postController;
