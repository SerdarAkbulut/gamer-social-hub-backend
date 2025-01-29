const express = require("express");
const { Router } = require("express");
const { User, validateRegister } = require("../models/userModel");
const bcrypt = require("bcryptjs"); // bcryptjs kullanımı
const { Op } = require("sequelize");

const router = Router();

router.post("/register", async (req, res) => {
  // Kullanıcı verilerini doğrulama
  const { error } = validateRegister(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  // Kullanıcı adı ve e-posta kontrolü
  let user = await User.findOne({
    where: {
      [Op.or]: [{ email: req.body.email }, { userName: req.body.userName }],
    },
  });
  if (user) {
    return res.status(400).send("E-posta veya kullanıcı adı zaten kayıtlı");
  }

  // Yeni kullanıcı oluşturma
  user = new User({
    userName: req.body.userName,
    email: req.body.email,
    password: req.body.password, // şifreyi hash'leme işlemi modelde yapılacak
  });

  // Kullanıcıyı veritabanına kaydetme
  await user.save();
});

router.get("/user", async (req, res) => {
  // Kullanıcıyı ID ile arayalım (GET isteği olduğu için params ya da query kullanabiliriz)
  const { id } = req.query; // Burada id'yi query parametresi olarak alıyoruz

  let user = await User.findOne({
    where: {
      id: id, // Op kullanmaya gerek yok çünkü sadece basit bir eşleşme yapıyoruz
    },
  });

  if (!user) {
    return res.status(404).send("Kullanıcı Bulunamadı");
  }

  return res.status(200).json(user); // Kullanıcıyı başarılı bir şekilde bulduysak gönderelim
});

module.exports = router;
