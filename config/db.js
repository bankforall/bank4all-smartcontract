//This file is not currently in use
const mongoose = require("mongoose");
const { dbUri } = require("./config");

mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on("connected", () => {
  console.log("Connected to database");
});

mongoose.connection.on("error", (err) => {
  console.log(`Database connection error: ${err}`);
});

