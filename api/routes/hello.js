const express = require('express');
const router = express.Router();

// Define index route
router.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

module.exports = router;
  