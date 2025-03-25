const { Model, DataTypes } = require("sequelize");
const sequelize = require("../startup/db");

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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "likedGames",
  }
);

// İlişkiyi kuruyoruz

module.exports = LikedGames;
