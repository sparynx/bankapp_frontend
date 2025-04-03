// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./src/users/user.route');
const accountRoutes = require("./src/account/account.route")
const transactionRoutes = require('./src/transaction/transaction.route');

// Initialize dotenv to load environment variables
dotenv.config();

// Initialize an Express app
const app = express();

// Middleware to parse incoming JSON data
app.use(express.json());


app.use(cors({
  origin: ["http://localhost:5173","https://owo-six.vercel.app/"],
  credentials: true
}));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Bank database online');
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Basic route for the root URL
app.get('/', (req, res) => {
  res.send('Welcome to the Sparynx Bank API!');
});




// Register user routes under the "/api/users" path
app.use('/api/users', userRoutes);
app.use("/api/accounts", accountRoutes);
app.use('/api/transactions', transactionRoutes);

// Set up the port and start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
