const { DataTypes } = require("sequelize");
const sequelize = require("../startup/db");
const favoritedGames = sequelize.define("favoritedGames", {
  gameId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  gameName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gameImage: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isFavorited: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = favoritedGames;
