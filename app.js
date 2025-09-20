const express = require("express");
const dotenv = require("dotenv");
const serverless = require("serverless-http");
const sequelize = require("./src/startup/db.js");
require("./src/models/index.js");

dotenv.config();

const app = express();
app.use(express.json());

require("./src/startup/routers")(app);

sequelize
  .authenticate()
  .then(() => console.log("✅ Veritabanı bağlantısı başarılı."))
  .catch((err) => console.error("❌ Bağlantı hatası:", err));

sequelize
  .sync({ alter: true })
  .then(() => console.log("✅ Veritabanı senkronizasyonu tamamlandı!"))
  .catch((err) => console.error("❌ Senkronizasyon hatası:", err));

// Local için: app.listen
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`);
  });
}

module.exports = serverless(app);
