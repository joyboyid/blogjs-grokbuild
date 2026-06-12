/**
 * models/User.js
 * User model - handles authentication and admin users
 * Uses mysql2 Promise pool + bcryptjs
 */

const pool = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    /**
     * Find user by email (used for login)
     */
    static async findByEmail(email) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [email]
        );
        return rows[0] || null;
    }

    /**
     * Find user by ID
     */
    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
            [id]
        );
        return rows[0] || null;
    }

    /**
     * Create new user (registration)
     * Password is automatically hashed
     */
    static async create({ name, email, password, role = 'admin' }) {
        // Hash password with bcrypt (cost factor 10 is good balance)
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            `INSERT INTO users (name, email, password, role) 
             VALUES (?, ?, ?, ?)`,
            [name, email, hashedPassword, role]
        );

        return {
            id: result.insertId,
            name,
            email,
            role
        };
    }

    /**
     * Verify password during login
     */
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Get all users (admin only)
     */
    static async getAll() {
        const [rows] = await pool.execute(
            'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        return rows;
    }

    /**
     * Update user password (for future profile feature)
     */
    static async updatePassword(id, newPassword) {
        const hashed = await bcrypt.hash(newPassword, 10);
        await pool.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashed, id]
        );
        return true;
    }
}

module.exports = User;
