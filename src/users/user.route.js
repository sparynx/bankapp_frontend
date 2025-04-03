const express = require('express');
const router = express.Router();
const { createUser, loginUser, getUserDetails } = require('./user.controller');
const { protect } = require('../middleware/authmiddleware');

// Route for user registration
router.post('/create', createUser);

// Route for user login
router.post('/login', loginUser);

// Route for getting user details (protected route)
router.get('/me', getUserDetails);

module.exports = router;