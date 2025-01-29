const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME, // .env'den veritabanı adı
  process.env.DB_USER, // .env'den kullanıcı adı
  process.env.DB_PASSWORD, // .env'den şifre
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "postgres", // PostgreSQL kullanıyorsanız
    logging: false,
  }
);

module.exports = sequelize; // `{ sequelize }` yerine `sequelize` döndürülmeli
