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

        // Get posts with category name and author
        const [rows] = await pool.execute(
            `SELECT p.*, c.name as category_name, c.slug as category_slug,
                    COALESCE(u.name, 'Unknown') as author_name
             FROM posts p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN users u ON p.user_id = u.id
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
            `SELECT p.*, c.name as category_name, c.slug as category_slug,
                    COALESCE(u.name, 'Unknown') as author_name
             FROM posts p
             INNER JOIN categories c ON p.category_id = c.id
             LEFT JOIN users u ON p.user_id = u.id
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
            `SELECT p.*, c.name as category_name, c.slug as category_slug,
                    COALESCE(u.name, 'Unknown') as author_name
             FROM posts p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN users u ON p.user_id = u.id
             WHERE p.slug = ? 
             LIMIT 1`,
            [slug]
        );
        return rows[0] || null;
    }

    /**
     * Find by ID (for admin editing) - includes user_id for ownership check
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                `SELECT p.*, c.name as category_name, u.name as author_name
                 FROM posts p
                 LEFT JOIN categories c ON p.category_id = c.id
                 LEFT JOIN users u ON p.user_id = u.id
                 WHERE p.id = ? 
                 LIMIT 1`,
                [id]
            );
            return rows[0] || null;
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR' && err.sqlMessage.includes('user_id')) {
                console.warn('Post.findById fallback (no user_id column yet)');
                const [rows] = await pool.execute(
                    `SELECT p.*, c.name as category_name, 'Unknown' as author_name
                     FROM posts p
                     LEFT JOIN categories c ON p.category_id = c.id
                     WHERE p.id = ? 
                     LIMIT 1`,
                    [id]
                );
                return rows[0] || null;
            }
            throw err;
        }
    }

    /**
     * Get all posts for admin (with author name) - admin only
     * Note: Requires 'user_id' column on posts table (added in migration)
     */
    static async getAllForAdmin() {
        try {
            const [rows] = await pool.execute(
                `SELECT p.*, c.name as category_name, 
                        COALESCE(u.name, 'Unknown') as author_name
                 FROM posts p
                 LEFT JOIN categories c ON p.category_id = c.id
                 LEFT JOIN users u ON p.user_id = u.id
                 ORDER BY p.created_at DESC`
            );
            return rows;
        } catch (err) {
            // Fallback if user_id column doesn't exist yet (for old databases)
            console.warn('getAllForAdmin fallback (user_id column missing?):', err.message);
            const [rows] = await pool.execute(
                `SELECT p.*, c.name as category_name, 'Unknown' as author_name
                 FROM posts p
                 LEFT JOIN categories c ON p.category_id = c.id
                 ORDER BY p.created_at DESC`
            );
            return rows;
        }
    }

    /**
     * Get posts owned by a specific user (for authors - My Posts)
     */
    static async getByUserId(userId) {
        try {
            const [rows] = await pool.execute(
                `SELECT p.*, c.name as category_name,
                        COALESCE(u.name, 'Unknown') as author_name
                 FROM posts p
                 LEFT JOIN categories c ON p.category_id = c.id
                 LEFT JOIN users u ON p.user_id = u.id
                 WHERE p.user_id = ?
                 ORDER BY p.created_at DESC`,
                [userId]
            );
            return rows;
        } catch (err) {
            // Fallback if user_id column doesn't exist yet
            console.warn('getByUserId fallback (user_id column missing?):', err.message);
            const [rows] = await pool.execute(
                `SELECT p.*, c.name as category_name, 'Unknown' as author_name
                 FROM posts p
                 LEFT JOIN categories c ON p.category_id = c.id
                 ORDER BY p.created_at DESC`
            );
            return rows;
        }
    }

    /**
     * Create new post (ensures unique slug)
     */
    static async create({ title, slug, content, featured_image, category_id, tags, user_id }) {
        let finalSlug = slug || slugify(title, { lower: true, strict: true });

        // Make slug unique if necessary
        let uniqueSlug = finalSlug;
        let counter = 1;
        while (await Post.slugExists(uniqueSlug)) {
            uniqueSlug = `${finalSlug}-${counter}`;
            counter++;
        }
        finalSlug = uniqueSlug;

        const baseParams = [
            title,
            finalSlug,
            content,
            featured_image || null,
            category_id || null,
            tags || null
        ];

        try {
            // Try with user_id first (new schema)
            const [result] = await pool.execute(
                `INSERT INTO posts 
                 (title, slug, content, featured_image, category_id, tags, user_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [...baseParams, user_id || null]
            );
            return { id: result.insertId, slug: finalSlug };
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR' && err.sqlMessage.includes('user_id')) {
                // Fallback for old databases without user_id column
                console.warn('Post.create fallback (no user_id column yet)');
                const [result] = await pool.execute(
                    `INSERT INTO posts 
                     (title, slug, content, featured_image, category_id, tags) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    baseParams
                );
                return { id: result.insertId, slug: finalSlug };
            }
            throw err;
        }
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
