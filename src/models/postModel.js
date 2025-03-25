const { Model, DataTypes } = require("sequelize");
const sequelize = require("../startup/db");
const ReplyPost = require("./replyModel");

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

// İlişki: Post, User modeline bağlıdır

// İlişki: Post, ReplyPost modeline bağlıdır
Post.hasMany(ReplyPost, { foreignKey: "postId", as: "replies" });

module.exports = Post;
