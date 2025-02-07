const express = require("express");
const dotenv = require("dotenv");
const { User } = require("./src/models/userModel.js");
const sequelize = require("./src/startup/db.js");
const app = express();

// .env dosyasını yükle
dotenv.config();

// Middleware'ler
app.use(express.json());

// Router'ları içe aktar
require("./src/startup/routers")(app);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  try {
    await sequelize.authenticate(); // Veritabanı bağlantısını doğrula
    console.log("✅ Veritabanı bağlantısı başarılı.");

    await sequelize.sync({ alter: true });
    console.log("✅ Veritabanı senkronizasyonu tamamlandı!");
  } catch (error) {
    console.error("❌ Bağlantı hatası:", error);
  }

  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`);
});
