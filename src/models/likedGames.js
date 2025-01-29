const { DataTypes } = require("sequelize");
const sequelize = require("../startup/db");
const { User } = require("./userModel");

const likedGames = sequelize.define("likedGames", {
  gameId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = likedGames;
