/**
 * config/db.js
 * MariaDB Connection Pool using mysql2 with Promises
 * Provides a single reusable pool across the application
 */

const mysql = require('mysql2/promise');

// Create connection pool (better than single connection for production)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_blogjs',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Important for MariaDB + modern apps
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // Return results as plain objects (not RowDataPacket)
    rowsAsArray: false
});

// Test connection on startup
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to MariaDB successfully');
        console.log(`   Database: ${process.env.DB_NAME}`);
        connection.release();
    } catch (error) {
        console.error('❌ Failed to connect to MariaDB:');
        console.error('   ', error.message);
        console.error('\n   Please check your .env configuration and that MariaDB is running.');
        process.exit(1);
    }
})();

module.exports = pool;
