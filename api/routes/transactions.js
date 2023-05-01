const express = require('express');
const router = express.Router();

// Define transactions route
router.get('/', (req, res) => {
  res.json({ message: 'List of all transactions' });
});

module.exports = router;
