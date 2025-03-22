const { Model, DataTypes } = require("sequelize");
const sequelize = require("../startup/db");
const User = require("./userModel");

class LikedGames extends Model {}

LikedGames.init(
  {
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
  },
  {
    sequelize,
    modelName: "likedGames",
  }
);

// İlişkiyi kuruyoruz
LikedGames.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = LikedGames;
