const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const accountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    accountNumber: {
        type: String,
        unique: true
    },
    accountType: {
        type: String,
        required: true,
        enum: ['savings', 'checking', 'business', 'current'],
        lowercase: true
    },
    accountName: {
        type: String,
        required: true
    },
    currency: {
        type: String,
        required: true,
        enum: ['NGN', 'EUR', 'GBP', 'USD'],
        uppercase: true
    },
    balance: {
        type: Number,
        default: 0
    },
    transactionPin: {
        type: String,
        select: false // Don't return PIN in normal queries
    },
    isPinSet: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Generate account number before validation
accountSchema.pre('validate', async function (next) {
    try {
        if (this.isNew && !this.accountNumber) {
            const maxAttempts = 10;
            let attempts = 0;

            while (attempts < maxAttempts) {
                const randomNum = Math.floor(Math.random() * 9000000000) + 1000000000;
                const tempAccountNumber = randomNum.toString();

                // Check if account number exists
                const existingAccount = await mongoose.model('Account').findOne({
                    accountNumber: tempAccountNumber
                });

                if (!existingAccount) {
                    this.accountNumber = tempAccountNumber;
                    break;
                }
                attempts++;

                if (attempts === maxAttempts) {
                    throw new Error('Unable to generate unique account number after maximum attempts');
                }
            }
        }
        next();
    } catch (error) {
        next(error);
    }
});


// Method to set transaction PIN (No changes needed)
accountSchema.methods.setTransactionPin = async function (pin) {
    const salt = await bcrypt.genSalt(10);
    this.transactionPin = await bcrypt.hash(pin, salt);
    this.isPinSet = true;
    return this.save(); // Return the saved account for potential use.
};

// Method to verify transaction PIN - No changes needed, but added for completeness.
accountSchema.methods.verifyTransactionPin = async function (enteredPin) {
    const account = await this.constructor.findById(this._id).select('+transactionPin');
    if (!account.transactionPin) {
        return false;
    }
    return await bcrypt.compare(enteredPin, account.transactionPin);
};



const Account = mongoose.model('Account', accountSchema);
module.exports = Account;