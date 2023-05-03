const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const globalConponent = require('../app');
const db = globalConponent.db;
const app = globalConponent.app;
const { jwtSecret } = require("../../config/config");
const users = db.users;

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
  
  // Define a route to handle user login
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

// Define index route
router.get('/', authenticateJWT, (req, res) => {
    res.json({ message: `Hello, ${req.user.name}! This is a protected resource.` });
});

module.exports = router;