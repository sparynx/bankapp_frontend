// account.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware'); // Your authentication middleware
const {
  createAccount,
  getAccounts,
  getAccountDetails,
  verifyAccount
} = require('./account.controller');

// All routes are protected and require authentication
router.use(protect);

router.post('/create', createAccount);
router.get('/list', getAccounts);
router.get('/:accountId', getAccountDetails);
router.get('/verify/:accountNumber', verifyAccount);
module.exports = router;
