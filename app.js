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

module.exports = app;

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () =>
    console.log(`🚀 Local sunucu ${PORT} portunda çalışıyor`)
  );
}

module.exports = serverless(app);
