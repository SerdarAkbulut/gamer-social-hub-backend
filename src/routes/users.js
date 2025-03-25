const express = require("express");
const { Router } = require("express");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs"); // bcryptjs kullanımı
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const {
  User,
  validateRegister,
  validateUpdateUser,
} = require("../models/userModel");
const auth = require("../middleware/auth");
const router = Router();
require("dotenv").config();

router.post("/register", async (req, res) => {
  const { error } = validateRegister(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
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
    password: hashedPassword,
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

router.put("/user", auth, async (req, res) => {
  // Validasyon kontrolü
  const { error } = validateUpdateUser(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  // Kullanıcıyı bulma
  const user = await User.findOne({
    where: { id: req.user.id },
  });

  if (!user) {
    return res.status(404).send("Kullanıcı bulunamadı");
  }

  // Eğer yeni şifre gönderildiyse, mevcut şifreyi doğrula
  if (req.body.password && req.body.password.trim() !== "") {
    if (!req.body.currentPassword) {
      return res
        .status(400)
        .send("Şifre değiştirmek için mevcut şifreyi girin");
    }

    const isMatch = await bcrypt.compare(
      req.body.currentPassword,
      user.password
    );
    if (!isMatch) {
      return res.status(400).send("Mevcut şifre hatalı");
    }

    // Yeni şifreyi hashleyip güncelle
    user.password = await bcrypt.hash(req.body.password, 10);
  }

  // Diğer alanları güncelle
  user.userName = req.body.userName || user.userName;
  user.email = req.body.email || user.email;

  // Güncellenen kullanıcıyı kaydetme
  try {
    await user.save();
    res.status(200).send("Kullanıcı başarıyla güncellendi");
  } catch (err) {
    console.error(err);
    res.status(500).send("Sunucu hatası");
  }
});

router.post("/password-reset", async (req, res) => {
  const { email } = req.body;

  let user = await User.findOne({
    where: { email: email },
  });

  if (!user) {
    return res.status(404).send({ message: "Girilen email kaydı bulunamadı" });
  } else {
    try {
      // Nodemailer transporter ayarları
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAILJS_USER, // Gmail adresi
          pass: process.env.EMAILJS_PASSWORD, // Uygulama şifresi
        },
      });

      // Mail gönderme ayarları
      const mailOptions = {
        from: process.env.EMAILJS_USER, // Gönderen e-posta adresi
        to: email, // Alıcı e-posta adresi
        subject: "Şifre Sıfırlama",
        text: "Şifrenizi sıfırlamak için bu bağlantıya tıklayın.",
        html: "<b>Şifrenizi sıfırlamak için bu bağlantıya tıklayın.</b>", // HTML içeriği (isteğe bağlı)
      };

      // Mail gönderme işlemi
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Mail gönderilirken hata oluştu:", error);
          return res
            .status(500)
            .send({ message: "E-posta gönderilirken bir hata oluştu." });
        }
        console.log("Mail başarıyla gönderildi:", info.response);
        return res
          .status(200)
          .send({ message: "Şifre sıfırlama kodu mail adresinize gönderildi" });
      });
    } catch (error) {
      console.log("Hata oluştu:", error);
      return res
        .status(500)
        .send({ message: "E-posta gönderilirken bir hata oluştu." });
    }
  }
});

module.exports = router;
