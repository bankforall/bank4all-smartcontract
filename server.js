const app = require('./api/app');

const port = process.env.PORT || 3000;

const { helloWorld } = require('./api/hello');

app.get('/hello', (req, res) => {
  const message = helloWorld();
  res.send(message);
});
// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
