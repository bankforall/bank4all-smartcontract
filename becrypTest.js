// Import required modules
const bcrypt = require('bcryptjs');

// Define a plaintext string
const plaintext = 'ggwpez';

// Generate a salt
const salt = bcrypt.genSaltSync(10);

// Hash the plaintext using the salt
const passwordHash = bcrypt.hashSync(plaintext, salt);

// Display the password hash
console.log(passwordHash);
