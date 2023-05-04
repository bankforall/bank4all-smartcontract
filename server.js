//Back to basic, no route mess, everything are here!!!!
const express = require('express'); //Loadup Express
const app = express();
const http = require("http"); //Loadup http for server
const PORT = 1234; //Assign listening port
const jwt = require('jsonwebtoken'); //jsonwebtoken for authentication
const bcrypt = require('bcryptjs'); //bcryptjs for authentication

//Loadup database
//const db = require("../config/db"); // real db not ready yet
const db = require("./config/mockdb"); //use mockdb just for demonstration
const users = db['users'];
const { jwtSecret } = require("./config/config");

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

//Function section =================================
//authenticateJWT verify if the request is from the correct user
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, jwtSecret);
            req.user = users.find((user) => user.id === decoded.id);
            next();
        } catch (error) {
            res.status(401).json({ message: 'Invalid token' });
        }
    } else {
        res.status(401).json({ message: 'Missing token' });
    }
}

//==================================================

// Handling request
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the API' });
});

app.get('/greet', (req, res) => {
    res.json({ message: 'Hello World!' });
});

// Login handling
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find((user) => user.email === email);
    if (user) {
        const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
        if (isPasswordMatch) {
            const token = jwt.sign({ id: user.id }, jwtSecret);
            res.json({ token });
        } else {
            res.status(401).json({ message: 'Invalid password' });
        }
    } else {
        res.status(401).json({ message: 'Invalid email' });
    }
});

// Check user authorization
app.get('/protected', authenticateJWT, (req, res) => {
    res.json({ message: `Hello, ${req.user.name}! This is a protected resource.` });
});

// Dashboard summary - status, active group list
app.get('/protected', authenticateJWT, (req, res) => {
    res.json({ message: `Hello, ${req.user.name}! This is a protected resource.` });
});

// Create group


// Join group


// Group ongoing cycle


//All setup
//Create Server ====================================
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log("Server listening on port: " + PORT);
});
  
console.log("Server started");