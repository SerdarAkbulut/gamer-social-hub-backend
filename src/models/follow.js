const { Model, DataTypes } = require("sequelize");
const sequelize = require("../startup/db");
const { User } = require("./userModel");

class Follow extends Model {}

Follow.init(
  {
    followerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    followingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    modelName: "Follow",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["followerId", "followingId"],
      },
    ],
  }
);

module.exports = Follow;
