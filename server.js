const App = require("./api/app");
const app = App.app;
const http = require("http");
const PORT = 3000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log("Server listening on port: " + PORT);
});
