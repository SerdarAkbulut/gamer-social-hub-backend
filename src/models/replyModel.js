const { Model, DataTypes } = require("sequelize");
const sequelize = require("../startup/db");
const User = require("./userModel");

class replyPost extends Model {}

replyPost.init(
  {
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reply: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { sequelize, modelName: "replyPost" }
);

replyPost.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = replyPost;
