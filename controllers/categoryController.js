/**
 * controllers/categoryController.js
 * Category CRUD for admin
 * Includes slug validation to prevent duplicates
 */

const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const slugify = require('slugify');

const categoryValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Category name is required')
        .isLength({ min: 2, max: 100 })
];

const categoryController = {
    // Admin list
    async adminList(req, res) {
        try {
            const categories = await Category.getAll();
            res.render('admin/categories', {
                title: 'Manage Categories',
                categories,
                errors: [],
                oldInput: {},

            });
        } catch (err) {
            console.error(err);
            req.flash('error', 'Failed to load categories.');
            res.redirect('/admin/dashboard');
        }
    },

    // Show create form (we use the same page with modal or separate simple form)
    showCreateForm(req, res) {
        res.render('admin/category-form', {
            title: 'Create Category',
            category: null,
            errors: [],
            oldInput: {},
            layout: 'admin/layout'
        });
    },

    // Create
    create: [
        ...categoryValidation,
        async (req, res) => {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.render('admin/category-form', {
                    title: 'Create Category',
                    category: null,
                    errors: errors.array(),
                    oldInput: req.body,
    
                });
            }

            try {
                const { name } = req.body;
                const slug = slugify(name, { lower: true, strict: true });

                const exists = await Category.slugExists(slug);
                if (exists) {
                    return res.render('admin/category-form', {
                        title: 'Create Category',
                        category: null,
                        errors: [{ msg: 'A category with similar name already exists' }],
                        oldInput: req.body,
        
                    });
                }

                await Category.create({ name, slug });
                req.flash('success', 'Category created successfully!');
                res.redirect('/admin/categories');
            } catch (err) {
                console.error(err);
                req.flash('error', 'Failed to create category.');
                res.redirect('/admin/categories');
            }
        }
    ],

    // Edit form
    async showEditForm(req, res) {
        const category = await Category.findById(req.params.id);
        if (!category) {
            req.flash('error', 'Category not found.');
            return res.redirect('/admin/categories');
        }

        res.render('admin/category-form', {
            title: 'Edit Category',
            category,
            errors: [],
            oldInput: category,
            layout: 'admin/layout'
        });
    },

    // Update
    update: [
        ...categoryValidation,
        async (req, res) => {
            const { id } = req.params;
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                const category = await Category.findById(id);
                return res.render('admin/category-form', {
                    title: 'Edit Category',
                    category: category || { id },
                    errors: errors.array(),
                    oldInput: req.body,
    
                });
            }

            try {
                const { name } = req.body;
                const slug = slugify(name, { lower: true, strict: true });

                const exists = await Category.slugExists(slug, id);
                if (exists) {
                    const category = await Category.findById(id);
                    return res.render('admin/category-form', {
                        title: 'Edit Category',
                        category,
                        errors: [{ msg: 'Slug already used by another category' }],
                        oldInput: req.body,
        
                    });
                }

                await Category.update(id, { name, slug });
                req.flash('success', 'Category updated successfully!');
                res.redirect('/admin/categories');
            } catch (err) {
                console.error(err);
                req.flash('error', 'Failed to update category.');
                res.redirect('/admin/categories');
            }
        }
    ],

    // Delete
    async delete(req, res) {
        try {
            await Category.delete(req.params.id);
            req.flash('success', 'Category deleted. Posts in this category are now uncategorized.');
        } catch (err) {
            console.error(err);
            req.flash('error', 'Failed to delete category.');
        }
        res.redirect('/admin/categories');
    }
};

module.exports = categoryController;
