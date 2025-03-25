const express = require("express");
const dotenv = require("dotenv");
const sequelize = require("./src/startup/db.js");
const app = express();
require("./src/models/index.js");
// .env dosyasını yükle
dotenv.config();

// Middleware'ler
app.use(express.json());

// Router'ları içe aktar
require("./src/startup/routers")(app);

const PORT = process.env.PORT || 3000;

// Veritabanı bağlantısını doğrula
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Veritabanı bağlantısı başarılı.");
  })
  .catch((error) => {
    console.error("❌ Bağlantı hatası:", error);
  });

// Veritabanı senkronizasyonu ve server başlatma
sequelize
  .sync({ alter: true }) // alter:true, schema'yi kontrol eder ve gerekiyorsa değiştirir.
  .then(() => {
    console.log("✅ Veritabanı senkronizasyonu tamamlandı!");
    app.listen(PORT, () => {
      console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`);
    });
  })
  .catch((error) => {
    console.error("❌ Senkronizasyon hatası:", error);
  });
