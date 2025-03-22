const favoritedGames = require("./favoritedGames");
const User = require("./userModel");
const sequelize = require("../startup/db");

User.hasMany(favoritedGames, { foreignKey: "userId", as: "favorites" });
favoritedGames.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = { sequelize, User, favoritedGames };
