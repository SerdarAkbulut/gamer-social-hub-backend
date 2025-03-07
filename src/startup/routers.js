const express = require("express");
const users = require("../routes/users");
const games = require("../routes/games");
const cors = require("cors");
const likedGames = require("../routes/likedGames");
const favoritedGames = require("../routes/favoritedGames");
const newPost = require("../routes/postRouter");
module.exports = function (app) {
  app.use(cors());
  app.use(express.json());
  app.use("/api", users);
  app.use("/api", games);
  app.use("/api", likedGames);
  app.use("/api", favoritedGames);
  app.use("/api", newPost);
};
