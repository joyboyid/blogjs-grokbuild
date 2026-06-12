/**
 * models/Category.js
 * Category model - CRUD for blog categories
 * Slug is generated on frontend/controller layer using slugify
 */

const pool = require('../config/db');
const slugify = require('slugify');

class Category {
    /**
     * Get all categories (ordered by name)
     */
    static async getAll() {
        const [rows] = await pool.execute(
            'SELECT * FROM categories ORDER BY name ASC'
        );
        return rows;
    }

    /**
     * Find category by ID
     */
    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM categories WHERE id = ? LIMIT 1',
            [id]
        );
        return rows[0] || null;
    }

    /**
     * Find category by slug (for public filtering)
     */
    static async findBySlug(slug) {
        const [rows] = await pool.execute(
            'SELECT * FROM categories WHERE slug = ? LIMIT 1',
            [slug]
        );
        return rows[0] || null;
    }

    /**
     * Create new category
     */
    static async create({ name, slug }) {
        // Auto generate slug if not provided
        const finalSlug = slug || slugify(name, { lower: true, strict: true });

        const [result] = await pool.execute(
            'INSERT INTO categories (name, slug) VALUES (?, ?)',
            [name, finalSlug]
        );

        return {
            id: result.insertId,
            name,
            slug: finalSlug
        };
    }

    /**
     * Update category
     */
    static async update(id, { name, slug }) {
        const finalSlug = slug || slugify(name, { lower: true, strict: true });

        await pool.execute(
            'UPDATE categories SET name = ?, slug = ? WHERE id = ?',
            [name, finalSlug, id]
        );

        return { id, name, slug: finalSlug };
    }

    /**
     * Delete category
     * Posts with this category will have category_id set to NULL (see FK constraint)
     */
    static async delete(id) {
        await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
        return true;
    }

    /**
     * Check if slug already exists (useful for validation)
     */
    static async slugExists(slug, excludeId = null) {
        let query = 'SELECT id FROM categories WHERE slug = ?';
        const params = [slug];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const [rows] = await pool.execute(query, params);
        return rows.length > 0;
    }
}

module.exports = Category;
