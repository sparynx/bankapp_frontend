// utils/accountHelpers.js
const Account = require('../account/accouunt.model');

async function generateUniqueAccountNumber() {
  const maxAttempts = 10;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const accountNumber = Math.floor(Math.random() * 9000000000) + 1000000000;
    const existingAccount = await Account.findOne({ accountNumber: accountNumber.toString() });
    
    if (!existingAccount) {
      return accountNumber.toString();
    }
    attempts++;
  }
  
  throw new Error('Unable to generate unique account number after maximum attempts');
}

module.exports = { generateUniqueAccountNumber };
