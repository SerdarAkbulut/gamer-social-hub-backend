const { Model, DataTypes } = require("sequelize");
const sequelize = require("../startup/db");
const favoritedGames = require("./favoritedGames");

class User extends Model {}

User.init(
  {
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  { sequelize, modelName: "Users" }
);
User.hasMany(favoritedGames, { foreignKey: "userId", as: "favorites" });
module.exports = User;
