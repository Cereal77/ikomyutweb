const express = require('express');
const { sendContactEmail } = require('../controllers/contactController');

const router = express.Router();

// POST /api/contact - Send contact message
router.post('/', sendContactEmail);

module.exports = router;
