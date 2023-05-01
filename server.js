const express = require('express');

// Create a new Express application instance
const app = express();

// Define a route to handle GET requests for the "helloworld" endpoint
app.get('/helloworld', (req, res) => {
  // Call the helloWorld function to generate the response
  const responseText = helloWorld();

  // Send the response back to the client
  res.send(responseText);
});

// Define the helloWorld function
function helloWorld() {
  return 'Hello World!';
}

// Start the server and listen on port 3000
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
