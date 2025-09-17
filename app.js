const express = require("express");
const dotenv = require("dotenv");
const sequelize = require("./src/startup/db.js");
const app = express();
require("./src/models/index.js");
dotenv.config();

app.use(express.json());

require("./src/startup/routers")(app);

const PORT = process.env.PORT || 3000;

sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Veritabanı bağlantısı başarılı.");
  })
  .catch((error) => {
    console.error("❌ Bağlantı hatası:", error);
  });

sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("✅ Veritabanı senkronizasyonu tamamlandı!");
    app.listen(PORT, () => {
      console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`);
    });
  })
  .catch((error) => {
    console.error("❌ Senkronizasyon hatası:", error);
  });
