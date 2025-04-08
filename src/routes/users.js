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
const optionalAuth = require("../middleware/optionalAuth ");
const Follow = require("../models/follow");
const { default: axios } = require("axios");
const multer = require("multer");
const router = Router();
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const cloudinary = require("cloudinary").v2;

const upload = multer({ storage: multer.memoryStorage() });
const FormData = require("form-data");

const generateResetToken = (userId) => {
  const resetToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  }); // 1 saat geçerli
  return resetToken;
};
const generateResetLink = (token) => {
  return `http://localhost:3002/reset-password?token=${token}`; // Frontend URL'inizi burada kullanın
};
const verifyResetToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET); // Token geçerli mi?
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return { error: "Bu bağlantının süresi dolmuş. Lütfen tekrar deneyin." };
    }
    return { error: "Geçersiz veya bozuk token." };
  }
};

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

router.get("/user/:id", optionalAuth, async (req, res) => {
  const { id } = req.params;
  const loggedInUserId = req.user ? req.user.id : null; // Giriş yapmış kullanıcıyı al

  let user = await User.findOne({
    where: {
      id: id,
    },
    attributes: ["userName", "id", "banner"],
  });

  if (!user) {
    return res.status(404).send("Kullanıcı Bulunamadı");
  }

  // Eğer giriş yapmış bir kullanıcı varsa, takip ilişkisini kontrol et
  let isFollowing = false;
  if (loggedInUserId) {
    const follow = await Follow.findOne({
      where: {
        followerId: loggedInUserId,
        followingId: id,
      },
    });
    isFollowing = follow ? true : false;
  }

  return res.status(200).json({
    user,
    isFollowing, // Takip durumu ekleniyor
  });
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

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  let user = await User.findOne({ where: { email: email } });

  if (!user) {
    return res.status(404).send({ message: "Girilen email kaydı bulunamadı" });
  }

  try {
    // Şifre sıfırlama token'ını oluştur
    const resetToken = generateResetToken(user.id);

    // Şifre sıfırlama linkini oluştur
    const resetLink = generateResetLink(resetToken);

    // Nodemailer transporter ayarları
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAILJS_USER,
        pass: process.env.EMAILJS_PASSWORD,
      },
    });

    // Mail gönderme ayarları
    const mailOptions = {
      from: process.env.EMAILJS_USER,
      to: email,
      subject: "Şifre Sıfırlama",
      text: `Şifrenizi sıfırlamak için şu bağlantıya tıklayın: ${resetLink}`,
      html: `<b>Şifrenizi sıfırlamak için şu bağlantıya tıklayın:</b> <a href="${resetLink}">${resetLink}</a>`,
    };

    // Mail gönderme işlemi
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res
          .status(500)
          .send({ message: "E-posta gönderilirken bir hata oluştu." });
      }

      return res
        .status(200)
        .send({ message: "Şifre sıfırlama linki mail adresinize gönderildi" });
    });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "E-posta gönderilirken bir hata oluştu." });
  }
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  const decoded = verifyResetToken(token);

  if (decoded.error) {
    return res.status(400).json({ message: decoded.error });
  }

  // Token geçerliyse kullanıcıyı bul ve şifresini güncelle
  const user = await User.findOne({ where: { id: decoded.userId } });

  if (!user) {
    return res.status(404).json({ message: "Kullanıcı bulunamadı." });
  }

  // Yeni şifreyi hashleyerek güncelle
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  res.status(200).json({ message: "Şifreniz başarıyla güncellendi!" });
});

router.get("/check-reset-password-token/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.status(200).json({ valid: true, userId: decoded.userId });
  } catch (error) {
    res.status(400).json({
      valid: false,
      message:
        "Bağlantı linkinin süresi dolmuş yeniden bağlantı linki isteyin   ",
    });
  }
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post("/upload-image", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Lütfen bir resim yükleyin" });
    }

    // Buffer'dan base64 formatına çevir
    const base64Data = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    // Cloudinary'e yükle
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: "user_banners", // Cloudinary'de klasör ismi
    });

    // Cloudinary'den gelen URL
    const fileUrl = result.secure_url;

    // Veritabanında kullanıcının banner alanını güncelle
    await User.update({ banner: fileUrl }, { where: { id: req.user.id } });

    return res.status(200).json({ imageUrl: fileUrl });
  } catch (error) {
    console.error(
      "Cloudinary yükleme hatası:",
      error.response?.data || error.message
    );
    return res
      .status(500)
      .json({ message: "Resim yükleme başarısız", error: error.message });
  }
});
module.exports = router;
