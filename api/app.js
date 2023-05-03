//Loadup Express
const express = require('express');
const app = express();

//Loadup database
//const db = require("../config/db"); // real db not ready yet
const db = require("../config/mockdb"); //use mockdb just for demonstration

//Loadup smartcontract and blockchain interface
const Web3 = require('web3');
//Then setup connection to our prefer node
const web3 = new Web3('http://localhost:8545');

// Load middleware
const cors = require('cors');
const bodyParser = require('body-parser');

//include bodyParser to deal with HTTP POST request
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//include cors, allow cross-origin resource sharing
app.use(cors());

// When HTTP request came in, pass it here
// Loadup routes
const greetRoute = require('./routes/hello');
const indexRoute = require('./routes/index');
const signInRoute = require('./routes/signIn');
//const authRoutes = require("./routes/auth");
// Then Setup routes
app.use('/', indexRoute);
app.use('/greet', greetRoute);
app.use('/protected', signInRoute);

const globalComponent = {
    app: app,
    web3: web3,
    db: db
};

// Export the app instance
module.exports = globalComponent;
