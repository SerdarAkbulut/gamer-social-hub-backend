const { DataTypes } = require("sequelize");
const sequelize = require("../startup/db");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const likedGames = require("./likedGames");
const favoritedGames = require("./favoritedGames");

const User = sequelize.define(
  "User",
  {
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
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
  {
    timestamps: true,
  }
);

User.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

User.prototype.createAuthToken = function () {
  return jwt.sign(
    { _id: this.id, isAdmin: this.isAdmin },
    process.env.JWT_PRIVATE_KEY
  );
};

function validateRegister(user) {
  const schema = Joi.object({
    userName: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(3).max(50).required().email(),
    password: Joi.string().min(5).required(),
  });
  return schema.validate(user);
}

function validateLogin(user) {
  const schema = Joi.object({
    email: Joi.string().min(3).max(50).required().email(),
    password: Joi.string().min(5).required(),
  });
  return schema.validate(user);
}
likedGames.belongsTo(User, {
  foreignKey: "userId", // likedGames tablosunda userId adlı bir dış anahtar olacak
  as: "user", // User modeliyle olan ilişkiyi tanımladık
});
favoritedGames.belongsTo(User, {
  foreignKey: "userId", // likedGames tablosunda userId adlı bir dış anahtar olacak
  as: "user", // User modeliyle olan ilişkiyi tanımladık
});

module.exports = { User, validateRegister, validateLogin };
