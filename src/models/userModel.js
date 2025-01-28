const { DataTypes } = require("sequelize");
const sequelize = require("../startup/db.js");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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

module.exports = { User, validateRegister, validateLogin };
