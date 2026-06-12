-- =====================================================
-- Database: db_blogjs
-- Complete Schema for BlogJS Application
-- =====================================================

-- Create database (run this manually if needed)
-- CREATE DATABASE IF NOT EXISTS db_blogjs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE db_blogjs;

-- Drop tables if exist (for clean reinstall)
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS sessions; -- for connect-mariadb-session

-- =====================================================
-- Table: users
-- Stores admin users for authentication
-- =====================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- bcrypt hashed
    role ENUM('admin', 'user') DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: categories
-- Blog categories with SEO-friendly slug
-- =====================================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: posts
-- Main blog posts. Content stored as HTML (from Quill.js rich text editor)
-- Tags stored as comma-separated string for simplicity
-- =====================================================
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content LONGTEXT NOT NULL, -- HTML content from rich editor
    featured_image VARCHAR(255) DEFAULT NULL, -- path to uploaded image e.g. /uploads/filename.jpg
    category_id INT DEFAULT NULL,
    tags VARCHAR(500) DEFAULT NULL, -- comma separated: "tech,nodejs,web"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key
    CONSTRAINT fk_post_category 
        FOREIGN KEY (category_id) 
        REFERENCES categories(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    
    -- Useful indexes for performance
    INDEX idx_slug (slug),
    INDEX idx_category (category_id),
    INDEX idx_created (created_at),
    FULLTEXT INDEX idx_search (title, content) -- optional for simple search
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: sessions (for express-session + connect-mariadb-session)
-- This table is auto-created by the session store, but we declare it here for completeness.
-- You can let the library create it automatically on first run.
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(128) NOT NULL PRIMARY KEY,
    expires INT UNSIGNED NOT NULL,
    data MEDIUMTEXT,
    INDEX idx_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SEED DATA (Optional but useful for development)
-- =====================================================

-- Default admin user
-- Password: admin123
-- IMPORTANT: After first login, immediately change this password!
INSERT INTO users (name, email, password, role) VALUES 
('Admin BlogJS', 'admin@blogjs.local', '$2a$10$d6UmURQHV/M7M2YLion0e.SO4rWDfL5DyEqqZMk7gRgCwXlMX/BKi', 'admin');
-- The hash above was generated with bcryptjs (cost 10) for the password "admin123"

-- Sample categories
INSERT INTO categories (name, slug) VALUES 
('Technology', 'technology'),
('Web Development', 'web-development'),
('Node.js', 'nodejs'),
('Database', 'database'),
('Tutorial', 'tutorial');

-- Sample posts (optional)
INSERT INTO posts (title, slug, content, category_id, tags, featured_image) VALUES 
('Welcome to BlogJS', 'welcome-to-blogjs', 
'<p>This is your first blog post created with BlogJS. You can edit or delete it from the admin panel.</p><p>Enjoy building with Node.js + Express + MariaDB + EJS!</p>', 
1, 'blogjs,nodejs,express', NULL),

('Getting Started with Express.js', 'getting-started-with-expressjs', 
'<h2>Introduction</h2><p>Express.js is a fast, unopinionated, minimalist web framework for Node.js.</p><p>It provides a robust set of features for web and mobile applications.</p>', 
2, 'express,nodejs,backend', NULL);

-- =====================================================
-- End of schema
-- =====================================================
