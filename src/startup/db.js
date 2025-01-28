const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

// dotenv paketini yükle ve yapılandır
dotenv.config();

// PostgreSQL bağlantısı
const sequelize = new Sequelize(
  process.env.DB_NAME, // Veritabanı adı
  process.env.DB_USER, // Kullanıcı adı
  process.env.DB_PASSWORD, // Şifre
  {
    host: "localhost",
    port: 5432, // Port
    dialect: "postgres", // Dialect (PostgreSQL)
    logging: false, // SQL sorgularını loglama (isteğe bağlı)
  }
);

module.exports = sequelize;
