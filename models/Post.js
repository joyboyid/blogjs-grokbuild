/**
 * models/Post.js
 * Post model - Full CRUD for blog posts
 * Supports pagination, category filter, search by slug, etc.
 */

const pool = require('../config/db');
const slugify = require('slugify');

class Post {
    /**
     * Get latest posts with pagination (PUBLIC)
     * @param {number} page 
     * @param {number} limit 
     */
    static async getLatest(page = 1, limit = 6) {
        const offset = (page - 1) * limit;

        // Get posts with category name
        const [rows] = await pool.execute(
            `SELECT p.*, c.name as category_name, c.slug as category_slug
             FROM posts p
             LEFT JOIN categories c ON p.category_id = c.id
             ORDER BY p.created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        // Get total count for pagination
        const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM posts');
        const total = countRows[0].total;
        const totalPages = Math.ceil(total / limit);

        return {
            posts: rows,
            pagination: {
                current: page,
                totalPages,
                total,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    }

    /**
     * Get posts filtered by category slug + pagination
     */
    static async getByCategory(categorySlug, page = 1, limit = 6) {
        const offset = (page - 1) * limit;

        const [rows] = await pool.execute(
            `SELECT p.*, c.name as category_name, c.slug as category_slug
             FROM posts p
             INNER JOIN categories c ON p.category_id = c.id
             WHERE c.slug = ?
             ORDER BY p.created_at DESC
             LIMIT ? OFFSET ?`,
            [categorySlug, limit, offset]
        );

        const [countRows] = await pool.execute(
            `SELECT COUNT(*) as total 
             FROM posts p 
             INNER JOIN categories c ON p.category_id = c.id 
             WHERE c.slug = ?`,
            [categorySlug]
        );

        const total = countRows[0].total;
        const totalPages = Math.ceil(total / limit);

        return {
            posts: rows,
            pagination: {
                current: page,
                totalPages,
                total,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    }

    /**
     * Find single post by slug (PUBLIC detail page)
     */
    static async findBySlug(slug) {
        const [rows] = await pool.execute(
            `SELECT p.*, c.name as category_name, c.slug as category_slug
             FROM posts p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.slug = ? 
             LIMIT 1`,
            [slug]
        );
        return rows[0] || null;
    }

    /**
     * Find by ID (for admin editing)
     */
    static async findById(id) {
        const [rows] = await pool.execute(
            `SELECT p.*, c.name as category_name 
             FROM posts p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ? 
             LIMIT 1`,
            [id]
        );
        return rows[0] || null;
    }

    /**
     * Get all posts for admin dashboard (no pagination limit)
     */
    static async getAllForAdmin() {
        const [rows] = await pool.execute(
            `SELECT p.*, c.name as category_name 
             FROM posts p
             LEFT JOIN categories c ON p.category_id = c.id
             ORDER BY p.created_at DESC`
        );
        return rows;
    }

    /**
     * Create new post
     */
    static async create({ title, slug, content, featured_image, category_id, tags }) {
        const finalSlug = slug || slugify(title, { lower: true, strict: true });

        const [result] = await pool.execute(
            `INSERT INTO posts 
             (title, slug, content, featured_image, category_id, tags) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                title,
                finalSlug,
                content,
                featured_image || null,
                category_id || null,
                tags || null
            ]
        );

        return { id: result.insertId, slug: finalSlug };
    }

    /**
     * Update existing post
     */
    static async update(id, { title, slug, content, featured_image, category_id, tags }) {
        const finalSlug = slug || slugify(title, { lower: true, strict: true });

        // If no new image provided, keep existing
        let query = `UPDATE posts SET 
                        title = ?, 
                        slug = ?, 
                        content = ?, 
                        category_id = ?, 
                        tags = ?,
                        updated_at = CURRENT_TIMESTAMP`;

        const params = [title, finalSlug, content, category_id || null, tags || null];

        if (featured_image) {
            query += `, featured_image = ?`;
            params.push(featured_image);
        }

        query += ` WHERE id = ?`;
        params.push(id);

        await pool.execute(query, params);

        return { id, slug: finalSlug };
    }

    /**
     * Delete post
     */
    static async delete(id) {
        // Optionally: delete the featured image file here (future improvement)
        await pool.execute('DELETE FROM posts WHERE id = ?', [id]);
        return true;
    }

    /**
     * Check if slug is already used (for validation)
     */
    static async slugExists(slug, excludeId = null) {
        let query = 'SELECT id FROM posts WHERE slug = ?';
        const params = [slug];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const [rows] = await pool.execute(query, params);
        return rows.length > 0;
    }
}

module.exports = Post;
