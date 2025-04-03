const Account = require('./accouunt.model'); // Fix the import name
const mongoose = require('mongoose');

// Create a new account
const createAccount = async (req, res) => {
    try {
      console.log('Creating account with body:', req.body);
      console.log('Authenticated user:', req.user._id);
  
      const { accountName, accountType, currency, initialBalance } = req.body;
  
      // Validate required fields
      if (!accountType || !currency || !accountName) {
        return res.status(400).json({
          success: false,
          message: 'Account type, currency, and account name are required'
        });
      }
  
      // Validate initial balance if provided
      const balance = initialBalance ? Number(initialBalance) : 0;
      if (isNaN(balance) || balance < 0) {
        return res.status(400).json({
          success: false,
          message: 'Initial balance must be a valid positive number'
        });
      }
  
      const newAccount = new Account({
        userId: req.user._id,
        accountType: accountType.toLowerCase(),
        currency: currency.toUpperCase(),
        balance: balance,
        accountName: accountName.trim() // Ensure the account name is properly trimmed
      });
  
      console.log('Account object before save:', newAccount);
  
      const savedAccount = await newAccount.save();
      console.log('Saved account:', savedAccount);
  
      // Include accountName in the response
      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        account: {
          ...savedAccount.toObject(),
          accountName: savedAccount.accountName // Explicitly include accountName
        }
      });
    } catch (error) {
      console.error('Detailed error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        errors: error.errors
      });
  
      res.status(500).json({
        success: false,
        message: 'Error creating account',
        error: error.message
      });
    }
};

// Get user's accounts
const getAccounts = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const accounts = await Account.find({ userId })
      .sort({ createdAt: -1 })
      .select('-__v');
    
    res.status(200).json({
      success: true,
      count: accounts.length,
      accounts: accounts.map(account => ({
        ...account.toObject(),
        accountName: account.accountName // Explicitly include accountName
      }))
    });
  } catch (error) {
    console.error('Fetch accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching accounts',
      error: error.message
    });
  }
};

// Get specific account details
const getAccountDetails = async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account ID format'
      });
    }

    const account = await Account.findOne({
      _id: accountId,
      userId
    }).select('-__v');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found or unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      account: {
        ...account.toObject(),
        accountName: account.accountName // Explicitly include accountName
      }
    });
  } catch (error) {
    console.error('Fetch account details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching account details',
      error: error.message
    });
  }
};

const verifyAccount = async (req, res) => {
  try {
    const { accountNumber } = req.params;

    // Find account and select specific fields
    const account = await Account.findOne({ accountNumber })
      .select('accountName firstName lastName accountType bankName');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Return account details including accountName
    res.status(200).json({
      success: true,
      account: {
        ...account.toObject(),
        accountName: account.accountName
      }
    });
  } catch (error) {
    console.error('Account verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying account',
      error: error.message
    });
  }
};

module.exports = {
  createAccount,
  getAccounts,
  getAccountDetails,
  verifyAccount
};