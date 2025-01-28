const express = require("express");
const dotenv = require("dotenv");
const { User } = require("./src/models/userModel.js");
const sequelize = require("./src/startup/db.js");
const app = express();
require("./src/startup/routers")(app);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Veritabanı bağlantısı başarılı!");

    await sequelize.sync({ force: true });
    console.log("Tablolar başarıyla oluşturuldu!");
  } catch (error) {
    console.error("Veritabanı bağlantısı sırasında bir hata oluştu:", error);
  }
})();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
