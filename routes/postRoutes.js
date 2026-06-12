/**
 * routes/postRoutes.js
 * Optional dedicated post routes (currently mostly handled via admin)
 * Can be extended for public API later
 */

const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// Example: Get single post by ID (JSON) - for future use
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
