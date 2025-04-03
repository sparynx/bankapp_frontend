// transaction.routes.js
const express = require('express');
const router = express.Router();
const { createTransaction, getTransactionHistory, setTransactionPin, getTransactionPin  } = require('./transaction.controller');
const { protect } = require('../middleware/authmiddleware');

router.use(protect);

router.post('/transfer', createTransaction);
router.get('/history', getTransactionHistory);
router.post('/set-pin', setTransactionPin);
router.get('/pin/:accountNumber', getTransactionPin);

module.exports = router;