const express = require('express');
const router = express.Router();

// Define users route
router.get('/', (req, res) => {
  res.json({ message: 'List of all users' });
});

module.exports = router;
