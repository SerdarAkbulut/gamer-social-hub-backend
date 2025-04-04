const { Model, DataTypes } = require("sequelize");
const sequelize = require("../startup/db");

class Post extends Model {}

Post.init(
  {
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    gameName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    postTitle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    postText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  { sequelize, modelName: "Post" }
);

module.exports = Post;
