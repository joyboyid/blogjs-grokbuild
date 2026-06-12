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
    // ADMIN - LIST ALL POSTS (for admins)
    // =====================================================
    async adminList(req, res) {
        try {
            const posts = await Post.getAllForAdmin();
            const categories = await Category.getAll();

            res.render('admin/posts', {
                title: 'All Posts - Admin',
                posts,
                categories,
                isMyPosts: false,
                user: req.session.user || null
            });
        } catch (err) {
            console.error(err);
            req.flash('error', 'Failed to load posts.');
            res.redirect('/admin/dashboard');
        }
    },

    // =====================================================
    // AUTHOR - MY POSTS (only own posts)
    // =====================================================
    async myPostsList(req, res) {
        try {
            const userId = req.session.user.id;
            const posts = await Post.getByUserId(userId);
            const categories = await Category.getAll();

            res.render('admin/posts', {
                title: 'My Posts',
                posts,
                categories,
                isMyPosts: true,
                user: req.session.user || null
            });
        } catch (err) {
            console.error(err);
            req.flash('error', 'Failed to load your posts.');
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
            user: req.session.user || null
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
                    user: req.session.user || null
                });
            }

            try {
                const { title, content, category_id, tags } = req.body;
                const userId = req.session.user.id;

                // Handle featured image (uploaded by multer)
                let featured_image = null;
                if (req.file) {
                    featured_image = `/uploads/${req.file.filename}`;
                }

                // Create with owner
                await Post.create({
                    title,
                    content,
                    featured_image,
                    category_id: category_id || null,
                    tags: tags || null,
                    user_id: userId
                });

                req.flash('success', 'Post created successfully!');
                // Redirect authors to myposts, admins to all posts
                const redirectTo = req.session.user.role === 'author' ? '/admin/myposts' : '/admin/posts';
                res.redirect(redirectTo);
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
                const redirectTo = req.session.user.role === 'author' ? '/admin/myposts' : '/admin/posts';
                return res.redirect(redirectTo);
            }

            // Admins can edit any post. Authors can only edit their own.
            if (req.session.user.role !== 'admin' && post.user_id !== req.session.user.id) {
                req.flash('error', 'You can only edit your own posts.');
                return res.redirect('/admin/myposts');
            }

            const categories = await Category.getAll();

            res.render('admin/post-form', {
                title: 'Edit Post',
                post,
                categories,
                errors: [],
                oldInput: post,
                user: req.session.user || null

            });
        } catch (err) {
            console.error(err);
            req.flash('error', 'Failed to load post.');
            const redirectTo = req.session.user.role === 'author' ? '/admin/myposts' : '/admin/posts';
            res.redirect(redirectTo);
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
                    user: req.session.user || null
                });
            }

            try {
                const { title, content, category_id, tags } = req.body;
                const existingPost = await Post.findById(id);

                if (!existingPost) {
                    req.flash('error', 'Post not found.');
                    const redirectTo = req.session.user.role === 'author' ? '/admin/myposts' : '/admin/posts';
                    return res.redirect(redirectTo);
                }

                // Admins can edit any post. Authors can only edit their own.
                if (req.session.user.role !== 'admin' && existingPost.user_id !== req.session.user.id) {
                    req.flash('error', 'You can only edit your own posts.');
                    return res.redirect('/admin/myposts');
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
                const redirectTo = req.session.user.role === 'author' ? '/admin/myposts' : '/admin/posts';
                res.redirect(redirectTo);
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
            if (!post) {
                req.flash('error', 'Post not found.');
                const redirectTo = req.session.user.role === 'author' ? '/admin/myposts' : '/admin/posts';
                return res.redirect(redirectTo);
            }

            // Admins can delete any post. Authors can only delete their own.
            if (req.session.user.role !== 'admin' && post.user_id !== req.session.user.id) {
                req.flash('error', 'You can only delete your own posts.');
                return res.redirect('/admin/myposts');
            }

            if (post.featured_image) {
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

        const redirectTo = req.session.user.role === 'author' ? '/admin/myposts' : '/admin/posts';
        res.redirect(redirectTo);
    }
};

module.exports = postController;
