const { Model, DataTypes } = require("sequelize");
const sequelize = require("../startup/db");
const User = require("./userModel");
const replyPost = require("./replyModel");

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

Post.belongsTo(User, { foreignKey: "userId", as: "user" });
Post.hasMany(replyPost, { foreignKey: "postId", as: "replies" });
module.exports = Post;
