// transaction.model.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [100, 'Amount must be greater than  NGN 100']
  },
  currency: {
    type: String,
    required: true,
    enum: ['NGN', 'EUR', 'GBP', 'USD'],
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  reference: {
    type: String,
    unique: true
  },


}, { timestamps: true });

// Generate unique transaction reference
transactionSchema.pre('validate', function(next) {
  if (this.isNew && !this.reference) {
    this.reference = 'TRX' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Add this line to export the model
module.exports = Transaction;