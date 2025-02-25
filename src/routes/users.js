const express = require("express");
const { Router } = require("express");
const { User, validateRegister } = require("../models/userModel");
const bcrypt = require("bcryptjs"); // bcryptjs kullanımı
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const router = Router();
require("dotenv").config();
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
    return res.status(409).send({
      error: "conflict",
      message: "E-posta veya kullanıcı adı zaten kayıtlı",
    });
  }

  user = new User({
    userName: req.body.userName,
    email: req.body.email,
    password: req.body.password,
  });

  // Kullanıcıyı veritabanına kaydetme
  await user.save();
  return res.status(200).send("Kayıt İşlemi Başarılı");
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
router.post("/login", async (req, res) => {
  try {
    let user = await User.findOne({ where: { email: req.body.email } });
    if (!user) {
      return res.status(409).send("Böyle bir email kaydı bulunamadı");
    }

    const isSuccess = await bcrypt.compare(req.body.password, user.password);
    if (!isSuccess) {
      return res.status(409).send("Şifre hatalı");
    }

    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_PRIVATE_KEY, {
      // .env'den al
      expiresIn: "30d",
    });

    return res.header("Authorization", token).json({ token });
  } catch (error) {
    return res.status(500).send("Sunucu hatası: " + error.message);
  }
});
module.exports = router;
