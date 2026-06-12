/**
 * BlogJS - Main Server Entry Point
 * Clean, modern Express.js application with MariaDB + EJS
 */

require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const flash = require('connect-flash');
const fs = require('fs');

// Database connection pool
const pool = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Import middleware
const { setLocals } = require('./middleware/flash');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// Ensure uploads directory exists
// =====================================================
const uploadDir = path.join(__dirname, 'public', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory:', uploadDir);
}

// =====================================================
// View Engine Setup (EJS)
// =====================================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// =====================================================
// Static Files
// =====================================================
app.use(express.static(path.join(__dirname, 'public')));

// =====================================================
// Body Parsers (for form data + JSON)
// =====================================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// =====================================================
// Session Store with MariaDB (express-mysql-session)
// =====================================================
const sessionStoreOptions = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_blogjs',
    clearExpired: true,
    checkExpirationInterval: 900000, // 15 minutes
    expiration: 86400000, // 24 hours
    createDatabaseTable: true, // auto create sessions table
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
};

const sessionStore = new MySQLStore(sessionStoreOptions);

app.use(
    session({
        key: 'blogjs_sid',
        secret: process.env.SESSION_SECRET || 'change_this_secret_in_production',
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24, // 1 day
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' // HTTPS only in prod
        }
    })
);

// =====================================================
// Flash Messages
// =====================================================
app.use(flash());

// Make flash messages and current user available in all views
app.use(setLocals);

// =====================================================
// Routes
// =====================================================

// Public routes
app.use('/', require('./routes/publicRoutes')); // Home, post detail, category filter

// Auth routes (register/login/logout)
app.use('/auth', authRoutes);

// Admin protected routes
app.use('/admin', adminRoutes);

// API-ish routes for posts & categories (used by admin)
app.use('/posts', postRoutes);
app.use('/categories', categoryRoutes);

// =====================================================
// 404 Handler
// =====================================================
app.use((req, res) => {
    res.status(404).render('pages/404', {
        title: 'Page Not Found',
        user: req.session.user || null
    });
});

// =====================================================
// Global Error Handler
// =====================================================
app.use((err, req, res, next) => {
    console.error('Application Error:', err.stack || err);

    const statusCode = err.status || 500;
    res.status(statusCode).render('pages/error', {
        title: 'Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {},
        user: req.session.user || null
    });
});

// =====================================================
// Start Server
// =====================================================
app.listen(PORT, () => {
    console.log(`\n🚀 BlogJS is running!`);
    console.log(`   → Local: http://localhost:${PORT}`);
    console.log(`   → Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   → Database: ${process.env.DB_NAME}\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await pool.end();
    process.exit(0);
});

module.exports = app; // for testing
