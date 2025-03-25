const { Model, DataTypes } = require("sequelize");
const sequelize = require("../startup/db");
const Joi = require("joi");
const jwt = require("jsonwebtoken");

class User extends Model {
  createAuthToken() {
    return jwt.sign(
      { id: this.id, isAdmin: this.isAdmin },
      process.env.JWT_PRIVATE_KEY,
      {
        expiresIn: "30d",
      }
    );
  }
}

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
    banner: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  { sequelize, modelName: "Users" } // Model adı tekil olmalı
);

function validateRegister(user) {
  const schema = Joi.object({
    userName: Joi.string().min(3).max(50).required().messages({
      "string.min": "Kullanıcı adı en az 3 karakter uzunluğunda olmalıdır",
      "string.max": "Kullanıcı adı en fazla 50 karakter uzunluğunda olmalıdır",
      "any.required": "Kullanıcı adı gereklidir",
    }),

    email: Joi.string().min(3).max(50).required().email().messages({
      "string.min": "E-posta en az 3 karakter uzunluğunda olmalıdır",
      "string.max": "E-posta en fazla 50 karakter uzunluğunda olmalıdır",
      "string.email": "Geçerli bir e-posta adresi girin",
      "any.required": "E-posta gereklidir",
    }),

    password: Joi.string().min(5).required().messages({
      "string.min": "Şifre en az 5 karakter uzunluğunda olmalıdır",
      "any.required": "Şifre gereklidir",
    }),
  });

  return schema.validate(user);
}

function validateUpdateUser(user) {
  const schema = Joi.object({
    userName: Joi.string().min(3).max(50).optional().empty("").messages({
      "string.min": "Kullanıcı adı en az 3 karakter uzunluğunda olmalıdır",
      "string.max": "Kullanıcı adı en fazla 50 karakter uzunluğunda olmalıdır",
    }),

    email: Joi.string().min(3).max(50).email().optional().empty("").messages({
      "string.min": "E-posta en az 3 karakter uzunluğunda olmalıdır",
      "string.max": "E-posta en fazla 50 karakter uzunluğunda olmalıdır",
      "string.email": "Geçerli bir e-posta adresi girin",
    }),

    currentPassword: Joi.string()
      .required()
      .empty("")
      .when("password", {
        is: Joi.exist(),
        then: Joi.required(),
      })
      .messages({
        "any.required": "İşlem yapmak için şifrenizi girin",
      }),

    password: Joi.string().min(5).optional().empty("").messages({
      "string.min": "Yeni şifre en az 5 karakter uzunluğunda olmalıdır",
    }),
  });

  return schema.validate(user);
}
// Kullanıcının favori oyunlarıyla ilişkisi

module.exports = { User, validateRegister, validateUpdateUser };
