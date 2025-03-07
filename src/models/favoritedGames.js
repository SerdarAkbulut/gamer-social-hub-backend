const { DataTypes } = require("sequelize");
const sequelize = require("../startup/db");
const User = require("./userModel");
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
});
favoritedGames.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = favoritedGames;
