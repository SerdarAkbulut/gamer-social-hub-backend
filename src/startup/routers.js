const express = require("express");
const users = require("../routes/users");
const cors = require("cors");
module.exports = function (app) {
  app.use(cors());
  app.use(express.json());
  app.use("/api/users", users);
};
