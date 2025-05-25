const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register admin
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Login admin & get token
// @access  Public
router.post('/login', authController.login);

// @route   GET api/auth/me
// @desc    Get current admin
// @access  Private
router.get('/me', auth, authController.getCurrentAdmin);

module.exports = router;
