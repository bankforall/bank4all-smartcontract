const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Load middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Load routes
const indexRoute = require('./routes/index');
const usersRoute = require('./routes/users');
const authRoute = require('./routes/auth');
const transactionsRoute = require('./routes/transactions');

// Set up routes
app.use('/', indexRoute);
app.use('/users', usersRoute);
app.use('/auth', authRoute);
app.use('/transactions', transactionsRoute);

// Export the app instance
module.exports = app;
