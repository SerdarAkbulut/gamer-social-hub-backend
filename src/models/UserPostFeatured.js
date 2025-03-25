const { Model, DataTypes } = require("sequelize");
const sequelize = require("../startup/db");

class UserPostFeatured extends Model {}

UserPostFeatured.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { sequelize, modelName: "UserPostFeatured" }
);

module.exports = UserPostFeatured;
