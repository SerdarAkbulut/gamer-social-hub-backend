const { DataTypes } = require("sequelize");
const sequelize = require("../startup/db");
const User = require("./userModel");
const likedGames = sequelize.define("likedGames", {
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
  isLiked: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
});
likedGames.belongsTo(User, { foreignKey: "userId", as: "user" });
module.exports = likedGames;
