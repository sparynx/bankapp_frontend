// transaction.controller.js
const Transaction = require('./transaction.model');
const Account = require('../account/accouunt.model');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const createTransaction = async (req, res) => {
  let session;
  
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    
    const { receiverAccountNumber, amount, senderAccountNumber, transactionPin } = req.body;
    
    if (!transactionPin) {
      return res.status(400).json({
        success: false,
        message: 'Transaction PIN is required'
      });
    }

    // Find sender's account - IMPORTANT: include '+transactionPin' to select the PIN field
    const senderAccount = await Account.findOne({ 
      userId: req.user._id,
      accountNumber: senderAccountNumber 
    }).select('+transactionPin').session(session);

    if (!senderAccount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Sender account not found'
      });
    }
    
    // Verify if PIN has been set
    if (!senderAccount.isPinSet || !senderAccount.transactionPin) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Transaction PIN not set. Please set your PIN first.'
      });
    }
    
    // Verify transaction PIN directly with bcrypt
    const isPinValid = await bcrypt.compare(transactionPin, senderAccount.transactionPin);
    
    if (!isPinValid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({
        success: false,
        message: 'Invalid transaction PIN'
      });
    }

    // Find receiver with session
    const receiverAccount = await Account.findOne({ 
      accountNumber: receiverAccountNumber 
    }).session(session);
    
    if (!receiverAccount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Receiver account not found'
      });
    }

    // Prevent self-transfer
    if (senderAccount._id.toString() === receiverAccount._id.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer to same account'
      });
    }

    // Validate currencies match
    if (senderAccount.currency !== receiverAccount.currency) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Currency mismatch between accounts'
      });
    }

    // Check sufficient balance
    if (senderAccount.balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Create transaction record
    const transaction = new Transaction({
      senderId: senderAccount._id,
      receiverId: receiverAccount._id,
      amount,
      currency: senderAccount.currency
    });

    // Update account balances
    senderAccount.balance -= amount;
    receiverAccount.balance += amount;

    // Save changes
    await transaction.save({ session });
    await senderAccount.save({ session });
    await receiverAccount.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Transaction completed successfully',
      transaction: {
        reference: transaction.reference,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        createdAt: transaction.createdAt
      }
    });
  } catch (error) {
    console.error('Transaction error:', error);
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error('Error aborting transaction:', abortError);
      }
    }
    res.status(500).json({
      success: false,
      message: 'Error processing transaction',
      error: error.message
    });
  } finally {
    if (session) {
      try {
        session.endSession();
      } catch (endSessionError) {
        console.error('Error ending session:', endSessionError);
      }
    }
  }
};

const getTransactionHistory = async (req, res) => {
  try {
    const userAccount = await Account.findOne({ userId: req.user._id });
    
    if (!userAccount) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    const transactions = await Transaction.find({
      $or: [
        { senderId: userAccount._id },
        { receiverId: userAccount._id }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('senderId receiverId', 'accountNumber accountType');

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error('Fetch transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
};

// Add controller method to set/update transaction PIN
// Controller
const setTransactionPin = async (req, res) => {
  try {
    const { pin, accountNumber } = req.body;
    
    // Validate PIN format
    if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be a 4-digit number'
      });
    }
    
    // Find account
    const account = await Account.findOne({ 
      userId: req.user._id,
      accountNumber
    });
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }
    
    // Set the PIN using the method from the schema
    try {
      await account.setTransactionPin(pin);
      
      res.status(200).json({
        success: true,
        message: 'Transaction PIN set successfully'
      });
    } catch (err) {
      if (err.message.includes('already set')) {
        return res.status(400).json({
          success: false,
          message: 'Transaction PIN is already set for this account'
        });
      }
      throw err;
    }
    
  } catch (error) {
    console.error('Set transaction PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting transaction PIN',
      error: error.message
    });
  }
};

const getTransactionPin = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    
    // Find account
    const account = await Account.findOne({ 
      userId: req.user._id,
      accountNumber
    });
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Return the actual PIN instead of masking it
    res.status(200).json({
      success: true,
      pin: account.transactionPin || null,
      isPinSet: account.isPinSet
    });
  } catch (error) {
    console.error('Get transaction PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction PIN',
      error: error.message
    });
  }
};

module.exports = {
  createTransaction,
  getTransactionHistory,
  setTransactionPin,
  getTransactionPin
};