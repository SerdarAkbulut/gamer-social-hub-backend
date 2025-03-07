const { DataTypes } = require("sequelize");
const sequelize = require("../startup/db");

const replyPost = sequelize.define("replyPost", {
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reply: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});
module.exports = replyPost;
