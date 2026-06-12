/**
 * routes/categoryRoutes.js
 * Optional dedicated category routes
 */

const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Simple JSON endpoint (future use)
router.get('/', async (req, res) => {
    const categories = await Category.getAll();
    res.json(categories);
});

module.exports = router;
